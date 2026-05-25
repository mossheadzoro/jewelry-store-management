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
            where: { status: "OPEN" },
            select: {
              issuedWeight: true,
              remainingRawMetal: true,
            },
          },
        },
      }),
      prisma.karigar.count({ where }),
    ])

    /* ---------------- DERIVED FIELDS ---------------- */

    const formatted = karigars.map((k) => {
      const metalBalance = k.jobs.reduce((sum, job) => {
        return (
          sum +
          (job.remainingRawMetal !== null
            ? job.remainingRawMetal
            : job.issuedWeight)
        )
      }, 0)

      return {
        ...k,
        currentBalanceMetal: metalBalance,
        activeJobsCount: k.jobs.length,
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
