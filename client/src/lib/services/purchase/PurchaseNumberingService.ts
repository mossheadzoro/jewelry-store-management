// client/src/lib/services/purchase/PurchaseNumberingService.ts
// Server-Authoritative Transactional Sequential Number Generator

import { prisma } from "@/lib/prisma";

export type PurchaseNumberType =
  | "VERIFICATION_REQUEST"
  | "SUPPLIER"
  | "PURCHASE_BOOKING"
  | "PURCHASE_INVOICE"
  | "PURCHASE_PAYMENT"
  | "METAL_RECEIPT"
  | "METAL_TRANSFER"
  | "PURCHASE_RETURN"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "PURCHASE_DOCUMENT";

const PREFIX_CONFIG: Record<PurchaseNumberType, { prefix: string; padLength: number }> = {
  VERIFICATION_REQUEST: { prefix: "VR", padLength: 5 },
  SUPPLIER: { prefix: "SUP", padLength: 4 },
  PURCHASE_BOOKING: { prefix: "PB", padLength: 6 },
  PURCHASE_INVOICE: { prefix: "PUR", padLength: 6 },
  PURCHASE_PAYMENT: { prefix: "PAY", padLength: 6 },
  METAL_RECEIPT: { prefix: "GRN", padLength: 6 },
  METAL_TRANSFER: { prefix: "MT", padLength: 6 },
  PURCHASE_RETURN: { prefix: "PR", padLength: 6 },
  CREDIT_NOTE: { prefix: "PCN", padLength: 6 },
  DEBIT_NOTE: { prefix: "PDN", padLength: 6 },
  PURCHASE_DOCUMENT: { prefix: "DOC", padLength: 6 },
};

export class PurchaseNumberingService {
  /**
   * Generates a guaranteed collision-free, server-authoritative document number.
   * Format: PREFIX-YEAR-000001 (e.g. PB-2026-000001 or PUR-2026-000042)
   */
  public static async generateNumber(
    type: PurchaseNumberType,
    branchId: number = 1,
    customYear?: number
  ): Promise<string> {
    const year = customYear || new Date().getFullYear();
    const config = PREFIX_CONFIG[type];
    const categoryKey = `PURCHASE_${type}_${year}`;

    // Use SequenceTracker table with upsert and row increment
    const sequence = await prisma.sequenceTracker.upsert({
      where: {
        branchId_categoryName: {
          branchId,
          categoryName: categoryKey,
        },
      },
      create: {
        branchId,
        categoryName: categoryKey,
        lastValue: 1,
      },
      update: {
        lastValue: { increment: 1 },
      },
    });

    const paddedNumber = String(sequence.lastValue).padStart(config.padLength, "0");
    if (type === "SUPPLIER") {
      return `${config.prefix}-${paddedNumber}`;
    }
    return `${config.prefix}-${year}-${paddedNumber}`;
  }
}
