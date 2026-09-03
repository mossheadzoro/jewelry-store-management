// client/src/app/api/purchase/documents/route.ts
// Purchase Document Management & Invoice Scan Storage API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchaseNumberingService } from "@/lib/services/purchase/PurchaseNumberingService";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId") || undefined;
    const documentType = searchParams.get("documentType") || undefined;

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (documentType && documentType !== "ALL") where.documentType = documentType;

    const documents = await prisma.purchaseDocument.findMany({
      where,
      include: {
        supplier: { select: { id: true, businessName: true, code: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        booking: { select: { id: true, bookingNumber: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error("Get purchase documents error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      documentType = "INVOICE_SCAN",
      supplierId,
      purchaseInvoiceId,
      purchaseBookingId,
      metalReceiptId,
      purchasePaymentId,
      storageUrl,
      storageKey,
      storageProvider = "CLOUDINARY",
      mimeType = "application/pdf",
      fileSizeBytes,
      fileHash,
      originalFileName,
      ocrExtractedData,
    } = body;

    if (!storageUrl) {
      return NextResponse.json({ error: "storageUrl is required" }, { status: 400 });
    }

    const documentNumber = await PurchaseNumberingService.generateNumber("PURCHASE_DOCUMENT", auth.branchId || 1);

    const doc = await prisma.purchaseDocument.create({
      data: {
        documentNumber,
        documentType,
        supplierId: supplierId || undefined,
        purchaseInvoiceId: purchaseInvoiceId || undefined,
        purchaseBookingId: purchaseBookingId || undefined,
        metalReceiptId: metalReceiptId || undefined,
        purchasePaymentId: purchasePaymentId || undefined,
        storageUrl,
        storageKey,
        storageProvider,
        mimeType,
        fileSizeBytes: fileSizeBytes ? Number(fileSizeBytes) : undefined,
        fileHash,
        originalFileName: originalFileName || `Scan_${documentNumber}.pdf`,
        ocrStatus: ocrExtractedData ? "COMPLETED" : "NOT_ATTEMPTED",
        ocrExtractedData: ocrExtractedData || undefined,
        verificationStatus: "VERIFIED",
        uploadedById: parseInt(auth.session.user.id, 10),
      },
      include: {
        supplier: true,
        invoice: true,
      },
    });

    await AuditLogService.recordBusinessEvent({
      req,
      module: "PURCHASE_DOCUMENTS",
      action: "DOCUMENT_UPLOADED",
      entityType: "PURCHASE_DOCUMENT",
      entityId: doc.id,
      entityDisplayName: `${doc.documentNumber} (${doc.documentType})`,
      description: `Purchase document ${doc.documentNumber} uploaded: ${doc.originalFileName}`,
      after: doc,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Create purchase document error:", error);
    return NextResponse.json({ error: error.message || "Failed to save document" }, { status: 500 });
  }
}
