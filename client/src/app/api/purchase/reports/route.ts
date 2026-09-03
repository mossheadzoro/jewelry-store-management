// client/src/app/api/purchase/reports/route.ts
// Procurement & Tax Periodic Reports API (Monthly, Quarterly, FY)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

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
    const reportType = searchParams.get("reportType") || "PROCUREMENT_SUMMARY";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const whereInvoice: any = branchId ? { branchId } : {};
    if (from || to) whereInvoice.invoiceDate = dateFilter;

    const [invoices, payments, receipts, transfers, suppliers] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where: whereInvoice,
        include: { supplier: true, items: true },
        orderBy: { invoiceDate: "desc" },
      }),
      prisma.purchasePayment.findMany({
        where: branchId ? { branchId, ...(from || to ? { paymentDate: dateFilter } : {}) } : (from || to ? { paymentDate: dateFilter } : {}),
        include: { supplier: true },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.purchaseMetalReceipt.findMany({
        where: branchId ? { receivingBranchId: branchId, ...(from || to ? { receiptDate: dateFilter } : {}) } : (from || to ? { receiptDate: dateFilter } : {}),
        include: { supplier: true },
        orderBy: { receiptDate: "desc" },
      }),
      prisma.purchaseMetalTransfer.findMany({
        where: branchId ? { sourceBranchId: branchId, ...(from || to ? { issueDate: dateFilter } : {}) } : (from || to ? { issueDate: dateFilter } : {}),
        orderBy: { issueDate: "desc" },
      }),
      prisma.bullionSupplier.findMany({
        where: { isActive: true },
      }),
    ]);

    // Aggregate metrics
    const totalPurchasedValue = invoices.reduce((sum, i) => sum + i.invoiceTotal, 0);
    const totalGrossWeight = invoices.reduce((sum, i) => sum + i.totalGrossWeight, 0);
    const totalFineWeight = invoices.reduce((sum, i) => sum + i.totalFineWeight, 0);
    const totalTaxPaid = invoices.reduce((sum, i) => sum + (i.cgstAmount + i.sgstAmount + i.igstAmount), 0);
    const totalPaymentsDisbursed = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        period: { from, to },
        summary: {
          totalInvoicesCount: invoices.length,
          totalPurchasedValue: Number(totalPurchasedValue.toFixed(2)),
          totalGrossWeight: Number(totalGrossWeight.toFixed(3)),
          totalFineWeight: Number(totalFineWeight.toFixed(3)),
          totalTaxPaid: Number(totalTaxPaid.toFixed(2)),
          totalPaymentsDisbursed: Number(totalPaymentsDisbursed.toFixed(2)),
          totalTransfersCount: transfers.length,
        },
        invoices,
        payments,
        receipts,
        transfers,
        suppliers,
      },
    });
  } catch (error: any) {
    console.error("Get purchase reports error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
