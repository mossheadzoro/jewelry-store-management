import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
              select: {
                weight: true,
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
        totalWeight: sub.products.reduce((acc, p) => acc + p.weight, 0),
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
  } finally {
    await prisma.$disconnect();
  }
}

