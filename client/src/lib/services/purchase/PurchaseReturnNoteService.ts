// client/src/lib/services/purchase/PurchaseReturnNoteService.ts
// Purchase Returns, Supplier Credit Notes & Debit Notes with ITC Adjustments

import { prisma, MetalCategory, NoteSettlementMode } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { insertLedgerEntry } from "@/lib/inventoryLedger";

export interface CreatePurchaseReturnParams {
  purchaseInvoiceId: string;
  returnedGrossWeight: number;
  returnedFineWeight?: number;
  reason: string;
  inspectionNotes?: string;
  requestedById: number;
  autoCreditNote?: boolean;
  reqContext?: any;
}

export interface CreateCreditNoteParams {
  purchaseInvoiceId?: string;
  purchaseReturnId?: string;
  supplierId: string;
  branchId: number;
  supplierCreditNoteNo?: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: Date | string;
  taxableValue: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  affectedGrossWeight?: number;
  settlementMode?: NoteSettlementMode;
  reason: string;
  createdById: number;
  reqContext?: any;
}

export interface CreateDebitNoteParams {
  purchaseInvoiceId: string;
  supplierId: string;
  branchId: number;
  supplierDebitNoteNo?: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: Date | string;
  taxableValue: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  reason: string;
  createdById: number;
  reqContext?: any;
}

