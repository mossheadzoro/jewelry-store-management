import { prisma } from "../../../../../libs/prisma"


export async function logAudit({
  sessionId,
  action,
  performedById,
  metadata,
}: {
  sessionId: string
  action: string
  performedById?: number
  metadata?: any
}) {
  await prisma.metalExchangeAudit.create({
    data: {
      sessionId,
      action,
      performedById,
      metadata,
    },
  })
}
