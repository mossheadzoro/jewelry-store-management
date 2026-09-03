// src/app/api/returns/[id]/reject/route.ts
// Manager Rejection Endpoint for Return & Exchange Transactions

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
        { error: "Forbidden: Salesmen cannot reject returns. Manager authorization is required." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const transactionId = resolvedParams.id;

    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "A rejection reason is mandatory." },
        { status: 400 }
      );
    }

    const transaction = await prisma.returnExchangeTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const result = await ReturnExchangeService.rejectTransaction(
      transactionId,
      auth.user.id,
      reason.trim(),
      {
        userId: auth.user.id,
        userNameSnapshot: auth.user.name,
        roleSnapshot: auth.user.systemRole,
        branchId: transaction.branchId,
      }
    );

    return NextResponse.json({ message: "Transaction rejected.", transaction: result }, { status: 200 });
  } catch (error: any) {
    console.error("Error rejecting return transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject transaction." },
      { status: 400 }
    );
  }
}
