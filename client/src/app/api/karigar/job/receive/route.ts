import { NextResponse } from "next/server"
import { prisma } from "../../../../../../libs/prisma"
import { insertLedgerEntry } from "../../../../../../libs/inventoryLedger"

const TONCH_MAP: Record<string, number> = {
  K22: 0.92,
  K20: 0.833,
  K18: 0.75,
  K14: 0.585,
}

async function getOrCreateUnmarkedCategoryAndSubcategory(tx: any, branchId: number) {
  let category = await tx.category.findFirst({
    where: {
      branchId,
      name: { equals: "UNMARKED JEWELLERY", mode: "insensitive" },
    },
  })

  if (!category) {
    category = await tx.category.create({
      data: {
        name: "UNMARKED JEWELLERY",
        description: "Default category for jewellery items produced by Karigars",
        branchId,
      },
    })
  }

  let subCategory = await tx.subCategory.findFirst({
    where: {
      branchId,
      categoryId: category.id,
      name: { contains: "Karigar", mode: "insensitive" },
    },
  })

  if (!subCategory) {
    subCategory = await tx.subCategory.create({
      data: {
        name: "Karigar Produced Jewellery",
        categoryId: category.id,
        branchId,
      },
    })
  }

  return { category, subCategory }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      jobId,
      calculationMode = "MODE_A",
      jewelleryItems,
      wastagePercent = 0,
      remainingRawMetal,
      remainingAction, // HOLD or RETURN
      branchId,        // Required for ledger
      cashPaid = 0,    // Labour charges or cash paid/due to Karigar
    } = body

    const job = await prisma.karigarJob.findUnique({
      where: { id: jobId },
      include: {
        karigar: { select: { name: true } },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const targetBranchId = branchId ? Number(branchId) : 1
    const w = (Number(wastagePercent) || 0) / 100

    let calculatedBaseFine = 0
    let calculatedTotalFine = 0

    await prisma.$transaction(async (tx) => {
      /* ---------------- ENSURE UNMARKED JEWELLERY CATEGORY ---------------- */
      const { subCategory } = await getOrCreateUnmarkedCategoryAndSubcategory(tx, targetBranchId)

      /* ---------------- SAVE JEWELLERY & CREATE UNMARKED PRODUCTS ---------------- */
      let itemIdx = 0
      for (const item of jewelleryItems) {
        const wt = Number(item.weight) || 0
        const tonch = Number(item.tonch) || TONCH_MAP[item.purity] || 0.92
        const baseFine = wt * tonch

        let itemFineGold = 0
        if (calculationMode === "MODE_B") {
          itemFineGold = wt * (tonch + w)
        } else {
          itemFineGold = wt * (1 + w) * tonch
        }

        calculatedBaseFine += baseFine
        calculatedTotalFine += itemFineGold

        await tx.karigarJobJewellery.create({
          data: {
            jobId,
            purity: item.purity,
            weight: wt,
            tonch,
            fineGold: itemFineGold,
          },
        })

        // 🛍️ Create ProductItem in UNMARKED JEWELLERY category
        const uniqueCode = `UMJ-${jobId.slice(-6).toUpperCase()}-${itemIdx + 1}-${Date.now().toString().slice(-4)}`
        const purityPercent = Number((tonch * 100).toFixed(2))

        const createdProduct = await tx.productItem.create({
          data: {
            name: `Unmarked ${item.purity || "K22"} Jewellery (${job.karigar?.name || "Karigar"})`,
            productCode: uniqueCode,
            barcode: uniqueCode,
            gsWeight: wt,
            ntWeight: wt,
            purity: purityPercent,
            quantity: 1,
            allowNegativeStock: true,
            branchId: targetBranchId,
            subCategoryId: subCategory.id,
            description: `Unmarked produced jewellery received from Karigar ${job.karigar?.name || ""} for job #${jobId.slice(-6).toUpperCase()}`,
          },
        })

        // 📒 Log Inventory Ledger Entry under UNMARKED JEWELLERY product
        await insertLedgerEntry(
          tx,
          {
            productId: createdProduct.id,
            branchId: targetBranchId,
            txnType: "KARIGAR_RECEIVE_IN",
            refType: "KARIGAR_JOB",
            refId: jobId,
            qtyIn: 1,
            grossWeightIn: wt,
            netWeightIn: wt,
            remarks: `Karigar jewellery received (${item.purity || "K22"}) - ${job.karigar?.name || "Artisan"} (Job #${jobId.slice(-6).toUpperCase()})`,
          },
          {
            purityPercent,
          }
        )

        itemIdx++
      }

      const calculatedWastageFine = calculatedTotalFine - calculatedBaseFine
      const finalRemainingRaw = Number(remainingRawMetal) ?? (job.issuedWeight - calculatedTotalFine)

      /* ---------------- HANDLE HOLD METAL ---------------- */
      if (remainingAction === "HOLD" && finalRemainingRaw > 0) {
        await tx.karigarHeldMetal.upsert({
          where: {
            karigarId_purity: {
              karigarId: job.karigarId,
              purity: job.issuedPurity,
            },
          },
          update: {
            weight: {
              increment: finalRemainingRaw,
            },
          },
          create: {
            karigarId: job.karigarId,
            purity: job.issuedPurity,
            weight: finalRemainingRaw,
          },
        })
      }

      /* ---------------- CLOSE JOB & UPDATE CASH PAID ---------------- */
      const baseUpdateData: any = {
        wastagePercent: Number(wastagePercent) || 0,
        fineUsed: calculatedBaseFine,
        fineWastage: calculatedWastageFine,
        remainingRawMetal: finalRemainingRaw,
        remainingAction,
        cashPaid: Number(cashPaid) || 0,
        status: "CLOSED",
        closedAt: new Date(),
        remarks: job.remarks ? `${job.remarks} [Mode: ${calculationMode}]` : `[Mode: ${calculationMode}]`,
      }

      try {
        await tx.karigarJob.update({
          where: { id: jobId },
          data: {
            ...baseUpdateData,
            calculationMode,
          },
        })
      } catch (updateErr) {
        await tx.karigarJob.update({
          where: { id: jobId },
          data: baseUpdateData,
        })
      }
    })

    return NextResponse.json({
      success: true,
      calculationMode,
      totalFineGoldAccounted: calculatedTotalFine,
      baseFineGold: calculatedBaseFine,
      fineWastage: calculatedTotalFine - calculatedBaseFine,
    })
  } catch (error: any) {
    console.error("Receive metal error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to receive metal" },
      { status: 500 }
    )
  }
}
