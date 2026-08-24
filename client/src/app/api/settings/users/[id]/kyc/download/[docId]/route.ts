import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { StaffKycService } from "@/lib/services/StaffKycService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string; docId: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(params.id, 10);
    const docId = params.docId;

    const result = await StaffKycService.getStaffDocumentBuffer(userId, docId);
    if (!result) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { buffer, meta } = result;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": meta.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${meta.fileName}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Staff KYC download error:", error);
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}

export async function DELETE(
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
      { error: "Forbidden: Only Managers or Admins can delete staff KYC documents." },
      { status: 403 }
    );
  }

  try {
    const userId = parseInt(params.id, 10);
    const docId = params.docId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, branchId: true },
    });

    const deleted = await StaffKycService.deleteStaffDocument(userId, docId);
    if (!deleted) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Record Immutable Audit Log
    await AuditLogService.recordBusinessEvent({
      req,
      module: AuditModules.USERS,
      action: AuditActions.STAFF_KYC_DELETED,
      entityType: "STAFF_USER",
      entityId: String(userId),
      entityDisplayName: user?.name,
      description: `KYC document (${docId}) permanently removed for staff member ${user?.name || "Staff"} by ${session.user.name || "Manager"}`,
      metadata: {
        documentId: docId,
      },
      reason: "Document removed from vault by authorized reviewer",
      context: {
        userId: parseInt(session.user.id, 10),
        userName: session.user.name || "Manager",
        userRole: actorRole,
        branchId: user?.branchId || undefined,
      },
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Staff KYC deletion error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