export class PurchaseReturnNoteService {
  /**
   * Creates a Purchase Return, deducts inventory, and optionally generates a Supplier Credit Note.
   */
  public static async createReturn(params: CreatePurchaseReturnParams) {
    const {
      purchaseInvoiceId,
      returnedGrossWeight,
      reason,
      inspectionNotes,
      requestedById,
      autoCreditNote = true,
      reqContext,
    } = params;

    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id: purchaseInvoiceId },
      include: { supplier: true, items: true },
    });
    if (!invoice) throw new Error(`Purchase invoice ${purchaseInvoiceId} not found.`);

    if (returnedGrossWeight <= 0 || returnedGrossWeight > invoice.totalGrossWeight) {
      throw new Error(`Invalid return weight ${returnedGrossWeight}g. Max returnable: ${invoice.totalGrossWeight}g.`);
    }

    const firstItem = invoice.items[0];
    const metalCategory = firstItem?.metalCategory || "GOLD_24K";
    const purityPercent = firstItem?.purityPercent || 99.50;
    const returnedFineWeight = (metalCategory === "GOLD_24K" && purityPercent >= 99.50)
      ? Number(returnedGrossWeight.toFixed(3))
      : Number(((returnedGrossWeight * purityPercent) / 99.50).toFixed(3));

    // Calculate proportionate taxable value and GST
    const ratePerGram = invoice.taxableValue / invoice.totalGrossWeight;
    const returnTaxable = Number((returnedGrossWeight * ratePerGram).toFixed(2));
    const isInterState = invoice.isInterState;

    const cgst = isInterState ? 0 : Number((returnTaxable * 0.015).toFixed(2));
    const sgst = isInterState ? 0 : Number((returnTaxable * 0.015).toFixed(2));
    const igst = isInterState ? Number((returnTaxable * 0.03).toFixed(2)) : 0;
    const totalReturnAmount = Number((returnTaxable + cgst + sgst + igst).toFixed(2));

    const returnNumber = await PurchaseNumberingService.generateNumber("PURCHASE_RETURN", invoice.branchId);

    const purchaseReturn = await prisma.$transaction(async (tx) => {
      // 1. Create PurchaseReturn record
      const createdReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          purchaseInvoiceId,
          supplierId: invoice.supplierId,
          branchId: invoice.branchId,
          returnDate: new Date(),
          transactionAt: new Date(),
          metalCategory,
          purityPercent,
          returnedGrossWeight,
          returnedFineWeight,
          taxableValue: returnTaxable,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: igst,
          totalAmount: totalReturnAmount,
          reason,
          inspectionNotes,
          status: "APPROVED",
          requestedById,
          approvedById: requestedById,
        },
      });

      // 2. Post PURCHASE_RETURN_OUT to InventoryLedger
      const bullionProduct = await tx.productItem.findFirst({
        where: {
          branchId: invoice.branchId,
          productCode: `BULLION-${metalCategory}`,
        },
      });

      if (bullionProduct) {
        await insertLedgerEntry(
          tx,
          {
            productId: bullionProduct.id,
            branchId: invoice.branchId,
            txnType: "PURCHASE_RETURN_OUT",
            refType: "PURCHASE",
            refId: createdReturn.id,
            qtyOut: 1,
            grossWeightOut: returnedGrossWeight,
            netWeightOut: returnedGrossWeight,
            unitCost: ratePerGram,
            totalValue: totalReturnAmount,
            remarks: `Purchase return ${returnNumber} to ${invoice.supplier.businessName} (${reason})`,
            createdById: requestedById,
          },
          {
            karatage: metalCategory === "GOLD_24K" ? 24 : 22,
            purityPercent,
          }
        );

        await tx.productItem.update({
          where: { id: bullionProduct.id },
          data: {
            gsWeight: { decrement: returnedGrossWeight },
            ntWeight: { decrement: returnedGrossWeight },
          },
        });
      }

      // 3. If autoCreditNote, generate Credit Note immediately
      if (autoCreditNote) {
        const creditNoteNumber = await PurchaseNumberingService.generateNumber("CREDIT_NOTE", invoice.branchId);

        const creditNote = await tx.purchaseCreditNote.create({
          data: {
            creditNoteNumber,
            purchaseInvoiceId,
            purchaseReturnId: createdReturn.id,
            supplierId: invoice.supplierId,
            branchId: invoice.branchId,
            issueDate: new Date(),
            transactionAt: new Date(),
            originalInvoiceNumber: invoice.invoiceNumber,
            originalInvoiceDate: invoice.invoiceDate,
            reason,
            taxableValue: returnTaxable,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalAmount: totalReturnAmount,
            itcReductionAmount: Number((cgst + sgst + igst).toFixed(2)),
            affectedGrossWeight: returnedGrossWeight,
            affectedFineWeight: returnedFineWeight,
            settlementMode: "DEDUCT_PAYABLE",
            status: "ISSUED",
            createdById: requestedById,
          },
        });

        // Decrement supplier payable balance
        const newPayable = Number((invoice.supplier.currentPayable - totalReturnAmount).toFixed(2));
        await tx.bullionSupplier.update({
          where: { id: invoice.supplierId },
          data: { currentPayable: newPayable },
        });

        // Post to SupplierLedgerEntry (Debit reduces balance)
        await tx.supplierLedgerEntry.create({
          data: {
            supplierId: invoice.supplierId,
            branchId: invoice.branchId,
            entryType: "CREDIT_NOTE",
            debit: totalReturnAmount,
            credit: 0,
            balance: newPayable,
            referenceType: "CREDIT_NOTE",
            referenceId: creditNote.id,
            documentNumber: creditNoteNumber,
            description: `Credit Note ${creditNoteNumber} for Return ${returnNumber} - Deducted from payable`,
            transactionDate: new Date(),
            createdById: requestedById,
          },
        });

        // Create PurchaseGSTRecord for Credit Note (ITC reversal)
        const periodMonth = new Date().getMonth() + 1;
        const periodYear = new Date().getFullYear();
        const financialYear = periodMonth >= 4 ? `${periodYear}-${periodYear + 1}` : `${periodYear - 1}-${periodYear}`;
        const totalTax = Number((cgst + sgst + igst).toFixed(2));

        await tx.purchaseGSTRecord.create({
          data: {
            branchId: invoice.branchId,
            supplierId: invoice.supplierId,
            purchaseInvoiceId,
            purchaseCreditNoteId: creditNote.id,
            financialYear,
            periodMonth,
            periodYear,
            gstin: invoice.supplier.gstin || "UNREGISTERED",
            placeOfSupply: invoice.placeOfSupply,
            isInterState,
            taxableValue: -returnTaxable,
            cgst: -cgst,
            sgst: -sgst,
            igst: -igst,
            totalTax: -totalTax,
            itcEligibility: "ELIGIBLE",
            itcClaimedAmount: -totalTax,
            reconciliationStatus: "NOT_RECONCILED",
          },
        });

        // Link creditNoteId to return
        await tx.purchaseReturn.update({
          where: { id: createdReturn.id },
          data: { creditNoteId: creditNote.id, status: "COMPLETED" },
        });
      }

      return createdReturn;
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_RETURNS",
      action: "RETURN_CREATED",
      entityType: "PURCHASE_RETURN",
      entityId: purchaseReturn.id,
      entityDisplayName: `${purchaseReturn.returnNumber} (${returnedGrossWeight}g returned to ${invoice.supplier.businessName})`,
      description: `Purchase return of ${returnedGrossWeight}g processed on invoice ${invoice.invoiceNumber}. Value: ₹${totalReturnAmount}`,
      after: purchaseReturn,
      severity: "MEDIUM",
    });

    return purchaseReturn;
  }

  /**
   * Creates a standalone Supplier Debit Note (e.g. for upward rate adjustments).
   */
  public static async createDebitNote(params: CreateDebitNoteParams) {
    const {
      purchaseInvoiceId,
      supplierId,
      branchId,
      supplierDebitNoteNo,
      originalInvoiceNumber,
      originalInvoiceDate,
      taxableValue,
      cgstAmount = 0,
      sgstAmount = 0,
      igstAmount = 0,
      reason,
      createdById,
      reqContext,
    } = params;

    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new Error(`Supplier ${supplierId} not found.`);

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = Number((taxableValue + totalTax).toFixed(2));

    const debitNoteNumber = await PurchaseNumberingService.generateNumber("DEBIT_NOTE", branchId);

    const debitNote = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseDebitNote.create({
        data: {
          debitNoteNumber,
          supplierDebitNoteNo,
          purchaseInvoiceId,
          supplierId,
          branchId,
          issueDate: new Date(),
          transactionAt: new Date(),
          originalInvoiceNumber,
          originalInvoiceDate: new Date(originalInvoiceDate),
          reason,
          taxableValue,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount,
          additionalItcAmount: totalTax,
          status: "ISSUED",
          createdById,
        },
      });

      // Increase supplier payable balance
      const newPayable = Number((supplier.currentPayable + totalAmount).toFixed(2));
      await tx.bullionSupplier.update({
        where: { id: supplierId },
        data: { currentPayable: newPayable },
      });

      // Post to SupplierLedgerEntry (Credit increases balance)
      await tx.supplierLedgerEntry.create({
        data: {
          supplierId,
          branchId,
          entryType: "DEBIT_NOTE",
          debit: 0,
          credit: totalAmount,
          balance: newPayable,
          referenceType: "DEBIT_NOTE",
          referenceId: created.id,
          documentNumber: debitNoteNumber,
          description: `Debit Note ${debitNoteNumber} on Invoice ${originalInvoiceNumber} - Increased payable (₹${totalAmount})`,
          transactionDate: new Date(),
          createdById,
        },
      });

        // Create PurchaseGSTRecord for Debit Note (ITC addition)
        const periodMonth = new Date().getMonth() + 1;
        const periodYear = new Date().getFullYear();
        const financialYear = periodMonth >= 4 ? `${periodYear}-${periodYear + 1}` : `${periodYear - 1}-${periodYear}`;

        await tx.purchaseGSTRecord.create({
          data: {
            branchId,
            supplierId,
            purchaseInvoiceId,
            purchaseDebitNoteId: created.id,
            financialYear,
            periodMonth,
            periodYear,
            gstin: supplier.gstin || "UNREGISTERED",
            placeOfSupply: supplier.state ? `${supplier.state} (${supplier.stateCode || "19"})` : "West Bengal (19)",
            isInterState: igstAmount > 0,
            taxableValue,
            cgst: cgstAmount,
            sgst: sgstAmount,
            igst: igstAmount,
            totalTax,
            itcEligibility: "ELIGIBLE",
            itcClaimedAmount: totalTax,
            reconciliationStatus: "NOT_RECONCILED",
          },
        });

        return created;
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_RETURNS",
      action: "DEBIT_NOTE_ISSUED",
      entityType: "PURCHASE_DEBIT_NOTE",
      entityId: debitNote.id,
      entityDisplayName: `${debitNote.debitNoteNumber} (₹${totalAmount.toLocaleString("en-IN")})`,
      description: `Debit Note ${debitNote.debitNoteNumber} issued to supplier ${supplier.businessName}. Total: ₹${totalAmount}`,
      after: debitNote,
      severity: "INFO",
    });

    return debitNote;
  }
}
