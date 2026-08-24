/**
 * Inventory Costing Engine
 *
 * Provides Weighted Average Cost (WAC) and FIFO costing methods
 * for jewelry inventory valuation.
 *
 * WAC: On every PURCHASE_IN, recalculates the weighted average cost:
 *   newAvgCost = (prevAvgCost × prevQty + newUnitCost × incomingQty) / (prevQty + incomingQty)
 *
 * FIFO: Maintains cost layers (oldest-first consumption):
 *   On PURCHASE_IN → push a new layer
 *   On SALE_OUT    → consume layers oldest-first
 *
 * The costing method is configured at the company level via CompanySettings.costingMethod.
 */

// ============================================================
// TYPES
// ============================================================

/** Supported costing methods */
export type CostingMethod = "WAC" | "FIFO";

/** Result of a WAC recalculation */
export interface WacResult {
  productId: number;
  branchId: number;
  avgCostPrice: number;
  totalQty: number;
}

/** Result of a FIFO consumption */
export interface FifoConsumptionResult {
  totalCostConsumed: number;
  layersConsumed: number;
  weightedUnitCost: number;
}

// ============================================================
// HELPERS
// ============================================================

/** Round to 2 decimal places (monetary precision) */
function round2(val: number): number {
  return parseFloat(val.toFixed(2));
}

// ============================================================
// WAC — WEIGHTED AVERAGE COST
// ============================================================

/**
 * Recalculates the weighted average cost for a product at a branch
 * after a new PURCHASE_IN entry.
 *
 * Formula: newAvg = (prevAvg × prevQty + newCost × newQty) / (prevQty + newQty)
 *
 * Upserts the result into the ProductBranchCost table.
 *
 * @param tx - Prisma transaction client
 * @param productId - Product receiving the purchase
 * @param branchId - Branch where the purchase is received
 * @param incomingQty - Quantity being purchased
 * @param incomingUnitCost - Unit cost of the incoming purchase
 */
export async function recalculateAvgCost(
  tx: any,
  productId: number,
  branchId: number,
  incomingQty: number,
  incomingUnitCost: number
): Promise<WacResult> {
  // Fetch current cost record (if exists)
  const existing = await tx.productBranchCost.findUnique({
    where: {
      productId_branchId: { productId, branchId },
    },
  });

  const prevAvg = existing?.avgCostPrice ?? 0;
  const prevQty = existing?.totalQty ?? 0;

  const totalQty = prevQty + incomingQty;

  // Avoid division by zero
  const avgCostPrice =
    totalQty > 0
      ? round2((prevAvg * prevQty + incomingUnitCost * incomingQty) / totalQty)
      : 0;

  // Upsert the cost record
  await tx.productBranchCost.upsert({
    where: {
      productId_branchId: { productId, branchId },
    },
    update: {
      avgCostPrice,
      totalQty,
    },
    create: {
      productId,
      branchId,
      avgCostPrice,
      totalQty,
    },
  });

  return { productId, branchId, avgCostPrice, totalQty };
}

/**
 * Reduces the tracked quantity in ProductBranchCost when stock goes out.
 * Does not change the avgCostPrice — WAC is only recalculated on purchases.
 *
 * @param tx - Prisma transaction client
 * @param productId - Product being sold/transferred
 * @param branchId - Branch losing the stock
 * @param outgoingQty - Quantity leaving inventory
 */
export async function decrementCostQty(
  tx: any,
  productId: number,
  branchId: number,
  outgoingQty: number
): Promise<void> {
  const existing = await tx.productBranchCost.findUnique({
    where: {
      productId_branchId: { productId, branchId },
    },
  });

  if (existing) {
    await tx.productBranchCost.update({
      where: {
        productId_branchId: { productId, branchId },
      },
      data: {
        totalQty: Math.max(0, existing.totalQty - outgoingQty),
      },
    });
  }
}

// ============================================================
// FIFO — FIRST IN FIRST OUT
// ============================================================

/**
 * Adds a new cost layer for FIFO tracking when a purchase is received.
 *
 * @param tx - Prisma transaction client
 * @param productId - Product receiving the purchase
 * @param branchId - Branch where the purchase is received
 * @param qty - Quantity in this layer
 * @param unitCost - Cost per unit in this layer
 * @param ledgerEntryId - Optional reference to the ledger entry that created this layer
 */
