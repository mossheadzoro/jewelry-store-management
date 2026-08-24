import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job = await prisma.karigarJob.findUnique({
      where: { id },
      include: {
        karigar: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            department: true,
            profilePhoto: true,
          },
        },
        jewelleryItems: {
          orderBy: { createdAt: "asc" },
        },
        heldMetals: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error: any) {
    console.error("Fetch job error:", error)
    return NextResponse.json({ error: "Failed to fetch job details" }, { status: 500 })
  }
}
