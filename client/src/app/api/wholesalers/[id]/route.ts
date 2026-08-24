import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const wholesaler = await prisma.wholesaler.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: { include: { category: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            cashItems: true,
            ledgerEntries: true,
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            transaction: {
              include: { cashItems: true },
            },
          },
        },
      },
    });

    if (!wholesaler) {
      return NextResponse.json(
        { error: "Wholesaler not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(wholesaler);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch wholesaler" },
      { status: 500 }
    );
  }
}
