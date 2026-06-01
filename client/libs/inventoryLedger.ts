/**
 * Inventory Ledger Helper — v2
 *
 * Reusable function to insert a ledger entry with running balance snapshots.
 * Import this into any API route that moves inventory.
 *
 * v2 additions:
 *  - Fine weight (pure metal) tracking via purityPercent
 *  - Sequence numbering per product+branch
 *  - Row-level locking (FOR UPDATE) for concurrency safety
 *  - Negative balance guard with InsufficientStockError
 *  - Optional jewelry-specific metadata (karatage, stones, HUID, etc.)
 */


import { handlePurchaseCosting, handleSaleCosting } from "./inventoryCosting";
import { assertHuidCompliance, getHuidSettings } from "./huidValidation";

// ============================================================
// TYPES
// ============================================================

/**
 * Original ledger entry parameters — fully backward-compatible.
 * All existing call-sites pass this shape and will continue to work.
 */
export interface LedgerEntryParams {
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
 * Jewelry-specific optional parameters for enhanced ledger entries.
 * None of these are required — existing call-sites omit this entirely.
 */
export interface JewelryLedgerParams {
  /** Karatage of the metal (e.g. 22, 18, 14, 9) */
  karatage?: number;
  /** Purity as a percentage (e.g. 91.6 for 22K, 75.0 for 18K) */
  purityPercent?: number;
  /** Metal price per unit at transaction time */
  metalRateAtEntry?: number;
  /** Unit for the metal rate */
  metalRateUnit?: "PER_GRAM" | "PER_TOLA" | "PER_OZ";
  /** Cost of metal component only */
  metalCost?: number;
  /** Cost of stones */
  stoneCost?: number;
  /** Labour / making charges */
  makingCharges?: number;
  /** Hallmarking, certification, etc. */
  otherCharges?: number;
  /** Number of stones */
  stoneQty?: number;
  /** Stone weight in carats */
  stoneWeightCt?: number;
  /** Type of stone (e.g. "DIAMOND", "RUBY", "EMERALD") */
  stoneType?: string;
  /** BIS Hallmark Unique ID (mandatory India 2023+) */
  huidNumber?: string;
  /** Purchase lot / batch reference */
  batchLotNo?: string;
  /** BIS hallmark certificate number */
  hallmarkCertNo?: string;
  /** Expected wastage weight for this transaction */
  allowedWastageWt?: number;
  /** Actual wastage weight recorded on karigar return */
  actualWastageWt?: number;
}

// ============================================================
// ERRORS
// ============================================================

/**
 * Thrown when an inventory operation would result in negative stock
 * and the product does not allow negative stock levels.
 */
export class InsufficientStockError extends Error {
  public readonly productId: number;
  public readonly branchId: number;
  public readonly requested: { qty?: number; netWt?: number };
  public readonly available: { qty: number; netWt: number };

