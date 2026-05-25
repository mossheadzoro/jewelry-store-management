import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  const branchId = parseInt(req.nextUrl.searchParams.get("branchId") || "1");

  try {
    const categories = await prisma.category.findMany({
      where: { branchId },
      include: {
        subCategories: {
          include: {
            products: {
              select: { ntWeight: true, gsWeight: true, quantity: true, reservedQty: true },
            },
          },
        },
      },
    });

    const result = categories.map((cat) => {
      let totalWeight = 0;
      let itemCount = 0;

      cat.subCategories.forEach((sub) => {
        sub.products.forEach((p) => {
          totalWeight += p.ntWeight ?? 0;
          itemCount += p.quantity ?? 1;
        });
      });

      return {
        id: cat.id,
        name: cat.name,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        itemCount,
        subCategoryCount: cat.subCategories.length,
      };
    });

    const totalVaultWeight = result.reduce((s, c) => s + c.totalWeight, 0);
    const totalItems = result.reduce((s, c) => s + c.itemCount, 0);

    return NextResponse.json({ categories: result, totalVaultWeight, totalItems });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
