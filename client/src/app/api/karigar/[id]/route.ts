import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";



export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log("IDid", id);

    const karigar = await prisma.karigar.findUnique({
  where: { id },
  include: {
    jobs: {
      orderBy: { createdAt: "desc" },
      include: { jewelleryItems: true },
    },
    KarigarHeldMetal: true,
  },
})

console.log("karigarkarigar", karigar);


    if (!karigar) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ karigar });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch karigar" },
      { status: 500 }
    );
  }
}
