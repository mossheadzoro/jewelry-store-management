// src/lib/services/returns/ReturnInventoryService.ts
// Inventory Ledger Reversal & Quarantine Routing Engine

import { insertLedgerEntry } from "@/lib/inventoryLedger";

export interface ProcessInventoryReturnParams {
  productId: number;
  branchId: number;
  transactionNumber: string;
  grossWeight: number;
  netWeight: number;
  purityPercent?: number;
  huidNumber?: string | null;
  metalRate?: number;
  unitCost?: number;
  totalValue?: number;
  createdById?: number;
  inventoryRoute?: "RETURNED_HOLD" | "AVAILABLE" | "REPAIR" | "MELT" | "QUARANTINE";
}

export class ReturnInventoryService {
  /**
   * Records a SALE_RETURN_IN ledger movement inside an existing Prisma transaction.
   */
  public static async processReturnItem(tx: any, params: ProcessInventoryReturnParams) {
    const {
      productId,
      branchId,
      transactionNumber,
      grossWeight,
      netWeight,
      purityPercent = 91.6,
      huidNumber,
      metalRate,
      unitCost,
      totalValue,
      createdById,
      inventoryRoute = "RETURNED_HOLD",
    } = params;

    // 1. Insert InventoryLedger entry (v2 with fine weight and row-locking)
    const ledgerEntry = await insertLedgerEntry(
      tx,
      {
        productId,
        branchId,
        txnType: "SALE_RETURN_IN",
        refType: "INVOICE",
        refId: transactionNumber,
        qtyIn: 1,
        qtyOut: 0,
        grossWeightIn: grossWeight,
        grossWeightOut: 0,
        netWeightIn: netWeight,
        netWeightOut: 0,
        unitCost: unitCost || (metalRate ? metalRate * netWeight : undefined),
        totalValue: totalValue,
        remarks: `Customer return via ${transactionNumber} (Route: ${inventoryRoute})`,
        createdById,
      },
      {
        purityPercent,
        karatage: purityPercent >= 91.6 ? 22 : purityPercent >= 75 ? 18 : 14,
        metalRateAtEntry: metalRate,
        huidNumber: huidNumber || undefined,
      }
    );

    // 2. Adjust ProductItem physical quantity if routed directly to AVAILABLE
    // Note: gsWeight and ntWeight are physical unit piece specifications and must never be incremented
    if (inventoryRoute === "AVAILABLE") {
      await tx.productItem.update({
        where: { id: productId },
        data: {
          quantity: { increment: 1 },
        },
      });
    }

    return ledgerEntry;
  }
}
