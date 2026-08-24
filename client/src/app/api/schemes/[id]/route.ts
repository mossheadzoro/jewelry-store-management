import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/schemes/[id] — Full scheme detail with deposits and redemptions
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: schemeId } = await params;

    const scheme = await prisma.savingScheme.findUnique({
      where: { id: schemeId },
      include: {
        customer: {
          select: { id: true, name: true, mobile: true, email: true, address: true },
        },
        createdBy: { select: { id: true, name: true } },
        deposits: {
          orderBy: { depositedAt: "desc" },
        },
        redemptions: {
          orderBy: { redeemedAt: "desc" },
        },
      },
    });

    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    // Calculate bonus eligibility for Type 1
    let bonusInfo = null;
    if (scheme.type === "FIXED_MONTHLY") {
      const paidMonths = scheme.deposits.filter((d) => !d.isBonus).length;
      const bonusMonths = scheme.deposits.filter((d) => d.isBonus).length;

      bonusInfo = {
        paidMonths,
        bonusMonthsCredited: bonusMonths,
        eligibleForYear1Bonus: paidMonths >= 12 && bonusMonths < 1,
        eligibleForYear2Bonus: paidMonths >= 24 && bonusMonths < 2,
        canRedeemPart1: paidMonths >= 12, // After 12 paid months (month 13+)
        canRedeemAll: paidMonths >= 24,
      };
    }

    return NextResponse.json({ scheme, bonusInfo });
  } catch (error: any) {
    console.error("Error fetching scheme:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/schemes/[id] — Update scheme (cancel, extend, update card)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: schemeId } = await params;
    const body = await req.json();
    const { action, physicalCardNumber, maxDurationMonths } = body;

    const scheme = await prisma.savingScheme.findUnique({ where: { id: schemeId } });
    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case "CANCEL":
        updateData.status = "CANCELLED";
        break;

      case "EXTEND":
        if (!maxDurationMonths || maxDurationMonths <= scheme.maxDurationMonths) {
          return NextResponse.json(
            { error: "New duration must be greater than current" },
            { status: 400 }
          );
        }
        if (scheme.type === "FIXED_MONTHLY" && maxDurationMonths > 24) {
          return NextResponse.json(
            { error: "Fixed Monthly schemes can be extended to maximum 24 months" },
            { status: 400 }
          );
        }
        updateData.maxDurationMonths = maxDurationMonths;
        const newMaturity = new Date(scheme.startDate);
        newMaturity.setMonth(newMaturity.getMonth() + maxDurationMonths);
        updateData.maturityDate = newMaturity;
        
        if (scheme.status === "MATURED") {
          updateData.status = "ACTIVE";
        }
        break;

      case "UPDATE_CARD":
        if (!physicalCardNumber) {
          return NextResponse.json({ error: "Card number required" }, { status: 400 });
        }
        updateData.physicalCardNumber = physicalCardNumber;
        updateData.cardIssuedAt = new Date();
        break;

      case "MATURE":
        updateData.status = "MATURED";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.savingScheme.update({
      where: { id: schemeId },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
      },
    });

    return NextResponse.json({ success: true, scheme: updated });
  } catch (error: any) {
    console.error("Error updating scheme:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
