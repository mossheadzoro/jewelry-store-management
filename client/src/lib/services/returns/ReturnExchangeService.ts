// src/lib/services/returns/ReturnExchangeService.ts
// Master Orchestration Service for Enterprise Returns & Exchanges

import { prisma } from "@/lib/prisma";
import { ReturnEligibilityService } from "./ReturnEligibilityService";
import { ReturnCalculationService } from "./ReturnCalculationService";
import { ReturnNumberingService } from "./ReturnNumberingService";
import { TaxDocumentService } from "./TaxDocumentService";
import { ReturnInventoryService } from "./ReturnInventoryService";
import { RefundService } from "./RefundService";
import { OldGoldSettlementService } from "./OldGoldSettlementService";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export interface CreateReturnRequestParams {
  invoiceNumber: string;
  branchId: number;
  transactionType: "RETURN" | "EXCHANGE";
  items: Array<{
    invoiceItemId: number;
    requestedAction: "RETURN" | "EXCHANGE";
    returnReason: string;
    condition?: "GOOD" | "MINOR_DAMAGE" | "MAJOR_DAMAGE" | "ALTERED" | "MISSING_STONE" | "MISSING_TAG" | "SUSPECTED_SUBSTITUTION" | "OTHER";
    measuredGrossWeight?: number;
    measuredNetWeight?: number;
    measuredPurity?: number;
    photos?: Array<{
      category: "FRONT" | "BACK" | "SIDE" | "TAG_OR_HALLMARK" | "DETAIL" | "CUSTOM";
      storageUrl: string;
      storageKey?: string;
      sizeBytes?: number;
      sha256Hash?: string;
    }>;
    deductionOptions?: {
      makingChargePolicy?: "FULL" | "PARTIAL" | "NON_REFUNDABLE";
      makingChargeDeductionPercent?: number;
      stoneChargePolicy?: "FULL" | "PARTIAL" | "NON_REFUNDABLE";
      stoneChargeDeductionAmount?: number;
      damageDeductionAmount?: number;
      damageDeductionPercent?: number;
      otherDeductionAmount?: number;
    };
  }>;
  policyOverride?: boolean;
  overrideReason?: string;
  requestedById?: number;
  notes?: string;
  
  // Refund / Settlement Preference
  refundMethod?: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "STORE_CREDIT" | "CUSTOMER_WALLET" | "EXCHANGE_OFFSET";
  paymentReference?: string;

  // For instant manager approval (if manager creates request)
  autoApprove?: boolean;
  approvedById?: number;
}

export class ReturnExchangeService {
  /**
   * Creates and optionally processes a Return / Exchange transaction atomically.
   */
  public static async createTransaction(params: CreateReturnRequestParams, reqContext?: any) {
    const {
      invoiceNumber,
      branchId,
      transactionType,
      items,
      policyOverride = false,
      overrideReason,
      requestedById,
      notes,
      refundMethod = "STORE_CREDIT",
      paymentReference,
      autoApprove = false,
      approvedById,
    } = params;

    if (!items || items.length === 0) {
      throw new Error("Cannot create return transaction with zero items.");
    }

    // 1. Pre-validation & eligibility evaluation
    const eligibilitySummary = await ReturnEligibilityService.evaluateInvoice(invoiceNumber, new Date(), branchId);
    
    // Verify each item's eligibility
    for (const reqItem of items) {
      const evalItem = eligibilitySummary.items.find((ei) => ei.invoiceItemId === reqItem.invoiceItemId);
      if (!evalItem) {
        throw new Error(`Item ${reqItem.invoiceItemId} does not belong to invoice ${invoiceNumber}.`);
      }

      if (evalItem.isAlreadyReturned || evalItem.isAlreadyExchanged) {
        throw new Error(`Item ${evalItem.productName} has already been returned/exchanged.`);
      }

      if (evalItem.hasActiveRequest) {
        throw new Error(`Item ${evalItem.productName} is already part of active request ${evalItem.activeTransactionNumber}.`);
      }

      const isAllowed = reqItem.requestedAction === "RETURN" ? evalItem.returnAllowed : evalItem.exchangeAllowed;
      if (!isAllowed && !policyOverride) {
        throw new Error(
          `Action ${reqItem.requestedAction} is not allowed for item ${evalItem.productName} (${evalItem.message}). Manager Policy Override is required.`
        );
      }
    }

    // 2. Compute Financial Reversal
    const originalInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!originalInvoice) {
      throw new Error(`Invoice ${invoiceNumber} not found.`);
    }

