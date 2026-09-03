// src/app/api/returns/eligibility/route.ts
// Direct Eligibility Calculation Endpoint

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { ReturnEligibilityService } from "@/lib/services/returns/ReturnEligibilityService";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { invoiceNumber, currentDate } = body;

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number is required." }, { status: 400 });
    }

    const evalDate = currentDate ? new Date(currentDate) : new Date();
    const summary = await ReturnEligibilityService.evaluateInvoice(invoiceNumber, evalDate, auth.branchId);

    return NextResponse.json(summary, { status: 200 });
  } catch (error: any) {
    console.error("Eligibility evaluation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate eligibility." },
      { status: 500 }
    );
  }
}
