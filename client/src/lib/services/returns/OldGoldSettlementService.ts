// src/lib/services/returns/OldGoldSettlementService.ts
// Old Gold Physical Reversal & Monetary Settlement Engine

export interface SettleOldGoldParams {
  transactionId: string;
  originalMetalExchangeItemId?: string;
  originalWeight: number;
  originalPurity: number;
  originalFineWeight: number;
  originalRate: number;
  originalValuation: number;
  settlementMode: "PHYSICAL_RETURN" | "ORIGINAL_VALUE_REFUND" | "WALLET_CREDIT" | "EXCHANGE_ADJUSTMENT";
  physicalReturnAvailable?: boolean;
  physicalReturnProcessed?: boolean;
  monetarySettlement?: number;
  walletSettlement?: number;
  notes?: string;
  approvedById?: number;
}

export class OldGoldSettlementService {
  /**
   * Inspects original invoice payment notes / metal exchange item to verify physical metal status.
   */
  public static async inspectOldGoldAvailability(tx: any, originalInvoiceId: number) {
    const invoice = await tx.invoice.findUnique({
      where: { id: originalInvoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) return null;

    // Check payments for old gold exchange
    const oldGoldRecord = (invoice.payments || []).find((p: any) =>
      p.paymentRef?.includes("Old Gold Exchange Weight:")
    );

    if (!oldGoldRecord) {
      return null;
    }

    // Parse recorded weight and valuation
    let exchangeGoldValue = 0;
    let exchangeGoldWeight = 0;
    let exchangeGoldPurity = 91.6;

    const valMatch = oldGoldRecord.paymentRef?.match(/Value:\s*₹([\d.]+)/);
    if (valMatch) exchangeGoldValue = parseFloat(valMatch[1]);

    const wtMatch = oldGoldRecord.paymentRef?.match(/Old Gold Exchange Weight:\s*([\d.]+)/);
    if (wtMatch) exchangeGoldWeight = parseFloat(wtMatch[1]);

    const purityMatch = oldGoldRecord.paymentRef?.match(/Purity:\s*([\d.]+)/);
    if (purityMatch) exchangeGoldPurity = parseFloat(purityMatch[1]);

    return {
      recordedValuation: exchangeGoldValue,
      recordedWeight: exchangeGoldWeight,
      recordedPurity: exchangeGoldPurity,
      // Default: if it has been more than 24 hours or session closed, mark physical as unavailable
      physicalReturnAvailable: false,
    };
  }

  /**
   * Persists an OldGoldSettlement record within a Prisma transaction.
   */
  public static async recordOldGoldSettlement(tx: any, params: SettleOldGoldParams) {
    const settlement = await tx.oldGoldSettlement.create({
      data: {
        transactionId: params.transactionId,
        originalMetalExchangeItemId: params.originalMetalExchangeItemId || null,
        originalWeight: params.originalWeight,
        originalPurity: params.originalPurity,
        originalFineWeight: params.originalFineWeight,
        originalRate: params.originalRate,
        originalValuation: params.originalValuation,
        settlementMode: params.settlementMode,
        physicalReturnAvailable: params.physicalReturnAvailable ?? false,
        physicalReturnProcessed: params.physicalReturnProcessed ?? false,
        monetarySettlement: params.monetarySettlement || null,
        walletSettlement: params.walletSettlement || null,
        notes: params.notes || null,
        approvedById: params.approvedById || null,
      },
    });

    return settlement;
  }
}
