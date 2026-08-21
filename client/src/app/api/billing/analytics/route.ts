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

    // Fetch invoices and customer stats concurrently
    const [invoices, customerAgg] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          createdBy: true,
          items: {
            include: {
              product: {
                include: {
                  subCategory: {
                    include: {
                      category: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "asc" }
      }),
      prisma.invoice.groupBy({
        by: ["customerId"],
        where: { branchId },
        _sum: { totalAmount: true },
        _count: { id: true }
      })
    ]);

    // ── 1. Revenue Trend (Group by YYYY-MM-DD or Month if range is long) ──
    const trendMap = new Map<string, { revenue: number; count: number }>();
    for (const inv of invoices) {
      const dateKey = new Date(inv.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
      });
      const existing = trendMap.get(dateKey) || { revenue: 0, count: 0 };
      existing.revenue += inv.totalAmount;
      existing.count += 1;
      trendMap.set(dateKey, existing);
    }

    const revenueTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      revenue: parseFloat(data.revenue.toFixed(2)),
      avgInvoiceValue: parseFloat((data.revenue / data.count).toFixed(2))
    }));

    // ── 2. Sales by Metal Type (based on purity & category names) ──
    let totalMetalRevenue = 0;
    const metalMap = new Map<string, number>();
    
    // Default categories if nothing exists
    metalMap.set("Gold", 0);
    metalMap.set("Diamond", 0);
    metalMap.set("Platinum", 0);
    metalMap.set("Silver", 0);

    for (const inv of invoices) {
      for (const item of inv.items) {
        const cat = item.product.subCategory.category.name.toLowerCase();
        let metalKey = "Gold";
        if (cat.includes("diamond")) metalKey = "Diamond";
        else if (cat.includes("platinum")) metalKey = "Platinum";
        else if (cat.includes("silver")) metalKey = "Silver";
        else if (item.product.purity === 0.916) metalKey = "Gold (22K)";
        else if (item.product.purity === 0.75) metalKey = "Gold (18K)";

        const rev = item.totalAfterTax;
        totalMetalRevenue += rev;
        metalMap.set(metalKey, (metalMap.get(metalKey) || 0) + rev);
      }
    }

    const salesByMetal = Array.from(metalMap.entries())
      .map(([metalType, revenue]) => ({
        metalType,
        revenue: parseFloat(revenue.toFixed(2)),
        percentage: totalMetalRevenue > 0 ? parseFloat(((revenue / totalMetalRevenue) * 100).toFixed(1)) : 0
      }))
      .filter(item => item.revenue > 0 || ["Gold", "Diamond"].includes(item.metalType));

    // ── 3. Sales by Category ──
    const catMap = new Map<string, { revenue: number; netWt: number }>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const catName = item.product.subCategory.category.name;
        const existing = catMap.get(catName) || { revenue: 0, netWt: 0 };
        existing.revenue += item.totalAfterTax;
        existing.netWt += item.ntWeight;
        catMap.set(catName, existing);
      }
    }

    const salesByCategory = Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      revenue: parseFloat(data.revenue.toFixed(2)),
      netWt: parseFloat(data.netWt.toFixed(3))
    })).sort((a, b) => b.revenue - a.revenue);

    // ── 4. Peak Showroom Hours Heatmap (Mon-Sun × 9am-8pm) ──
    // Group invoices by day of week (0 = Sunday, 1 = Monday) and hour
    const peakMap = new Map<string, number>();
    for (const inv of invoices) {
      const d = new Date(inv.createdAt);
      const day = d.getDay();
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      peakMap.set(key, (peakMap.get(key) || 0) + 1);
    }

    const peakHours: { dayOfWeek: number; hour: number; txnCount: number }[] = [];
    // Day of week: 1 = Monday, 5 = Friday, 0 = Sunday (matching screens Mon, Fri, Sun labels)
    for (let d = 0; d < 7; d++) {
      for (let h = 9; h <= 20; h++) {
        const key = `${d}-${h}`;
        peakHours.push({
          dayOfWeek: d,
          hour: h,
          txnCount: peakMap.get(key) || 0
        });
      }
    }

    // ── 5. Salesperson Leaderboard ──
    const staffMap = new Map<string, { count: number; revenue: number }>();
    for (const inv of invoices) {
      const name = inv.createdBy?.name || "System";
      const existing = staffMap.get(name) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += inv.totalAmount;
      staffMap.set(name, existing);
    }

    const salespersonPerformance = Array.from(staffMap.entries()).map(([name, data]) => ({
      name,
      invoiceCount: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      avgTicket: parseFloat((data.revenue / data.count).toFixed(2))
    })).sort((a, b) => b.revenue - a.revenue);

    // ── 6. Customer Insights ──
    // Get unique customer ids from current period invoices
    const currentCustomerIds = Array.from(new Set(invoices.map(inv => inv.customerId)));
    
    // Check which customers have invoices prior to the current period to find returning clients
    const minCurrentDate = invoices.length > 0 ? invoices[0].createdAt : new Date();
    const priorInvoicesCount = await prisma.invoice.groupBy({
      by: ["customerId"],
      where: {
        customerId: { in: currentCustomerIds },
        createdAt: { lt: minCurrentDate }
      },
      _count: { id: true }
    });

    const priorCustomersSet = new Set(priorInvoicesCount.map(p => p.customerId));
    const returningCustomers = currentCustomerIds.filter(id => priorCustomersSet.has(id)).length;
    const newCustomers = currentCustomerIds.length - returningCustomers;

    // Average lifetime value (customerAgg fetched concurrently above)

    const totalCustomersCount = customerAgg.length;
    const avgLifetimeValue = totalCustomersCount > 0 
      ? parseFloat((customerAgg.reduce((s, c) => s + (c._sum.totalAmount || 0), 0) / totalCustomersCount).toFixed(2))
      : 0;

    const repeatCustomersCount = customerAgg.filter(c => c._count.id > 1).length;
    const repeatRate = totalCustomersCount > 0 
      ? parseFloat(((repeatCustomersCount / totalCustomersCount) * 100).toFixed(1))
      : 0;

    // ── 7. HUID Compliance Summary ──
    let totalItemsSold = 0;
    let withHuid = 0;

    for (const inv of invoices) {
      for (const item of inv.items) {
        totalItemsSold += item.quantity;
        if (item.product.huidNumber && item.product.huidNumber.trim().length > 0) {
          withHuid += item.quantity;
        }
      }
    }

    const withoutHuid = totalItemsSold - withHuid;
    const compliancePercent = totalItemsSold > 0 
      ? parseFloat(((withHuid / totalItemsSold) * 100).toFixed(1))
      : 100.0;

    return NextResponse.json({
      revenueTrend,
      salesByMetal,
      salesByCategory,
      peakHours,
      salespersonPerformance,
      customerInsights: {
        newCustomers,
        returningCustomers,
        avgLifetimeValue,
        repeatRate
      },
      huidCompliance: {
        totalItemsSold,
        withHuid,
        withoutHuid,
        compliancePercent
      }
    });

  } catch (error: any) {
    console.error("Failed to generate analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate analytics dashboard data" },
      { status: 500 }
    );
  }
}
