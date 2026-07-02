import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";

// POST /api/schemes/[id]/deposit — Record a deposit
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: schemeId } = await params;
    const body = await req.json();
    const {
      depositType,
      cashAmount,
      metalWeightGm,
      metalPurity,
      metalType,
      metalRatePerGm,
      remarks,
      recordedById,
    } = body;

    // Fetch the scheme
    const scheme = await prisma.savingScheme.findUnique({
      where: { id: schemeId },
      include: { deposits: { where: { isBonus: false }, orderBy: { monthNumber: "desc" } } },
    });

    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    if (scheme.status !== "ACTIVE" && scheme.status !== "PARTIALLY_REDEEMED") {
      return NextResponse.json(
        { error: `Cannot deposit to a ${scheme.status} scheme` },
        { status: 400 }
      );
    }

    let depositData: any = {
      schemeId,
      depositType,
      remarks,
      recordedById: recordedById ? Number(recordedById) : null,
      receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
    };

    let updateSchemeData: any = {
      depositCount: { increment: 1 },
    };

    // ─── Type 1: FIXED_MONTHLY ───────────────────────────────────
    if (scheme.type === "FIXED_MONTHLY") {
      if (depositType !== "CASH") {
        return NextResponse.json(
          { error: "Fixed Monthly schemes only accept cash deposits" },
          { status: 400 }
        );
      }

      const amount = Number(cashAmount);
      if (!amount || amount < 1000 || amount > 5000) {
        return NextResponse.json(
          { error: "Cash amount must be between ₹1,000 and ₹5,000" },
          { status: 400 }
        );
      }

      // Determine month number
      const paidMonths = scheme.deposits.length;
      const nextMonth = paidMonths + 1;
      const maxPayableMonths = scheme.maxDurationMonths; // 12 or 24

      if (nextMonth > maxPayableMonths) {
        return NextResponse.json(
          { error: `All ${maxPayableMonths} months have been paid` },
          { status: 400 }
        );
      }

      depositData.cashAmount = amount;
      depositData.monthNumber = nextMonth;
      updateSchemeData.totalCashDeposited = { increment: amount };

      // Check for auto-bonus after 12th or 24th payment
      // We'll create bonus entries after the main deposit in a transaction
    }

    // ─── Type 2: ANONYMOUS_DEPOSIT ────────────────────────────────
    if (scheme.type === "ANONYMOUS_DEPOSIT") {
      if (depositType === "CASH") {
        const amount = Number(cashAmount);
        if (!amount || amount < 500) {
          return NextResponse.json(
            { error: "Cash deposits must be ≥ ₹500" },
            { status: 400 }
          );
        }
        depositData.cashAmount = amount;
        updateSchemeData.totalCashDeposited = { increment: amount };
      } else {
        // Metal deposit
        if (!metalWeightGm || metalWeightGm <= 0) {
          return NextResponse.json(
            { error: "Metal weight must be greater than 0" },
            { status: 400 }
          );
        }
        depositData.metalWeightGm = Number(metalWeightGm);
        depositData.metalPurity = metalPurity ? Number(metalPurity) : null;
        depositData.metalType = metalType || "GOLD";
        depositData.metalRatePerGm = metalRatePerGm ? Number(metalRatePerGm) : null;
        updateSchemeData.totalGoldDepositedGm = { increment: Number(metalWeightGm) };
      }
    }

    // ─── Type 3: GOLD_DEPOSIT ─────────────────────────────────────
    if (scheme.type === "GOLD_DEPOSIT") {
      if (!metalWeightGm || metalWeightGm <= 0) {
        return NextResponse.json(
          { error: "Gold weight must be greater than 0" },
          { status: 400 }
        );
      }
      depositData.depositType = "GOLD";
      depositData.metalWeightGm = Number(metalWeightGm);
      depositData.metalPurity = metalPurity ? Number(metalPurity) : null;
      depositData.metalType = "GOLD";
      depositData.metalRatePerGm = metalRatePerGm ? Number(metalRatePerGm) : null;
      updateSchemeData.totalGoldDepositedGm = { increment: Number(metalWeightGm) };
    }

    // Execute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the deposit
      const deposit = await tx.schemeDeposit.create({ data: depositData });

      // Update scheme totals
      await tx.savingScheme.update({ where: { id: schemeId }, data: updateSchemeData });

      // Auto-credit bonus for Type 1 after 12th/24th month
      let bonusDeposit = null;
      if (scheme.type === "FIXED_MONTHLY") {
        const paidMonths = scheme.deposits.length + 1; // +1 for the one we just created
        const existingBonuses = await tx.schemeDeposit.count({
          where: { schemeId, isBonus: true },
        });

        if (paidMonths === 12 && existingBonuses < 1) {
          // Credit 1 bonus month (value = fixedMonthlyAmount)
          bonusDeposit = await tx.schemeDeposit.create({
            data: {
              schemeId,
              depositType: "BONUS",
              cashAmount: scheme.fixedMonthlyAmount,
              monthNumber: 13,
              isBonus: true,
              remarks: "Year 1 Bonus — 1 free month",
              receiptNumber: `RCP-B1-${Date.now().toString().slice(-8)}`,
            },
          });
          await tx.savingScheme.update({
            where: { id: schemeId },
            data: {
              totalBonusAmount: { increment: scheme.fixedMonthlyAmount || 0 },
              depositCount: { increment: 1 },
            },
          });
        } else if (paidMonths === 24 && existingBonuses < 2) {
          // Credit 2nd bonus month
          bonusDeposit = await tx.schemeDeposit.create({
            data: {
              schemeId,
              depositType: "BONUS",
              cashAmount: scheme.fixedMonthlyAmount,
              monthNumber: 26,
              isBonus: true,
              remarks: "Year 2 Bonus — 2nd free month",
              receiptNumber: `RCP-B2-${Date.now().toString().slice(-8)}`,
            },
          });
          await tx.savingScheme.update({
            where: { id: schemeId },
            data: {
              totalBonusAmount: { increment: scheme.fixedMonthlyAmount || 0 },
              depositCount: { increment: 1 },
              status: "MATURED", // Auto-mature after 24 months
            },
          });
        }

        // Auto-mature after 12 months if maxDuration is 12
        if (paidMonths >= scheme.maxDurationMonths) {
          await tx.savingScheme.update({
            where: { id: schemeId },
            data: { status: "MATURED" },
          });
        }
      }

      return { deposit, bonusDeposit };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error recording deposit:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
