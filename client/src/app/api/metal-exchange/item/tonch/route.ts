import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAudit } from "../../audit/log"
import { roundFineGold } from "@/lib/fineGold"

/* ---------------------------------------
   GET → Tonch Queue
--------------------------------------- */
export async function GET() {
  const items = await prisma.metalExchangeItem.findMany({
    where: {
      session: {
        isClosed: false,
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      customer: true,
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

    customerId: item.customerId,
    customer: item.customer,
    customerName: item.customer.name,
    customerPhone: item.customer.mobile,
    customerAddress: item.customer.address,
    customerCity: item.customer.city,
    customerPan: item.customer.pan,
    customerAadhar: item.customer.aadhar,
    customerGstin: item.customer.gstin,

    description: item.description,
    metalType: item.metalType,

    before: item.weightBefore,
    after: item.weightAfter,

    remaining:
      item.weightAfter != null
        ? Number(
            (item.weightBefore - item.weightAfter).toFixed(3)
          )
        : null,

    purity: item.purityPercent,
    fine: item.fineGold ? roundFineGold(item.fineGold) : null,

    status: item.status,
    locked: item.isLocked,
    createdAt: item.createdAt,
  }))

  return NextResponse.json(queue)
}

/* ---------------------------------------
   PATCH → Pencil Edit (Draft)
--------------------------------------- */
export async function PATCH(req: Request) {
  const body = await req.json()

  const fineCalculated = body.weightAfter && body.purityPercent
    ? roundFineGold(body.weightAfter * (body.purityPercent / 100))
    : undefined

  const updated = await prisma.metalExchangeItem.update({
    where: { id: body.itemId },
    data: {
      weightAfter: body.weightAfter,
      purityPercent: body.purityPercent,

      tonch: body.purityPercent
        ? body.purityPercent / 100
        : undefined,

      fineGold: fineCalculated,

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
    const fine = roundFineGold(body.weightAfter * (body.purityPercent / 100))

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
      include: {
        customer: true,
        session: true,
      },
    })

    // 🔥 1. SESSION LEDGER UPDATE
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

    // 🔥 2. CREDIT CUSTOMER WALLET
    if (item.customerId) {
      const walletId = `WAL-${item.customerId}`;
      await tx.customerWallet.upsert({
        where: { customerId: item.customerId },
        create: {
          id: walletId,
          customerId: item.customerId,
          metal24KBalance: fine,
          updatedAt: new Date(),
        },
        update: {
          metal24KBalance: { increment: fine },
          updatedAt: new Date(),
        },
      });

      await tx.customerWalletLedger.create({
        data: {
          id: `CWL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          walletId,
          transactionType: "CREDIT",
          assetType: "METAL_24K",
          amount: fine,
          description: `Old Gold Deposit from Tonch (Item: ${item.id.slice(-4)})`,
          relatedEntityId: item.id,
        },
      });
    }

    // 🔥 3. RECORD BRANCH STOCK LEDGER ENTRY (OLD_GOLD_IN)
    const branchId = item.session.branchId
    let existingProduct = await tx.productItem.findFirst({
      where: { branchId },
      select: { id: true },
    })

    if (!existingProduct) {
      // Ensure a default category & subcategory exists
      let cat = await tx.category.findFirst({ where: { name: "Raw Metal", branchId } })
      if (!cat) {
        cat = await tx.category.create({ data: { name: "Raw Metal", branchId } })
      }

      let subcat = await tx.subCategory.findFirst({ where: { name: "Old Gold", categoryId: cat.id } })
      if (!subcat) {
        subcat = await tx.subCategory.create({ data: { name: "Old Gold", categoryId: cat.id, branchId } })
      }

      // Create a default product
      existingProduct = await tx.productItem.create({
        data: {
          name: "Old Gold Stock",
          barcode: "OLDGOLD-" + Date.now(),
          productCode: "OLDGOLD",
          gsWeight: 0,
          ntWeight: 0,
          purity: 100,
          branchId,
          subCategoryId: subcat.id,
        },
        select: { id: true }
      })
    }

    const productId = existingProduct.id

    await tx.inventoryLedger.create({
      data: {
        productId,
        branchId,
        txnType: "OLD_GOLD_IN",
        refType: "METAL_EXCHANGE",
        refId: item.id,
        qtyIn: 1,
        qtyOut: 0,
        grossWeightIn: 0, // Set to 0 as per user request to treat as free fine gold
        netWeightIn: 0,   // Set to 0 as per user request to treat as free fine gold
        fineWeightIn: fine,
        purityPercent: item.purityPercent || undefined,
        remarks: `${item.session.sessionNumber}-${item.id.slice(-4).toUpperCase()} - ${item.customer.name}`,
        createdById: body.userId || null,
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
