import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";

// ─── Wholesale rounded purity % for Gold ─────────────────────────────────────
// In wholesale business, purities are rounded: 22K=92, 20K=83, 18K=75, etc.
const GOLD_PURITY_PCT: Record<string, number> = {
  "22K": 92,
  "20K": 83,
  "18K": 75,
  "14K": 58,
  "9K":  37,
};

// ─── POST ─ Create a new transaction ─────────────────────────────────────────
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wholesalerId } = await context.params;
    const body = await req.json();

    const {
      type,         // "ISSUE_METAL" | "RECEIVE_JEWELLERY"
      metalType,    // "GOLD" | "SILVER" | "DIAMOND"
      purityLabel,  // "22K" | "20K" | "18K" | "14K" | "9K"  OR decimal string for silver e.g. "92.50"
      weight,       // number
      wastage,      // number (%)
      cashItems,    // [{ itemName: string, cost: number }]
      remarks,
    } = body;

    // ── Validate required fields ────────────────────────────────────────────
    if (!type || !metalType) {
      return NextResponse.json(
        { error: "type and metalType are required" },
        { status: 400 }
      );
    }

    const wholesaler = await prisma.wholesaler.findUnique({
      where: { id: wholesalerId },
    });

    if (!wholesaler) {
      return NextResponse.json(
        { error: "Wholesaler not found" },
        { status: 404 }
      );
    }

    let purityFactor = 0;
    let fineWeight = 0;
    const weightNum = Number(weight) || 0;
    const wastageNum = type === "ISSUE_METAL" ? 0 : (Number(wastage) || 0);

    // If ISSUE_METAL, it's strictly 24K pure (factor 1.0) with zero wastage
    if (type === "ISSUE_METAL") {
      purityFactor = 1.0;
      fineWeight = weightNum;
    } else {
      if (metalType === "GOLD") {
        // Wholesale formula: Fine = weight × (roundedPurity + wastage) / 100
        const purityPct = GOLD_PURITY_PCT[purityLabel] ?? 0;
        purityFactor = (purityPct + wastageNum) / 100;
        fineWeight = weightNum * purityFactor;
      } else if (metalType === "SILVER") {
        // Silver: user enters purity as decimal (e.g. 92.50), same formula
        const purityPct = Number(purityLabel) || 0;
        purityFactor = (purityPct + wastageNum) / 100;
        fineWeight = weightNum * purityFactor;
      }
    }

    // ── Cash items total ───────────────────────────────────────────────────
    const items: { itemName: string; cost: number }[] = Array.isArray(cashItems)
      ? cashItems
      : [];
    const totalCashAmount = items.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );

    // ── Build balance delta ────────────────────────────────────────────────
    // Issue Metal → we GIVE metal to wholesaler → balance INCREASES (they owe us)
    // Receive Jewellery → they RETURN jewellery → balance DECREASES (they owe us less)
    let goldDelta = 0;
    let silverDelta = 0;
    let moneyDelta = 0;

    if (type === "ISSUE_METAL") {
      if (metalType === "GOLD") goldDelta = +fineWeight;
      if (metalType === "SILVER") silverDelta = +fineWeight;
    } else if (type === "RECEIVE_JEWELLERY") {
      if (metalType === "GOLD") goldDelta = -fineWeight;
      if (metalType === "SILVER") silverDelta = -fineWeight;
      moneyDelta = +totalCashAmount;
    }

    // ── Build description ──────────────────────────────────────────────────
    const txLabel = type === "ISSUE_METAL" ? "Issue Metal" : "Receive Jewellery";
    let metalLabel = "Diamond";
    
    if (type === "ISSUE_METAL") {
       metalLabel = metalType === "GOLD" ? "Gold (24K)" : "Silver (99.9%)";
    } else {
       if (metalType === "GOLD") metalLabel = `Gold (${purityLabel})`;
       if (metalType === "SILVER") metalLabel = `Silver (${purityLabel}%)`;
    }

    const description = type === "ISSUE_METAL"
      ? `${txLabel} — ${metalLabel}, Wt: ${weightNum}g`
      : `${txLabel} — ${metalLabel}, Wt: ${weightNum}g, Wastage: ${wastageNum}%, Fine: ${fineWeight.toFixed(3)}g`;

    // ── Ledger entries ─────────────────────────────────────────────────────
    // Ledger display: CREDIT = "+" green (Issue), DEBIT = "-" red (Receive)
    type LedgerCreate = {
      wholesalerId: string;
      entryType: string;
      metalAmount: number;
      cashAmount: number;
      description: string;
    };

    const ledgerData: LedgerCreate[] = [];

    if (goldDelta !== 0) {
      ledgerData.push({
        wholesalerId,
        entryType: type === "ISSUE_METAL" ? "GOLD_CREDIT" : "GOLD_DEBIT",
        metalAmount: Math.abs(goldDelta),
        cashAmount: 0,
        description,
      });
    }
    if (silverDelta !== 0) {
      ledgerData.push({
        wholesalerId,
        entryType: type === "ISSUE_METAL" ? "SILVER_CREDIT" : "SILVER_DEBIT",
        metalAmount: Math.abs(silverDelta),
        cashAmount: 0,
        description,
      });
    }
    if (moneyDelta !== 0) {
      ledgerData.push({
        wholesalerId,
        entryType: "MONEY_DEBIT",
        metalAmount: 0,
        cashAmount: moneyDelta,
        description: `Cash items for ${txLabel}`,
      });
    }

    // ── Prisma transaction ─────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const transaction = await tx.wholesalerTransaction.create({
        data: {
          wholesalerId,
          type,
          metalType,
          purityLabel: String(purityLabel ?? ""),
          purityFactor,
          weight: weightNum,
          wastage: wastageNum,
          fineWeight,
          totalCashAmount,
          remarks: remarks ?? null,
          cashItems: {
            create: items.map((i) => ({
              itemName: i.itemName,
              cost: Number(i.cost),
            })),
          },
          ledgerEntries: {
            create: ledgerData,
          },
        },
        include: { cashItems: true, ledgerEntries: true },
      });

      // 2. Update wholesaler balances
      const updated = await tx.wholesaler.update({
        where: { id: wholesalerId },
        data: {
          goldBal: { increment: goldDelta },
          silverBal: { increment: silverDelta },
          moneyBal: { increment: moneyDelta },
        },
      });

      return { transaction, updated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[WHOLESALER TRANSACTION POST]", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// ─── GET ─ Fetch all ledger entries for a wholesaler ─────────────────────────
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wholesalerId } = await context.params;

    const entries = await prisma.wholesalerLedgerEntry.findMany({
      where: { wholesalerId },
      include: {
        transaction: {
          include: { cashItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[WHOLESALER LEDGER GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger" },
      { status: 500 }
    );
  }
}
