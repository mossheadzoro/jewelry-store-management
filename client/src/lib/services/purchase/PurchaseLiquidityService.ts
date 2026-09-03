// client/src/lib/services/purchase/PurchaseLiquidityService.ts
// Cash Liquidity, Net Cash Left to Book & Payment Method Analytics

import { prisma } from "@/lib/prisma";

export interface CashMovementSummary {
  openingCash: number;
  confirmedSalesCollections: number;
  confirmedOtherReceipts: number;
  purchasePayments: number;
  approvedCashOutflows: number;
  otherCommittedObligations: number;
  availableCash: number;
  outstandingPurchaseCommitments: number;
  netCashLeftToBook: number;
  breakdown: Array<{
    category: string;
    description: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
  paymentMethods: Array<{
    method: string;
    label: string;
    todayInflow: number;
    todayOutflow: number;
    periodInflow: number;
    periodOutflow: number;
    txnCount: number;
    pendingSettlement: number;
    reconciledAmount: number;
  }>;
}

export class PurchaseLiquidityService {
  /**
   * Computes available cash liquidity and Net Cash Left to Book for procurement planning.
   */
  public static async getLiquiditySummary(branchId?: number): Promise<CashMovementSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereBranch = branchId ? { branchId } : {};

    // 1. Calculate sales payments collected
    const invoicePayments = await prisma.invoicePayment.findMany({
      where: branchId ? { invoice: { branchId } } : {},
      include: { invoice: { select: { branchId: true, createdAt: true } } },
    });

    let totalSalesCollections = 0;
    let todaySalesCollections = 0;
    const methodInflows: Record<string, { total: number; today: number; count: number }> = {};

    for (const ip of invoicePayments) {
      totalSalesCollections += ip.amount;
      const isToday = new Date(ip.paidAt) >= today;
      if (isToday) todaySalesCollections += ip.amount;

      const m = ip.method || "OTHER";
      if (!methodInflows[m]) methodInflows[m] = { total: 0, today: 0, count: 0 };
      methodInflows[m].total += ip.amount;
      if (isToday) methodInflows[m].today += ip.amount;
      methodInflows[m].count++;
    }

    // 2. Booking Advances
    const bookingAdvances = await prisma.bookingAdvance.findMany({
      where: branchId ? { ProductBooking: { branchId } } : {},
    });

    let totalBookingAdvances = 0;
    for (const ba of bookingAdvances) {
      const advAmount = ba.cashAmount || 0;
      totalBookingAdvances += advAmount;
      const isToday = new Date(ba.createdAt) >= today;
      const m = ba.advanceType === "CASH" ? "CASH" : ba.advanceType === "UPI" ? "UPI" : "BANK_TRANSFER";
      if (!methodInflows[m]) methodInflows[m] = { total: 0, today: 0, count: 0 };
      methodInflows[m].total += advAmount;
      if (isToday) methodInflows[m].today += advAmount;
      methodInflows[m].count++;
    }

    // 3. Purchase Payments Outflows
    const purchasePayments = await prisma.purchasePayment.findMany({
      where: {
        ...whereBranch,
        status: { in: ["COMPLETED", "VERIFIED"] },
      },
    });

    let totalPurchasePayments = 0;
    let todayPurchasePayments = 0;
    const methodOutflows: Record<string, { total: number; today: number; count: number }> = {};

    for (const pp of purchasePayments) {
      totalPurchasePayments += pp.amount;
      const isToday = new Date(pp.paymentDate) >= today;
      if (isToday) todayPurchasePayments += pp.amount;

      const m = pp.paymentMethod || "BANK_TRANSFER";
      if (!methodOutflows[m]) methodOutflows[m] = { total: 0, today: 0, count: 0 };
      methodOutflows[m].total += pp.amount;
      if (isToday) methodOutflows[m].today += pp.amount;
      methodOutflows[m].count++;
    }

    // 4. Outstanding Purchase Commitments (Bookings booked but unpaid + Unpaid Invoices)
    const activeBookings = await prisma.purchaseBooking.findMany({
      where: {
        ...whereBranch,
        status: { in: ["BOOKED", "PARTIALLY_RECEIVED", "PENDING_VERIFICATION"] },
      },
      select: { balancePayment: true },
    });

    const outstandingBookings = activeBookings.reduce((sum, b) => sum + (b.balancePayment || 0), 0);

    const unpaidInvoices = await prisma.purchaseInvoice.findMany({
      where: {
        ...whereBranch,
        status: "POSTED",
        paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      select: { balanceAmount: true },
    });

    const outstandingInvoices = unpaidInvoices.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);
    const outstandingPurchaseCommitments = Number((outstandingBookings + outstandingInvoices).toFixed(2));

