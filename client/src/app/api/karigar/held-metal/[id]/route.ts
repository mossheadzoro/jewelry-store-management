import { NextResponse } from "next/server"
import { prisma } from "../../../../../../libs/prisma"



export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const data = await prisma.karigarHeldMetal.findMany({
    where: { karigarId: id },
    orderBy: { purity: "asc" },
  })

  return NextResponse.json(data)
}

