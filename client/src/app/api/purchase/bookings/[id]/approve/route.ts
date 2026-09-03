// client/src/app/api/purchase/bookings/[id]/approve/route.ts
// Purchase Booking Verification & Approval API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { VerificationService } from "@/lib/services/purchase/VerificationService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden: Manager or Admin role required." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { decision = "APPROVED", decisionNotes, pinVerified = true } = body;

    const booking = await prisma.purchaseBooking.findUnique({
      where: { id },
    });
    if (!booking) {
      return NextResponse.json({ error: "Purchase booking not found" }, { status: 404 });
    }

    if (!booking.verificationId) {
      // Direct booking approval without existing verification request
      const updated = await prisma.purchaseBooking.update({
        where: { id },
        data: {
          status: decision === "APPROVED" ? "BOOKED" : "CANCELLED",
          verifiedById: parseInt(auth.session.user.id, 10),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const verificationResult = await VerificationService.decide({
      verificationRequestId: booking.verificationId,
      approverId: parseInt(auth.session.user.id, 10),
      decision: decision as any,
      decisionNotes,
      pinVerified,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || undefined,
      reqContext: {
        userId: parseInt(auth.session.user.id, 10),
        userEmail: auth.session.user.email,
        role: auth.user.systemRole,
        branchId: booking.branchId,
      },
    });

    return NextResponse.json({ success: true, data: verificationResult });
  } catch (error: any) {
    console.error("Approve booking error:", error);
    return NextResponse.json({ error: error.message || "Failed to process booking approval" }, { status: 500 });
  }
}