    // 5. Dynamic Calculations from Database Records
    const [
      branchTxns,
      unappliedAdvances,
      walletBalances,
      karigarCashDisbursements,
      pendingChequePayments,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: whereBranch,
        _sum: { amount: true },
      }),
      prisma.advance.aggregate({
        where: { isApplied: false, ...(branchId ? { customer: { invoices: { some: { branchId } } } } : {}) },
        _sum: { moneyAmount: true },
      }),
      prisma.customerWallet.aggregate({
        _sum: { cashBalance: true },
      }),
      prisma.karigarJob.aggregate({
        _sum: { cashIssued: true },
      }),
      prisma.invoicePayment.aggregate({
        where: {
          method: "CHEQUE",
          ...(branchId ? { invoice: { branchId } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const openingCash = Number((branchTxns._sum.amount || 0).toFixed(2));
    const confirmedSalesCollections = Number(totalSalesCollections.toFixed(2));
    const confirmedOtherReceipts = Number(totalBookingAdvances.toFixed(2));
    const approvedCashOutflows = Number((karigarCashDisbursements._sum.cashIssued || 0).toFixed(2));
    const otherCommittedObligations = Number(
      ((unappliedAdvances._sum.moneyAmount || 0) + (walletBalances._sum.cashBalance || 0)).toFixed(2)
    );

    const availableCash = Number(
      (
        openingCash +
        confirmedSalesCollections +
        confirmedOtherReceipts -
        totalPurchasePayments -
        approvedCashOutflows -
        otherCommittedObligations
      ).toFixed(2)
    );

    const netCashLeftToBook = Number((availableCash - outstandingPurchaseCommitments).toFixed(2));

    // Construct structured category breakdown
    const breakdown = [
      {
        category: "Base Reserve",
        description: "Branch Opening Cash Reserves & Capital Transactions",
        inflow: openingCash,
        outflow: 0,
        net: openingCash,
      },
      {
        category: "Sales Collections",
        description: "Customer Invoice Payments Received",
        inflow: confirmedSalesCollections,
        outflow: 0,
        net: confirmedSalesCollections,
      },
      {
        category: "Booking Advances",
        description: "Customer Product & Scheme Advances",
        inflow: confirmedOtherReceipts,
        outflow: 0,
        net: confirmedOtherReceipts,
      },
      {
        category: "Purchase Payments",
        description: "Disbursements Made to Bullion Suppliers",
        inflow: 0,
        outflow: Number(totalPurchasePayments.toFixed(2)),
        net: -Number(totalPurchasePayments.toFixed(2)),
      },
      {
        category: "Operating Outflows",
        description: "Workshop & Karigar Cash Advances",
        inflow: 0,
        outflow: approvedCashOutflows,
        net: -approvedCashOutflows,
      },
      {
        category: "Committed Obligations",
        description: "Customer Advance Liabilities & Wallet Balances",
        inflow: 0,
        outflow: otherCommittedObligations,
        net: -otherCommittedObligations,
      },
    ];

    // Standard Payment Methods matrix
    const methodsList = [
      { method: "CASH", label: "Cash on Hand" },
      { method: "UPI", label: "UPI & QR Payments" },
      { method: "BANK_TRANSFER", label: "NEFT / RTGS / Bank" },
      { method: "CARD", label: "Debit / Credit Cards" },
      { method: "CHEQUE", label: "Cheques & Drafts" },
    ];

    const chequePendingAmount = Number((pendingChequePayments._sum.amount || 0).toFixed(2));

    const paymentMethods = methodsList.map((m) => {
      const inData = methodInflows[m.method] || { total: 0, today: 0, count: 0 };
      const outData = methodOutflows[m.method] || { total: 0, today: 0, count: 0 };

      return {
        method: m.method,
        label: m.label,
        todayInflow: Number(inData.today.toFixed(2)),
        todayOutflow: Number(outData.today.toFixed(2)),
        periodInflow: Number(inData.total.toFixed(2)),
        periodOutflow: Number(outData.total.toFixed(2)),
        txnCount: inData.count + outData.count,
        pendingSettlement: m.method === "CHEQUE" ? chequePendingAmount : 0,
        reconciledAmount: Number(Math.max(0, inData.total - outData.total).toFixed(2)),
      };
    });

    return {
      openingCash,
      confirmedSalesCollections,
      confirmedOtherReceipts,
      purchasePayments: Number(totalPurchasePayments.toFixed(2)),
      approvedCashOutflows,
      otherCommittedObligations,
      availableCash,
      outstandingPurchaseCommitments,
      netCashLeftToBook,
      breakdown,
      paymentMethods,
    };
  }
}
