import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json({ canClose: false })
  }

  const totalItems = await prisma.metalExchangeItem.count({
    where: { sessionId },
  })

  const pendingItems = await prisma.metalExchangeItem.count({
    where: {
      sessionId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  })

  return NextResponse.json({
    canClose: totalItems > 0 && pendingItems === 0,
  })
}
