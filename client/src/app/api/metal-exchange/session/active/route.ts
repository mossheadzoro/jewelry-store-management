import { NextResponse } from "next/server"
import { getActiveMetalExchangeSession } from "@/lib/metalExchange"

export async function POST(req: Request) {
  const { branchId, userId } = await req.json()

  if (!branchId || !userId) {
    return NextResponse.json(
      { error: "branchId and userId required" },
      { status: 400 }
    )
  }

  const session = await getActiveMetalExchangeSession(branchId, userId)

  return NextResponse.json(session)
}
