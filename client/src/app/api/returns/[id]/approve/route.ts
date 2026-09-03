// src/app/api/returns/[id]/approve/route.ts
// Manager Approval Endpoint for Return & Exchange Transactions

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { ReturnExchangeService } from "@/lib/services/returns/ReturnExchangeService";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const isManagerOrAdmin = ["ADMIN", "MANAGER", "SUPER_ADMIN", "OWNER"].includes(
      auth.user.systemRole as string
    );

    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Salesmen cannot approve returns. Manager approval is required." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const transactionId = resolvedParams.id;

    const body = await req.json().catch(() => ({}));
    const { refundMethod = "STORE_CREDIT", paymentReference, stepUpVerified } = body;

    // Check transaction and branch high-value threshold
    const transaction = await prisma.returnExchangeTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const branchPolicy = await prisma.returnExchangePolicySettings.findUnique({
      where: { branchId: transaction.branchId },
    });

    const threshold = branchPolicy?.highValueApprovalThreshold || 100000;
    const refundPayable = (transaction.financialSnapshot as any)?.summary?.netRefundPayable || 0;

    if (refundPayable > threshold && branchPolicy?.requireStepUpAuthAboveThreshold && !stepUpVerified) {
      // Prompt for step-up confirmation
      return NextResponse.json(
        {
          error: "High-value return threshold exceeded. Step-up manager authorization is required.",
          requireStepUp: true,
          threshold,
          amount: refundPayable,
        },
        { status: 403 }
      );
    }

    const result = await ReturnExchangeService.approveTransaction(
      transactionId,
      auth.user.id,
      refundMethod,
      paymentReference,
      {
        userId: auth.user.id,
        userNameSnapshot: auth.user.name,
        roleSnapshot: auth.user.systemRole,
        branchId: transaction.branchId,
      }
    );

    return NextResponse.json({ message: "Transaction approved successfully.", result }, { status: 200 });
  } catch (error: any) {
    console.error("Error approving return transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve transaction." },
      { status: 400 }
    );
  }
}
