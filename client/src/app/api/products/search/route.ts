// /app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Console } from "console";

const prisma = new PrismaClient();

// GET /api/products/search?q=ring&branchId=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("search")?.trim();
  const branchId = searchParams.get("branchId");
  if (!q) {
    return NextResponse.json({ products: [] });
  }

  const isNumeric = /^\d+$/.test(q); // ✅ check if query is only digits
  try {
    const products = await prisma.productItem.findMany({
      where: {
        branchId: branchId ? Number(branchId) : undefined,
        reservedQty: 0,
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