export async function pushFifoLayer(
  tx: any,
  productId: number,
  branchId: number,
  qty: number,
  unitCost: number,
  ledgerEntryId?: string
): Promise<void> {
  await tx.inventoryCostLayer.create({
    data: {
      productId,
      branchId,
      unitCost,
      qtyRemaining: qty,
      ledgerEntryId: ledgerEntryId ?? null,
    },
  });
}

/**
 * Consumes FIFO cost layers oldest-first when stock goes out (e.g., SALE_OUT).
 * Returns the total cost consumed and the effective weighted unit cost.
 *
 * @param tx - Prisma transaction client
 * @param productId - Product being sold
 * @param branchId - Branch losing the stock
 * @param qtyToConsume - Quantity to consume from the FIFO queue
 */
export async function consumeFifoLayers(
  tx: any,
  productId: number,
  branchId: number,
  qtyToConsume: number
): Promise<FifoConsumptionResult> {
  // Fetch available layers, oldest first
  const layers = await tx.inventoryCostLayer.findMany({
    where: {
      productId,
      branchId,
      qtyRemaining: { gt: 0 },
    },
    orderBy: { createdAt: "asc" },
  });

  let remaining = qtyToConsume;
  let totalCostConsumed = 0;
  let layersConsumed = 0;

  for (const layer of layers) {
    if (remaining <= 0) break;

    const consumeFromLayer = Math.min(remaining, layer.qtyRemaining);
    totalCostConsumed += round2(consumeFromLayer * layer.unitCost);
    remaining -= consumeFromLayer;
    layersConsumed++;

    if (consumeFromLayer >= layer.qtyRemaining) {
      // Layer fully consumed — delete it
      await tx.inventoryCostLayer.delete({
        where: { id: layer.id },
      });
    } else {
      // Partial consumption — update remaining
      await tx.inventoryCostLayer.update({
        where: { id: layer.id },
        data: {
          qtyRemaining: layer.qtyRemaining - consumeFromLayer,
        },
      });
    }
  }

  const weightedUnitCost =
    qtyToConsume > 0 ? round2(totalCostConsumed / qtyToConsume) : 0;

  return {
    totalCostConsumed: round2(totalCostConsumed),
    layersConsumed,
    weightedUnitCost,
  };
}

// ============================================================
// UNIFIED COSTING HANDLER
// ============================================================

/**
 * Fetches the company's configured costing method.
 * Falls back to "WAC" if no CompanySettings row exists.
 */
export async function getCostingMethod(tx: any): Promise<CostingMethod> {
  const settings = await tx.companySettings.findFirst();
  return (settings?.costingMethod as CostingMethod) ?? "WAC";
}

/**
 * Handles costing for a PURCHASE_IN transaction.
 * Delegates to WAC or FIFO based on company settings.
 *
 * @param tx - Prisma transaction client
 * @param productId - Product being purchased
 * @param branchId - Branch receiving the purchase
 * @param qty - Quantity purchased
 * @param unitCost - Cost per unit
 * @param ledgerEntryId - Optional reference to the ledger entry
 */
export async function handlePurchaseCosting(
  tx: any,
  productId: number,
  branchId: number,
  qty: number,
  unitCost: number,
  ledgerEntryId?: string
): Promise<void> {
  const method = await getCostingMethod(tx);

  if (method === "FIFO") {
    // FIFO: push a new cost layer
    await pushFifoLayer(tx, productId, branchId, qty, unitCost, ledgerEntryId);
  }

  // WAC is always maintained (useful for reports even when FIFO is primary)
  await recalculateAvgCost(tx, productId, branchId, qty, unitCost);
}

/**
 * Handles costing for a SALE_OUT transaction.
 * For FIFO, consumes layers oldest-first. For WAC, just decrements qty.
 *
 * @param tx - Prisma transaction client
 * @param productId - Product being sold
 * @param branchId - Branch losing the stock
 * @param qty - Quantity sold
 * @returns The unit cost used for this sale (FIFO weighted or WAC average)
 */
export async function handleSaleCosting(
  tx: any,
  productId: number,
  branchId: number,
  qty: number
): Promise<{ unitCost: number }> {
  const method = await getCostingMethod(tx);

  let unitCost = 0;

  if (method === "FIFO") {
    const result = await consumeFifoLayers(tx, productId, branchId, qty);
    unitCost = result.weightedUnitCost;
  } else {
    // WAC: use the current average cost
    const costRecord = await tx.productBranchCost.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    unitCost = costRecord?.avgCostPrice ?? 0;
  }

  // Always decrement the WAC qty tracker
  await decrementCostQty(tx, productId, branchId, qty);

  return { unitCost };
}