    const sumInvoiceTaxable = originalInvoice.items.reduce((acc, it) => acc + (it.totalBeforeTax || 0), 0);

    const calcInputs = items.map((it) => {
      const invItem = originalInvoice.items.find((origIt) => origIt.id === it.invoiceItemId)!;
      const taxableVal = invItem.totalBeforeTax || 0;
      let cgstVal = invItem.cgst || 0;
      let sgstVal = invItem.sgst || 0;
      let totalAfterTaxVal = invItem.totalAfterTax || 0;

      if ((cgstVal === 0 && sgstVal === 0) || totalAfterTaxVal <= taxableVal) {
        if (originalInvoice.cgst > 0 || originalInvoice.sgst > 0) {
          const cgstRatio = sumInvoiceTaxable > 0 ? (originalInvoice.cgst / sumInvoiceTaxable) : 0.015;
          const sgstRatio = sumInvoiceTaxable > 0 ? (originalInvoice.sgst / sumInvoiceTaxable) : 0.015;
          cgstVal = Math.round((taxableVal * cgstRatio + Number.EPSILON) * 100) / 100;
          sgstVal = Math.round((taxableVal * sgstRatio + Number.EPSILON) * 100) / 100;
        } else {
          cgstVal = Math.round((taxableVal * 0.015 + Number.EPSILON) * 100) / 100;
          sgstVal = Math.round((taxableVal * 0.015 + Number.EPSILON) * 100) / 100;
        }
        totalAfterTaxVal = Math.round((taxableVal + cgstVal + sgstVal + Number.EPSILON) * 100) / 100;
      }

      return {
        invoiceItemId: it.invoiceItemId,
        originalValues: {
          metalValue: invItem.metalValue,
          makingAmount: invItem.makingAmount,
          stoneCharge: invItem.stoneCharge,
          discountOnMaking: invItem.discountOnMaking,
          totalBeforeTax: taxableVal,
          cgst: cgstVal,
          sgst: sgstVal,
          totalAfterTax: totalAfterTaxVal,
          grossWeight: invItem.gsWeight,
          netWeight: invItem.ntWeight,
          purity: invItem.product?.purity,
        },
        policyDeductions: it.deductionOptions,
      };
    });

    const financialCalc = ReturnCalculationService.calculateReturn(
      calcInputs,
      originalInvoice.payments.map((p) => ({ method: p.method, amount: p.amount })),
      originalInvoice.totalAmount
    );

    // 3. Execute everything inside an ATOMIC Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Generate transaction number
      const { documentNumber: transactionNumber } = await ReturnNumberingService.generateDocumentNumber(
        tx,
        branchId,
        transactionType
      );

      const initialStatus = autoApprove ? "COMPLETED" : "PENDING_APPROVAL";

      // Step B: Create ReturnExchangeTransaction record
      const transaction = await tx.returnExchangeTransaction.create({
        data: {
          transactionNumber,
          transactionType,
          branchId,
          customerId: originalInvoice.customerId,
          originalInvoiceId: originalInvoice.id,
          status: initialStatus,
          requestedById: requestedById || null,
          approvedById: autoApprove ? approvedById : null,
          processedById: autoApprove ? approvedById : null,
          approvedAt: autoApprove ? new Date() : null,
          completedAt: autoApprove ? new Date() : null,
          policySnapshot: eligibilitySummary.policy as any,
          eligibilitySnapshot: eligibilitySummary as any,
          financialSnapshot: financialCalc as any,
          reason: items[0]?.returnReason || "Customer Return",
          notes,
          policyOverride,
          overrideReason: policyOverride ? overrideReason : null,
        },
      });

