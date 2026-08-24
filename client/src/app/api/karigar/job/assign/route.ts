import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { insertLedgerEntry } from "@/lib/inventoryLedger"

async function getOrCreateFineGoldProduct(tx: any, branchId: number) {
  let product = await tx.productItem.findFirst({
    where: {
      branchId,
      OR: [
        { name: { contains: "Fine Gold", mode: "insensitive" } },
        { productCode: { contains: "FINEGOLD", mode: "insensitive" } },
      ],
    },
  })

  if (!product) {
    let subCategory = await tx.subCategory.findFirst({
      where: {
        branchId,
        name: { contains: "Gold", mode: "insensitive" },
      },
    })

    if (!subCategory) {
      let category = await tx.category.findFirst({
        where: {
          branchId,
          name: { contains: "Gold", mode: "insensitive" },
        },
      })

      if (!category) {
        category = await tx.category.create({
          data: {
            name: "Gold",
            branchId,
          },
        })
      }

      subCategory = await tx.subCategory.create({
        data: {
          name: "Fine Gold 24K",
          categoryId: category.id,
          branchId,
        },
      })
    }

    const uniqueCode = `FG-${branchId}-${Date.now().toString().slice(-4)}`
    product = await tx.productItem.create({
      data: {
        name: "Fine Gold 24K Raw Metal",
        productCode: uniqueCode,
        barcode: uniqueCode,
        gsWeight: 0,
        ntWeight: 0,
        purity: 99.5,
        quantity: 0,
        allowNegativeStock: true,
        branchId,
        subCategoryId: subCategory.id,
      },
    })
  }

  return product
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

      const {
        karigarId,
        issuedWeight,
        issuedPurity,
        wastagePercent,
        remarks,
        metalSource,      // "STOCK" | "HELD"
        productId,        // Optional: if issuing a specific product
        branchId,         // Required for ledger
        cashIssued = 0,   // Cash advance / cash issued for job
      } = body

      if (!karigarId || !issuedWeight || !issuedPurity) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        )
      }

      const targetBranchId = branchId ? Number(branchId) : 1
      const issuedWtNum = Number(issuedWeight)
      const purityNum = Number(issuedPurity)

      await prisma.$transaction(async (tx) => {
        // 🔹 Fetch karigar info
        const karigar = await tx.karigar.findUnique({
          where: { id: karigarId },
          select: { name: true },
        })

        // 🔹 If metal comes from HELD balance
        if (metalSource === "HELD") {
          const held = await tx.karigarHeldMetal.findUnique({
            where: {
              karigarId_purity: {
                karigarId,
                purity: purityNum,
              },
            },
          })

          if (!held || held.weight < issuedWtNum) {
            throw new Error("Insufficient held metal in karigar custody")
          }

          // Deduct held metal
          await tx.karigarHeldMetal.update({
            where: {
              karigarId_purity: {
                karigarId,
                purity: purityNum,
              },
            },
            data: {
              weight: {
                decrement: issuedWtNum,
              },
            },
          })
        }

        // 🔹 Create job (same for STOCK or HELD)
        const job = await tx.karigarJob.create({
          data: {
            karigarId,
            issuedWeight: issuedWtNum,
            issuedPurity: purityNum,
            wastagePercent: wastagePercent ? Number(wastagePercent) : null,
            cashIssued: Number(cashIssued) || 0,
            remarks,
          },
        })

      // 📒 ALWAYS Auto Ledger: KARIGAR_ISSUE_OUT
      let targetProductId = productId ? Number(productId) : null
      if (!targetProductId) {
        const rawProduct = await getOrCreateFineGoldProduct(tx, targetBranchId)
        targetProductId = rawProduct.id
      }

      await insertLedgerEntry(
        tx,
        {
          productId: targetProductId,
          branchId: targetBranchId,
          txnType: "KARIGAR_ISSUE_OUT",
          refType: "KARIGAR_JOB",
          refId: job.id,
          qtyOut: 1,
          grossWeightOut: issuedWtNum,
          netWeightOut: issuedWtNum,
          remarks: `Karigar issue - ${karigar?.name || karigarId} (${metalSource} source)`,
        },
        {
          purityPercent: 100, // 24K fine metal issued to karigar is 1:1 direct fine weight (e.g., 5g = 5g fine weight out)
          karatage: 24,
        }
      )
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Assign metal error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to assign metal" },
      { status: 500 }
    )
  }
}
