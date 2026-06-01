import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Failed to list users:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
