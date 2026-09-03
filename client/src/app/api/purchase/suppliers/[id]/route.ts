// client/src/app/api/purchase/suppliers/[id]/route.ts
// Bullion Supplier Detail, Update & Status Toggle API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { invoiceDate: "desc" },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
        metalReceipts: {
          orderBy: { receiptDate: "desc" },
          take: 10,
        },
        creditNotes: {
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        debitNotes: {
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error("Get supplier detail error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch supplier details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.bullionSupplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const updated = await prisma.bullionSupplier.update({
      where: { id },
      data: {
        businessName: body.businessName !== undefined ? body.businessName : existing.businessName,
        legalName: body.legalName !== undefined ? body.legalName : existing.legalName,
        gstin: body.gstin !== undefined ? body.gstin : existing.gstin,
        pan: body.pan !== undefined ? body.pan : existing.pan,
        supplierType: body.supplierType !== undefined ? body.supplierType : existing.supplierType,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : existing.contactPerson,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        address: body.address !== undefined ? body.address : existing.address,
        city: body.city !== undefined ? body.city : existing.city,
        state: body.state !== undefined ? body.state : existing.state,
        stateCode: body.stateCode !== undefined ? body.stateCode : existing.stateCode,
        pincode: body.pincode !== undefined ? body.pincode : existing.pincode,
        bankName: body.bankName !== undefined ? body.bankName : existing.bankName,
        accountNumber: body.accountNumber !== undefined ? body.accountNumber : existing.accountNumber,
        ifscCode: body.ifscCode !== undefined ? body.ifscCode : existing.ifscCode,
        branchName: body.branchName !== undefined ? body.branchName : existing.branchName,
        paymentTermsDays: body.paymentTermsDays !== undefined ? Number(body.paymentTermsDays) : existing.paymentTermsDays,
        creditLimit: body.creditLimit !== undefined ? Number(body.creditLimit) : existing.creditLimit,
        gstStatus: body.gstStatus !== undefined ? body.gstStatus : existing.gstStatus,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    await AuditLogService.recordBusinessEvent({
      req,
      module: "BULLION_SUPPLIERS",
      action: "SUPPLIER_UPDATED",
      entityType: "BULLION_SUPPLIER",
      entityId: updated.id,
      entityDisplayName: `${updated.code} - ${updated.businessName}`,
      description: `Supplier ${updated.businessName} profile updated`,
      before: existing,
      after: updated,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update supplier error:", error);
    return NextResponse.json({ error: error.message || "Failed to update supplier" }, { status: 500 });
  }
}
