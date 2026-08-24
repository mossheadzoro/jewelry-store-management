import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expiredBookings = await prisma.productBooking.findMany({
      where: { status: "EXPIRED" },
      include: { customer: true, product: true },
      orderBy: { expiryDate: 'desc' }
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const expiredToday = expiredBookings.filter(b => b.expiryDate >= today);
    const expiredThisWeek = expiredBookings.filter(b => {
      const diff = now.getTime() - b.expiryDate.getTime();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    });
    const expiredThisMonth = expiredBookings.filter(b => {
      const diff = now.getTime() - b.expiryDate.getTime();
      return diff > 7 * 24 * 60 * 60 * 1000 && diff <= 30 * 24 * 60 * 60 * 1000;
    });

    return NextResponse.json({
      expiredToday,
      expiredThisWeek,
      expiredThisMonth,
      allExpired: expiredBookings
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load expired bookings", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
