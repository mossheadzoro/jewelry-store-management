// client/src/app/api/purchase/receiving/route.ts
// Physical Metal Receiving, Tolerance Check & Inventory Intake API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { MetalReceiptService } from "@/lib/services/purchase/MetalReceiptService";

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
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await MetalReceiptService.getReceipts({
      branchId,
      supplierId,
      status,
      search,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Get metal receipts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch receipts" }, { status: 500 });
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
    const receivedById = parseInt(auth.session.user.id, 10);

    const receipt = await MetalReceiptService.recordReceipt({
      branchId,
      supplierId: body.supplierId,
      purchaseInvoiceId: body.purchaseInvoiceId || undefined,
      purchaseBookingId: body.purchaseBookingId || undefined,
      supplierInvoiceNumber: body.supplierInvoiceNumber || undefined,
      metalCategory: body.metalCategory || "GOLD_24K",
      purityPercent: body.purityPercent ? Number(body.purityPercent) : undefined,
      expectedGrossWeight: Number(body.expectedGrossWeight),
      actualGrossWeight: Number(body.actualGrossWeight),
      lotBatchNo: body.lotBatchNo,
      purityTestingResult: body.purityTestingResult,
      testCertificateNo: body.testCertificateNo,
      notes: body.notes,
      receivedById,
      autoApprove: role === "ADMIN" && body.autoApprove === true,
      reqContext: {
        userId: receivedById,
        userEmail: auth.session.user.email,
        userName: auth.session.user.name,
        role: auth.user.systemRole,
        branchId,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true, data: receipt }, { status: 201 });
  } catch (error: any) {
    console.error("Record metal receipt error:", error);
    return NextResponse.json({ error: error.message || "Failed to record metal intake" }, { status: 500 });
  }
}
