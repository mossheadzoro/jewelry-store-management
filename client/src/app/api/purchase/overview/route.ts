// client/src/app/api/purchase/overview/route.ts
// Executive Dashboard KPIs, Metal Position, Liquidity & Summary

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchaseLiquidityService } from "@/lib/services/purchase/PurchaseLiquidityService";

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
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : auth.branchId;

    const whereBranch = branchId ? { branchId } : {};

    // 1. Fetch KPI metrics concurrently
    const [
      liquidity,
      totalSuppliersCount,
      activeBookings,
      pendingVerificationCount,
      recentBookings,
      recentInvoices,
      recentReceipts,
      recentPayments,
      monthlyGSTPeriod,
    ] = await Promise.all([
      PurchaseLiquidityService.getLiquiditySummary(branchId),
      prisma.bullionSupplier.count({ where: { isActive: true } }),
      prisma.purchaseBooking.findMany({
        where: {
          ...whereBranch,
          status: { in: ["BOOKED", "PARTIALLY_RECEIVED", "PENDING_VERIFICATION"] },
        },
        select: {
          grossWeight: true,
          fineWeight: true,
          totalAmount: true,
          paidAmount: true,
          balancePayment: true,
          receivedGrossWeight: true,
          pendingGrossWeight: true,
        },
      }),
      prisma.verificationRequest.count({
        where: {
          ...whereBranch,
          status: "PENDING",
        },
      }),
      prisma.purchaseBooking.findMany({
        where: whereBranch,
        include: {
          supplier: { select: { businessName: true, code: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.purchaseInvoice.findMany({
        where: whereBranch,
        include: {
          supplier: { select: { businessName: true, code: true } },
        },
        orderBy: { invoiceDate: "desc" },
        take: 5,
      }),
      prisma.purchaseMetalReceipt.findMany({
        where: branchId ? { receivingBranchId: branchId } : {},
        include: {
          supplier: { select: { businessName: true } },
        },
        orderBy: { receiptDate: "desc" },
        take: 5,
      }),
      prisma.purchasePayment.findMany({
        where: whereBranch,
        include: {
          supplier: { select: { businessName: true } },
        },
        orderBy: { paymentDate: "desc" },
        take: 5,
      }),
      prisma.purchaseGSTPeriod.findFirst({
        where: whereBranch,
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      }),
    ]);

    // Aggregate booking positions
    let totalBookedGrossWeight = 0;
    let totalBookedFineWeight = 0;
    let totalPendingIntakeGross = 0;
    let totalBookedValue = 0;
    let totalOutstandingPayable = 0;

    for (const b of activeBookings) {
      totalBookedGrossWeight += b.grossWeight;
      totalBookedFineWeight += b.fineWeight;
      totalPendingIntakeGross += b.pendingGrossWeight;
      totalBookedValue += b.totalAmount;
      totalOutstandingPayable += b.balancePayment;
    }

    // Suppliers total payable & advances
    const suppliers = await prisma.bullionSupplier.findMany({
      where: { isActive: true },
      select: { currentPayable: true, totalPurchasedValue: true },
    });
    const totalSupplierPayables = suppliers
      .filter((s) => s.currentPayable > 0)
      .reduce((sum, s) => sum + s.currentPayable, 0);
    const totalSupplierAdvances = suppliers
      .filter((s) => s.currentPayable < 0)
      .reduce((sum, s) => sum + Math.abs(s.currentPayable), 0);
    const netSupplierPosition = suppliers.reduce((sum, s) => sum + s.currentPayable, 0);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          availableCash: liquidity.availableCash,
          committedPurchases: liquidity.outstandingPurchaseCommitments,
          netCashLeftToBook: liquidity.netCashLeftToBook,
          totalBookedGrossWeight: Number(totalBookedGrossWeight.toFixed(3)),
          totalBookedFineWeight: Number(totalBookedFineWeight.toFixed(3)),
          totalPendingIntakeGross: Number(totalPendingIntakeGross.toFixed(3)),
          totalSupplierPayables: Number(totalSupplierPayables.toFixed(2)),
          totalSupplierAdvances: Number(totalSupplierAdvances.toFixed(2)),
          netSupplierPosition: Number(netSupplierPosition.toFixed(2)),
          activeSuppliersCount: totalSuppliersCount,
          activeBookingsCount: activeBookings.length,
          pendingVerificationCount,
          monthlyGSTStatus: monthlyGSTPeriod ? monthlyGSTPeriod.status : "DRAFT",
        },
        liquidity,
        recentActivity: {
          bookings: recentBookings,
          invoices: recentInvoices,
          receipts: recentReceipts,
          payments: recentPayments,
        },
      },
    });
  } catch (error: any) {
    console.error("Purchase overview error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load purchase overview" },
      { status: 500 }
    );
  }
}
