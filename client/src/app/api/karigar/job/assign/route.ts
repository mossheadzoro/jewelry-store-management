import { NextResponse } from "next/server"
import { prisma } from "../../../../../../libs/prisma"
import { insertLedgerEntry } from "../../../../../../libs/inventoryLedger"


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
    } = body

    if (!karigarId || !issuedWeight || !issuedPurity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // 🔹 If metal comes from HELD balance
      if (metalSource === "HELD") {
        const held = await tx.karigarHeldMetal.findUnique({
          where: {
            karigarId_purity: {
              karigarId,
              purity: issuedPurity,
            },
          },
        })

        if (!held || held.weight < issuedWeight) {
          throw new Error("Insufficient held metal")
        }

        // Deduct held metal
        await tx.karigarHeldMetal.update({
          where: {
            karigarId_purity: {
              karigarId,
              purity: issuedPurity,
            },
          },
          data: {
            weight: {
              decrement: issuedWeight,
            },
          },
        })
      }

      // 🔹 Create job (same for STOCK or HELD)
      const job = await tx.karigarJob.create({
        data: {
          karigarId,
          issuedWeight,
          issuedPurity,
          wastagePercent,
          remarks,
        },
      })

      // 📒 Auto Ledger: KARIGAR_ISSUE_OUT
      if (productId && branchId) {
        await insertLedgerEntry(tx, {
          productId,
          branchId,
          txnType: "KARIGAR_ISSUE_OUT",
          refType: "KARIGAR_JOB",
          refId: job.id,
          qtyOut: 1,
          grossWeightOut: issuedWeight,
          netWeightOut: issuedWeight,
          remarks: `Karigar issue - ${metalSource} source`,
        })
      }
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
