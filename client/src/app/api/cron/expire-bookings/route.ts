import { NextResponse } from "next/server";

import { prisma } from "@libs/prisma";

export async function GET() {
  return handleCron();
}

export async function POST() {
  return handleCron();
}

async function handleCron() {
  try {
    const now = new Date();

    const expiredBookings = await prisma.productBooking.findMany({
      where: {
        status: { in: ["ACTIVE", "PARTIAL_LOCK", "RATE_LOCKED"] },
        deliveryDueDate: { lt: now }
      }
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({ message: "No bookings to expire", count: 0 });
    }

    const expiredIds = expiredBookings.map(b => b.id);

    const res = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.productBooking.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "EXPIRED" }
      });

      const auditLogs = expiredIds.map(id => ({
        bookingId: id,
        action: "STATUS_CHANGED",
        newValue: { status: "EXPIRED" } as any
      }));

      await tx.bookingAuditLog.createMany({
        data: auditLogs
      });

      return updateResult;
    });

    return NextResponse.json({ message: "Bookings expired successfully", count: res.count });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Failed to expire bookings", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
