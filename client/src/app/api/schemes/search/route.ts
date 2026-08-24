import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/schemes/search?q=SCH-001234&branchId=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const branchId = Number(searchParams.get("branchId"));

    if (!q.trim()) {
      return NextResponse.json({ schemes: [] });
    }

    const schemes = await prisma.savingScheme.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        status: { in: ["ACTIVE", "MATURED", "PARTIALLY_REDEEMED"] },
        OR: [
          { schemeNumber: { contains: q.trim(), mode: "insensitive" } },
          { physicalCardNumber: { contains: q.trim(), mode: "insensitive" } },
          { customer: { name: { contains: q.trim(), mode: "insensitive" } } },
          { customer: { mobile: { contains: q.trim() } } },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        redemptions: { select: { amountUsed: true } },
      },
      take: 10,
    });

    // Compute available balance for each
    const results = schemes.map((s) => {
      const totalRedeemed = s.redemptions.reduce((sum, r) => sum + r.amountUsed, 0);
      const availableBalance = s.totalCashDeposited + s.totalBonusAmount - totalRedeemed;
      return {
        id: s.id,
        schemeNumber: s.schemeNumber,
        type: s.type,
        status: s.status,
        customer: s.customer,
        totalDeposited: s.totalCashDeposited,
        totalBonus: s.totalBonusAmount,
        totalGoldGm: s.totalGoldDepositedGm,
        availableBalance,
        physicalCardNumber: s.physicalCardNumber,
      };
    });

    return NextResponse.json({ schemes: results });
  } catch (error: any) {
    console.error("Error searching schemes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
