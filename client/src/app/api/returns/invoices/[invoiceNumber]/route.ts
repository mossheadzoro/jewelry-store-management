// src/app/api/returns/invoices/[invoiceNumber]/route.ts
// Invoice Lookup and Item Eligibility Evaluation Endpoint

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { ReturnEligibilityService } from "@/lib/services/returns/ReturnEligibilityService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const resolvedParams = await params;
    const invoiceNumber = decodeURIComponent(resolvedParams.invoiceNumber).trim();

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number is required." }, { status: 400 });
    }

    const evaluation = await ReturnEligibilityService.evaluateInvoice(
      invoiceNumber,
      new Date(),
      auth.branchId
    );

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error: any) {
    console.error("Error looking up invoice for return:", error);
    return NextResponse.json(
      { error: error.message || "Failed to look up invoice." },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}
