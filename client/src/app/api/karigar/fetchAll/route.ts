import { NextResponse } from "next/server"
import { prisma } from "../../../../../libs/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const search = searchParams.get("search") || ""
    const department = searchParams.get("department") as
      | "GOLD"
      | "SILVER"
      | "DIAMOND"
      | null

    const page = Number(searchParams.get("page") || 1)
    const limit = 5
    const skip = (page - 1) * limit

    /* ---------------- WHERE ---------------- */

    const where: any = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search } },
              ],
            }
          : {},
        department ? { department } : {},
      ],
    }

    /* ---------------- QUERY ---------------- */

    const [karigars, total] = await Promise.all([
      prisma.karigar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          jobs: {
            select: {
              issuedWeight: true,
              issuedPurity: true,
              fineUsed: true,
              fineWastage: true,
              remainingRawMetal: true,
              status: true,
              cashIssued: true,
              cashPaid: true,
              jewelleryItems: {
                select: { fineGold: true },
              },
            },
          },
          KarigarHeldMetal: {
            select: {
              weight: true,
              purity: true,
            },
          },
        },
      }),
      prisma.karigar.count({ where }),
    ])

    /* ---------------- DERIVED FIELDS ---------------- */

    const formatted = karigars.map((k) => {
      let totalMetalBalance = 0
      let totalCashBalance = 0
      let activeJobsCount = 0

      k.jobs.forEach((job) => {
        // In India, 99.5% purity is standard 24K — fine weight = gross weight
        const effectivePurity = job.issuedPurity >= 0.995 ? 1.0 : job.issuedPurity
        if (job.status === "OPEN") {
          activeJobsCount++
          const openMetal = job.remainingRawMetal !== null ? job.remainingRawMetal : (job.issuedWeight * effectivePurity)
          totalMetalBalance += openMetal
        } else {
          // CLOSED job: Issued Fine Metal - Returned Fine Metal
          const issuedFine = job.issuedWeight * effectivePurity
          // Dynamically compute returned fine using exact Mode A / Mode B formulas from Receiving Modal
          let returnedFine = 0
          if (job.jewelleryItems && job.jewelleryItems.length > 0) {
            const w = (job.wastagePercent || 0) / 100
            const mode = job.calculationMode || (job.remarks?.includes("MODE_B") ? "MODE_B" : "MODE_A")
            if (mode === "MODE_B") {
              returnedFine = job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) * ((Number(item.tonch) || 0.92) + w)), 0)
            } else {
              returnedFine = job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) * (1 + w) * (Number(item.tonch) || 0.92)), 0)
            }
          } else {
            returnedFine = (job.fineUsed || 0) + (job.fineWastage || 0)
          }
          
          const jobBalance = issuedFine - returnedFine
          // If jobBalance > 0, the karigar either returned it to store (RETURN) or it is held (HOLD) and thus already in KarigarHeldMetal.
          // If jobBalance < 0, the karigar gave us more metal, so we owe them (due).
          if (jobBalance < 0) {
            totalMetalBalance += jobBalance
          }
        }

        totalCashBalance += ((job.cashIssued || 0) - (job.cashPaid || 0))
      })

      // Add held metal custody balance
      k.KarigarHeldMetal.forEach((hm) => {
        totalMetalBalance += (hm.weight || 0)
      })

      return {
        ...k,
        currentBalanceMetal: Number(totalMetalBalance.toFixed(3)),
        currentBalanceCash: Number(totalCashBalance.toFixed(2)),
        activeJobsCount,
      }
    })

    /* ---------------- RESPONSE ---------------- */

    return NextResponse.json({
      data: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("fetchAll karigars error:", error)

    return NextResponse.json(
      { message: "Failed to fetch karigars" },
      { status: 500 }
    )
  }
}
