// client/src/app/api/purchase/suppliers/[id]/ledger/route.ts
// Chronological Supplier Ledger Statement & Balance Verification API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

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
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const entryType = searchParams.get("entryType");

    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        businessName: true,
        gstin: true,
        phone: true,
        currentPayable: true,
        openingPayable: true,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const where: any = { supplierId: id };
    if (entryType && entryType !== "ALL") where.entryType = entryType;

    if (from || to) {
      where.transactionDate = {};
      if (from) where.transactionDate.gte = new Date(from);
      if (to) where.transactionDate.lte = new Date(to);
    }

    const entries = await prisma.supplierLedgerEntry.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: "asc" },
    });

    let totalDebit = 0;
    let totalCredit = 0;
    for (const e of entries) {
      totalDebit += e.debit;
      totalCredit += e.credit;
    }

    return NextResponse.json({
      success: true,
      data: {
        supplier,
        summary: {
          openingBalance: supplier.openingPayable,
          totalDebit: Number(totalDebit.toFixed(2)),
          totalCredit: Number(totalCredit.toFixed(2)),
          currentPayable: supplier.currentPayable,
          computedClosingBalance: Number((supplier.openingPayable + totalCredit - totalDebit).toFixed(2)),
        },
        entries,
      },
    });
  } catch (error: any) {
    console.error("Fetch supplier ledger error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch supplier ledger" }, { status: 500 });
  }
}
