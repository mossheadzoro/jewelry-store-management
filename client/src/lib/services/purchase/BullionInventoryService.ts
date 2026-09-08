// client/src/lib/services/purchase/BullionInventoryService.ts
// Bullion & Free Stock Inventory Service with Multi-Layer Transaction Safeguards

import { Prisma, MetalCategory } from "@/lib/prisma";
import { insertLedgerEntry } from "@/lib/inventoryLedger";

export interface BullionIntakeParams {
  branchId: number;
  receiptId: string;
  receiptNumber: string;
  metalCategory: MetalCategory;
  purityPercent: number;
  actualGrossWeight: number;
  actualFineWeight: number;
  supplierName: string;
  receivedById: number;
  lotBatchNo?: string;
  testCertificateNo?: string;
  karatage: number;
}

export class BullionInventoryService {
  /**
   * Resolves appropriate Category and SubCategory for raw metal / bullion.
   * Ensures 24K gold is strictly filed under "24k FREE GOLD STOCK".
   */
  public static async ensureBullionSubCategory(
    tx: Prisma.TransactionClient,
    branchId: number,
    metalCategory: MetalCategory
  ) {
    let categoryName = "Gold";
    let subCategoryName = "24k FREE GOLD STOCK";

    if (metalCategory === "GOLD_24K") {
      categoryName = "Gold";
      subCategoryName = "24k FREE GOLD STOCK";
    } else if (metalCategory === "GOLD_22K") {
      categoryName = "Gold";
      subCategoryName = "22k FREE GOLD STOCK";
    } else if (metalCategory === "GOLD_18K") {
      categoryName = "Gold";
      subCategoryName = "18k FREE GOLD STOCK";
    } else if (metalCategory === "GOLD_14K") {
      categoryName = "Gold";
      subCategoryName = "14k FREE GOLD STOCK";
    } else if (metalCategory === "SILVER_999") {
      categoryName = "Silver";
      subCategoryName = "999 FREE SILVER STOCK";
    } else if (metalCategory === "SILVER_925") {
      categoryName = "Silver";
      subCategoryName = "925 FREE SILVER STOCK";
    }

    // 1. Find or create Category (e.g. "Gold" or "Silver")
    let category = await tx.category.findFirst({
      where: {
        branchId,
        name: { in: [categoryName, categoryName.toUpperCase(), "Bullion", "BULLION", "Raw Metal"], mode: "insensitive" },
      },
    });

    if (!category) {
      category = await tx.category.create({
        data: {
          name: categoryName,
          description: `${categoryName} Jewellery & Raw Bullion`,
          branchId,
        },
      });
    }

    // 2. Find or create SubCategory (e.g. "24k FREE GOLD STOCK")
    let subCategory = await tx.subCategory.findFirst({
      where: {
        branchId,
        categoryId: category.id,
        name: { in: [subCategoryName, subCategoryName.toUpperCase(), subCategoryName.toLowerCase()], mode: "insensitive" },
      },
    });

    if (!subCategory) {
      subCategory = await tx.subCategory.create({
        data: {
          name: subCategoryName,
          categoryId: category.id,
          branchId,
        },
      });
    }

    return { category, subCategory, subCategoryName };
  }

  /**
   * Retrieves or initializes the running bullion product for a branch.
   * SAFEGUARD: Newly created bullion stock items are initialized with ZERO weights (0.000g)
   * so that subsequent increments apply the exact transaction weight without doubling.
   */
  public static async getOrCreateBullionProduct(
    tx: Prisma.TransactionClient,
    branchId: number,
    metalCategory: MetalCategory,
    purityPercent: number
  ) {
    const { subCategory, subCategoryName } = await this.ensureBullionSubCategory(tx, branchId, metalCategory);
    const productCode = `BULLION-${metalCategory}`;

    let bullionProduct = await tx.productItem.findFirst({
      where: {
        branchId,
        productCode,
      },
    });

    if (!bullionProduct) {
      bullionProduct = await tx.productItem.create({
        data: {
          branchId,
          subCategoryId: subCategory.id,
          name: subCategoryName,
          productCode,
          barcode: `BUL-${metalCategory}-${branchId}`,
          gsWeight: 0, // SAFEGUARD: Start at 0 so single increment accurately reflects received weight
          ntWeight: 0, // SAFEGUARD: Start at 0 so single increment accurately reflects received weight
          purity: purityPercent,
          quantity: 0, // SAFEGUARD: Start at 0
          allowNegativeStock: true,
        },
      });
    } else if (bullionProduct.subCategoryId !== subCategory.id || bullionProduct.name !== subCategoryName) {
      // SAFEGUARD: Auto-migrate any legacy misplaced bullion products into the dedicated subcategory
      bullionProduct = await tx.productItem.update({
        where: { id: bullionProduct.id },
        data: {
          subCategoryId: subCategory.id,
          name: subCategoryName,
        },
      });
    }

    return bullionProduct;
  }

