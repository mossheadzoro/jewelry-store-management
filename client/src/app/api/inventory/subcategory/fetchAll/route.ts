import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const branchId = parseInt(searchParams.get("branchId") || "");

  try {
    const categories = await prisma.category.findMany({
      where: { branchId },
      include: {
        subCategories: {
          include: {
            products: {
              where: { quantity: { gt: 0 } },
              select: {
                ntWeight: true,
              },
            },
          },
        },
      },
    });
    
    // Flatten subcategories
    const subcategories = categories.flatMap((cat) =>
      cat.subCategories.map((sub) => ({
        
        id: sub.id,
        name: sub.name,
        totalWeight: sub.products.reduce((acc, p) => acc + p.ntWeight, 0),
        category: {
          id: cat.id,
          name: cat.name,
          
        },
        branchId,
      }))
    );

    return NextResponse.json(subcategories);
  } catch (error: any) {
    console.error("Fetch error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  } 
}

