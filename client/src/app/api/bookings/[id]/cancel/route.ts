import { NextResponse } from "next/server";
import { cancelBookingSchema } from "@/schemas/booking";

import { prisma } from "@libs/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const result = cancelBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation Error", code: "VALIDATION_FAILED" }, { status: 400 });
    }

    const data = result.data;

    const booking = await prisma.productBooking.findUnique({
      where: { id: bookingId },
      include: { rateLockPlan: true, items: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (booking.status === "DELIVERED" || booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot cancel a delivered or already cancelled booking", code: "INVALID_STATUS" }, { status: 400 });
    }

    let refundAmount = booking.totalAdvance;
    let cancellationCharge = 0;

    // Rule 10: 2% Cancellation Charge for Refund
    if (data.refundOption === "REFUND_WITH_DEDUCTION") {
      cancellationCharge = 0.02 * booking.totalAdvance;
      refundAmount -= cancellationCharge;
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Update Booking
      const bkg = await tx.productBooking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancellationReason: data.reason,
          cancelledAt: new Date(),
        }
      });

      // 2. Refund logic
      if (data.refundOption === "WALLET") {
        await tx.customer.update({
          where: { id: booking.customerId },
          data: { walletBalance: { increment: refundAmount } }
        });
      }

      // 3. Write Ledger
      const entryType = data.refundOption === "WALLET" ? "REFUND_WALLET" : "REFUND_CASH";
      await tx.bookingLedger.create({
        data: {
          bookingId,
          entryType: "CANCELLATION",
          description: `Booking cancelled. Reason: ${data.reason}. Charge: ${cancellationCharge}`,
          amount: 0
        }
      });
      await tx.bookingLedger.create({
        data: {
          bookingId,
          entryType: entryType as any,
          description: `Refund processed to ${data.refundOption}`,
          amount: refundAmount
        }
      });

      // 4. Update Inventory Ledger
      for (const item of booking.items) {
        await tx.inventoryLedger.create({
          data: {
            productId: item.productId,
            branchId: booking.branchId,
            txnType: "UNRESERVE_IN",
            refType: "ORDER",
            refId: bookingId,
            qtyIn: 1,
            grossWeightIn: item.weightGrams,
            netWeightIn: item.purity
          }
        });

        await tx.productItem.update({
          where: { id: item.productId },
          data: { reservedQty: { decrement: 1 } }
        });
      }

      // 5. Audit
      await tx.bookingAuditLog.create({
        data: {
          bookingId,
          action: "CANCELLED"
        }
      });

      return { booking: bkg, refundAmount, cancellationCharge };
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to cancel booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