      // Step C: Create ReturnExchangeItem & Inspection records
      for (const reqItem of items) {
        const invItem = originalInvoice.items.find((origIt) => origIt.id === reqItem.invoiceItemId)!;
        const itemCalc = financialCalc.items.find((ic) => ic.invoiceItemId === reqItem.invoiceItemId)!;

        const originalValuesSnapshot = {
          productCode: invItem.product?.productCode,
          barcode: invItem.product?.barcode,
          huid: invItem.product?.huidNumber,
          gsWeight: invItem.gsWeight,
          ntWeight: invItem.ntWeight,
          purity: invItem.product?.purity || 22,
          metalRate: invItem.metalRate,
          metalValue: invItem.metalValue,
          makingAmount: invItem.makingAmount,
          stoneCharge: invItem.stoneCharge,
          discount: invItem.discountOnMaking,
          taxableValue: itemCalc.originalValues.taxableValue,
          cgst: itemCalc.taxReversal.cgstReversal,
          sgst: itemCalc.taxReversal.sgstReversal,
          igst: 0,
          totalAfterTax: itemCalc.netEligibleCredit,
        };

        const returnedValues = {
          measuredGrossWeight: reqItem.measuredGrossWeight ?? invItem.gsWeight,
          measuredNetWeight: reqItem.measuredNetWeight ?? invItem.ntWeight,
          measuredPurity: reqItem.measuredPurity ?? (invItem.product?.purity || 22),
          deductionAmount: itemCalc.deductions.totalCommercialDeduction,
          netRefundAmount: itemCalc.netRefundPayable,
        };

        const retItem = await tx.returnExchangeItem.create({
          data: {
            transactionId: transaction.id,
            originalInvoiceItemId: reqItem.invoiceItemId,
            originalProductItemId: invItem.productId,
            requestedAction: reqItem.requestedAction,
            quantity: 1,
            originalValuesSnapshot: originalValuesSnapshot as any,
            returnedValues: returnedValues as any,
            condition: reqItem.condition || "GOOD",
            inventoryRoute: autoApprove ? "AVAILABLE" : "RETURNED_HOLD",
            returnReason: reqItem.returnReason,
            status: initialStatus,
          },
        });

        // Create Inspection record
        await tx.returnInspection.create({
          data: {
            itemId: retItem.id,
            barcodeVerified: true,
            weightVerified: true,
            purityVerified: true,
            huidVerified: !!invItem.product?.huidNumber,
            photoVerified: (reqItem.photos?.length || 0) > 0,
            measuredGrossWeight: returnedValues.measuredGrossWeight,
            measuredNetWeight: returnedValues.measuredNetWeight,
            measuredPurity: returnedValues.measuredPurity,
            condition: reqItem.condition || "GOOD",
            inspectedById: autoApprove ? approvedById : requestedById,
          },
        });

        // Create photo records if present
        if (reqItem.photos && reqItem.photos.length > 0) {
          for (const photo of reqItem.photos) {
            await tx.returnItemPhoto.create({
              data: {
                returnExchangeItemId: retItem.id,
                photoCategory: photo.category || "DETAIL",
                storageUrl: photo.storageUrl,
                storageKey: photo.storageKey || null,
                sizeBytes: photo.sizeBytes || null,
                sha256Hash: photo.sha256Hash || null,
                uploadedById: requestedById || null,
              },
            });
          }
        }

        // If auto-approved, update inventory ledger
        if (autoApprove) {
          await ReturnInventoryService.processReturnItem(tx, {
            productId: invItem.productId,
            branchId,
            transactionNumber,
            grossWeight: invItem.gsWeight,
            netWeight: invItem.ntWeight,
            purityPercent: (invItem.product?.purity || 22) >= 22 ? 91.6 : 75.0,
            huidNumber: invItem.product?.huidNumber,
            metalRate: invItem.metalRate,
            totalValue: itemCalc.originalValues.taxableValue,
            createdById: approvedById,
            inventoryRoute: "AVAILABLE",
          });
        }
      }

      let creditNote = null;
      let refund = null;

