// client/src/app/api/purchase/suppliers/route.ts
// Bullion Supplier Master List & Creation API

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
    return NextResponse.json(
      { error: "Forbidden: Purchase Panel is accessible only to Admin and Manager roles." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const supplierType = searchParams.get("supplierType");
    const isActiveStr = searchParams.get("isActive");

    const where: any = {};
    if (supplierType && supplierType !== "ALL") where.supplierType = supplierType;
    if (isActiveStr !== null) where.isActive = isActiveStr === "true";

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { gstin: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.bullionSupplier.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
            invoices: true,
            payments: true,
            metalReceipts: true,
          },
        },
      },
      orderBy: { businessName: "asc" },
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error("Fetch suppliers error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json(
      { error: "Forbidden: Only Admin and Manager roles can add suppliers." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      businessName,
      legalName,
      gstin,
      pan,
      supplierType = "BULLION_DEALER",
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      stateCode = "19",
      pincode,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      paymentTermsDays = 0,
      creditLimit = 0,
      openingPayable = 0,
      notes,
    } = body;

    if (!businessName || !phone || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { error: "Business Name, Phone, Address, City, State, and Pincode are required fields." },
        { status: 400 }
      );
    }

    const code = await PurchaseNumberingService.generateNumber("SUPPLIER", auth.branchId || 1);

    const supplier = await prisma.$transaction(async (tx) => {
      const created = await tx.bullionSupplier.create({
        data: {
          code,
          businessName,
          legalName,
          gstin,
          pan,
          supplierType,
          contactPerson,
          phone,
          email,
          address,
          city,
          state,
          stateCode,
          pincode,
          bankName,
          accountNumber,
          ifscCode,
          branchName,
          paymentTermsDays: Number(paymentTermsDays),
          creditLimit: Number(creditLimit),
          openingPayable: Number(openingPayable),
          currentPayable: Number(openingPayable),
          notes,
          branchId: auth.branchId || null,
        },
      });

      // If opening balance > 0, post to SupplierLedgerEntry
      if (Number(openingPayable) !== 0) {
        await tx.supplierLedgerEntry.create({
          data: {
            supplierId: created.id,
            branchId: auth.branchId || 1,
            entryType: "OPENING_BALANCE",
            debit: openingPayable < 0 ? Math.abs(openingPayable) : 0,
            credit: openingPayable > 0 ? openingPayable : 0,
            balance: Number(openingPayable),
            referenceType: "SUPPLIER",
            referenceId: created.id,
            documentNumber: code,
            description: "Opening balance forward",
            transactionDate: new Date(),
            createdById: parseInt(auth.session.user.id, 10),
          },
        });
      }

      return created;
    });

    await AuditLogService.recordBusinessEvent({
      req,
      module: "BULLION_SUPPLIERS",
      action: "SUPPLIER_CREATED",
      entityType: "BULLION_SUPPLIER",
      entityId: supplier.id,
      entityDisplayName: `${supplier.code} - ${supplier.businessName}`,
      description: `New bullion supplier ${supplier.businessName} (${supplier.code}) created`,
      after: supplier,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    console.error("Create supplier error:", error);
    return NextResponse.json({ error: error.message || "Failed to create supplier" }, { status: 500 });
  }
}
