import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;

    const freeFineAgg = await prisma.inventoryLedger.aggregate({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        OR: [
          { refType: "METAL_EXCHANGE" },
          { txnType: "OLD_GOLD_IN" },
          { txnType: "KARIGAR_ISSUE_OUT" },
          { txnType: "TRANSFER_OUT" },
          { txnType: "OPENING" }
        ]
      },
      _sum: {
        fineWeightIn: true,
        fineWeightOut: true,
      }
    });

    const freeFineWeight = Math.max(0, (freeFineAgg._sum.fineWeightIn || 0) - (freeFineAgg._sum.fineWeightOut || 0));

    return NextResponse.json({
      branchId: branchIdNum || null,
      freeFineWeight: Number(freeFineWeight.toFixed(3)),
    });
  } catch (error: any) {
    console.error("Free fine metal query error:", error);
    return NextResponse.json({ freeFineWeight: 0 }, { status: 500 });
  }
}
