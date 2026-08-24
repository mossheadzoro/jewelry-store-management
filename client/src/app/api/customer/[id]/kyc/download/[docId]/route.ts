import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptBuffer } from "@/lib/services/KycEncryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";
import fs from "fs";

export async function GET(
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
    const document = await prisma.customerDocument.findUnique({
      where: { id: docId },
    });

    if (!document || document.customerId !== customerId) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    if (!fs.existsSync(document.filePath)) {
      return NextResponse.json({ error: "Encrypted file not found on storage server" }, { status: 404 });
    }

    // Read encrypted file
    const encBuffer = fs.readFileSync(document.filePath);

    // Decrypt
    const decryptedBuffer = decryptBuffer(encBuffer, document.iv || "");

    // Determine content type based on extension
    const ext = document.fileName.split(".").pop()?.toLowerCase() || "";
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";

    return new Response(decryptedBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        "Content-Length": decryptedBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Error downloading document:", err);
    return NextResponse.json({ error: "Server error during decryption" }, { status: 500 });
  }
}

// Add DELETE handler to delete the document and clean up local file storage with RBAC
export async function DELETE(
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

    // Only Manager or Admin can delete KYC documents
    const isManagerOrAdmin = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN" || userRole === "OWNER";
    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Deleting KYC vault documents requires Manager authority." },
        { status: 403 }
      );
    }

    const document = await prisma.customerDocument.findUnique({
      where: { id: docId },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    if (!document || document.customerId !== customerId) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete database entry
    await prisma.customerDocument.delete({
      where: { id: docId },
    });

    // Record deletion in Audit Log
    try {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.CUSTOMERS,
        action: AuditActions.KYC_DOCUMENT_DELETED,
        entityType: "CUSTOMER",
        entityId: String(customerId),
        entityDisplayName: document.customer?.name || `Customer #${customerId}`,
        description: `Deleted KYC document (${document.documentType}: ${document.fileName}) for customer ${document.customer?.name}`,
        before: {
          documentId: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          verified: document.verified,
        },
        context: {
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          userNameSnapshot: session?.user?.name || "Manager Staff",
          roleSnapshot: userRole,
          branchId: session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined,
        },
      });
    } catch (auditErr) {
      console.error("[KycDelete] Failed to record audit log:", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting document:", err);
    return NextResponse.json({ error: "Server error during deletion" }, { status: 500 });
  }
}

