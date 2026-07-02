import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      bookings,
      advances,
      customers
    ] = await Promise.all([
      prisma.productBooking.count({ where: { status: { in: ["ACTIVE", "PARTIAL_LOCK", "RATE_LOCKED"] } } }),
      prisma.productBooking.count({ where: { rateLockStatus: "FULL_LOCK" } }),
      prisma.productBooking.count({ where: { deliveryDueDate: { gte: now, lte: nextWeek } } }),
      prisma.productBooking.count({ where: { status: "EXPIRED" } }),
      prisma.productBooking.findMany({ where: { status: { not: "CANCELLED" } }, select: { grandTotal: true } }),
      prisma.bookingAdvance.findMany({ select: { netValue: true, advanceType: true, metalWeight: true, metalPurity: true, createdAt: true } }),
      prisma.customer.aggregate({ _sum: { walletBalance: true } })
    ]);

    const bookingRevenue = bookings.reduce((sum, b) => sum + b.grandTotal, 0);
    const advanceCollected = advances.reduce((sum, a) => sum + a.netValue, 0);
    const goldAdvanceWeight = advances
      .filter(a => a.advanceType === "METAL_22K" || a.advanceType === "METAL_24K")
      .reduce((sum, a) => sum + (a.metalWeight || 0), 0);
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
