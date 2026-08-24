// /app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { Console } from "console";

import { prisma } from "@/lib/prisma";

// GET /api/products/search?q=ring&branchId=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("search")?.trim();
  const branchIdParam = searchParams.get("branchId");
  if (!q) {
    return NextResponse.json({ products: [] });
  }

  let branchId: number | undefined = undefined;
  if (branchIdParam && branchIdParam !== "undefined" && branchIdParam !== "null") {
    const parsed = Number(branchIdParam);
    if (!isNaN(parsed)) {
      branchId = parsed;
    }
  }

  const isNumeric = /^\d+$/.test(q); // ✅ check if query is only digits
  try {
    const products = await prisma.productItem.findMany({
      where: {
        branchId: branchId,
        quantity: { gt: 0 }, // only show items that are in stock
        NOT: {
          subCategory: {
            category: {
              name: { equals: "STAMPING CENTER", mode: "insensitive" }
            }
          }
        },
        OR: isNumeric
          ? [
              { barcode: { equals: q } },
              { productCode: { equals: q } },
              { huidNumber: { equals: q } },
            ]
          : [
              { name: { contains: q, mode: "insensitive" } },
              { barcode: { contains: q, mode: "insensitive" } },
              { productCode: { contains: q, mode: "insensitive" } },
              { huidNumber: { contains: q, mode: "insensitive" } },
            ],
      },
      include: {
        subCategory: { include: { category: true } },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