  constructor(details: {
    productId: number;
    branchId: number;
    requested: { qty?: number; netWt?: number };
    available: { qty: number; netWt: number };
  }) {
    const msg =
      `Insufficient stock for product ${details.productId} at branch ${details.branchId}. ` +
      `Requested: qty=${details.requested.qty ?? 0}, netWt=${details.requested.netWt ?? 0}g. ` +
      `Available: qty=${details.available.qty}, netWt=${details.available.netWt}g.`;
    super(msg);
    this.name = "InsufficientStockError";
    this.productId = details.productId;
    this.branchId = details.branchId;
    this.requested = details.requested;
    this.available = details.available;
  }
}

// ============================================================
// HELPERS
// ============================================================

/** Round to 3 decimal places (weight precision standard in jewelry) */
function round3(val: number): number {
  return parseFloat(val.toFixed(3));
}

/** Round to 2 decimal places (monetary precision) */
function round2(val: number): number {
  return parseFloat(val.toFixed(2));
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Inserts a ledger entry within an existing Prisma transaction.
 * Automatically calculates running balances based on the last entry for this product+branch.
 *
 * v2: Now supports an optional third parameter for jewelry-specific metadata.
 * All existing call-sites that pass only (tx, params) continue to work identically.
 *
 * @param tx - Prisma transaction client (from prisma.$transaction)
 * @param params - Core ledger entry parameters (unchanged from v1)
 * @param jewelryParams - Optional jewelry-specific parameters (karatage, purity, stones, HUID, etc.)
 */
export async function insertLedgerEntry(
  tx: any,
  params: LedgerEntryParams,
  jewelryParams?: JewelryLedgerParams
) {
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

  // ── Row-level lock: fetch the latest entry with FOR UPDATE ──
  // This prevents concurrent transactions from reading stale balances.
  const prevEntries: any[] = await tx.$queryRaw`
    SELECT "balanceQty", "balanceGrossWt", "balanceNetWt", "balanceFineWt", "sequenceNo"
    FROM "InventoryLedger"
    WHERE "productId" = ${productId}
      AND "branchId"  = ${branchId}
    ORDER BY "createdAt" DESC, "sequenceNo" DESC NULLS LAST
    LIMIT 1
    FOR UPDATE
  `;

  const lastEntry = prevEntries.length > 0 ? prevEntries[0] : null;

  const prevQty = Number(lastEntry?.balanceQty ?? 0);
  const prevGrossWt = Number(lastEntry?.balanceGrossWt ?? 0);
  const prevNetWt = Number(lastEntry?.balanceNetWt ?? 0);
  const prevFineWt = Number(lastEntry?.balanceFineWt ?? 0);
  const prevSeqNo = Number(lastEntry?.sequenceNo ?? 0);

  // ── Existing balance calculations (UNCHANGED) ──
  const balanceQty = prevQty + qtyIn - qtyOut;
  const balanceGrossWt = round3(prevGrossWt + grossWeightIn - grossWeightOut);
  const balanceNetWt = round3(prevNetWt + netWeightIn - netWeightOut);

  // ── NEW: Fine weight balance (only computed if purity is provided) ──
  const fineWeightIn =
    jewelryParams?.purityPercent != null
      ? round3(netWeightIn * (jewelryParams.purityPercent / 100))
      : null;
  const fineWeightOut =
    jewelryParams?.purityPercent != null
      ? round3(netWeightOut * (jewelryParams.purityPercent / 100))
      : null;
  const balanceFineWt = round3(
    prevFineWt + (fineWeightIn ?? 0) - (fineWeightOut ?? 0)
  );

  // ── NEW: Sequence number (monotonically increasing per product+branch) ──
  const sequenceNo = prevSeqNo + 1;

  // ── NEW: Negative balance guard ──
  if (balanceQty < 0 || balanceNetWt < 0) {
    const product = await tx.productItem.findUnique({
      where: { id: productId },
      select: { allowNegativeStock: true },
    });
    if (!product?.allowNegativeStock) {
      throw new InsufficientStockError({
        productId,
        branchId,
        requested: { qty: qtyOut, netWt: netWeightOut },
        available: { qty: prevQty, netWt: prevNetWt },
      });
    }
  }

  // ── HUID compliance check (before creating the entry) ──
  // Only runs for SALE_OUT and TRANSFER_OUT when company setting is enabled
  try {
    const huidSettings = await getHuidSettings(tx);
    const effectiveHuid = jewelryParams?.huidNumber ?? null;
    assertHuidCompliance(txnType, effectiveHuid, huidSettings);
  } catch (err) {
    // Re-throw HUID compliance errors (they're user-facing)
    if (err instanceof Error && err.name === "HuidComplianceError") {
      throw err;
    }
    // Silently ignore other errors (e.g., CompanySettings table doesn't exist yet)
  }

  // ── Create ledger row ──
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

      // v2 fields — all nullable, safe for existing call-sites
      balanceFineWt,
      fineWeightIn,
      fineWeightOut,
      sequenceNo,

      // Jewelry metadata (from optional 3rd param)
      karatage: jewelryParams?.karatage ?? null,
      purityPercent: jewelryParams?.purityPercent ?? null,
      metalRateAtEntry: jewelryParams?.metalRateAtEntry ?? null,
      metalRateUnit: jewelryParams?.metalRateUnit ?? null,
      metalCost: jewelryParams?.metalCost ?? null,
      stoneCost: jewelryParams?.stoneCost ?? null,
      makingCharges: jewelryParams?.makingCharges ?? null,
      otherCharges: jewelryParams?.otherCharges ?? null,
      stoneQty: jewelryParams?.stoneQty ?? null,
      stoneWeightCt: jewelryParams?.stoneWeightCt ?? null,
      stoneType: jewelryParams?.stoneType ?? null,
      huidNumber: jewelryParams?.huidNumber ?? null,
      batchLotNo: jewelryParams?.batchLotNo ?? null,
      hallmarkCertNo: jewelryParams?.hallmarkCertNo ?? null,
      allowedWastageWt: jewelryParams?.allowedWastageWt ?? null,
      actualWastageWt: jewelryParams?.actualWastageWt ?? null,
    },
  });

  // ── Post-create hooks: Costing ──
  try {
    if (txnType === "PURCHASE_IN" && unitCost != null && qtyIn > 0) {
      await handlePurchaseCosting(
        tx,
        productId,
        branchId,
        qtyIn,
        unitCost,
        entry.id
      );
    } else if (txnType === "SALE_OUT" && qtyOut > 0) {
      await handleSaleCosting(tx, productId, branchId, qtyOut);
    }
  } catch (costingErr) {
    // Log but don't fail the ledger entry for costing errors
    console.warn("Costing hook warning:", costingErr);
  }

  return entry;
}

