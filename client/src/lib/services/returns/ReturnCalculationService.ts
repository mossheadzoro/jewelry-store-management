// src/lib/services/returns/ReturnCalculationService.ts
// Financial Reversal & Commercial Deduction Calculation Engine

export interface ItemCalculationInput {
  invoiceItemId: number;
  originalValues: {
    metalValue: number;
    makingAmount: number;
    stoneCharge: number;
    discountOnMaking?: number;
    totalBeforeTax: number;
    cgst: number;
    sgst: number;
    totalAfterTax: number;
    purity?: number;
    grossWeight: number;
    netWeight: number;
  };
  policyDeductions?: {
    makingChargePolicy?: "FULL" | "PARTIAL" | "NON_REFUNDABLE";
    makingChargeDeductionPercent?: number; // e.g. 50%
    stoneChargePolicy?: "FULL" | "PARTIAL" | "NON_REFUNDABLE";
    stoneChargeDeductionAmount?: number;
    damageDeductionAmount?: number;
    damageDeductionPercent?: number;
    otherDeductionAmount?: number;
    customDeductionReason?: string;
  };
}

export interface ItemCalculationOutput {
  invoiceItemId: number;
  originalValues: {
    metalValue: number;
    makingAmount: number;
    stoneCharge: number;
    discountOnMaking: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    totalAfterTax: number;
  };
  deductions: {
    makingChargeDeduction: number;
    stoneChargeDeduction: number;
    damageDeduction: number;
    otherDeduction: number;
    totalCommercialDeduction: number;
  };
  taxReversal: {
    taxableReversal: number;
    cgstReversal: number;
    sgstReversal: number;
    igstReversal: number;
    totalTaxReversal: number;
  };
  netEligibleCredit: number; // Gross Credit Note value
  netRefundPayable: number;  // After non-refundable commercial adjustments
}

export interface FinancialCalculationResult {
  items: ItemCalculationOutput[];
  summary: {
    totalOriginalTaxable: number;
    totalOriginalCgst: number;
    totalOriginalSgst: number;
    totalOriginalTax: number;
    totalOriginalAmount: number;
    
    totalCommercialDeductions: number;
    
    totalTaxableReversal: number;
    totalCgstReversal: number;
    totalSgstReversal: number;
    totalTaxReversal: number;
    
    creditNoteTotalAmount: number; // Taxable Reversal + GST Reversal
    netRefundPayable: number;      // Amount customer actually receives
  };
  recommendedRefundAllocation: Array<{
    method: string;
    amount: number;
    isOriginalMethod: boolean;
  }>;
}

