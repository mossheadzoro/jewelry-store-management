// src/lib/services/returns/ReturnEligibilityService.ts
// Backend Enterprise Return & Exchange Eligibility Engine

import { prisma } from "@/lib/prisma";

export interface ItemEligibilityResult {
  invoiceItemId: number;
  productId: number;
  productName: string;
  barcode: string;
  huidNumber: string | null;
  grossWeight: number;
  netWeight: number;
  purity: number;
  totalAfterTax: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  
  // Status flags
  returnAllowed: boolean;
  exchangeAllowed: boolean;
  isAlreadyReturned: boolean;
  isAlreadyExchanged: boolean;
  hasActiveRequest: boolean;
  activeTransactionId?: string;
  activeTransactionNumber?: string;
  
  // Policy window details
  elapsedDays: number;
  returnWindowDays: number;
  exchangeWindowDays: number;
  returnDeadline: string;
  exchangeDeadline: string;
  
  // Tax statutory eligibility
  isGstTaxAdjustmentEligible: boolean;
  taxStatutoryDaysRemaining: number;
  
  // Manager Override
  isOverrideRequired: boolean;
  reasonCode: string | null;
  message: string;
}

export interface InvoiceEligibilitySummary {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number;
  customerName: string;
  customerMobile: string;
  customerGstin?: string | null;
  branchId: number;
  branchName: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  isFullyPaid: boolean;
  elapsedDays: number;
  
  // Policy settings applied
  policy: {
    returnWindowDays: number;
    exchangeWindowDays: number;
    requireBarcodeVerification: boolean;
    requireWeightVerification: boolean;
    requireHuidVerification: boolean;
    requireRfidVerification: boolean;
    requirePhotoVerification: boolean;
    minimumReturnPhotoCount: number;
    maximumReturnPhotoCount: number;
    weightToleranceGrams: number;
    highValueApprovalThreshold: number;
    allowPolicyOverride: boolean;
  };
  
  items: ItemEligibilityResult[];
}

export class ReturnEligibilityService {
  /**
   * Retrieves or creates default branch policy settings.
   */
  public static async getBranchPolicy(branchId: number) {
    let settings = await prisma.returnExchangePolicySettings.findUnique({
      where: { branchId },
    });

    if (!settings) {
      settings = await prisma.returnExchangePolicySettings.create({
        data: {
          branchId,
          returnWindowDays: 3,
          exchangeWindowDays: 7,
          minimumReturnPhotoCount: 2,
          maximumReturnPhotoCount: 5,
          requireBarcodeVerification: true,
          requireWeightVerification: true,
          requireHuidVerification: false,
          requireRfidVerification: false,
          requirePhotoVerification: true,
          weightToleranceGrams: 0.010,
          allowStoreCredit: true,
          allowCashRefund: true,
          allowOriginalPaymentRefund: true,
          allowOldGoldPhysicalReturn: true,
          allowOldGoldMonetarySettlement: true,
          allowPolicyOverride: true,
          managerApprovalRequired: true,
          highValueApprovalThreshold: 100000,
          requireStepUpAuthAboveThreshold: true,
          makingChargeReturnPolicy: "FULL",
          stoneChargeReturnPolicy: "FULL",
          hallmarkChargeReturnPolicy: "FULL",
          damageDeductionPolicy: "NONE",
          taxAdjustmentStatutoryDays: 180,
        },
      });
    }

    return settings;
  }

