import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { insertLedgerEntry } from "@/lib/inventoryLedger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromBranchId, toBranchId, items, remarks } = body;

    if (!fromBranchId || !toBranchId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (fromBranchId === toBranchId) {
      return NextResponse.json({ error: "Cannot transfer to the same branch" }, { status: 400 });
    }

    const transferNo = `TRF-${Date.now().toString().slice(-8)}`;

    const transfer = await prisma.$transaction(async (tx: any) => {
      // 1. Create transfer record
      const newTransfer = await tx.inventoryTransfer.create({
        data: {
          transferNo,
          fromBranchId,
          toBranchId,
          status: "COMPLETED",
          remarks: remarks || null,
        },
      });

      // 2. Process each item
      for (const item of items) {
        const product = await tx.productItem.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product ${item.productId} not found`);

        // Create transfer item
        await tx.inventoryTransferItem.create({
          data: {
            transferId: newTransfer.id,
            productId: item.productId,
            qty: item.qty || 1,
            grossWeight: product.gsWeight,
            netWeight: product.ntWeight,
          },
        });

        // Update product branch
        await tx.productItem.update({
          where: { id: item.productId },
          data: { branchId: toBranchId },
        });

        // 📒 Ledger: TRANSFER_OUT from source branch
        await insertLedgerEntry(tx, {
          productId: item.productId,
          branchId: fromBranchId,
          txnType: "TRANSFER_OUT",
          refType: "TRANSFER",
          refId: newTransfer.id,
          qtyOut: item.qty || 1,
          grossWeightOut: product.gsWeight,
          netWeightOut: product.ntWeight,
          remarks: `Transfer to Branch ${toBranchId} - ${transferNo}`,
        });

        // 📒 Ledger: TRANSFER_IN at destination branch
        await insertLedgerEntry(tx, {
          productId: item.productId,
          branchId: toBranchId,
          txnType: "TRANSFER_IN",
          refType: "TRANSFER",
          refId: newTransfer.id,
          qtyIn: item.qty || 1,
          grossWeightIn: product.gsWeight,
          netWeightIn: product.ntWeight,
          remarks: `Transfer from Branch ${fromBranchId} - ${transferNo}`,
        });
      }

      return newTransfer;
    });

    return NextResponse.json({ success: true, transferId: transfer.id, transferNo });
  } catch (error: any) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: error.message || "Failed to create transfer" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId) {
      where.OR = [
        { fromBranchId: parseInt(branchId) },
        { toBranchId: parseInt(branchId) },
      ];
    }

    const transfers = await prisma.inventoryTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { id: true, name: true } },
        toBranch: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, productCode: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ transfers });
  } catch (error: any) {
    console.error("Transfer fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transfers" }, { status: 500 });
  }
}
