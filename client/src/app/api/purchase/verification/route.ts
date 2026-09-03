// client/src/app/api/purchase/verification/route.ts
// Purchase Verification Queue & Manager Decision API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { VerificationService } from "@/lib/services/purchase/VerificationService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden: Verification queue restricted to Managers and Admins." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;

    const queue = await VerificationService.getPendingQueue(branchId);
    return NextResponse.json({ success: true, data: queue });
  } catch (error: any) {
    console.error("Get verification queue error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch verification queue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden: Only Managers or Admins can authorize verification requests." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      verificationRequestId,
      decision = "APPROVED",
      decisionNotes,
      escalatedToRole,
      pinVerified = true,
      stepUpTokenUsed,
    } = body;

    if (!verificationRequestId) {
      return NextResponse.json({ error: "verificationRequestId is required" }, { status: 400 });
    }

    const result = await VerificationService.decide({
      verificationRequestId,
      approverId: parseInt(auth.session.user.id, 10),
      decision,
      decisionNotes,
      escalatedToRole,
      pinVerified,
      stepUpTokenUsed,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || undefined,
      reqContext: {
        userId: parseInt(auth.session.user.id, 10),
        userEmail: auth.session.user.email,
        role: auth.user.systemRole,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Verification decision error:", error);
    return NextResponse.json({ error: error.message || "Failed to process decision" }, { status: 500 });
  }
}
