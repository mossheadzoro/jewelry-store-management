import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const recentProducts = await prisma.productItem.findMany({
      where: { branchId: parseInt(branchId) },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        barcode: true,
        purity: true,
        ntWeight: true,
        createdAt: true,
      },
    });

    return NextResponse.json(recentProducts, { status: 200 });
  } catch (error) {
    console.error("Recent Activity Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
