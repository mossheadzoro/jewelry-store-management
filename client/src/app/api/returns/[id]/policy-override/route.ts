// src/app/api/returns/[id]/policy-override/route.ts
// Manager Policy Override Endpoint

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/audit/AuditLogService";

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
        { error: "Forbidden: Only Managers or Admins can authorize policy overrides." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const transactionId = resolvedParams.id;

    const body = await req.json();
    const { overrideReason } = body;

    if (!overrideReason || !overrideReason.trim()) {
      return NextResponse.json(
        { error: "An override justification reason is mandatory." },
        { status: 400 }
      );
    }

    const transaction = await prisma.returnExchangeTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const updated = await prisma.returnExchangeTransaction.update({
      where: { id: transactionId },
      data: {
        policyOverride: true,
        overrideReason: overrideReason.trim(),
      },
    });

    // Record high-severity Enterprise Audit event
    try {
      await AuditLogService.recordBusinessEvent({
        context: {
          userId: auth.user.id,
          userNameSnapshot: auth.user.name,
          roleSnapshot: auth.user.systemRole,
          branchId: transaction.branchId,
        },
        module: "RETURNS",
        action: "RETURN.POLICY_OVERRIDE",
        entityType: "RETURN_EXCHANGE",
        entityId: transaction.id,
        entityDisplayName: transaction.transactionNumber,
        description: `Manager ${auth.user.name} authorized policy override for ${transaction.transactionNumber}: ${overrideReason}`,
        severity: "HIGH",
        reason: overrideReason,
      });
    } catch (auditErr) {
      console.warn("Audit log warning:", auditErr);
    }

    return NextResponse.json({ message: "Policy override recorded.", transaction: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error authorizing policy override:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record policy override." },
      { status: 400 }
    );
  }
}
