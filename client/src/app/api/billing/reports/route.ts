import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "0");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where: any = {
      branchId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    };

    // ── Previous period range (for comparison) ──
    let prevWhere: any = { branchId };
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const duration = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - duration);
      const prevTo = new Date(from.getTime() - 1);
      prevWhere.createdAt = { gte: prevFrom, lte: prevTo };
    }

    // ── Aggregate current & previous periods & fetch items/payments concurrently ──
    const [
      currentAgg,
      prevAgg,
      pendingInvoiceCount,
      invoiceItems,
      invoicePayments,
      invoicesForPayments
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          cgst: true,
          sgst: true,
          balanceAmount: true,
          paidAmount: true,
        },
      }),
      prisma.invoice.aggregate({
        where: prevWhere,
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.invoice.count({
        where: {
          ...where,
          isFullyPaid: false,
        },
      }),
      prisma.invoiceItem.findMany({
        where: {
          invoice: where,
        },
        include: {
          product: {
            include: {
              subCategory: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.invoicePayment.findMany({
        where: {
          invoice: where,
        },
      }),
      prisma.invoice.findMany({
        where,
        select: { paymentMethod: true, totalAmount: true },
      })
    ]);

    const totalSales = currentAgg._sum.totalAmount || 0;
    const cgstCollected = currentAgg._sum.cgst || 0;
    const sgstCollected = currentAgg._sum.sgst || 0;
    const gstCollected = cgstCollected + sgstCollected;
    const netRevenue = totalSales - gstCollected;
    const pendingDues = currentAgg._sum.balanceAmount || 0;
    const totalSalesPrevPeriod = prevAgg._sum.totalAmount || 0;

    // ── Category Sales breakdown ──
    const categorySummaryMap = new Map<string, { itemsSold: number; netWt: number; revenue: number }>();
    for (const item of invoiceItems) {
      const catName = item.product.subCategory.category.name || "General";
      const existing = categorySummaryMap.get(catName) || { itemsSold: 0, netWt: 0, revenue: 0 };
      existing.itemsSold += item.quantity;
      existing.netWt += item.ntWeight || 0;
      existing.revenue += item.totalAfterTax || 0;
      categorySummaryMap.set(catName, existing);
    }

    const salesByCategory = Array.from(categorySummaryMap.entries()).map(([category, details]) => ({
      category,
      itemsSold: details.itemsSold,
      netWt: parseFloat(details.netWt.toFixed(3)),
      revenue: parseFloat(details.revenue.toFixed(2)),
      percentage: totalSales > 0 ? parseFloat(((details.revenue / totalSales) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // ── Top selling products ──
    const productSummaryMap = new Map<number, { name: string; sku: string; qtySold: number; revenue: number }>();
    for (const item of invoiceItems) {
      const existing = productSummaryMap.get(item.productId) || {
        name: item.product.name,
        sku: item.product.productCode,
        qtySold: 0,
        revenue: 0,
      };
      existing.qtySold += item.quantity;
      existing.revenue += item.totalAfterTax || 0;
      productSummaryMap.set(item.productId, existing);
    }

    const topProducts = Array.from(productSummaryMap.entries())
      .map(([_, details]) => ({
        productName: details.name,
        sku: details.sku,
        qtySold: details.qtySold,
        revenue: parseFloat(details.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    // ── Payment method breakdown ──
    const paymentSummaryMap = new Map<string, { count: number; amount: number }>();
    let totalPaymentAmount = 0;
    
    for (const pay of invoicePayments) {
      const existing = paymentSummaryMap.get(pay.method) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += pay.amount;
      totalPaymentAmount += pay.amount;
      paymentSummaryMap.set(pay.method, existing);
    }

    // Include invoice paymentMethod from invoice itself if payments are empty
    if (invoicePayments.length === 0) {
      for (const inv of invoicesForPayments) {
        const existing = paymentSummaryMap.get(inv.paymentMethod) || { count: 0, amount: 0 };
        existing.count += 1;
        existing.amount += inv.totalAmount;
        totalPaymentAmount += inv.totalAmount;
        paymentSummaryMap.set(inv.paymentMethod, existing);
      }
    }

    const paymentBreakdown = Array.from(paymentSummaryMap.entries()).map(([method, details]) => ({
      method,
      count: details.count,
      amount: parseFloat(details.amount.toFixed(2)),
      percentage: totalPaymentAmount > 0 ? parseFloat(((details.amount / totalPaymentAmount) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      summary: {
        totalSales,
        totalSalesPrevPeriod,
        gstCollected,
        cgstCollected,
        sgstCollected,
        netRevenue,
        pendingDues,
        pendingInvoiceCount,
      },
      salesByCategory,
      topProducts,
      paymentBreakdown,
    });
  } catch (error: any) {
    console.error("Failed to generate reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate reports" },
      { status: 500 }
    );
  }
}
