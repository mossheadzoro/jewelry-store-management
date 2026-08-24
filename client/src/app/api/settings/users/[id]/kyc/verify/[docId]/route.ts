import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { StaffKycService } from "@/lib/services/StaffKycService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string; docId: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = session.user.role;
  const isManagerOrAdmin =
    actorRole === "ADMIN" ||
    actorRole === "MANAGER" ||
    actorRole === "SUPER_ADMIN" ||
    actorRole === "OWNER";

  if (!isManagerOrAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Staff KYC document verification requires Manager or Admin authority." },
      { status: 403 }
    );
  }

  try {
    const userId = parseInt(params.id, 10);
    const docId = params.docId;
    const body = await req.json();
    const action: "VERIFY" | "REJECT" = body.action === "REJECT" ? "REJECT" : "VERIFY";
    const notes: string = body.notes || body.reason || "";

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, branchId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    const updatedDoc = await StaffKycService.verifyStaffDocument(
      userId,
      docId,
      action,
      {
        id: parseInt(session.user.id, 10),
        name: session.user.name || "Manager",
        role: actorRole,
      },
      notes
    );

    if (!updatedDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Record Immutable Audit Log
    const auditAction =
      action === "VERIFY" ? AuditActions.STAFF_KYC_VERIFIED : AuditActions.STAFF_KYC_REJECTED;

    await AuditLogService.recordBusinessEvent({
      req,
      module: AuditModules.USERS,
      action: auditAction,
      entityType: "STAFF_USER",
      entityId: user.id.toString(),
      entityDisplayName: user.name,
      description:
        action === "VERIFY"
          ? `Manager ${session.user.name || "Staff"} verified KYC document (${updatedDoc.documentType}: ${updatedDoc.fileName}) for staff ${user.name}`
          : `Manager ${session.user.name || "Staff"} rejected KYC document (${updatedDoc.documentType}: ${updatedDoc.fileName}) for staff ${user.name} - Reason: ${notes}`,
      metadata: {
        documentId: docId,
        documentType: updatedDoc.documentType,
        fileName: updatedDoc.fileName,
        action,
        notes,
      },
      reason: notes || (action === "VERIFY" ? "Document verified against authentic records" : "Document rejected"),
      context: {
        userId: parseInt(session.user.id, 10),
        userName: session.user.name || "Manager",
        userRole: actorRole,
        branchId: user.branchId || undefined,
      },
    });

    return NextResponse.json({ success: true, document: updatedDoc });
  } catch (error: any) {
    console.error("Staff KYC verification error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update document verification" },
      { status: 500 }
    );
  }
}
