import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { insertLedgerEntry } from "@/lib/inventoryLedger";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Find all reservations for this draft
      const reservations = await tx.inventoryLedger.findMany({
        where: {
          refType: "SYSTEM",
          refId: draftId,
          txnType: "RESERVE_OUT",
        },
      });

      for (const res of reservations) {
        // Release product quantities
        await tx.productItem.update({
          where: { id: res.productId },
          data: {
            quantity: { increment: res.qtyOut ?? 1 },
            reservedQty: { decrement: res.qtyOut ?? 1 },
          },
        });

        // Write RESERVE_IN ledger entry to balance it
        await insertLedgerEntry(tx, {
          productId: res.productId,
          branchId: res.branchId,
          txnType: "RESERVE_IN",
          refType: "SYSTEM",
          refId: draftId,
          qtyIn: res.qtyOut ?? 1,
          netWeightIn: res.netWeightOut,
          grossWeightIn: res.grossWeightOut,
          remarks: "Manual cancel of draft",
        });
      }

      // Delete the draft
      await tx.draftInvoice.delete({ where: { id: draftId } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting draft:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    const draft = await prisma.draftInvoice.findUnique({
      where: { id: draftId },
      include: {
        customer: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
