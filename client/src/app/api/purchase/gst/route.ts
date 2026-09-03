// client/src/app/api/purchase/gst/route.ts
// Purchase GST & GSTR-2B ITC Tracking API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { PurchaseGSTService } from "@/lib/services/purchase/PurchaseGSTService";

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
    const financialYear = searchParams.get("financialYear") || undefined;
    const periodMonth = searchParams.get("periodMonth")
      ? parseInt(searchParams.get("periodMonth")!, 10)
      : undefined;
    const periodYear = searchParams.get("periodYear")
      ? parseInt(searchParams.get("periodYear")!, 10)
      : undefined;

    const summary = await PurchaseGSTService.getGSTSummary({
      branchId,
      financialYear,
      periodMonth,
      periodYear,
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error("Get GST summary error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch GST summary" }, { status: 500 });
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
    const { recordId, reconciliationStatus, supplierReportedTax, gstr2bFilingDate, remarks } = body;

    if (!recordId || !reconciliationStatus) {
      return NextResponse.json({ error: "recordId and reconciliationStatus are required" }, { status: 400 });
    }

    const updated = await PurchaseGSTService.reconcileRecord({
      recordId,
      reconciliationStatus,
      supplierReportedTax: supplierReportedTax !== undefined ? Number(supplierReportedTax) : undefined,
      gstr2bFilingDate,
      remarks,
      actorId: parseInt(auth.session.user.id, 10),
      reqContext: {
        userId: parseInt(auth.session.user.id, 10),
        userEmail: auth.session.user.email,
        role: auth.user.systemRole,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Reconcile GST record error:", error);
    return NextResponse.json({ error: error.message || "Failed to reconcile GST record" }, { status: 500 });
  }
}
