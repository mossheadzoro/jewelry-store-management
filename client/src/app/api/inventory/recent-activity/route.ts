import { NextResponse } from "next/server";
import { prisma } from "@libs/prisma";
import { requireAuth } from "@/lib/authGuard";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, { module: "INVENTORY", requireBranch: true });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const recentLedgerEntries = await prisma.inventoryLedger.findMany({
      where: { branchId: auth.branchId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        product: {
          select: {
            name: true,
            barcode: true,
            purity: true,
          }
        }
      }
    });

    return NextResponse.json(recentLedgerEntries, { status: 200 });
  } catch (error) {
    console.error("Recent Activity Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