      // Step D: If auto-approved, generate Credit Note and Refund record
      if (autoApprove) {
        // Create GST Credit Note
        creditNote = await TaxDocumentService.createTaxDocument(tx, {
          transactionId: transaction.id,
          originalInvoiceId: originalInvoice.id,
          branchId,
          customerId: originalInvoice.customerId,
          documentType: "CREDIT_NOTE",
          taxableValue: financialCalc.summary.totalTaxableReversal,
          cgstAmount: financialCalc.summary.totalCgstReversal,
          sgstAmount: financialCalc.summary.totalSgstReversal,
          totalAmount: financialCalc.summary.creditNoteTotalAmount,
          reason: overrideReason || items[0]?.returnReason || "Sales Return",
        });

        // Process Refund / Wallet Credit
        refund = await RefundService.processRefund(tx, {
          transactionId: transaction.id,
          transactionNumber,
          branchId,
          customerId: originalInvoice.customerId,
          amount: financialCalc.summary.netRefundPayable,
          method: refundMethod,
          paymentReference,
          requestedById,
          approvedById,
          processedById: approvedById,
          notes: `Settlement for return ${transactionNumber}`,
        });

        // Record Old Gold Settlement if applicable
        const oldGoldInfo = await OldGoldSettlementService.inspectOldGoldAvailability(tx, originalInvoice.id);
        if (oldGoldInfo && oldGoldInfo.recordedValuation > 0) {
          await OldGoldSettlementService.recordOldGoldSettlement(tx, {
            transactionId: transaction.id,
            originalWeight: oldGoldInfo.recordedWeight,
            originalPurity: oldGoldInfo.recordedPurity,
            originalFineWeight: (oldGoldInfo.recordedWeight * oldGoldInfo.recordedPurity) / 100,
            originalRate: 0,
            originalValuation: oldGoldInfo.recordedValuation,
            settlementMode: "ORIGINAL_VALUE_REFUND",
            physicalReturnAvailable: false,
            monetarySettlement: oldGoldInfo.recordedValuation,
            approvedById,
          });
        }
      }

