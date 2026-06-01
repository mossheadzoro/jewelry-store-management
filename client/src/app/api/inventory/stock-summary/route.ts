/**
 * GET /api/inventory/stock-summary
 *
 * Returns current live stock per product per branch with valuation data.
 * This is the primary report endpoint for jewelry inventory management.
 *
 * Filters: branchId, category, karatage, slowMovingThresholdDays
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const karatage = searchParams.get("karatage");
    const slowMovingThresholdDays = parseInt(
      searchParams.get("slowMovingThresholdDays") || "90"
    );
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build product filter
    const productWhere: any = {};
    if (branchId) productWhere.branchId = parseInt(branchId);
    if (category) {
      productWhere.subCategory = {
        category: { name: { equals: category, mode: "insensitive" } },
      };
    }

    // Fetch products with their latest ledger entry and cost data
    const products = await prisma.productItem.findMany({
      where: {
        ...productWhere,
        quantity: { gt: 0 }, // Only items currently in stock
      },
      include: {
        subCategory: {
          include: {
            category: { select: { name: true } },
          },
        },
        branch: { select: { id: true, name: true } },
        branchCosts: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    });

    // Fetch the latest metal rate for valuation
    const latestGoldRate = await prisma.metalRateHistory.findFirst({
      where: { metalType: "GOLD" },
      orderBy: { date: "desc" },
    });

    const currentMetalRate = latestGoldRate?.rate ?? 0;
    const now = new Date();

    // Build summary for each product
    const stockSummary = await Promise.all(
      products.map(async (product) => {
        // Get the latest ledger entry for balance data
        const latestLedger = await prisma.inventoryLedger.findFirst({
          where: {
            productId: product.id,
            branchId: product.branchId,
          },
          orderBy: [{ createdAt: "desc" }, { sequenceNo: "desc" }],
          select: {
            balanceQty: true,
            balanceNetWt: true,
            balanceFineWt: true,
            balanceGrossWt: true,
            karatage: true,
            createdAt: true,
          },
        });

        // Filter by karatage if specified
        if (karatage && latestLedger?.karatage !== parseFloat(karatage)) {
          return null;
        }

        // Find the last SALE_OUT to determine slow-moving status
        const lastSale = await prisma.inventoryLedger.findFirst({
          where: {
            productId: product.id,
            branchId: product.branchId,
            txnType: "SALE_OUT",
          },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        const slowMovingDays = lastSale
          ? Math.floor(
              (now.getTime() - lastSale.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : Math.floor(
              (now.getTime() - product.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );

        // Check for unhallmarked stock
        const hasUnhallmarkedStock = !product.huidNumber;

        // Get cost data
        const costRecord = product.branchCosts.find(
          (c) => c.branchId === product.branchId
        );
        const avgCostPrice = costRecord?.avgCostPrice ?? 0;

        // Valuation
        const balanceNetWt = latestLedger?.balanceNetWt ?? 0;
        const balanceFineWt = latestLedger?.balanceFineWt ?? 0;
        const costValue = parseFloat((balanceNetWt * avgCostPrice).toFixed(2));
        const marketValue = parseFloat(
          (balanceFineWt * currentMetalRate).toFixed(2)
        );
        const gainLoss = parseFloat((marketValue - costValue).toFixed(2));

        return {
          productId: product.id,
          branchId: product.branchId,
          branchName: product.branch.name,
          productName: product.name,
          productCode: product.productCode,
          category: product.subCategory.category.name,
          subCategory: product.subCategory.name,
          karatage: latestLedger?.karatage ?? null,
          balanceQty: latestLedger?.balanceQty ?? product.quantity,
          balanceNetWt: latestLedger?.balanceNetWt ?? product.ntWeight,
          balanceFineWt: latestLedger?.balanceFineWt ?? 0,
          balanceGrossWt: latestLedger?.balanceGrossWt ?? product.gsWeight,
          avgCostPrice,
          currentMetalRate,
          costValue,
          marketValue,
          gainLoss,
          lastMovementAt: latestLedger?.createdAt ?? product.createdAt,
          hasUnhallmarkedStock,
          slowMovingDays,
          isSlowMoving: slowMovingDays >= slowMovingThresholdDays,
        };
      })
    );

    // Filter out nulls (karatage filter)
    const filteredSummary = stockSummary.filter((item) => item !== null);

    // Calculate aggregated totals
    const totals = filteredSummary.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + 1,
        totalQty: acc.totalQty + (item?.balanceQty ?? 0),
        totalNetWt: parseFloat(
          (acc.totalNetWt + (item?.balanceNetWt ?? 0)).toFixed(3)
        ),
        totalFineWt: parseFloat(
          (acc.totalFineWt + (item?.balanceFineWt ?? 0)).toFixed(3)
        ),
        totalCostValue: parseFloat(
          (acc.totalCostValue + (item?.costValue ?? 0)).toFixed(2)
        ),
        totalMarketValue: parseFloat(
          (acc.totalMarketValue + (item?.marketValue ?? 0)).toFixed(2)
        ),
        totalGainLoss: parseFloat(
          (acc.totalGainLoss + (item?.gainLoss ?? 0)).toFixed(2)
        ),
        unhallmarkedCount:
          acc.unhallmarkedCount + (item?.hasUnhallmarkedStock ? 1 : 0),
        slowMovingCount:
          acc.slowMovingCount + (item?.isSlowMoving ? 1 : 0),
      }),
      {
        totalItems: 0,
        totalQty: 0,
        totalNetWt: 0,
        totalFineWt: 0,
        totalCostValue: 0,
        totalMarketValue: 0,
        totalGainLoss: 0,
        unhallmarkedCount: 0,
        slowMovingCount: 0,
      }
    );

    return NextResponse.json({
      items: filteredSummary,
      totals,
      pagination: {
        page,
        limit,
        total: filteredSummary.length,
      },
      metadata: {
        currentMetalRate,
        metalRateDate: latestGoldRate?.date ?? null,
        slowMovingThresholdDays,
      },
    });
  } catch (error: any) {
    console.error("Stock summary error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stock summary" },
      { status: 500 }
    );
  }
}
