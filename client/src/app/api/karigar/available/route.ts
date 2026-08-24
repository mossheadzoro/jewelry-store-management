import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"


export async function GET() {
  try {
    const karigars = await prisma.karigar.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        department: true,
        phoneNumber: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(karigars)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch karigars" },
      { status: 500 }
    )
  }
}
