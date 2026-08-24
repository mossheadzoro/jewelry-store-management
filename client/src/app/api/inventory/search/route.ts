import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const branchId = parseInt(req.nextUrl.searchParams.get("branchId") || "1");

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const products = await prisma.productItem.findMany({
      where: {
        branchId,
        OR: [
          { productCode: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          { huidNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        subCategory: {
          include: { category: true },
        },
        inventoryLedger: {
          where: { txnType: 'RESERVE_OUT' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
