import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { deliverBookingSchema } from "@/schemas/booking";
import { calculateDeliverySettlement } from "@/lib/booking-logic";

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const result = deliverBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation Error", code: "VALIDATION_FAILED" }, { status: 400 });
    }

    const data = result.data;

    const booking = await prisma.productBooking.findUnique({
      where: { id: bookingId },
      include: { items: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (booking.status === "DELIVERED" || booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking is already delivered or cancelled", code: "INVALID_STATUS" }, { status: 400 });
    }

    const goldRateEntry = await prisma.metalRateHistory.findFirst({
      where: { metalType: "GOLD", karatage: 22 },
      orderBy: { date: 'desc' }
    });
    const currentGoldRate = goldRateEntry ? goldRateEntry.rate : 7000;

    const walletUsed = data.walletAmountUsed || 0;
    const settlement = calculateDeliverySettlement(booking, currentGoldRate, walletUsed);

    const deliveryRes = await prisma.$transaction(async (tx) => {
      // 1. Create Delivery Session
      const session = await tx.deliverySession.create({
        data: {
          bookingId,
          deliveryType: data.deliveryType,
          lockedPortionValue: settlement.lockedValue,
          deliveryRateValue: settlement.deliveryValue,
          walletAmountUsed: walletUsed,
          advancePaid: booking.totalAdvance,
          outstandingAmount: settlement.outstanding,
          deliveryGoldRate: currentGoldRate,
          paymentMethod: data.outstandingPaymentMethod,
          paymentRef: data.outstandingPaymentRef,
          notes: data.notes
        }
      });

      // 2. Wallet Deduct
      const walletAmountUsed = data.walletAmountUsed || 0;
      const walletMetal24KUsedGrams = data.walletMetal24KUsedGrams || 0;

      if (walletAmountUsed > 0 || walletMetal24KUsedGrams > 0) {
        let wallet = await tx.customerWallet.findUnique({ where: { customerId: booking.customerId } });
        if (wallet) {
          await tx.customerWallet.update({
            where: { id: wallet.id },
            data: { 
              cashBalance: { decrement: walletAmountUsed },
              metal24KBalance: { decrement: walletMetal24KUsedGrams }
            }
          });

          if (walletAmountUsed > 0) {
            await tx.customerWalletLedger.create({
              data: {
                walletId: wallet.id,
                transactionType: "WITHDRAWAL",
                assetType: "CASH",
                amount: walletAmountUsed,
                description: `Used cash for delivery of booking ${booking.bookingNumber}`,
                relatedEntityId: bookingId
              }
            });
          }

          if (walletMetal24KUsedGrams > 0) {
            await tx.customerWalletLedger.create({
              data: {
                walletId: wallet.id,
                transactionType: "WITHDRAWAL",
                assetType: "METAL_24K",
                amount: walletMetal24KUsedGrams,
                description: `Used metal for delivery of booking ${booking.bookingNumber}`,
                relatedEntityId: bookingId,
                goldRateApplied: currentGoldRate * (24 / 22)
              }
            });
          }
        }
      }

      // 3. Update Booking
      const bkg = await tx.productBooking.update({
        where: { id: bookingId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date()
        }
      });

      // 4. Ledger
      await tx.bookingLedger.create({
        data: {
          bookingId,
          entryType: "DELIVERY_COMPLETE",
          description: `Delivery completed. Wallet used: ${walletUsed}`,
          amount: settlement.total
        }
      });

      // 5. Inventory Sale Out
      for (const item of booking.items) {
        await tx.inventoryLedger.create({
          data: {
            productId: item.productId,
            branchId: booking.branchId,
            txnType: "SALE_OUT",
            refType: "ORDER",
            refId: bookingId,
            qtyOut: 1,
            grossWeightOut: item.weightGrams,
            netWeightOut: item.purity
          }
        });

        await tx.productItem.update({
          where: { id: item.productId },
          data: { 
            quantity: { decrement: 1 },
            reservedQty: { decrement: 1 } 
          }
        });
      }

      // 6. Audit
      await tx.bookingAuditLog.create({
        data: {
          bookingId,
          action: "DELIVERED"
        }
      });

      return { session, settlement, booking: bkg };
    });

    return NextResponse.json(deliveryRes);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to deliver booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
