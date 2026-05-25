// /app/api/stock/update/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json();

    if (!id || !action)
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    let updateData = {};

    switch (action) {
      case "reserve":
        updateData = { reservedQty: { increment: 1 } };
        break;
      case "unreserve":
        updateData = { reservedQty: { decrement: 1 } };
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const updated = await prisma.productItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Stock update error:", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
