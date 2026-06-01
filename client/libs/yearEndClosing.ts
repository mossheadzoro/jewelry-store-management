/**
 * Year-End Closing Snapshot
 *
 * In the Indian jewelry industry, the financial year runs from April 1 to March 31.
 * At year-end, businesses take a snapshot of all inventory balances for:
 *  - Tax assessment and compliance (GST, Income Tax)
 *  - Stock valuation for balance sheet
 *  - Audit trail integrity
 *
 * This module inserts CLOSING_SNAPSHOT ledger entries for every active product
 * at every branch. These are read-only marker entries:
 *  - qtyIn / qtyOut / weightIn / weightOut are all 0
 *  - balanceQty / balanceNetWt / balanceFineWt reflect the state at year-end
 *  - isLocked = true immediately on insert
 *  - txnType = CLOSING_SNAPSHOT
 *  - refType = SYSTEM
 */

// ============================================================
// TYPES
// ============================================================

/** Result of a year-end closing run */
export interface YearEndClosingResult {
  /** Total number of snapshot entries created */
  snapshots: number;
  /** Financial year string (e.g. "2024-25") */
  financialYear: string;
  /** Branches processed */
  branchIds: number[];
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Inserts a CLOSING_SNAPSHOT ledger entry for every active product at every branch.
 * These entries record balances as of 31st March (India FY) with txnType = CLOSING_SNAPSHOT.
 *
 * Idempotent: If a CLOSING_SNAPSHOT already exists for the same product+branch
 * in the same financial year, it is skipped.
 *
 * @param tx - Prisma transaction client (from prisma.$transaction)
 * @param financialYear - Financial year string, e.g. "2024-25"
 * @param branchIds - If omitted, runs for all branches
 * @returns Count of snapshot entries created
 */
export async function runYearEndClosing(
  tx: any,
  financialYear: string,
  branchIds?: number[]
): Promise<YearEndClosingResult> {
  // Parse financial year to determine the closing date
  // "2024-25" means FY ending March 31, 2025
  const parts = financialYear.split("-");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid financial year format: "${financialYear}". Expected format: "YYYY-YY" (e.g., "2024-25")`
    );
  }

  const startYear = parseInt(parts[0]);
  const endYearShort = parseInt(parts[1]);
  const endYear =
    endYearShort < 100
      ? Math.floor(startYear / 100) * 100 + endYearShort
      : endYearShort;

  // Closing date: March 31st of the ending year, end of day
  const closingDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // Month is 0-indexed, 2 = March
  const closingRemarks = `Year-end closing snapshot for FY ${financialYear}`;

  // Determine which branches to process
  let targetBranchIds: number[];
  if (branchIds && branchIds.length > 0) {
    targetBranchIds = branchIds;
  } else {
    const allBranches = await tx.branch.findMany({ select: { id: true } });
    targetBranchIds = allBranches.map((b: { id: number }) => b.id);
  }

  let snapshotCount = 0;

  for (const branchId of targetBranchIds) {
    // Find all products that have at least one ledger entry at this branch
    const productIds: { productId: number }[] = await tx.$queryRaw`
      SELECT DISTINCT "productId"
      FROM "InventoryLedger"
      WHERE "branchId" = ${branchId}
    `;

    for (const { productId } of productIds) {
      // Check if a snapshot already exists for this FY
      const existingSnapshot = await tx.inventoryLedger.findFirst({
        where: {
          productId,
          branchId,
          txnType: "CLOSING_SNAPSHOT",
          remarks: { contains: financialYear },
        },
      });

      if (existingSnapshot) {
        continue; // Already snapshotted — skip
      }

      // Get the latest balance for this product+branch
      const latestEntry = await tx.inventoryLedger.findFirst({
        where: { productId, branchId },
        orderBy: [{ createdAt: "desc" }, { sequenceNo: "desc" }],
        select: {
          balanceQty: true,
          balanceGrossWt: true,
          balanceNetWt: true,
          balanceFineWt: true,
          sequenceNo: true,
        },
      });

      if (!latestEntry) {
        continue; // No entries at all — nothing to snapshot
      }

      // Get the next sequence number
      const nextSeqNo = (latestEntry.sequenceNo ?? 0) + 1;

      // Insert the CLOSING_SNAPSHOT entry
      await tx.inventoryLedger.create({
        data: {
          productId,
          branchId,
          txnType: "CLOSING_SNAPSHOT",
          refType: "SYSTEM",
          refId: `FY-${financialYear}`,

          // Zero movement — this is a marker entry
          qtyIn: 0,
          qtyOut: 0,
          grossWeightIn: 0,
          grossWeightOut: 0,
          netWeightIn: 0,
          netWeightOut: 0,

          // Carry forward the current balances
          balanceQty: latestEntry.balanceQty,
          balanceGrossWt: latestEntry.balanceGrossWt,
          balanceNetWt: latestEntry.balanceNetWt,
          balanceFineWt: latestEntry.balanceFineWt,

          // Audit fields
          sequenceNo: nextSeqNo,
          isLocked: true, // Immediately locked — year-end entries are read-only
          remarks: closingRemarks,
          createdAt: closingDate,
        },
      });

      snapshotCount++;
    }
  }

  return {
    snapshots: snapshotCount,
    financialYear,
    branchIds: targetBranchIds,
  };
}
