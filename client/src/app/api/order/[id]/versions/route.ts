import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const versions = await prisma.orderVersion.findMany({
      where: { orderId: params.id },
      orderBy: { versionNumber: "desc" },
    });
    return NextResponse.json(versions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    
    // Determine the next version number
    const lastVersion = await prisma.orderVersion.findFirst({
      where: { orderId: params.id },
      orderBy: { versionNumber: "desc" }
    });
    
    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const newVersion = await prisma.orderVersion.create({
      data: {
        orderId: params.id,
        versionNumber,
        snapshot: data.snapshot,
      }
    });

    return NextResponse.json(newVersion);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}
