import { NextResponse } from "next/server";
import { transferBookingSchema } from "@/schemas/booking";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const result = transferBookingSchema.safeParse(body);

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
      // 1. Create Transfer Record
      const transfer = await tx.bookingTransfer.create({
        data: {
          bookingId,
          fromBranchId: booking.branchId,
          toBranchId: data.toBranchId,
          reason: data.reason,
          notes: data.notes,
          status: "COMPLETED",
          completedAt: new Date()
        }
      });

      // 2. Update Booking
      const bkg = await tx.productBooking.update({
        where: { id: bookingId },
        data: {
          branchId: data.toBranchId,
          originalBranchId: booking.originalBranchId || booking.branchId
        }
      });

      // 3. Ledger
      await tx.bookingLedger.create({
        data: {
          bookingId,
          entryType: "TRANSFER",
          description: `Transferred from Branch ${booking.branchId} to ${data.toBranchId}. Reason: ${data.reason}`,
          amount: 0
        }
      });

      // 4. Audit
      await tx.bookingAuditLog.create({
        data: {
          bookingId,
          action: "TRANSFER",
          newValue: { branchId: data.toBranchId } as any
        }
      });

      return { booking: bkg, transfer };
    });

    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to transfer booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
