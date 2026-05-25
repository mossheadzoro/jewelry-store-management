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

    // ── Aggregate current period ──
    const [currentAgg, prevAgg, invoiceCount, prevInvoiceCount] = await Promise.all([
      prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          cgst: true,
          sgst: true,
          balanceAmount: true,
          paidAmount: true,
          totalMetalAmount: true,
          totalMakingAmount: true,
          totalStoneAmount: true,
        },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: prevWhere,
        _sum: {
          totalAmount: true,
          cgst: true,
          sgst: true,
          balanceAmount: true,
          paidAmount: true,
        },
        _count: true,
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: prevWhere }),
    ]);

    const totalSales = currentAgg._sum.totalAmount || 0;
    const gstCollected = (currentAgg._sum.cgst || 0) + (currentAgg._sum.sgst || 0);
    const netRevenue = totalSales - gstCollected;
    const pendingDues = currentAgg._sum.balanceAmount || 0;

    const prevTotalSales = prevAgg._sum.totalAmount || 0;
    const prevGst = (prevAgg._sum.cgst || 0) + (prevAgg._sum.sgst || 0);
    const prevNetRevenue = prevTotalSales - prevGst;
    const prevPendingDues = prevAgg._sum.balanceAmount || 0;

    // ── Percentage change helper ──
    function pctChange(current: number, previous: number) {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    }

    // ── Sales by Category ──
    // Join through InvoiceItem → ProductItem → SubCategory → Category
    const categoryBreakdown = await prisma.invoiceItem.groupBy({
      by: ["productId"],
      where: {
        invoice: where,
      },
      _sum: {
        totalAfterTax: true,
      },
    });

    // Get product → category mapping for the products in the breakdown
    const productIds = categoryBreakdown.map((c) => c.productId);
    const products = await prisma.productItem.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        subCategory: {
          select: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const productCategoryMap = new Map<number, { id: number; name: string }>();
    for (const p of products) {
      productCategoryMap.set(p.id, p.subCategory.category);
    }

    // Aggregate by category
    const categoryTotals = new Map<number, { name: string; total: number }>();
    for (const item of categoryBreakdown) {
      const cat = productCategoryMap.get(item.productId);
      if (!cat) continue;
      const existing = categoryTotals.get(cat.id) || { name: cat.name, total: 0 };
      existing.total += item._sum.totalAfterTax || 0;
      categoryTotals.set(cat.id, existing);
    }

    const salesByCategory = Array.from(categoryTotals.entries())
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        totalAmount: parseFloat(data.total.toFixed(2)),
        percentage: totalSales > 0
          ? parseFloat(((data.total / totalSales) * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // ── Top selling products ──
    const topProducts = await prisma.invoiceItem.groupBy({
      by: ["productId"],
      where: {
        invoice: where,
      },
      _sum: {
        totalAfterTax: true,
        quantity: true,
      },
      orderBy: {
        _sum: { totalAfterTax: "desc" },
      },
      take: 5,
    });

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await prisma.productItem.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, productCode: true },
    });

    const productNameMap = new Map(topProductDetails.map((p) => [p.id, p]));

    const topSellingProducts = topProducts.map((p) => ({
      productId: p.productId,
      name: productNameMap.get(p.productId)?.name || "Unknown",
      productCode: productNameMap.get(p.productId)?.productCode || "",
      totalAmount: p._sum.totalAfterTax || 0,
      quantitySold: p._sum.quantity || 0,
    }));

    // ── Payment method breakdown ──
    const paymentMethods = await prisma.invoicePayment.groupBy({
      by: ["method"],
      where: {
        invoice: where,
      },
      _sum: { amount: true },
      _count: true,
    });

    const paymentBreakdown = paymentMethods.map((pm) => ({
      method: pm.method,
      totalAmount: pm._sum.amount || 0,
      count: pm._count,
    }));

    return NextResponse.json({
      summary: {
        totalSales,
        gstCollected,
        netRevenue,
        pendingDues,
        invoiceCount,
        changes: {
          totalSales: pctChange(totalSales, prevTotalSales),
          gstCollected: pctChange(gstCollected, prevGst),
          netRevenue: pctChange(netRevenue, prevNetRevenue),
          pendingDues: pctChange(pendingDues, prevPendingDues),
        },
      },
      salesByCategory,
      topSellingProducts,
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
