// client/src/app/api/purchase/returns/route.ts
// Purchase Returns List & Creation API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchaseReturnNoteService } from "@/lib/services/purchase/PurchaseReturnNoteService";

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
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;
    const supplierId = searchParams.get("supplierId") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (supplierId) where.supplierId = supplierId;

    if (search) {
      where.OR = [
        { returnNumber: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { supplier: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const returns = await prisma.purchaseReturn.findMany({
      where,
      include: {
        supplier: true,
        invoice: { select: { invoiceNumber: true, supplierInvoiceNumber: true } },
        creditNote: true,
        requestedBy: { select: { name: true } },
      },
      orderBy: { returnDate: "desc" },
    });

    return NextResponse.json({ success: true, data: returns });
  } catch (error: any) {
    console.error("Get purchase returns error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch returns" }, { status: 500 });
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
    const requestedById = parseInt(auth.session.user.id, 10);

    const purchaseReturn = await PurchaseReturnNoteService.createReturn({
      purchaseInvoiceId: body.purchaseInvoiceId,
      returnedGrossWeight: Number(body.returnedGrossWeight),
      reason: body.reason || "Purity / quality defect",
      inspectionNotes: body.inspectionNotes,
      requestedById,
      autoCreditNote: body.autoCreditNote !== false,
      reqContext: {
        userId: requestedById,
        userEmail: auth.session.user.email,
        userName: auth.session.user.name,
        role: auth.user.systemRole,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true, data: purchaseReturn }, { status: 201 });
  } catch (error: any) {
    console.error("Create purchase return error:", error);
    return NextResponse.json({ error: error.message || "Failed to process return" }, { status: 500 });
  }
}
