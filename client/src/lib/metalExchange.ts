
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function getActiveMetalExchangeSession(
  branchId: number,
  userId: number
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1️⃣ Re-check inside transaction
      const existing = await tx.metalExchangeSession.findFirst({
        where: {
          branchId,
          isClosed: false,
        },
      })

      if (existing) return existing

      // 2️⃣ Generate session number
      const today = new Date()
      const year = today.getFullYear()

      const count = await tx.metalExchangeSession.count({
        where: {
          branchId,
          createdAt: {
            gte: new Date(`${year}-01-01`),
          },
        },
      })

      const sessionNumber = `MX-${year}-${String(count + 1).padStart(4, "0")}`

      // 3️⃣ Create new session
      return await tx.metalExchangeSession.create({
        data: {
          sessionNumber,
          branchId,
          createdById: userId,
        },
      })
    })
  } catch (error: any) {
    // 4️⃣ SAFETY NET: handle race condition
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Another request already created it → just return it
      return prisma.metalExchangeSession.findFirst({
        where: {
          branchId,
          isClosed: false,
        },
      })
    }

    throw error
  }
}
