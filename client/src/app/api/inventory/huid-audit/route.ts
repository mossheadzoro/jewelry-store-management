/**
 * GET /api/inventory/huid-audit
 *
 * Lists all stock items (products with quantity > 0) that do NOT have a
 * HUID (Hallmark Unique ID) number recorded, grouped by branch and category.
 *
 * As per BIS regulations (2023+), all gold jewelry sold in India must carry
 * a HUID number. This endpoint supports compliance review by identifying
 * unhallmarked inventory that needs attention before sale.
 *
 * Filters: branchId
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    // Find all products without HUID that still have stock
    const where: any = {
      huidNumber: null,
      quantity: { gt: 0 },
    };
    if (branchId) where.branchId = parseInt(branchId);

    const unhallmarkedProducts = await prisma.productItem.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        subCategory: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [
        { branchId: "asc" },
        { subCategoryId: "asc" },
        { name: "asc" },
      ],
    });

    // Group by branch → category
    const grouped: Record<
      string,
      {
        branchId: number;
        branchName: string;
        categories: Record<
          string,
          {
            categoryId: number;
            categoryName: string;
            items: Array<{
              productId: number;
              name: string;
              productCode: string;
              barcode: string;
              quantity: number;
              gsWeight: number;
              ntWeight: number;
              purity: number;
              createdAt: Date;
            }>;
            totalQty: number;
            totalNetWt: number;
          }
        >;
        totalItems: number;
        totalQty: number;
        totalNetWt: number;
      }
    > = {};

    for (const product of unhallmarkedProducts) {
      const branchKey = `branch-${product.branchId}`;
      const categoryName =
        product.subCategory?.category?.name ?? "Uncategorized";
      const categoryId = product.subCategory?.category?.id ?? 0;
      const categoryKey = `cat-${categoryId}`;

      if (!grouped[branchKey]) {
        grouped[branchKey] = {
          branchId: product.branchId,
          branchName: product.branch.name,
          categories: {},
          totalItems: 0,
          totalQty: 0,
          totalNetWt: 0,
        };
      }

      if (!grouped[branchKey].categories[categoryKey]) {
        grouped[branchKey].categories[categoryKey] = {
          categoryId,
          categoryName,
          items: [],
          totalQty: 0,
          totalNetWt: 0,
        };
      }

      const cat = grouped[branchKey].categories[categoryKey];
      cat.items.push({
        productId: product.id,
        name: product.name,
        productCode: product.productCode,
        barcode: product.barcode,
        quantity: product.quantity,
        gsWeight: product.gsWeight,
        ntWeight: product.ntWeight,
        purity: product.purity,
        createdAt: product.createdAt,
      });
      cat.totalQty += product.quantity;
      cat.totalNetWt = parseFloat(
        (cat.totalNetWt + product.ntWeight * product.quantity).toFixed(3)
      );

      grouped[branchKey].totalItems++;
      grouped[branchKey].totalQty += product.quantity;
      grouped[branchKey].totalNetWt = parseFloat(
        (
          grouped[branchKey].totalNetWt +
          product.ntWeight * product.quantity
        ).toFixed(3)
      );
    }

    // Convert to array format
    const branches = Object.values(grouped).map((branch) => ({
      ...branch,
      categories: Object.values(branch.categories),
    }));

    // Overall totals
    const overallTotals = {
      totalBranches: branches.length,
      totalItems: unhallmarkedProducts.length,
      totalQty: unhallmarkedProducts.reduce((s, p) => s + p.quantity, 0),
      totalNetWt: parseFloat(
        unhallmarkedProducts
          .reduce((s, p) => s + p.ntWeight * p.quantity, 0)
          .toFixed(3)
      ),
    };

    // Check if HUID compliance is enabled
    const settings = await prisma.companySettings.findFirst({
      select: { requireHuidForSales: true },
    });

    return NextResponse.json({
      branches,
      totals: overallTotals,
      complianceEnabled: settings?.requireHuidForSales ?? false,
      message:
        overallTotals.totalItems > 0
          ? `${overallTotals.totalItems} items found without HUID numbers. ` +
            `These items cannot be sold if HUID compliance is enabled.`
          : "All stock items have HUID numbers recorded. ✅",
    });
  } catch (error: any) {
    console.error("HUID audit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch HUID audit report" },
      { status: 500 }
    );
  }
}
