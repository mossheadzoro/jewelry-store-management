
import { NextResponse } from "next/server"
import { logAudit } from "../../audit/log"
import { prisma } from "../../../../../../libs/prisma"

export async function POST(req: Request) {
  const body = await req.json()

  const session = await prisma.metalExchangeSession.create({
    data: {
      sessionNumber: body.sessionNumber,
      branchId: body.branchId,
      customerId: body.customerId ?? null,
      createdById: body.userId,
      remarks: body.remarks,
    },
  })

  await logAudit({
    sessionId: session.id,
    action: "CREATED",
    performedById: body.userId,
  })

  return NextResponse.json(session)
}
