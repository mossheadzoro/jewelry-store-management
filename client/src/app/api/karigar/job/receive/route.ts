import { NextResponse } from "next/server"
import { prisma } from "../../../../../../libs/prisma"
import { insertLedgerEntry } from "../../../../../../libs/inventoryLedger"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      jobId,
      jewelleryItems,
      wastagePercent,
      finingTonch,
      remainingRawMetal,
      remainingAction, // HOLD or RETURN
      productId,       // Optional: product being received back
      branchId,        // Required for ledger
    } = body

    const job = await prisma.karigarJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      /* ---------------- SAVE JEWELLERY ---------------- */
      for (const item of jewelleryItems) {
        await tx.karigarJobJewellery.create({
          data: {
            jobId,
            purity: item.purity,
            weight: item.weight,
            tonch: item.tonch,
          },
        })
      }

      /* ---------------- HANDLE HOLD METAL ---------------- */
      if (remainingAction === "HOLD" && remainingRawMetal > 0) {
        await tx.karigarHeldMetal.upsert({
          where: {
            karigarId_purity: {
              karigarId: job.karigarId,
              purity: job.issuedPurity,
            },
          },
          update: {
            weight: {
              increment: remainingRawMetal,
            },
          },
          create: {
            karigarId: job.karigarId,
            purity: job.issuedPurity,
            weight: remainingRawMetal,
          },
        })
      }

      /* ---------------- CLOSE JOB ---------------- */
      await tx.karigarJob.update({
        where: { id: jobId },
        data: {
          wastagePercent,
          remainingRawMetal,
          remainingAction,
          status: "CLOSED",
          closedAt: new Date(),
        },
      })

      /* ---------------- 📒 Auto Ledger: KARIGAR_RECEIVE_IN ---------------- */
      if (productId && branchId) {
        const totalReceivedWeight = jewelleryItems.reduce(
          (sum: number, item: any) => sum + (item.weight || 0),
          0
        );

        await insertLedgerEntry(tx, {
          productId,
          branchId,
          txnType: "KARIGAR_RECEIVE_IN",
          refType: "KARIGAR_JOB",
          refId: jobId,
          qtyIn: 1,
          grossWeightIn: totalReceivedWeight,
          netWeightIn: totalReceivedWeight,
          remarks: `Karigar receive - Job ${jobId}`,
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Receive metal error:", error)
    return NextResponse.json(
      { error: "Failed to receive metal" },
      { status: 500 }
    )
  }
}
