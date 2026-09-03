// client/src/app/api/purchase/payments/[id]/route.ts
// Purchase Payment Detail & Cheque Status Update API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchasePaymentService } from "@/lib/services/purchase/PurchasePaymentService";

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
    const payment = await prisma.purchasePayment.findUnique({
      where: { id },
      include: {
        supplier: true,
        branch: { select: { id: true, name: true } },
        invoice: true,
        booking: true,
        createdBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        documents: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Purchase payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    console.error("Get payment detail error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payment details" }, { status: 500 });
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
    const { chequeStatus } = body;

    if (!chequeStatus) {
      return NextResponse.json({ error: "chequeStatus is required" }, { status: 400 });
    }

    const updated = await PurchasePaymentService.updateChequeStatus(
      id,
      chequeStatus,
      parseInt(auth.session.user.id, 10)
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}
