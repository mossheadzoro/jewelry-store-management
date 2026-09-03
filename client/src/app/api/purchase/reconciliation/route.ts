// client/src/app/api/purchase/reconciliation/route.ts
// Three-Way Reconciliation API (Cash, Metal & GST ITC)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchaseLiquidityService } from "@/lib/services/purchase/PurchaseLiquidityService";
import { PurchaseGSTService } from "@/lib/services/purchase/PurchaseGSTService";

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

    const [liquidity, gstSummary, bookings, receipts, invoices] = await Promise.all([
      PurchaseLiquidityService.getLiquiditySummary(branchId),
      PurchaseGSTService.getGSTSummary({ branchId }),
      prisma.purchaseBooking.findMany({
        where: branchId ? { branchId } : {},
        select: { grossWeight: true, fineWeight: true, receivedGrossWeight: true, pendingGrossWeight: true },
      }),
      prisma.purchaseMetalReceipt.findMany({
        where: branchId ? { receivingBranchId: branchId } : {},
        select: { expectedGrossWeight: true, actualGrossWeight: true, weightDifference: true },
      }),
      prisma.purchaseInvoice.findMany({
        where: branchId ? { branchId } : {},
        select: { totalGrossWeight: true, invoiceTotal: true, paidAmount: true, balanceAmount: true },
      }),
    ]);

    // Metal Variance calculation
    const totalBookedGross = bookings.reduce((sum, b) => sum + b.grossWeight, 0);
    const totalReceivedGross = bookings.reduce((sum, b) => sum + b.receivedGrossWeight, 0);
    const totalPendingGross = bookings.reduce((sum, b) => sum + b.pendingGrossWeight, 0);

    const totalWeightVariance = receipts.reduce((sum, r) => sum + r.weightDifference, 0);

    // Financial Variance calculation
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.invoiceTotal, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaid = invoices.reduce((sum, i) => sum + i.balanceAmount, 0);

    return NextResponse.json({
      success: true,
      data: {
        metalReconciliation: {
          totalBookedGross: Number(totalBookedGross.toFixed(3)),
          totalReceivedGross: Number(totalReceivedGross.toFixed(3)),
          totalPendingGross: Number(totalPendingGross.toFixed(3)),
          totalWeightVariance: Number(totalWeightVariance.toFixed(3)),
          reconciliationStatus: Math.abs(totalWeightVariance) > 0.1 ? "VARIANCE_FLAGGED" : "BALANCED",
        },
        financialReconciliation: {
          totalInvoiced: Number(totalInvoiced.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          totalUnpaid: Number(totalUnpaid.toFixed(2)),
          availableCash: liquidity.availableCash,
          netCashLeftToBook: liquidity.netCashLeftToBook,
          reconciliationStatus: liquidity.netCashLeftToBook >= 0 ? "SOLVENT" : "LIQUIDITY_DEFICIT",
        },
        gstReconciliation: {
          totalTaxableValue: gstSummary.totalTaxableValue,
          totalTax: gstSummary.totalTax,
          eligibleItc: gstSummary.eligibleItc,
          matchedCount: gstSummary.matchedCount,
          unreconciledCount: gstSummary.unreconciledCount,
          reconciliationStatus: gstSummary.unreconciledCount > 0 ? "ACTION_REQUIRED" : "RECONCILED",
        },
      },
    });
  } catch (error: any) {
    console.error("Purchase reconciliation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate reconciliation" }, { status: 500 });
  }
}