  /**
   * Calculates calendar elapsed days between invoice creation and evaluation date.
   */
  public static calculateElapsedDays(invoiceDate: Date, evalDate: Date = new Date()): number {
    const start = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), invoiceDate.getDate());
    const end = new Date(evalDate.getFullYear(), evalDate.getMonth(), evalDate.getDate());
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Evaluates an invoice and all its items for Return & Exchange eligibility.
   */
  public static async evaluateInvoice(
    invoiceIdOrNumber: number | string,
    currentDate: Date = new Date(),
    userBranchId?: number
  ): Promise<InvoiceEligibilitySummary> {
    const whereClause: any = typeof invoiceIdOrNumber === "number"
      ? { id: invoiceIdOrNumber }
      : { invoiceNumber: String(invoiceIdOrNumber).trim() };

    const invoice = await prisma.invoice.findUnique({
      where: whereClause,
      include: {
        customer: true,
        branch: true,
        items: {
          include: {
            product: true,
            returnExchangeItems: {
              include: {
                transaction: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new Error(`Invoice '${invoiceIdOrNumber}' not found.`);
    }

    const policy = await this.getBranchPolicy(invoice.branchId);
    const elapsedDays = this.calculateElapsedDays(new Date(invoice.createdAt), currentDate);

    // Calculate deadlines
    const invDate = new Date(invoice.createdAt);
    const returnDeadlineDate = new Date(invDate);
    returnDeadlineDate.setDate(returnDeadlineDate.getDate() + policy.returnWindowDays);
    
    const exchangeDeadlineDate = new Date(invDate);
    exchangeDeadlineDate.setDate(exchangeDeadlineDate.getDate() + policy.exchangeWindowDays);

    const taxStatutoryDeadlineDate = new Date(invDate);
    taxStatutoryDeadlineDate.setDate(taxStatutoryDeadlineDate.getDate() + policy.taxAdjustmentStatutoryDays);
    const taxStatutoryDaysRemaining = Math.max(
      0,
      Math.ceil((taxStatutoryDeadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const isGstTaxAdjustmentEligible = taxStatutoryDaysRemaining > 0;

    const evaluatedItems: ItemEligibilityResult[] = invoice.items.map((item) => {
      // Check prior return / exchange history on this specific invoice item
      const completedReturn = item.returnExchangeItems.find(
        (ri) => ri.requestedAction === "RETURN" && ["COMPLETED", "CLOSED", "APPROVED"].includes(ri.status)
      );
      const completedExchange = item.returnExchangeItems.find(
        (ri) => ri.requestedAction === "EXCHANGE" && ["COMPLETED", "CLOSED", "APPROVED"].includes(ri.status)
      );
      const activeRequest = item.returnExchangeItems.find(
        (ri) => !["REJECTED", "CANCELLED", "CLOSED", "COMPLETED"].includes(ri.status)
      );

      const isAlreadyReturned = !!completedReturn;
      const isAlreadyExchanged = !!completedExchange;
      const hasActiveRequest = !!activeRequest;

      let returnAllowed = false;
      let exchangeAllowed = false;
      let reasonCode: string | null = null;
      let message = "Available for return and exchange.";
      let isOverrideRequired = false;

      if (isAlreadyReturned) {
        returnAllowed = false;
        exchangeAllowed = false;
        reasonCode = "ITEM_ALREADY_RETURNED";
        message = "This item has already been returned.";
      } else if (isAlreadyExchanged) {
        returnAllowed = false;
        exchangeAllowed = false;
        reasonCode = "ITEM_ALREADY_EXCHANGED";
        message = "This item has already been exchanged.";
      } else if (hasActiveRequest) {
        returnAllowed = false;
        exchangeAllowed = false;
        reasonCode = "ACTIVE_REQUEST_EXISTS";
        message = `An active request (${activeRequest.transaction.transactionNumber}) is already in progress.`;
      } else {
        // Evaluate based on elapsed days and policy windows
        if (elapsedDays <= policy.returnWindowDays) {
          // Day 0–3
          returnAllowed = true;
          exchangeAllowed = true;
          reasonCode = null;
          message = `Within standard return window (${policy.returnWindowDays} days). Both return and exchange are allowed.`;
        } else if (elapsedDays <= policy.exchangeWindowDays) {
          // Day 4–7
          returnAllowed = false;
          exchangeAllowed = true;
          reasonCode = "RETURN_WINDOW_EXPIRED";
          message = `Return period has expired (${policy.returnWindowDays} days). Exchange is available until day ${policy.exchangeWindowDays}.`;
          isOverrideRequired = true; // Return would require manager override
        } else {
          // Day 8+
          returnAllowed = false;
          exchangeAllowed = false;
          reasonCode = "RETURN_EXCHANGE_WINDOW_EXPIRED";
          message = `Return and exchange window (${policy.exchangeWindowDays} days) has expired. Requires Manager Policy Override.`;
          isOverrideRequired = true;
        }
      }

      const taxableValue = item.totalBeforeTax || 0;
      let cgst = item.cgst || 0;
      let sgst = item.sgst || 0;
      let totalAfterTax = item.totalAfterTax || 0;

      // Robust fallback: If item tax is 0 or totalAfterTax equals taxable (legacy item storage),
      // compute GST proportionally from parent invoice or apply standard 3% GST (1.5% CGST + 1.5% SGST)
      if ((cgst === 0 && sgst === 0) || totalAfterTax <= taxableValue) {
        const sumInvoiceTaxable = invoice.items.reduce((acc, it) => acc + (it.totalBeforeTax || 0), 0);
        if (invoice.cgst > 0 || invoice.sgst > 0) {
          const cgstRatio = sumInvoiceTaxable > 0 ? (invoice.cgst / sumInvoiceTaxable) : 0.015;
          const sgstRatio = sumInvoiceTaxable > 0 ? (invoice.sgst / sumInvoiceTaxable) : 0.015;
          cgst = Math.round((taxableValue * cgstRatio + Number.EPSILON) * 100) / 100;
          sgst = Math.round((taxableValue * sgstRatio + Number.EPSILON) * 100) / 100;
        } else {
          cgst = Math.round((taxableValue * 0.015 + Number.EPSILON) * 100) / 100;
          sgst = Math.round((taxableValue * 0.015 + Number.EPSILON) * 100) / 100;
        }
        totalAfterTax = Math.round((taxableValue + cgst + sgst + Number.EPSILON) * 100) / 100;
      }

      return {
        invoiceItemId: item.id,
        productId: item.productId,
        productName: item.product?.name || `Product #${item.productId}`,
        barcode: item.product?.barcode || "—",
        huidNumber: item.product?.huidNumber || null,
        grossWeight: item.gsWeight,
        netWeight: item.ntWeight,
        purity: item.product?.purity || 22,
        totalAfterTax: totalAfterTax,
        taxableValue: taxableValue,
        cgst: cgst,
        sgst: sgst,
        
        returnAllowed,
        exchangeAllowed,
        isAlreadyReturned,
        isAlreadyExchanged,
        hasActiveRequest,
        activeTransactionId: activeRequest?.transactionId,
        activeTransactionNumber: activeRequest?.transaction.transactionNumber,
        
        elapsedDays,
        returnWindowDays: policy.returnWindowDays,
        exchangeWindowDays: policy.exchangeWindowDays,
        returnDeadline: returnDeadlineDate.toLocaleDateString("en-IN"),
        exchangeDeadline: exchangeDeadlineDate.toLocaleDateString("en-IN"),
        
        isGstTaxAdjustmentEligible,
        taxStatutoryDaysRemaining,
        
        isOverrideRequired,
        reasonCode,
        message,
      };
    });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt.toISOString(),
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      customerMobile: invoice.customer.mobile,
      customerGstin: invoice.customer.gstin,
      branchId: invoice.branchId,
      branchName: invoice.branch.name,
      grandTotal: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceAmount: invoice.balanceAmount,
      isFullyPaid: invoice.isFullyPaid,
      elapsedDays,
      policy: {
        returnWindowDays: policy.returnWindowDays,
        exchangeWindowDays: policy.exchangeWindowDays,
        requireBarcodeVerification: policy.requireBarcodeVerification,
        requireWeightVerification: policy.requireWeightVerification,
        requireHuidVerification: policy.requireHuidVerification,
        requireRfidVerification: policy.requireRfidVerification,
        requirePhotoVerification: policy.requirePhotoVerification,
        minimumReturnPhotoCount: policy.minimumReturnPhotoCount,
        maximumReturnPhotoCount: policy.maximumReturnPhotoCount,
        weightToleranceGrams: policy.weightToleranceGrams,
        highValueApprovalThreshold: policy.highValueApprovalThreshold,
        allowPolicyOverride: policy.allowPolicyOverride,
      },
      items: evaluatedItems,
    };
  }
}
