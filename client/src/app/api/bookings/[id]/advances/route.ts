import { NextResponse } from "next/server";
import { PrismaClient, RateLockStatus } from "@prisma/client";
import { advanceSchema } from "@/schemas/booking";
import { getRateLockStatus, metalAdvanceValue } from "@/lib/booking-logic";

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const result = advanceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation Error", code: "VALIDATION_FAILED" }, { status: 400 });
    }

    const data = result.data;

    const booking = await prisma.productBooking.findUnique({
      where: { id: bookingId },
      include: { rateLockPlan: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (booking.status !== "ACTIVE" && booking.status !== "PARTIAL_LOCK" && booking.status !== "RATE_LOCKED") {
      return NextResponse.json({ error: "Booking is not active", code: "INVALID_STATUS" }, { status: 400 });
    }

    // current rate for metal advances
    const goldRateEntry = await prisma.metalRateHistory.findFirst({
      where: { metalType: "GOLD", karatage: 22 },
      orderBy: { date: 'desc' }
    });
    const currentGoldRate = goldRateEntry ? goldRateEntry.rate : 7000;

    let netValue = 0;
    let newAdvance = {
      bookingId,
      advanceType: data.advanceType,
      branchId: booking.branchId,
      cashAmount: data.cashAmount,
      paymentRef: data.paymentRef,
      metalWeight: data.metalWeight,
      metalPurity: data.metalPurity,
      metalRateApplied: null as number | null,
      metalValueInRupees: null as number | null,
      netValue: 0
    };

    if (data.advanceType === "METAL_22K" || data.advanceType === "METAL_24K") {
      const weight = data.metalWeight || 0;
      const purity = data.advanceType === "METAL_24K" ? "24K" : "22K";
      netValue = metalAdvanceValue(weight, purity, currentGoldRate);
      newAdvance.metalRateApplied = currentGoldRate;
      newAdvance.metalValueInRupees = netValue;
    } else {
      netValue = data.cashAmount || 0;
    }
    newAdvance.netValue = netValue;

    const newTotalAdvance = booking.totalAdvance + netValue;
    const newAdvancePercent = (newTotalAdvance / booking.grandTotal) * 100;

    let rateLockStatus = booking.rateLockStatus;
    let lockedRate = booking.lockedRate;
    let lockedAt = booking.lockedAt;

    if (booking.deliveryRatePlan === "OPTION_B_15_DAY_LOCK" && rateLockStatus !== "FULL_LOCK") {
      if (newAdvancePercent >= 80) {
        rateLockStatus = "FULL_LOCK";
        lockedRate = currentGoldRate;
        lockedAt = new Date();
        // Option B locks for 15 days from the day it hits 80%
      }
    } else if (booking.deliveryRatePlan !== "OPTION_A_MARKET_RATE" && booking.deliveryRatePlan !== "OPTION_C_METAL_WALLET" && booking.deliveryRatePlan !== "OPTION_D_FIXED_RATE") {
      // Legacy support
      if (rateLockStatus !== "FULL_LOCK") {
        const newStatus = getRateLockStatus(newAdvancePercent);
        if (newStatus === "FULL_LOCK") {
          rateLockStatus = "FULL_LOCK";
          lockedRate = currentGoldRate;
          lockedAt = new Date();
        } else if (newStatus === "PARTIAL_LOCK" && rateLockStatus === "NO_LOCK") {
          rateLockStatus = "PARTIAL_LOCK";
        }
      }
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Create Advance
      await tx.bookingAdvance.create({ data: newAdvance as any });

      // 2. Write Ledger
      await tx.bookingLedger.create({
        data: {
          bookingId,
          entryType: "ADVANCE_ADDED",
          description: `Additional advance via ${data.advanceType}`,
          amount: netValue,
          balanceAfter: booking.grandTotal - newTotalAdvance
        }
      });

      // 3. Update Booking
      const bkg = await tx.productBooking.update({
        where: { id: bookingId },
        data: {
          totalAdvance: newTotalAdvance,
          advancePercent: newAdvancePercent,
          rateLockStatus,
          lockedRate,
          lockedAt,
          lockedPortion: rateLockStatus === "FULL_LOCK" ? booking.grandTotal : null,
          lockedWeightGrams: rateLockStatus === "FULL_LOCK" ? booking.totalWeightGrams : null,
          ...(rateLockStatus === "FULL_LOCK" && booking.status !== "RATE_LOCKED" ? { status: "RATE_LOCKED" } : {})
        }
      });

      // 4. Audit Log
      await tx.bookingAuditLog.create({
        data: {
          bookingId,
          action: "ADVANCE_ADDED",
          newValue: { totalAdvance: newTotalAdvance, advancePercent: newAdvancePercent, rateLockStatus } as any
        }
      });

      // 5. Wallet processing
      let wallet = await tx.customerWallet.findUnique({ where: { customerId: booking.customerId } });
      const getOrCreateWallet = async () => {
        if (!wallet) {
          wallet = await tx.customerWallet.create({ data: { customerId: booking.customerId } });
        }
        return wallet;
      };

      // 5a. Process Metal Advances (always store in wallet)
      let metalAdvance24KGrams = 0;
      if (data.advanceType === "METAL_22K" && data.metalWeight) {
        metalAdvance24KGrams = data.metalWeight * (22 / 24);
      } else if (data.advanceType === "METAL_24K" && data.metalWeight) {
        metalAdvance24KGrams = data.metalWeight;
      }

      if (metalAdvance24KGrams > 0) {
        const w = await getOrCreateWallet();
        await tx.customerWallet.update({
          where: { id: w.id },
          data: { metal24KBalance: { increment: metalAdvance24KGrams } }
        });
        await tx.customerWalletLedger.create({
          data: {
            walletId: w.id,
            transactionType: "DEPOSIT",
            assetType: "METAL_24K",
            amount: metalAdvance24KGrams,
            description: `Metal advance for booking ${booking.bookingNumber}`,
            relatedEntityId: booking.id
          }
        });
      }

      // 5b. Process Cash Conversion for Option C
      if (booking.deliveryRatePlan === "OPTION_C_METAL_WALLET" && data.advanceType !== "METAL_22K" && data.advanceType !== "METAL_24K") {
        const cashAmount = data.cashAmount || 0;
        if (cashAmount >= 10000) {
          const currentGoldRate24K = currentGoldRate * (24 / 22);
          const metal24KGrams = cashAmount / currentGoldRate24K;

          const w = await getOrCreateWallet();
          await tx.customerWallet.update({
            where: { id: w.id },
            data: { metal24KBalance: { increment: metal24KGrams } }
          });

          await tx.customerWalletLedger.create({
            data: {
              walletId: w.id,
              transactionType: "CONVERSION",
              assetType: "METAL_24K",
              amount: metal24KGrams,
              description: `Converted cash advance of ₹${cashAmount} to 24K metal for booking ${booking.bookingNumber}`,
              relatedEntityId: booking.id,
              goldRateApplied: currentGoldRate24K
            }
          });
        }
      }

      return bkg;
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to add advance", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
