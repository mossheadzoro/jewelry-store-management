// src/app/api/returns/[id]/route.ts
// Get Single Return / Exchange Transaction Details

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const resolvedParams = await params;
    const idOrNumber = resolvedParams.id;

    const transaction = await prisma.returnExchangeTransaction.findFirst({
      where: {
        OR: [
          { id: idOrNumber },
          { transactionNumber: idOrNumber },
        ],
      },
      include: {
        customer: true,
        branch: { include: { settings: true } },
        originalInvoice: {
          include: {
            items: { include: { product: true } },
            payments: true,
          },
        },
        replacementInvoice: {
          include: {
            items: { include: { product: true } },
            payments: true,
          },
        },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        processedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            originalInvoiceItem: { include: { product: true } },
            originalProductItem: true,
            inspection: true,
            photos: true,
          },
        },
        taxDocuments: true,
        refundTransactions: true,
        oldGoldSettlements: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching return transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch return details." },
      { status: 500 }
    );
  }
}
