import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.productBooking.findUnique({
      where: { id },
      include: {
        Customer: true,
        BookingItem: { include: { ProductItem: true } },
        Branch: true,
        BookingAdvance: {
          orderBy: { createdAt: 'asc' },
          include: { User: { select: { name: true } } }
        },
        BookingLedger: {
          orderBy: { createdAt: 'asc' },
          include: { User: { select: { name: true } } }
        },
        DeliverySession: true,
        BookingTransfer: true,
        BookingAuditLog: { orderBy: { createdAt: 'desc' } },
        RateLockPlan: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const formattedBooking = {
      ...booking,
      customer: booking.Customer,
      items: booking.BookingItem.map((item: any) => ({
        ...item,
        product: item.ProductItem
      })),
      branch: booking.Branch,
      advances: booking.BookingAdvance.map((adv: any) => ({
        ...adv,
        receivedBy: adv.User
      })),
      ledger: booking.BookingLedger.map((led: any) => ({
        ...led,
        performedBy: led.User
      })),
      deliverySessions: booking.DeliverySession,
      transfers: booking.BookingTransfer,
      auditLogs: booking.BookingAuditLog,
      rateLockPlan: booking.RateLockPlan
    };

    return NextResponse.json(formattedBooking);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
