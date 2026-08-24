import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wholesalerId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Optional date filter (defaults to all time)
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const whereClause: any = {
      wholesalerId,
      type: "RECEIVE_JEWELLERY",
    };
    if (fromDate || toDate) {
      whereClause.createdAt = dateFilter;
    }

    // Fetch all RECEIVE_JEWELLERY transactions
    const transactions = await prisma.wholesalerTransaction.findMany({
      where: whereClause,
      include: { cashItems: true },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch ISSUE_METAL transactions for the same period
    const issueWhereClause: any = {
      wholesalerId,
      type: "ISSUE_METAL",
    };
    if (fromDate || toDate) {
      issueWhereClause.createdAt = dateFilter;
    }
    const issueTransactions = await prisma.wholesalerTransaction.findMany({
      where: issueWhereClause,
      orderBy: { createdAt: "desc" },
    });

    // ── Jewellery Produced by Purity (Gold) ────────────────────────────────
    const goldByPurity: Record<string, { count: number; totalWeight: number; totalFine: number }> = {};
    let totalGoldJewelleryWeight = 0;
    let totalGoldFine = 0;
    let totalGoldPieces = 0;

    // ── Silver Stats ───────────────────────────────────────────────────────
    let totalSilverJewelleryWeight = 0;
    let totalSilverFine = 0;
    let totalSilverPieces = 0;

    // ── Diamond Stats ──────────────────────────────────────────────────────
    let totalDiamondPieces = 0;
    let totalDiamondCashAmount = 0;

    // ── Cash totals ────────────────────────────────────────────────────────
    let totalCashAmount = 0;

    for (const tx of transactions) {
      if (tx.metalType === "GOLD") {
        totalGoldPieces++;
        totalGoldJewelleryWeight += tx.weight;
        totalGoldFine += tx.fineWeight;

        const label = tx.purityLabel || "Unknown";
        if (!goldByPurity[label]) {
          goldByPurity[label] = { count: 0, totalWeight: 0, totalFine: 0 };
        }
        goldByPurity[label].count++;
        goldByPurity[label].totalWeight += tx.weight;
        goldByPurity[label].totalFine += tx.fineWeight;
      } else if (tx.metalType === "SILVER") {
        totalSilverPieces++;
        totalSilverJewelleryWeight += tx.weight;
        totalSilverFine += tx.fineWeight;
      } else if (tx.metalType === "DIAMOND") {
        totalDiamondPieces++;
        totalDiamondCashAmount += tx.totalCashAmount;
      }

      totalCashAmount += tx.totalCashAmount;
    }

    // ── Issue Metal stats ──────────────────────────────────────────────────
    let totalGoldIssued = 0;
    let totalSilverIssued = 0;
    let issueCount = 0;

    for (const tx of issueTransactions) {
      issueCount++;
      if (tx.metalType === "GOLD") totalGoldIssued += tx.fineWeight;
      if (tx.metalType === "SILVER") totalSilverIssued += tx.fineWeight;
    }

    // ── Today's stats ──────────────────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTransactions = transactions.filter(
      (tx) => new Date(tx.createdAt) >= todayStart
    );
    const todayGoldWeight = todayTransactions
      .filter((tx) => tx.metalType === "GOLD")
      .reduce((sum, tx) => sum + tx.weight, 0);
    const todaySilverWeight = todayTransactions
      .filter((tx) => tx.metalType === "SILVER")
      .reduce((sum, tx) => sum + tx.weight, 0);
    const todayPieces = todayTransactions.length;

    return NextResponse.json({
      // Gold breakdown
      goldByPurity,
      totalGoldPieces,
      totalGoldJewelleryWeight,
      totalGoldFine,

      // Silver
      totalSilverPieces,
      totalSilverJewelleryWeight,
      totalSilverFine,

      // Diamond
      totalDiamondPieces,
      totalDiamondCashAmount,

      // Issue Metal
      totalGoldIssued,
      totalSilverIssued,
      issueCount,

      // Cash
      totalCashAmount,

      // Today
      todayGoldWeight,
      todaySilverWeight,
      todayPieces,

      // Total
      totalTransactions: transactions.length + issueTransactions.length,
    });
  } catch (error) {
    console.error("[WHOLESALER STATS GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
