import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAudit } from "../../audit/log"

export async function POST(req: Request) {
  const body = await req.json()

  const {
    sessionId,
    customerId,
    metalType,
    description,
    weightBefore,
    notes,
    userId,
  } = body

  /* ---------------- VALIDATIONS ---------------- */

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session required" },
      { status: 400 }
    )
  }

  if (!customerId) {
    return NextResponse.json(
      { error: "Customer required" },
      { status: 400 }
    )
  }

  if (!weightBefore || weightBefore <= 0) {
    return NextResponse.json(
      { error: "Invalid weight" },
      { status: 400 }
    )
  }

  /* ---------------- SESSION SAFETY ---------------- */

  const session = await prisma.metalExchangeSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 404 }
    )
  }

  if (session.isClosed) {
    return NextResponse.json(
      { error: "Session already closed" },
      { status: 403 }
    )
  }

  /* ---------------- CREATE ITEM ---------------- */

  const item = await prisma.metalExchangeItem.create({
    data: {
      sessionId,
      customerId,            // ✅ FIX (MOST IMPORTANT)
      metalType,
      description,
      weightBefore,
      notes,
    },
  })

  /* ---------------- UPDATE SESSION TOTALS ---------------- */

  await prisma.metalExchangeSession.update({
    where: { id: sessionId },
    data: {
      totalItems: { increment: 1 },
      totalWeightBefore: { increment: weightBefore },
    },
  })

  /* ---------------- AUDIT ---------------- */

  await logAudit({
    sessionId,
    action: "ADDED_ITEM",
    performedById: userId,
    metadata: {
      itemId: item.id,
      customerId,
      metalType,
      weightBefore,
    },
  })

  return NextResponse.json(item)
}