      return {
        transaction,
        financialCalc,
        creditNote,
        refund,
      };
    });

    // 4. Record Enterprise Audit Log Event
    try {
      await AuditLogService.recordBusinessEvent({
        context: reqContext,
        module: "RETURNS",
        action: autoApprove ? "RETURN.APPROVED" : "RETURN.REQUEST_CREATED",
        entityType: "RETURN_EXCHANGE",
        entityId: result.transaction.id,
        entityDisplayName: result.transaction.transactionNumber,
        description: `Created ${transactionType} ${result.transaction.transactionNumber} for invoice ${invoiceNumber} (Amount: ₹${financialCalc.summary.netRefundPayable})`,
        after: {
          transactionNumber: result.transaction.transactionNumber,
          status: result.transaction.status,
          itemCount: items.length,
          refundAmount: financialCalc.summary.netRefundPayable,
          creditNoteNumber: result.creditNote?.documentNumber,
        },
        severity: policyOverride ? "HIGH" : "INFO",
        reason: overrideReason || items[0]?.returnReason,
      });
    } catch (auditErr) {
      console.warn("Audit logging warning:", auditErr);
    }

    return result;
  }

  /**
   * Approves a pending return or exchange transaction.
   */
  public static async approveTransaction(
    transactionId: string,
    approverId: number,
    refundMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "STORE_CREDIT" | "CUSTOMER_WALLET" | "EXCHANGE_OFFSET" = "STORE_CREDIT",
    paymentReference?: string,
    reqContext?: any
  ) {
    const transaction = await prisma.returnExchangeTransaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            originalInvoiceItem: { include: { product: true } },
            originalProductItem: true,
          },
        },
        originalInvoice: { include: { customer: true } },
      },
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    if (transaction.status === "COMPLETED" || transaction.status === "CLOSED") {
      throw new Error(`Transaction ${transaction.transactionNumber} is already completed.`);
    }

    const financialSnapshot = transaction.financialSnapshot as any;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update transaction status
      const updatedTx = await tx.returnExchangeTransaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          approvedById: approverId,
          processedById: approverId,
          approvedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // 2. Update item statuses & inventory
      for (const it of transaction.items) {
        await tx.returnExchangeItem.update({
          where: { id: it.id },
          data: {
            status: "COMPLETED",
            inventoryRoute: "AVAILABLE",
          },
        });

        // Insert inventory ledger
        await ReturnInventoryService.processReturnItem(tx, {
          productId: it.originalProductItemId,
          branchId: transaction.branchId,
          transactionNumber: transaction.transactionNumber,
          grossWeight: it.originalInvoiceItem.gsWeight,
          netWeight: it.originalInvoiceItem.ntWeight,
          purityPercent: (it.originalProductItem.purity || 22) >= 22 ? 91.6 : 75.0,
          huidNumber: it.originalProductItem.huidNumber,
          metalRate: it.originalInvoiceItem.metalRate,
          totalValue: it.originalInvoiceItem.totalBeforeTax,
          createdById: approverId,
          inventoryRoute: "AVAILABLE",
        });
      }

      // 3. Generate GST Credit Note
      const creditNote = await TaxDocumentService.createTaxDocument(tx, {
        transactionId: transaction.id,
        originalInvoiceId: transaction.originalInvoiceId,
        branchId: transaction.branchId,
        customerId: transaction.customerId,
        documentType: "CREDIT_NOTE",
        taxableValue: financialSnapshot.summary.totalTaxableReversal,
        cgstAmount: financialSnapshot.summary.totalCgstReversal,
        sgstAmount: financialSnapshot.summary.totalSgstReversal,
        totalAmount: financialSnapshot.summary.creditNoteTotalAmount,
        reason: transaction.overrideReason || transaction.reason || "Sales Return",
      });

      // 4. Process Refund
      const refund = await RefundService.processRefund(tx, {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        branchId: transaction.branchId,
        customerId: transaction.customerId,
        amount: financialSnapshot.summary.netRefundPayable,
        method: refundMethod,
        paymentReference,
        approvedById: approverId,
        processedById: approverId,
        notes: `Approved settlement for ${transaction.transactionNumber}`,
      });

      return { updatedTx, creditNote, refund };
    });

    // Record audit event
    try {
      await AuditLogService.recordBusinessEvent({
        context: reqContext,
        module: "RETURNS",
        action: "RETURN.APPROVED",
        entityType: "RETURN_EXCHANGE",
        entityId: transaction.id,
        entityDisplayName: transaction.transactionNumber,
        description: `Approved return ${transaction.transactionNumber} (Credit Note: ${result.creditNote?.documentNumber})`,
        after: {
          status: "COMPLETED",
          creditNoteNumber: result.creditNote?.documentNumber,
          refundNumber: result.refund?.refundNumber,
        },
        severity: "INFO",
      });
    } catch (auditErr) {
      console.warn("Audit logging warning:", auditErr);
    }

    return result;
  }

  /**
   * Rejects a pending return or exchange transaction with a mandatory reason.
   */
  public static async rejectTransaction(transactionId: string, rejectedById: number, reason: string, reqContext?: any) {
    const transaction = await prisma.returnExchangeTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    if (transaction.status === "COMPLETED" || transaction.status === "CLOSED") {
      throw new Error(`Cannot reject an already completed transaction.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.returnExchangeTransaction.update({
        where: { id: transactionId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          approvedById: rejectedById,
          closedAt: new Date(),
        },
      });

      await tx.returnExchangeItem.updateMany({
        where: { transactionId },
        data: { status: "REJECTED" },
      });

      return updatedTx;
    });

    try {
      await AuditLogService.recordBusinessEvent({
        context: reqContext,
        module: "RETURNS",
        action: "RETURN.REJECTED",
        entityType: "RETURN_EXCHANGE",
        entityId: transaction.id,
        entityDisplayName: transaction.transactionNumber,
        description: `Rejected return ${transaction.transactionNumber}: ${reason}`,
        after: { status: "REJECTED", rejectionReason: reason },
        severity: "LOW",
      });
    } catch (auditErr) {
      console.warn("Audit error:", auditErr);
    }

    return updated;
  }
}
