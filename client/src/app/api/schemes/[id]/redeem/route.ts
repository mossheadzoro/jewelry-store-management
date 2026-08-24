import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/schemes/[id]/redeem — Apply scheme balance to an invoice
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: schemeId } = await params;
    const body = await req.json();
    const { amountUsed, goldWeightUsed, invoiceId, remarks } = body;

    const scheme = await prisma.savingScheme.findUnique({
      where: { id: schemeId },
      include: {
        deposits: true,
        redemptions: true,
      },
    });

    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    if (scheme.status === "CANCELLED" || scheme.status === "EXPIRED") {
      return NextResponse.json(
        { error: "Cannot redeem a cancelled or expired scheme" },
        { status: 400 }
      );
    }

    // Type 1: Check maturity — must have completed at least 12 months
    if (scheme.type === "FIXED_MONTHLY") {
      const paidMonths = scheme.deposits.filter((d) => !d.isBonus).length;
      if (paidMonths < 12) {
        return NextResponse.json(
          { error: "Fixed Monthly scheme must have at least 12 paid months before redemption" },
          { status: 400 }
        );
      }
    }

    // Calculate available balance
    const totalDeposited = scheme.totalCashDeposited + scheme.totalBonusAmount;
    const totalPreviouslyRedeemed = scheme.redemptions.reduce(
      (sum, r) => sum + r.amountUsed,
      0
    );
    const availableBalance = totalDeposited - totalPreviouslyRedeemed;

    const redeemAmount = Number(amountUsed) || 0;
    if (redeemAmount <= 0 || redeemAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Invalid redeem amount. Available balance: ₹${availableBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const redemption = await tx.schemeRedemption.create({
        data: {
          schemeId,
          invoiceId: invoiceId ? Number(invoiceId) : null,
          amountUsed: redeemAmount,
          goldWeightUsed: goldWeightUsed ? Number(goldWeightUsed) : null,
          remarks: remarks || `Redeemed ₹${redeemAmount} against invoice`,
        },
      });

      // Update scheme totals
      const newTotalRedeemed = scheme.totalRedeemed + redeemAmount;
      const existingInvoiceIds = scheme.redeemedInvoiceIds || "";
      const newInvoiceIds = invoiceId
        ? existingInvoiceIds
          ? `${existingInvoiceIds},${invoiceId}`
          : String(invoiceId)
        : existingInvoiceIds;

      // Determine new status
      const remainingBalance = availableBalance - redeemAmount;
      let newStatus = scheme.status;
      if (remainingBalance <= 0) {
        newStatus = "REDEEMED";
      } else if (newTotalRedeemed > 0) {
        newStatus = "PARTIALLY_REDEEMED";
      }

      await tx.savingScheme.update({
        where: { id: schemeId },
        data: {
          totalRedeemed: newTotalRedeemed,
          redeemedInvoiceIds: newInvoiceIds,
          status: newStatus,
        },
      });

      return { redemption, newStatus, remainingBalance };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error redeeming scheme:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
