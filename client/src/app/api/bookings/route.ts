import { NextResponse } from "next/server";
import { PrismaClient, RateLockStatus } from "@prisma/client";
import { createBookingSchema } from "@/schemas/booking";
import { getRateLockStatus, metalAdvanceValue, generateBookingNumber } from "@/lib/booking-logic";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation Error", code: "VALIDATION_FAILED", details: result.error.errors }, { status: 400 });
    }

    const data = result.data;

    const productIds = data.items.map((i: any) => i.productId);
    const products = await prisma.productItem.findMany({ where: { id: { in: productIds } } });
    if (products.length !== data.items.length) {
      return NextResponse.json({ error: "One or more products not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const outOfStock = products.find(p => p.quantity - (p.reservedQty || 0) <= 0);
    if (outOfStock) {
      return NextResponse.json({ error: `Product ${outOfStock.name || outOfStock.productCode} is already reserved or out of stock`, code: "OUT_OF_STOCK" }, { status: 400 });
    }

    let rateLockPlan = null;
    if (data.rateLockPlanId) {
      rateLockPlan = await prisma.rateLockPlan.findUnique({ where: { id: data.rateLockPlanId } });
    }

    const goldRateEntry = await prisma.metalRateHistory.findFirst({
      where: { metalType: "GOLD", karatage: 22 },
      orderBy: { date: 'desc' }
    });
    const currentGoldRate = data.bookingRate && data.bookingRate > 0 ? data.bookingRate : (goldRateEntry ? goldRateEntry.rate : 7000);

    let subTotal = 0;
    let totalWeightGrams = 0;
    const bookingItemsToCreate = [];

    for (const itemData of data.items) {
      const product = products.find(p => p.id === itemData.productId)!;
      const metalValue = product.ntWeight * currentGoldRate;
      const makingCharge = metalValue * (itemData.makingChargePercent / 100);
      const itemValue = Math.round(metalValue + makingCharge);
      
      subTotal += itemValue;
      totalWeightGrams += product.gsWeight;
      
      bookingItemsToCreate.push({
        id: crypto.randomUUID(),
        productId: product.id,
        makingChargePercent: itemData.makingChargePercent,
        weightGrams: product.gsWeight,
        purity: product.purity,
        itemValue
      });
    }

    const additionalCharges = data.additionalCharges || 0;
    const gstAmount = 0;
    const grandTotal = subTotal + additionalCharges;

    let totalAdvance = 0;
    const advanceRecords: any[] = [];

    for (const adv of data.advances) {
      let netValue = 0;
      if (adv.advanceType === "METAL_22K" || adv.advanceType === "METAL_24K") {
        const weight = adv.metalWeight || 0;
        const purity = adv.advanceType === "METAL_24K" ? "24K" : "22K";
        netValue = metalAdvanceValue(weight, purity, currentGoldRate);
        advanceRecords.push({
          id: crypto.randomUUID(),
          advanceType: adv.advanceType,
          metalWeight: adv.metalWeight,
          metalPurity: purity,
          metalRateApplied: currentGoldRate,
          metalValueInRupees: netValue,
          netValue,
          branchId: data.branchId
        });
      } else {
        netValue = adv.cashAmount || 0;
        advanceRecords.push({
          id: crypto.randomUUID(),
          advanceType: adv.advanceType,
          cashAmount: adv.cashAmount,
          paymentRef: adv.paymentRef,
          netValue,
          branchId: data.branchId
        });
      }
      totalAdvance += netValue;
    }

    const advancePercent = grandTotal > 0 ? (totalAdvance / grandTotal) * 100 : 0;

    let rateLockStatus: RateLockStatus = "NO_LOCK";
    let lockedRate = null;
    let lockedAt = null;

    if (data.deliveryRatePlan === "OPTION_A_MARKET_RATE" || data.deliveryRatePlan === "MARKET_RATE") {
      rateLockStatus = "NO_LOCK";
    } else if (data.deliveryRatePlan === "OPTION_B_15_DAY_LOCK") {
      if (advancePercent < 80) {
        return NextResponse.json({ error: "Option B requires at least 80% advance.", code: "INVALID_ADVANCE" }, { status: 400 });
      }
      rateLockStatus = "FULL_LOCK";
      lockedRate = currentGoldRate;
      lockedAt = new Date();
    } else if (data.deliveryRatePlan === "OPTION_C_METAL_WALLET") {
      if (totalAdvance < 10000) {
        return NextResponse.json({ error: "Option C requires at least 10,000 advance.", code: "INVALID_ADVANCE" }, { status: 400 });
      }
      rateLockStatus = "NO_LOCK";
    } else if (data.deliveryRatePlan === "OPTION_D_FIXED_RATE" || data.deliveryRatePlan === "FIXED_RATE") {
      rateLockStatus = "FULL_LOCK";
      lockedRate = currentGoldRate;
      lockedAt = new Date();
    } else {
      // Legacy support for LOCK_NOW and SPLIT
      rateLockStatus = getRateLockStatus(advancePercent);
      if (rateLockStatus !== "NO_LOCK") {
        lockedRate = currentGoldRate;
        lockedAt = new Date();
      }
    }

    // Rule 6: Lock duration is strictly 15 days for Option B, else 90 days
    const lockDurationDays = data.deliveryRatePlan === "OPTION_B_15_DAY_LOCK" ? 15 : 90;
    const bookingDate = new Date();
    const expiryDate = new Date(bookingDate);
    expiryDate.setDate(expiryDate.getDate() + lockDurationDays);
    
    // Rule 8: Booking must be collected within 30 days
    // Store in deliveryDueDate as the overall collection deadline
    const validityDate = new Date(bookingDate);
    validityDate.setDate(validityDate.getDate() + 30);

    const bookingNumber = await generateBookingNumber(prisma);
    let currentBalance = grandTotal;
    const ledgerEntries: any[] = [
      {
        id: crypto.randomUUID(),
        entryType: "BOOKING_CREATED",
        description: `Booking Created with ${data.deliveryRatePlan}`,
        amount: grandTotal,
        balanceAfter: currentBalance
      }
    ];

    for (const adv of advanceRecords) {
      currentBalance -= (adv.netValue || 0);
      ledgerEntries.push({
        id: crypto.randomUUID(),
        entryType: "ADVANCE_ADDED",
        description: `Initial advance via ${adv.advanceType}`,
        amount: adv.netValue || 0,
        balanceAfter: currentBalance
      });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.productBooking.create({
        data: {
          id: crypto.randomUUID(),
          bookingNumber,
          customerId: data.customerId,
          branchId: data.branchId,
          rateLockPlanId: data.rateLockPlanId,
          bookingGoldRate: currentGoldRate,
          subTotal,
          additionalCharges,
          gstAmount,
          grandTotal,
          totalWeightGrams,
          rateLockStatus,
          lockedRate,
          lockedAt,
          lockedPortion: rateLockStatus === "FULL_LOCK" ? grandTotal : null,
          lockedWeightGrams: rateLockStatus === "FULL_LOCK" ? totalWeightGrams : null,
          deliveryRatePlan: data.deliveryRatePlan,
          totalAdvance,
          advancePercent,
          bookingDate,
          expiryDate,
          deliveryDueDate: validityDate,
          status: "ACTIVE",
          updatedAt: new Date(),
          BookingItem: { create: bookingItemsToCreate },
          BookingAdvance: { create: advanceRecords },
          BookingLedger: { create: ledgerEntries },
          BookingAuditLog: {
            create: {
              id: crypto.randomUUID(),
              action: "CREATED",
              newValue: { subTotal, grandTotal, totalAdvance, deliveryRatePlan: data.deliveryRatePlan, rateLockStatus } as any
            }
          }
        },
        include: { BookingAdvance: true, BookingLedger: true, Customer: true, BookingItem: { include: { ProductItem: true } } }
      });

      // Wallet Processing
      let wallet = await tx.customerWallet.findUnique({ where: { customerId: data.customerId } });
      const getOrCreateWallet = async () => {
        if (!wallet) {
          wallet = await tx.customerWallet.create({ data: { customerId: data.customerId } });
        }
        return wallet;
      };

      // 1. Process Metal Advances (always store in wallet)
      let metalAdvancesTotal24KGrams = 0;
      for (const a of advanceRecords) {
        if (a.advanceType === "METAL_22K" && a.metalWeight) {
          metalAdvancesTotal24KGrams += a.metalWeight * (22 / 24);
        } else if (a.advanceType === "METAL_24K" && a.metalWeight) {
          metalAdvancesTotal24KGrams += a.metalWeight;
        }
      }

      if (metalAdvancesTotal24KGrams > 0) {
        const w = await getOrCreateWallet();
        await tx.customerWallet.update({
          where: { id: w.id },
          data: { metal24KBalance: { increment: metalAdvancesTotal24KGrams } }
        });
        await tx.customerWalletLedger.create({
          data: {
            walletId: w.id,
            transactionType: "DEPOSIT",
            assetType: "METAL_24K",
            amount: metalAdvancesTotal24KGrams,
            description: `Metal advance for booking ${bookingNumber}`,
            relatedEntityId: newBooking.id
          }
        });
      }

      // 2. Process Cash Conversion for Option C
      if (data.deliveryRatePlan === "OPTION_C_METAL_WALLET") {
        const cashAdvancesTotal = advanceRecords.filter(a => a.advanceType !== "METAL_22K" && a.advanceType !== "METAL_24K").reduce((sum, a) => sum + (a.netValue || 0), 0);
        
        if (cashAdvancesTotal >= 10000) {
          const currentGoldRate24K = currentGoldRate * (24 / 22);
          const metal24KGrams = cashAdvancesTotal / currentGoldRate24K;

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
              description: `Converted cash advance of ₹${cashAdvancesTotal} to 24K metal for booking ${bookingNumber}`,
              relatedEntityId: newBooking.id,
              goldRateApplied: currentGoldRate24K
            }
          });
        }
      }

      for (const product of products) {
        await tx.inventoryLedger.create({
          data: {
            productId: product.id,
            branchId: data.branchId,
            txnType: "RESERVE_OUT",
            refType: "ORDER",
            refId: newBooking.id,
            qtyOut: 1,
            grossWeightOut: product.gsWeight,
            netWeightOut: product.ntWeight
          }
        });

        await tx.productItem.update({
          where: { id: product.id },
          data: { reservedQty: { increment: 1 } }
        });
      }

      return {
        ...newBooking,
        items: newBooking.BookingItem.map((i: any) => ({ ...i, product: i.ProductItem })),
        advances: newBooking.BookingAdvance,
        ledger: newBooking.BookingLedger,
        auditLogs: newBooking.BookingAuditLog,
        customer: newBooking.Customer,
      };
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Booking Create Error:", error);
    return NextResponse.json({ error: "Failed to create booking", code: "INTERNAL_ERROR", details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};
    if (status) where.status = status;
    if (branchId) where.branchId = parseInt(branchId);

    const bookings = await prisma.productBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { Customer: true, BookingItem: { include: { ProductItem: true } } }
    });
    
    const count = await prisma.productBooking.count({ where });

    const formattedBookings = bookings.map(b => ({
      ...b,
      items: b.BookingItem.map((i: any) => ({ ...i, product: i.ProductItem })),
      customer: b.Customer
    }));

    return NextResponse.json({ bookings: formattedBookings, count });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch bookings", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
