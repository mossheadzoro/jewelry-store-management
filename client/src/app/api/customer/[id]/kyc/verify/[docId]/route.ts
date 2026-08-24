import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules, AuditSeverity } from "@/lib/audit/AuditRegistry";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);
  const docId = resolvedParams.docId;

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role || "SALESMAN";

    // RBAC: Only Managers & Admins have KYC Verification / Approval authority
    const isManagerOrAdmin = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN" || userRole === "OWNER";
    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: KYC verification and approval requires Manager or Admin authority." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, notes, reason } = body; // action: "VERIFY" | "REJECT"

    if (action !== "VERIFY" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Must be VERIFY or REJECT." }, { status: 400 });
    }

    if (action === "REJECT" && !reason && !notes) {
      return NextResponse.json({ error: "A rejection reason is required when rejecting a document." }, { status: 400 });
    }

    // Find document
    const document = await prisma.customerDocument.findUnique({
      where: { id: docId },
      include: {
        customer: {
          select: { id: true, name: true, mobile: true },
        },
      },
    });

    if (!document || document.customerId !== customerId) {
      return NextResponse.json({ error: "Document not found or does not belong to this customer." }, { status: 404 });
    }

    const isVerifying = action === "VERIFY";
    const finalNotes = isVerifying
      ? (notes || `Verified by ${session?.user?.name || "Manager"}`)
      : `[REJECTED]: ${reason || notes || "Verification criteria not met"}`;

    const updatedDocument = await prisma.customerDocument.update({
      where: { id: docId },
      data: {
        verified: isVerifying,
        verifiedAt: isVerifying ? new Date() : null,
        notes: finalNotes,
      },
    });

    // Record Business Audit Event in Profile Change Ledger
    try {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.CUSTOMERS,
        action: isVerifying ? AuditActions.KYC_DOCUMENT_VERIFIED : AuditActions.KYC_DOCUMENT_REJECTED,
        entityType: "CUSTOMER",
        entityId: String(customerId),
        entityDisplayName: document.customer?.name || `Customer #${customerId}`,
        description: isVerifying
          ? `Manager ${session?.user?.name || "Staff"} verified KYC document (${document.documentType}) for ${document.customer?.name}`
          : `Manager ${session?.user?.name || "Staff"} rejected KYC document (${document.documentType}) for ${document.customer?.name} - Reason: ${reason || notes}`,
        before: {
          documentId: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          verified: document.verified,
          verifiedAt: document.verifiedAt,
          notes: document.notes,
        },
        after: {
          documentId: updatedDocument.id,
          documentType: updatedDocument.documentType,
          fileName: updatedDocument.fileName,
          verified: updatedDocument.verified,
          verifiedAt: updatedDocument.verifiedAt,
          notes: updatedDocument.notes,
        },
        reason: reason || notes || (isVerifying ? "Approved KYC document compliance" : "Document rejected"),
        severity: isVerifying ? AuditSeverity.INFO : AuditSeverity.LOW,
        context: {
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          userNameSnapshot: session?.user?.name || "Manager Staff",
          roleSnapshot: userRole,
          branchId: session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined,
        },
        metadata: {
          documentType: document.documentType,
          fileName: document.fileName,
          action,
        },
      });
    } catch (auditErr) {
      console.error("[KycVerify] Failed to record audit log:", auditErr);
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: isVerifying ? "Document verified successfully." : "Document rejected.",
    });
  } catch (err) {
    console.error("Error verifying document:", err);
    return NextResponse.json({ error: "Server error during KYC verification." }, { status: 500 });
  }
}
