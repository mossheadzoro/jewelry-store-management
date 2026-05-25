/**
 * Inventory Ledger Helper
 * 
 * Reusable function to insert a ledger entry with running balance snapshots.
 * Import this into any API route that moves inventory.
 */

interface LedgerEntryParams {
  productId: number;
  branchId: number;
  txnType: string;
  refType: string;
  refId?: string;
  qtyIn?: number;
  qtyOut?: number;
  grossWeightIn?: number;
  grossWeightOut?: number;
  netWeightIn?: number;
  netWeightOut?: number;
  unitCost?: number;
  totalValue?: number;
  remarks?: string;
  createdById?: number;
}

/**
 * Inserts a ledger entry within an existing Prisma transaction.
 * Automatically calculates running balances based on the last entry for this product+branch.
 * 
 * @param tx - Prisma transaction client (from prisma.$transaction)
 * @param params - Ledger entry parameters
 */
export async function insertLedgerEntry(tx: any, params: LedgerEntryParams) {
  const {
    productId,
    branchId,
    txnType,
    refType,
    refId,
    qtyIn = 0,
    qtyOut = 0,
    grossWeightIn = 0,
    grossWeightOut = 0,
    netWeightIn = 0,
    netWeightOut = 0,
    unitCost,
    totalValue,
    remarks,
    createdById,
  } = params;

  // Fetch the latest ledger entry for this product+branch to get running balance
  const lastEntry = await tx.inventoryLedger.findFirst({
    where: { productId, branchId },
    orderBy: { createdAt: "desc" },
    select: {
      balanceQty: true,
      balanceGrossWt: true,
      balanceNetWt: true,
    },
  });

  const prevQty = lastEntry?.balanceQty ?? 0;
  const prevGrossWt = lastEntry?.balanceGrossWt ?? 0;
  const prevNetWt = lastEntry?.balanceNetWt ?? 0;

  // Calculate new running balance
  const balanceQty = prevQty + qtyIn - qtyOut;
  const balanceGrossWt = parseFloat((prevGrossWt + grossWeightIn - grossWeightOut).toFixed(3));
  const balanceNetWt = parseFloat((prevNetWt + netWeightIn - netWeightOut).toFixed(3));

  // Create ledger row
  const entry = await tx.inventoryLedger.create({
    data: {
      productId,
      branchId,
      txnType,
      refType,
      refId: refId || null,
      qtyIn,
      qtyOut,
      grossWeightIn,
      grossWeightOut,
      netWeightIn,
      netWeightOut,
      balanceQty,
      balanceGrossWt,
      balanceNetWt,
      unitCost: unitCost || null,
      totalValue: totalValue || null,
      remarks: remarks || null,
      createdById: createdById || null,
    },
  });

  return entry;
}
