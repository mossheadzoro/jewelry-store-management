import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [
      totalActive,
      rateLocked,
      deliveryDueThisWeek,
      expired,
      bookingsAgg,
      advanceCollectedAgg,
      goldAdvanceWeightAgg,
      customers
    ] = await Promise.all([
      prisma.productBooking.count({ where: { status: { in: ["ACTIVE", "PARTIAL_LOCK", "RATE_LOCKED"] } } }),
      prisma.productBooking.count({ where: { rateLockStatus: "FULL_LOCK" } }),
      prisma.productBooking.count({ where: { deliveryDueDate: { gte: now, lte: nextWeek } } }),
      prisma.productBooking.count({ where: { status: "EXPIRED" } }),
      prisma.productBooking.aggregate({ _sum: { grandTotal: true }, where: { status: { not: "CANCELLED" } } }),
      prisma.bookingAdvance.aggregate({ _sum: { netValue: true } }),
      prisma.bookingAdvance.aggregate({ _sum: { metalWeight: true }, where: { advanceType: { in: ["METAL_22K", "METAL_24K"] } } }),
      prisma.customer.aggregate({ _sum: { walletBalance: true } })
    ]);

    const bookingRevenue = bookingsAgg._sum.grandTotal || 0;
    const advanceCollected = advanceCollectedAgg._sum.netValue || 0;
    const goldAdvanceWeight = goldAdvanceWeightAgg._sum.metalWeight || 0;
    const walletLiability = customers._sum.walletBalance || 0;

    return NextResponse.json({
      totalActive,
      rateLocked,
      deliveryDueThisWeek,
      expired,
      bookingRevenue,
      advanceCollected,
      goldAdvanceWeight,
      walletLiability,
      // Additional trends can be computed from the raw data
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load dashboard data", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
