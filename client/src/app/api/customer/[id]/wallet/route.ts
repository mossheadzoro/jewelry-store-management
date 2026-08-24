import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const customerId = Number(id);
    if (!customerId) return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });

    const wallet = await prisma.customerWallet.findUnique({
      where: { customerId },
      include: {
        CustomerWalletLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });

    if (!wallet) {
      return NextResponse.json({
        id: `WAL-${customerId}`,
        customerId,
        cashBalance: 0,
        metal22KBalance: 0,
        metal24KBalance: 0,
        CustomerWalletLedger: []
      });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error("Error fetching customer wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
