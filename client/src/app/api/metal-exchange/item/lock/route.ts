import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { itemId } = await req.json()

  const item = await prisma.metalExchangeItem.update({
    where: { id: itemId },
    data: { isLocked: true },
  })

  return NextResponse.json(item)
}