// ============================================================
// RECALCULATE RUNNING BALANCES
// ============================================================

/**
 * Recalculates ALL running balance snapshots for a product at a branch,
 * from the very first entry (or from a given date) forward.
 *
 * Use after manual DB corrections, data migrations, or when fine weight
 * needs to be back-filled on older entries.
 *
 * MUST be called inside a transaction with FOR UPDATE lock on affected rows.
 *
 * @param tx - Prisma transaction client
 * @param productId - The product to recalculate for
 * @param branchId - The branch to recalculate for
 * @param fromDate - Optional start date; if omitted, recalculates from the very beginning
 * @returns Count of recalculated entries
 */
export async function recalculateRunningBalances(
  tx: any,
  productId: number,
  branchId: number,
  fromDate?: Date
): Promise<{ recalculated: number }> {
  // Lock all affected rows to prevent concurrent modifications
  await tx.$queryRaw`
    SELECT id FROM "InventoryLedger"
    WHERE "productId" = ${productId}
      AND "branchId"  = ${branchId}
    ORDER BY "createdAt" ASC
    FOR UPDATE
  `;

  // Build the where clause
  const where: any = { productId, branchId };
  if (fromDate) {
    where.createdAt = { gte: fromDate };
  }

  // If recalculating from a specific date, we need the balance right before that date
  let prevQty = 0;
  let prevGrossWt = 0;
  let prevNetWt = 0;
  let prevFineWt = 0;
  let prevSeqNo = 0;

  if (fromDate) {
    const prior = await tx.inventoryLedger.findFirst({
      where: {
        productId,
        branchId,
        createdAt: { lt: fromDate },
      },
      orderBy: [{ createdAt: "desc" }, { sequenceNo: "desc" }],
      select: {
        balanceQty: true,
        balanceGrossWt: true,
        balanceNetWt: true,
        balanceFineWt: true,
        sequenceNo: true,
      },
    });
    if (prior) {
      prevQty = prior.balanceQty;
      prevGrossWt = prior.balanceGrossWt;
      prevNetWt = prior.balanceNetWt;
      prevFineWt = prior.balanceFineWt;
      prevSeqNo = prior.sequenceNo ?? 0;
    }
  }

  // Fetch all entries to recalculate, in chronological order
  const entries = await tx.inventoryLedger.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { sequenceNo: "asc" }],
  });

  let recalculated = 0;

  for (const entry of entries) {
    prevSeqNo += 1;
    const newBalanceQty = prevQty + (entry.qtyIn ?? 0) - (entry.qtyOut ?? 0);
    const newBalanceGrossWt = round3(
      prevGrossWt + (entry.grossWeightIn ?? 0) - (entry.grossWeightOut ?? 0)
    );
    const newBalanceNetWt = round3(
      prevNetWt + (entry.netWeightIn ?? 0) - (entry.netWeightOut ?? 0)
    );

    // Recalculate fine weight if purity is available on this entry
    let newFineWeightIn = entry.fineWeightIn;
    let newFineWeightOut = entry.fineWeightOut;
    if (entry.purityPercent != null) {
      newFineWeightIn = round3(
        (entry.netWeightIn ?? 0) * (entry.purityPercent / 100)
      );
      newFineWeightOut = round3(
        (entry.netWeightOut ?? 0) * (entry.purityPercent / 100)
      );
    }
    const newBalanceFineWt = round3(
      prevFineWt + (newFineWeightIn ?? 0) - (newFineWeightOut ?? 0)
    );

    // Only update if something actually changed
    const needsUpdate =
      entry.balanceQty !== newBalanceQty ||
      entry.balanceGrossWt !== newBalanceGrossWt ||
      entry.balanceNetWt !== newBalanceNetWt ||
      entry.balanceFineWt !== newBalanceFineWt ||
      entry.sequenceNo !== prevSeqNo ||
      entry.fineWeightIn !== newFineWeightIn ||
      entry.fineWeightOut !== newFineWeightOut;

    if (needsUpdate) {
      await tx.inventoryLedger.update({
        where: { id: entry.id },
        data: {
          balanceQty: newBalanceQty,
          balanceGrossWt: newBalanceGrossWt,
          balanceNetWt: newBalanceNetWt,
          balanceFineWt: newBalanceFineWt,
          fineWeightIn: newFineWeightIn,
          fineWeightOut: newFineWeightOut,
          sequenceNo: prevSeqNo,
        },
      });
      recalculated++;
    }

    // Carry forward for the next iteration
    prevQty = newBalanceQty;
    prevGrossWt = newBalanceGrossWt;
    prevNetWt = newBalanceNetWt;
    prevFineWt = newBalanceFineWt;
  }

  return { recalculated };
}
