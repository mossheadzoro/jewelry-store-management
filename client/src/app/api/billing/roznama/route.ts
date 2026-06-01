import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "0");
    const dateStr = searchParams.get("date");

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch branch info
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });
    const branchName = branch?.name || "Main Atelier";

    // 1. Calculate stock value (WAC cost) from ProductBranchCost
    const branchCosts = await prisma.productBranchCost.findMany({
      where: { branchId }
    });
    const closingStockValue = branchCosts.reduce((s, c) => s + (c.avgCostPrice * c.totalQty), 0);

    // 2. Fetch invoices raised today
    const invoices = await prisma.invoice.findMany({
      where: {
        branchId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true
      }
    });

    const invoicesRaised = invoices.length;
    let itemsSold = 0;
    let totalWeightSold = 0;
    let fineWeightSold = 0;
    let cashCollected = 0;
    let upiCollected = 0;
    let cardCollected = 0;
    let creditCollected = 0; // Balance due from today's invoices
    let totalCollected = 0;

    const productSalesMap = new Map<string, { qty: number; revenue: number }>();

    for (const inv of invoices) {
      creditCollected += inv.balanceAmount;
      totalCollected += inv.paidAmount;

      for (const item of inv.items) {
        itemsSold += item.quantity;
        totalWeightSold += item.ntWeight;
        fineWeightSold += item.ntWeight * (item.product.purity || 1.0);

        const prodName = item.product.name;
        const existing = productSalesMap.get(prodName) || { qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.totalAfterTax;
        productSalesMap.set(prodName, existing);
      }

      // Sum payments by type
      for (const pay of inv.payments) {
        if (pay.method === "CASH") cashCollected += pay.amount;
        else if (pay.method === "UPI") upiCollected += pay.amount;
        else if (pay.method === "CARD") cardCollected += pay.amount;
      }
      
      // Fallback if payments is empty
      if (inv.payments.length === 0) {
        if (inv.paymentMethod === "CASH") cashCollected += inv.paidAmount;
        else if (inv.paymentMethod === "UPI") upiCollected += inv.paidAmount;
        else if (inv.paymentMethod === "CARD") cardCollected += inv.paidAmount;
      }
    }

    // 3. New customers created today
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // 4. Calculate top product
    let topProduct: { name: string; qty: number; revenue: number } | null = null;
    if (productSalesMap.size > 0) {
      const sortedProducts = Array.from(productSalesMap.entries())
        .map(([name, details]) => ({
          name,
          qty: details.qty,
          revenue: details.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue);
      topProduct = sortedProducts[0];
    }

    // 5. Back-calculate opening stock value
    // Opening = Closing + Cost of Items Sold Today - Cost of Purchases Today
    // (We will approximate cost of items sold today as 80% of today's taxable revenue if exact cost layers aren't fully resolved)
    const todaySalesRevenue = invoices.reduce((s, inv) => s + (inv.totalMetalAmount + inv.totalMakingAmount + inv.totalStoneAmount), 0);
    const estimatedCostOfSales = todaySalesRevenue * 0.85; 
    const openingStockValue = Math.max(0, closingStockValue + estimatedCostOfSales);

    return NextResponse.json({
      date: startOfDay.toISOString(),
      branch: branchName,
      openingStockValue: parseFloat(openingStockValue.toFixed(2)),
      closingStockValue: parseFloat(closingStockValue.toFixed(2)),
      invoicesRaised,
      itemsSold,
      totalWeightSold: parseFloat(totalWeightSold.toFixed(3)),
      fineWeightSold: parseFloat(fineWeightSold.toFixed(3)),
      cashCollected: parseFloat(cashCollected.toFixed(2)),
      upiCollected: parseFloat(upiCollected.toFixed(2)),
      cardCollected: parseFloat(cardCollected.toFixed(2)),
      creditCollected: parseFloat(creditCollected.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      newCustomers,
      topProduct
    });

  } catch (error: any) {
    console.error("Failed to generate roznama:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate daily closing report" },
      { status: 500 }
    );
  }
}