  /**
   * Records bullion intake with multi-layered verification safeguards:
   *  - Safeguard 1: Idempotency check preventing duplicate execution.
   *  - Safeguard 2: Pre-update weight snapshot verification.
   *  - Safeguard 3: Atomic ledger journal insertion with running balances.
   *  - Safeguard 4: Single verified atomic weight increment.
   *  - Safeguard 5: Post-update delta verification (detects and blocks unexpected variance).
   */
  public static async recordBullionIntakeWithSafeguards(
    tx: Prisma.TransactionClient,
    params: BullionIntakeParams
  ) {
    const {
      branchId,
      receiptId,
      receiptNumber,
      metalCategory,
      purityPercent,
      actualGrossWeight,
      actualFineWeight,
      supplierName,
      receivedById,
      lotBatchNo,
      testCertificateNo,
      karatage,
    } = params;

    if (actualGrossWeight <= 0) {
      throw new Error(`Invalid gross weight: ${actualGrossWeight}g. Intake weight must be strictly positive.`);
    }

    // ── SAFEGUARD 1: Idempotency Check ───────────────────────────────────────
    // Check if this receipt has already been posted to the InventoryLedger
    const existingLedger = await tx.inventoryLedger.findFirst({
      where: {
        branchId,
        refType: "PURCHASE",
        refId: receiptId,
        txnType: "PURCHASE_IN",
      },
    });

    if (existingLedger) {
      throw new Error(
        `[Inventory Safeguard Block] Duplicate intake intercepted: Receipt ${receiptNumber} has already been posted to inventory ledger (Ledger ID: ${existingLedger.id}).`
      );
    }

    // ── SAFEGUARD 2: Resolve / Initialize Product with Zero Base ─────────────
    const bullionProduct = await this.getOrCreateBullionProduct(
      tx,
      branchId,
      metalCategory,
      purityPercent
    );

    // Pre-update snapshot
    const preUpdateSnapshot = await tx.productItem.findUnique({
      where: { id: bullionProduct.id },
      select: { id: true, gsWeight: true, ntWeight: true, quantity: true },
    });

    if (!preUpdateSnapshot) {
      throw new Error(`Bullion stock item ${bullionProduct.id} could not be locked for verification.`);
    }

    const previousGs = preUpdateSnapshot.gsWeight;
    const previousNt = preUpdateSnapshot.ntWeight;
    const previousQty = preUpdateSnapshot.quantity;

    // ── SAFEGUARD 3: Insert Atomic Inventory Ledger Record ───────────────────
    const is24K = metalCategory === "GOLD_24K";
    await insertLedgerEntry(
      tx,
      {
        productId: bullionProduct.id,
        branchId,
        txnType: "PURCHASE_IN",
        refType: "PURCHASE",
        refId: receiptId,
        qtyIn: 1,
        grossWeightIn: actualGrossWeight,
        netWeightIn: actualGrossWeight,
        unitCost: 0,
        totalValue: 0,
        remarks: `Metal receipt ${receiptNumber} from ${supplierName} (${metalCategory} ${actualGrossWeight.toFixed(3)}g)`,
        createdById: receivedById,
      },
      {
        karatage,
        purityPercent: is24K && purityPercent >= 99.50 ? 100 : purityPercent,
        fineWeightIn: actualFineWeight,
        batchLotNo: lotBatchNo,
        hallmarkCertNo: testCertificateNo,
      }
    );

    // ── SAFEGUARD 4: Single Atomic Increment ─────────────────────────────────
    const updatedProduct = await tx.productItem.update({
      where: { id: bullionProduct.id },
      data: {
        gsWeight: { increment: actualGrossWeight },
        ntWeight: { increment: actualGrossWeight },
        quantity: { increment: 1 },
      },
      select: {
        id: true,
        name: true,
        gsWeight: true,
        ntWeight: true,
        quantity: true,
        subCategoryId: true,
      },
    });

    // ── SAFEGUARD 5: Post-Update Delta Integrity Verification ────────────────
    const expectedGs = Number((previousGs + actualGrossWeight).toFixed(3));
    const expectedNt = Number((previousNt + actualGrossWeight).toFixed(3));
    const expectedQty = previousQty + 1;

    const gsDelta = Math.abs(updatedProduct.gsWeight - expectedGs);
    const ntDelta = Math.abs(updatedProduct.ntWeight - expectedNt);

    if (gsDelta > 0.001 || ntDelta > 0.001 || updatedProduct.quantity !== expectedQty) {
      throw new Error(
        `[Inventory Integrity Safeguard Violation] Stock calculation anomaly on ${bullionProduct.name}. ` +
        `Expected Net: ${expectedNt}g (actual: ${updatedProduct.ntWeight}g, delta: ${ntDelta}). ` +
        `Expected Qty: ${expectedQty} (actual: ${updatedProduct.quantity}). Transaction rolled back.`
      );
    }

    return {
      bullionProduct: updatedProduct,
      previousStock: { gs: previousGs, nt: previousNt, qty: previousQty },
      newStock: { gs: updatedProduct.gsWeight, nt: updatedProduct.ntWeight, qty: updatedProduct.quantity },
      intakeWeight: actualGrossWeight,
    };
  }
}
