import { NextResponse } from "next/server"
import { prisma } from "../../../../../../libs/prisma"
import { logAudit } from "../../audit/log"

/* ---------------------------------------
   GET → Tonch Queue
--------------------------------------- */
export async function GET() {
  const items = await prisma.metalExchangeItem.findMany({
    where: {
      status: {
        in: ["PENDING", "PROCESSING"],
      },
      isLocked: false,
    },
    orderBy: { createdAt: "asc" },
    include: {
      customer: {
        select: {
          name: true,
          mobile: true,
        },
      },
      session: {
        select: {
          sessionNumber: true,
        },
      },
    },
  })

  const queue = items.map((item, index) => ({
    id: item.id,
    queueId: `${item.session.sessionNumber}-${index + 1}`,

    customerName: item.customer.name,
    customerPhone: item.customer.mobile,

    description: item.description,
    metalType: item.metalType, // ✅ FIXED (GOLD / SILVER)

    before: item.weightBefore,
    after: item.weightAfter,

    // ✅ derive remaining safely
    remaining:
      item.weightAfter != null
        ? Number(
            (item.weightBefore - item.weightAfter).toFixed(3)
          )
        : null,

    purity: item.purityPercent,
    fine: item.fineGold,

    status: item.status,
    locked: item.isLocked,
  }))

  return NextResponse.json(queue)
}

/* ---------------------------------------
   PATCH → Pencil Edit (Draft)
--------------------------------------- */
export async function PATCH(req: Request) {
  const body = await req.json()

  const updated = await prisma.metalExchangeItem.update({
    where: { id: body.itemId },
    data: {
      weightAfter: body.weightAfter,
      purityPercent: body.purityPercent,

      tonch: body.purityPercent
        ? body.purityPercent / 100
        : undefined,

      fineGold:
        body.weightAfter && body.purityPercent
          ? body.weightAfter * (body.purityPercent / 100)
          : undefined,

      lossWeight:
        body.weightAfter !== undefined
          ? body.weightBefore - body.weightAfter
          : undefined,

      status: "PROCESSING",
    },
  })

  await logAudit({
    sessionId: updated.sessionId,
    action: "UPDATED_ITEM_DRAFT",
    performedById: body.userId,
    metadata: body,
  })

  return NextResponse.json(updated)
}

/* ---------------------------------------
   POST → FINAL TONCH
--------------------------------------- */
export async function POST(req: Request) {
  const body = await req.json()

  return await prisma.$transaction(async (tx) => {
 const fine =
  body.weightAfter * (body.purityPercent / 100)

const item = await tx.metalExchangeItem.update({
  where: { id: body.itemId },
  data: {
    weightAfter: body.weightAfter,
    purityPercent: body.purityPercent,
    tonch: body.purityPercent / 100,
    fineGold: fine,
    lossWeight: body.weightBefore - body.weightAfter,
    status: "TONCHED",
    isLocked: true,
  },
})

// 🔥 SESSION LEDGER UPDATE
await tx.metalExchangeSession.update({
  where: { id: item.sessionId },
  data:
    item.metalType === "GOLD"
      ? {
          fineGold: { increment: fine },
          totalWeightAfter: { increment: body.weightAfter },
        }
      : {
          fineSilver: { increment: fine },
          totalWeightAfter: { increment: body.weightAfter },
        },
})


    await logAudit({
      sessionId: item.sessionId,
      action: "TONCHED_ITEM",
      performedById: body.userId,
      metadata: item,
    })

    return NextResponse.json(item)
  })
}
