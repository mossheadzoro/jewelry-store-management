import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const productId = searchParams.get("productId");
    const txnType = searchParams.get("txnType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (branchId) where.branchId = parseInt(branchId);
    if (productId) where.productId = parseInt(productId);
    if (txnType) where.txnType = txnType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    }

    const [entries, total] = await Promise.all([
      prisma.inventoryLedger.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              productCode: true,
              image: true,
              subCategory: { select: { name: true, category: { select: { name: true } } } },
            },
          },
          branch: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryLedger.count({ where }),
    ]);

    // Summary aggregation
    const summary = await prisma.inventoryLedger.aggregate({
      where,
      _sum: {
        qtyIn: true,
        qtyOut: true,
        grossWeightIn: true,
        grossWeightOut: true,
        netWeightIn: true,
        netWeightOut: true,
        fineWeightIn: true,
        fineWeightOut: true,
        totalValue: true,
      },
    });

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalQtyIn: summary._sum.qtyIn || 0,
        totalQtyOut: summary._sum.qtyOut || 0,
        totalGrossWtIn: summary._sum.grossWeightIn || 0,
        totalGrossWtOut: summary._sum.grossWeightOut || 0,
        totalNetWtIn: summary._sum.netWeightIn || 0,
        totalNetWtOut: summary._sum.netWeightOut || 0,
        totalFineWtIn: summary._sum.fineWeightIn || 0,
        totalFineWtOut: summary._sum.fineWeightOut || 0,
        totalValue: summary._sum.totalValue || 0,
      },
    });
  } catch (error: any) {
    console.error("Ledger fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch ledger" }, { status: 500 });
  }
}
