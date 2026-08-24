import { NextResponse } from "next/server"

import { logAudit } from "../../audit/log"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { sessionId, authorizedBy } = await req.json()

  // 1️⃣ Fetch session
  const session = await prisma.metalExchangeSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    )
  }

  if (session.isClosed) {
    return NextResponse.json(
      { error: "Session already closed" },
      { status: 400 }
    )
  }

  // 2️⃣ HARD CHECK — all items must be TONCHED
  const openItems = await prisma.metalExchangeItem.count({
    where: {
      sessionId,
      status: { not: "TONCHED" },
    },
  })

  if (openItems > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot close session. All items must be TONCHED before closing.",
      },
      { status: 400 }
    )
  }

  // 3️⃣ Close session (OLD FIELD)
  const closedSession = await prisma.metalExchangeSession.update({
    where: { id: sessionId },
    data: {
      isClosed: true,
      closedAt: new Date(),
      authorizedBy, // ✅ OLD COLUMN
    },
  })

  // 4️⃣ Audit log
  await logAudit({
    sessionId,
    action: "CLOSED_DAY",
    performedById: authorizedBy,
    metadata: {
      fineGold: closedSession.fineGold,
      fineSilver: closedSession.fineSilver,
    },
  })

  return NextResponse.json(closedSession)
}
