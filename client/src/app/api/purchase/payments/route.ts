// client/src/app/api/purchase/payments/route.ts
// Purchase Payments List & Record Payment API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { PurchasePaymentService } from "@/lib/services/purchase/PurchasePaymentService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;
    const supplierId = searchParams.get("supplierId") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await PurchasePaymentService.getPayments({
      branchId,
      supplierId,
      paymentMethod,
      status,
      search,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Get purchase payments error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const branchId = body.branchId ? parseInt(body.branchId, 10) : auth.branchId || 1;
    const createdById = parseInt(auth.session.user.id, 10);

    const payment = await PurchasePaymentService.recordPayment({
      branchId,
      supplierId: body.supplierId,
      purchaseInvoiceId: body.purchaseInvoiceId || undefined,
      purchaseBookingId: body.purchaseBookingId || undefined,
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod || "BANK_TRANSFER",
      paymentType: body.paymentType || "INVOICE_PAYMENT",
      referenceNumber: body.referenceNumber,
      chequeNumber: body.chequeNumber,
      chequeDate: body.chequeDate,
      bankName: body.bankName,
      transactionId: body.transactionId,
      paymentDate: body.paymentDate || new Date(),
      idempotencyKey: body.idempotencyKey || req.headers.get("x-idempotency-key") || undefined,
      notes: body.notes,
      createdById,
      autoApprove: role === "ADMIN" && body.autoApprove === true,
      reqContext: {
        userId: createdById,
        userEmail: auth.session.user.email,
        userName: auth.session.user.name,
        role: auth.user.systemRole,
        branchId,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    console.error("Record purchase payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
