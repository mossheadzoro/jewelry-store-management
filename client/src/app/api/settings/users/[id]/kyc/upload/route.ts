import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { StaffKycService } from "@/lib/services/StaffKycService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorId = parseInt(session.user.id, 10);
  const actorRole = session.user.role;
  const targetUserId = parseInt(params.id, 10);

  const isSelf = actorId === targetUserId;
  const isManagerOrAdmin =
    actorRole === "ADMIN" ||
    actorRole === "MANAGER" ||
    actorRole === "SUPER_ADMIN" ||
    actorRole === "OWNER";

  if (!isManagerOrAdmin && !isSelf) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to upload KYC documents for this staff member." },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, branchId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = (formData.get("documentType") as string) || "OTHER";
    const notes = (formData.get("notes") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No document file provided" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const savedDoc = await StaffKycService.saveStaffDocument(targetUserId, fileBuffer, {
      documentType,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      notes,
      uploadedById: actorId,
      uploadedByName: session.user.name || "Staff Member",
      uploadedByRole: actorRole,
    });

    // Record Immutable Audit Log
    await AuditLogService.recordBusinessEvent({
      req,
      module: AuditModules.USERS,
      action: AuditActions.STAFF_KYC_UPLOADED,
      entityType: "STAFF_USER",
      entityId: user.id.toString(),
      entityDisplayName: user.name,
      description: `KYC document (${documentType}: ${file.name}) uploaded for staff ${user.name} by ${session.user.name || "User"} (${actorRole})`,
      metadata: {
        documentId: savedDoc.id,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        notes,
      },
      reason: notes || "Staff identity verification document submission",
      context: {
        userId: actorId,
        userName: session.user.name || "Staff Member",
        userRole: actorRole,
        branchId: user.branchId || undefined,
      },
    });

    return NextResponse.json({ success: true, document: savedDoc });
  } catch (error: any) {
    console.error("Staff KYC upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload KYC document" },
      { status: 500 }
    );
  }
}
