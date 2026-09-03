// client/src/app/api/purchase/bookings/[id]/route.ts
// Purchase Booking Detail, Update & Cancellation API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const booking = await prisma.purchaseBooking.findUnique({
      where: { id },
      include: {
        supplier: true,
        branch: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } },
        invoices: true,
        payments: true,
        metalReceipts: true,
        rateSnapshots: { orderBy: { timestamp: "desc" } },
        documents: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Purchase booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    console.error("Get booking detail error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch booking details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.purchaseBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Purchase booking not found" }, { status: 404 });
    }

    const updated = await prisma.purchaseBooking.update({
      where: { id },
      data: {
        expectedReceiptDate: body.expectedReceiptDate ? new Date(body.expectedReceiptDate) : existing.expectedReceiptDate,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        status: body.status !== undefined ? body.status : existing.status,
      },
    });

    await AuditLogService.recordBusinessEvent({
      req,
      module: "PURCHASE_BOOKINGS",
      action: "BOOKING_UPDATED",
      entityType: "PURCHASE_BOOKING",
      entityId: updated.id,
      entityDisplayName: updated.bookingNumber,
      description: `Purchase booking ${updated.bookingNumber} updated`,
      before: existing,
      after: updated,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only Administrators can cancel active bullion bookings." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const existing = await prisma.purchaseBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Purchase booking not found" }, { status: 404 });
    }

    if (existing.receivedGrossWeight > 0) {
      return NextResponse.json(
        { error: "Cannot cancel booking with physical metal already received." },
        { status: 400 }
      );
    }

    const updated = await prisma.purchaseBooking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await AuditLogService.recordBusinessEvent({
      req,
      module: "PURCHASE_BOOKINGS",
      action: "BOOKING_CANCELLED",
      entityType: "PURCHASE_BOOKING",
      entityId: updated.id,
      entityDisplayName: updated.bookingNumber,
      description: `Purchase booking ${updated.bookingNumber} was cancelled by Admin`,
      before: existing,
      after: updated,
      severity: "HIGH",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel booking" }, { status: 500 });
  }
}
