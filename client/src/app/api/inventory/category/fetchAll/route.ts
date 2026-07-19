import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@libs/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const branchIdParam = searchParams.get("branchId");

  if (!branchIdParam) {
    return NextResponse.json({ error: "Missing branchId" }, { status: 400 });
  }

  const branchId = parseInt(branchIdParam);

  try {
   const categories = await prisma.category.findMany({
  where: { branchId },
  include: {
    subCategories: {
      include: {
        products: {
          select: { ntWeight: true },
        },
      },
    },
  },
});

const categoryTotals = categories.map((category) => {
  const totalWeight = category.subCategories.reduce((sum, sub) => {
    return (
      sum +
      sub.products.reduce((subSum, product) => subSum + (product.ntWeight ?? 0), 0)
    );
  }, 0);

  return {
    id: category.id,
    name: category.name,
    totalWeight,
    branchId,
  };
});

return NextResponse.json(categoryTotals);
}

 catch (error: any) {
    console.error("Fetch error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  } 
}