export class ReturnCalculationService {
  /** Round to 2 decimal places consistently */
  public static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculates financial breakdown for one or more returning invoice items.
   */
  public static calculateReturn(
    items: ItemCalculationInput[],
    originalPayments: Array<{ method: string; amount: number }> = [],
    overallInvoiceTotal: number = 0
  ): FinancialCalculationResult {
    let sumOrigTaxable = 0;
    let sumOrigCgst = 0;
    let sumOrigSgst = 0;
    let sumOrigTotal = 0;
    
    let sumDeductions = 0;
    let sumTaxableReversal = 0;
    let sumCgstReversal = 0;
    let sumSgstReversal = 0;
    let sumCreditNoteTotal = 0;
    let sumNetRefund = 0;

    const itemOutputs: ItemCalculationOutput[] = items.map((it) => {
      const orig = it.originalValues;
      const policy = it.policyDeductions || {};

      const metalVal = this.round2(orig.metalValue || 0);
      const makingVal = this.round2(orig.makingAmount || 0);
      const stoneVal = this.round2(orig.stoneCharge || 0);
      const discountVal = this.round2(orig.discountOnMaking || 0);
      const taxableVal = this.round2(orig.totalBeforeTax || (metalVal + makingVal + stoneVal - discountVal));
      let cgstVal = this.round2(orig.cgst || 0);
      let sgstVal = this.round2(orig.sgst || 0);
      let totalAfterTaxVal = this.round2(orig.totalAfterTax || (taxableVal + cgstVal + sgstVal));

      // Robust fallback: If item tax is 0 or totalAfterTax equals taxable (legacy item storage),
      // compute 1.5% CGST + 1.5% SGST (3% GST)
      if ((cgstVal === 0 && sgstVal === 0) || totalAfterTaxVal <= taxableVal) {
        cgstVal = this.round2(taxableVal * 0.015);
        sgstVal = this.round2(taxableVal * 0.015);
        totalAfterTaxVal = this.round2(taxableVal + cgstVal + sgstVal);
      }

      // Commercial deductions
      let makingDeduction = 0;
      if (policy.makingChargePolicy === "NON_REFUNDABLE") {
        makingDeduction = makingVal;
      } else if (policy.makingChargePolicy === "PARTIAL" && (policy.makingChargeDeductionPercent || 0) > 0) {
        makingDeduction = this.round2(makingVal * ((policy.makingChargeDeductionPercent || 0) / 100));
      }

      let stoneDeduction = 0;
      if (policy.stoneChargePolicy === "NON_REFUNDABLE") {
        stoneDeduction = stoneVal;
      } else if (policy.stoneChargeDeductionAmount) {
        stoneDeduction = this.round2(Math.min(stoneVal, policy.stoneChargeDeductionAmount));
      }

      let damageDeduction = 0;
      if (policy.damageDeductionAmount) {
        damageDeduction = this.round2(policy.damageDeductionAmount);
      } else if (policy.damageDeductionPercent) {
        damageDeduction = this.round2(totalAfterTaxVal * (policy.damageDeductionPercent / 100));
      }

      const otherDeduction = this.round2(policy.otherDeductionAmount || 0);
      const totalDeduction = this.round2(makingDeduction + stoneDeduction + damageDeduction + otherDeduction);

      // Tax Reversal is derived proportionally from original snapshot
      // Under GST, the credit note reverses the taxable supply and original tax rate
      const taxableReversal = taxableVal;
      const cgstReversal = cgstVal;
      const sgstReversal = sgstVal;
      const totalTaxReversal = this.round2(cgstReversal + sgstReversal);
      const creditNoteValue = this.round2(taxableReversal + totalTaxReversal);

      // Net refund after commercial deductions
      const netRefund = this.round2(Math.max(0, creditNoteValue - totalDeduction));

      sumOrigTaxable = this.round2(sumOrigTaxable + taxableVal);
      sumOrigCgst = this.round2(sumOrigCgst + cgstVal);
      sumOrigSgst = this.round2(sumOrigSgst + sgstVal);
      sumOrigTotal = this.round2(sumOrigTotal + totalAfterTaxVal);

      sumDeductions = this.round2(sumDeductions + totalDeduction);
      sumTaxableReversal = this.round2(sumTaxableReversal + taxableReversal);
      sumCgstReversal = this.round2(sumCgstReversal + cgstReversal);
      sumSgstReversal = this.round2(sumSgstReversal + sgstReversal);
      sumCreditNoteTotal = this.round2(sumCreditNoteTotal + creditNoteValue);
      sumNetRefund = this.round2(sumNetRefund + netRefund);

      return {
        invoiceItemId: it.invoiceItemId,
        originalValues: {
          metalValue: metalVal,
          makingAmount: makingVal,
          stoneCharge: stoneVal,
          discountOnMaking: discountVal,
          taxableValue: taxableVal,
          cgst: cgstVal,
          sgst: sgstVal,
          totalAfterTax: totalAfterTaxVal,
        },
        deductions: {
          makingChargeDeduction: makingDeduction,
          stoneChargeDeduction: stoneDeduction,
          damageDeduction: damageDeduction,
          otherDeduction: otherDeduction,
          totalCommercialDeduction: totalDeduction,
        },
        taxReversal: {
          taxableReversal,
          cgstReversal,
          sgstReversal,
          igstReversal: 0,
          totalTaxReversal,
        },
        netEligibleCredit: creditNoteValue,
        netRefundPayable: netRefund,
      };
    });

    // Compute recommended refund distribution across original payment modes
    const recommendedRefundAllocation = this.computeRefundAllocation(
      sumNetRefund,
      originalPayments,
      overallInvoiceTotal || sumOrigTotal
    );

    return {
      items: itemOutputs,
      summary: {
        totalOriginalTaxable: sumOrigTaxable,
        totalOriginalCgst: sumOrigCgst,
        totalOriginalSgst: sumOrigSgst,
        totalOriginalTax: this.round2(sumOrigCgst + sumOrigSgst),
        totalOriginalAmount: sumOrigTotal,
        totalCommercialDeductions: sumDeductions,
        totalTaxableReversal: sumTaxableReversal,
        totalCgstReversal: sumCgstReversal,
        totalSgstReversal: sumSgstReversal,
        totalTaxReversal: this.round2(sumCgstReversal + sumSgstReversal),
        creditNoteTotalAmount: sumCreditNoteTotal,
        netRefundPayable: sumNetRefund,
      },
      recommendedRefundAllocation,
    };
  }

  /**
   * Allocates refund proportionally or sequentially according to original payments.
   */
  private static computeRefundAllocation(
    totalRefundNeeded: number,
    originalPayments: Array<{ method: string; amount: number }>,
    invoiceTotal: number
  ): Array<{ method: string; amount: number; isOriginalMethod: boolean }> {
    if (totalRefundNeeded <= 0 || !originalPayments || originalPayments.length === 0) {
      return [{ method: "STORE_CREDIT", amount: totalRefundNeeded, isOriginalMethod: false }];
    }

    let remainingRefund = totalRefundNeeded;
    const allocation: Array<{ method: string; amount: number; isOriginalMethod: boolean }> = [];

    for (const p of originalPayments) {
      if (remainingRefund <= 0) break;
      const paymentAmount = Number(p.amount) || 0;
      if (paymentAmount <= 0) continue;

      const refundPortion = this.round2(Math.min(remainingRefund, paymentAmount));
      if (refundPortion > 0) {
        allocation.push({
          method: p.method.toUpperCase(),
          amount: refundPortion,
          isOriginalMethod: true,
        });
        remainingRefund = this.round2(remainingRefund - refundPortion);
      }
    }

    if (remainingRefund > 0) {
      allocation.push({
        method: "CUSTOMER_WALLET",
        amount: remainingRefund,
        isOriginalMethod: false,
      });
    }

    return allocation;
  }
}
