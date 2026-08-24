import { NextResponse } from "next/server";
import { extendBookingSchema } from "@/schemas/booking";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const result = extendBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation Error", code: "VALIDATION_FAILED" }, { status: 400 });
    }

    const data = result.data;

    const booking = await prisma.productBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const res = await prisma.$transaction(async (tx) => {
      const bkg = await tx.productBooking.update({
        where: { id: bookingId },
        data: {
          expiryDate: new Date(data.newExpiryDate),
          ...(booking.status === "EXPIRED" ? { status: "ACTIVE" } : {})
        }
      });

      await tx.bookingLedger.create({
        data: {
          bookingId,
          entryType: "EXPIRY_EXTENDED",
          description: `Expiry extended to ${data.newExpiryDate}`,
          amount: 0
        }
      });

      await tx.bookingAuditLog.create({
        data: {
          bookingId,
          action: "EXPIRY_EXTENDED",
          newValue: { expiryDate: data.newExpiryDate } as any
        }
      });

      return bkg;
    });

    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to extend booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
