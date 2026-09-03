// client/src/lib/services/purchase/PurchaseInvoiceService.ts
// Purchase Invoice Service — Invoices, Itemized Taxes, Supplier Ledgers & GST

import { prisma, MetalCategory, ITCEligibilityType, ITCReconciliationStatus } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export interface PurchaseInvoiceItemInput {
  hsnCode?: string;
  description: string;
  metalCategory: MetalCategory;
  purityPercent?: number;
  grossWeight: number;
  netWeight?: number;
  ratePerGram: number;
}

export interface CreatePurchaseInvoiceParams {
  branchId: number;
  supplierId: string;
  supplierInvoiceNumber: string;
  bookingId?: string;
  invoiceDate?: Date | string;
  placeOfSupply?: string;
  isReverseCharge?: boolean;
  isInterState?: boolean;
  items: PurchaseInvoiceItemInput[];
  notes?: string;
  createdById: number;
  reqContext?: any;
}

export class PurchaseInvoiceService {
  /**
   * Records a Purchase Invoice, computes GST, updates supplier payable, and posts to ledger.
   */
  public static async createInvoice(params: CreatePurchaseInvoiceParams) {
    const {
      branchId,
      supplierId,
      supplierInvoiceNumber,
      bookingId,
      invoiceDate = new Date(),
      placeOfSupply = "West Bengal (19)",
      isReverseCharge = false,
      isInterState = false,
      items,
      notes,
      createdById,
      reqContext,
    } = params;

    if (!items || items.length === 0) {
      throw new Error("Purchase invoice must contain at least one item.");
    }

    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new Error(`Bullion supplier ${supplierId} not found.`);
    }

    // Check duplicate supplier invoice number for this supplier
    const existing = await prisma.purchaseInvoice.findUnique({
      where: {
        supplierId_supplierInvoiceNumber: {
          supplierId,
          supplierInvoiceNumber,
        },
      },
    });
    if (existing) {
      throw new Error(`Invoice number "${supplierInvoiceNumber}" has already been recorded for this supplier.`);
    }

    // Process line items & compute subtotals
    let totalGrossWeight = 0;
    let totalFineWeight = 0;
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const computedItems = items.map((item) => {
      const gross = item.grossWeight;
      const net = item.netWeight || gross;
      let purity = item.purityPercent;
      if (!purity) {
        if (item.metalCategory === "GOLD_24K") purity = 99.50;
        else if (item.metalCategory === "SILVER_999") purity = 99.90;
        else if (item.metalCategory === "GOLD_22K") purity = 91.60;
        else if (item.metalCategory === "GOLD_18K") purity = 75.00;
        else if (item.metalCategory === "GOLD_14K") purity = 58.50;
        else purity = 99.50;
      }

      // 24K bullion is 99.50% standard purity as traded — fine weight equals net weight as 24K metal
      const fine = (item.metalCategory === "GOLD_24K" && purity >= 99.50)
        ? Number(net.toFixed(3))
        : Number(((net * purity) / 99.50).toFixed(3));
      const taxable = Number((gross * item.ratePerGram).toFixed(2));

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = Number((taxable * 0.03).toFixed(2));
      } else {
        cgst = Number((taxable * 0.015).toFixed(2));
        sgst = Number((taxable * 0.015).toFixed(2));
      }

      const lineTotal = Number((taxable + cgst + sgst + igst).toFixed(2));

      totalGrossWeight += gross;
      totalFineWeight += fine;
      totalTaxableValue += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;

      return {
        hsnCode: item.hsnCode || (item.metalCategory.startsWith("GOLD") ? "7108" : "7106"),
        description: item.description || `${item.metalCategory} Bullion / Bar`,
        metalCategory: item.metalCategory,
        purityPercent: purity,
        grossWeight: gross,
        netWeight: net,
        fineWeight: fine,
        ratePerGram: item.ratePerGram,
        taxableValue: taxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalAmount: lineTotal,
      };
    });

    const subTotal = totalTaxableValue + totalCgst + totalSgst + totalIgst;
    const roundedTotal = Math.round(subTotal);
    const roundOff = Number((roundedTotal - subTotal).toFixed(2));
    const invoiceTotal = roundedTotal;

    const invoiceNumber = await PurchaseNumberingService.generateNumber("PURCHASE_INVOICE", branchId);

    const invDateObj = new Date(invoiceDate);
    const periodYear = invDateObj.getFullYear();
    const periodMonth = invDateObj.getMonth() + 1; // 1-12
    const financialYear = periodMonth >= 4
      ? `${periodYear}-${periodYear + 1}`
      : `${periodYear - 1}-${periodYear}`;

    let initialPaidAmount = 0;
    let initialBalanceAmount = invoiceTotal;
    let initialPaymentStatus: PurchasePaymentStatusEnum = "UNPAID";
    let linkedBooking: any = null;

    if (bookingId) {
      linkedBooking = await prisma.purchaseBooking.findUnique({
        where: { id: bookingId },
        include: { payments: true },
      });
      if (linkedBooking) {
        initialPaidAmount = Math.min(invoiceTotal, linkedBooking.paidAmount || 0);
        initialBalanceAmount = Math.max(0, Number((invoiceTotal - initialPaidAmount).toFixed(2)));
        initialPaymentStatus = initialBalanceAmount <= 0 ? "PAID" : initialPaidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID";
      }
    }

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Invoice record
      const created = await tx.purchaseInvoice.create({
        data: {
          invoiceNumber,
          supplierInvoiceNumber,
          supplierId,
          branchId,
          bookingId,
          invoiceDate: invDateObj,
          transactionAt: new Date(),
          placeOfSupply,
          isReverseCharge,
          isInterState,
          totalGrossWeight: Number(totalGrossWeight.toFixed(3)),
          totalFineWeight: Number(totalFineWeight.toFixed(3)),
          taxableValue: Number(totalTaxableValue.toFixed(2)),
          cgstRate: isInterState ? 0 : 1.5,
          sgstRate: isInterState ? 0 : 1.5,
          igstRate: isInterState ? 3.0 : 0,
          cgstAmount: Number(totalCgst.toFixed(2)),
          sgstAmount: Number(totalSgst.toFixed(2)),
          igstAmount: Number(totalIgst.toFixed(2)),
          roundOff,
          invoiceTotal,
          paidAmount: initialPaidAmount,
          balanceAmount: initialBalanceAmount,
          paymentStatus: initialPaymentStatus,
          status: "POSTED",
          notes,
          createdById,
          items: {
            create: computedItems,
          },
        },
        include: {
          items: true,
          supplier: true,
          branch: { select: { id: true, name: true } },
        },
      });

      // 2. Update BullionSupplier payable & statistics
      const newPayable = Number((supplier.currentPayable + invoiceTotal).toFixed(2));
      const newPurchasedValue = Number((supplier.totalPurchasedValue + invoiceTotal).toFixed(2));
      const isGold = computedItems.some(i => i.metalCategory.startsWith("GOLD"));
      const newGoldGm = isGold ? supplier.totalGoldPurchasedGm + totalGrossWeight : supplier.totalGoldPurchasedGm;
      const newSilverGm = !isGold ? supplier.totalSilverPurchasedGm + totalGrossWeight : supplier.totalSilverPurchasedGm;

      await tx.bullionSupplier.update({
        where: { id: supplierId },
        data: {
          currentPayable: newPayable,
          totalPurchasedValue: newPurchasedValue,
          totalGoldPurchasedGm: Number(newGoldGm.toFixed(3)),
          totalSilverPurchasedGm: Number(newSilverGm.toFixed(3)),
        },
      });

      // 3. Post to SupplierLedgerEntry (Credit increases payable)
      await tx.supplierLedgerEntry.create({
        data: {
          supplierId,
          branchId,
          entryType: "PURCHASE_INVOICE",
          debit: 0,
          credit: invoiceTotal,
          balance: newPayable,
          referenceType: "PURCHASE_INVOICE",
          referenceId: created.id,
          documentNumber: invoiceNumber,
          description: `Purchase invoice ${invoiceNumber} (Supplier Ref: ${supplierInvoiceNumber}) - ${totalGrossWeight.toFixed(3)}g`,
          transactionDate: invDateObj,
          transactionAt: new Date(),
          createdById,
        },
      });

      // 4. Create PurchaseGSTRecord for ITC reconciliation
      const totalTax = totalCgst + totalSgst + totalIgst;
      await tx.purchaseGSTRecord.create({
        data: {
          branchId,
          supplierId,
          purchaseInvoiceId: created.id,
          financialYear,
          periodMonth,
          periodYear,
          gstin: supplier.gstin || "UNREGISTERED",
          placeOfSupply,
          isInterState,
          taxableValue: Number(totalTaxableValue.toFixed(2)),
          cgst: Number(totalCgst.toFixed(2)),
          sgst: Number(totalSgst.toFixed(2)),
          igst: Number(totalIgst.toFixed(2)),
          totalTax: Number(totalTax.toFixed(2)),
          itcEligibility: isReverseCharge ? ITCEligibilityType.INELIGIBLE : ITCEligibilityType.ELIGIBLE,
          itcClaimedAmount: isReverseCharge ? 0 : Number(totalTax.toFixed(2)),
          reconciliationStatus: ITCReconciliationStatus.NOT_RECONCILED,
        },
      });

      // 5. If linked to a booking, link payments, receipts, and update booking status appropriately
      if (bookingId) {
        await tx.purchasePayment.updateMany({
          where: { purchaseBookingId: bookingId, purchaseInvoiceId: null },
          data: { purchaseInvoiceId: created.id },
        });

        await tx.purchaseMetalReceipt.updateMany({
          where: { purchaseBookingId: bookingId, purchaseInvoiceId: null },
          data: { purchaseInvoiceId: created.id },
        });

        if (linkedBooking) {
          const isFullyDelivered = linkedBooking.metalReceiptStatus === "FULLY_RECEIVED" || linkedBooking.pendingGrossWeight <= 0.05;
          const isFullySettled = initialBalanceAmount <= 0;
          const targetStatus = (isFullyDelivered && isFullySettled) || linkedBooking.status === "CLOSED" ? "CLOSED" : "BOOKED";

          await tx.purchaseBooking.update({
            where: { id: bookingId },
            data: {
              status: targetStatus,
            },
          });
        }
      }

      return created;
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_INVOICE",
      action: "INVOICE_RECORDED",
      entityType: "PURCHASE_INVOICE",
      entityId: invoice.id,
      entityDisplayName: `${invoice.invoiceNumber} (₹${invoice.invoiceTotal.toLocaleString("en-IN")})`,
      description: `Purchase invoice ${invoice.invoiceNumber} recorded for supplier ${supplier.businessName}. Total: ₹${invoiceTotal}`,
      after: invoice,
      severity: invoiceTotal > 1000000 ? "HIGH" : "INFO",
    });

    return invoice;
  }

  /**
   * Retrieves invoices list with search, filters and pagination.
   */
  public static async getInvoices(params: {
    branchId?: number;
    supplierId?: string;
    status?: string;
    paymentStatus?: string;
    from?: string | Date;
    to?: string | Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      branchId,
      supplierId,
      status,
      paymentStatus,
      from,
      to,
      search,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (supplierId) where.supplierId = supplierId;
    if (status && status !== "ALL") where.status = status;
    if (paymentStatus && paymentStatus !== "ALL") where.paymentStatus = paymentStatus;

    if (from || to) {
      where.invoiceDate = {};
      if (from) where.invoiceDate.gte = new Date(from);
      if (to) where.invoiceDate.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { supplierInvoiceNumber: { contains: search, mode: "insensitive" } },
        { supplier: { businessName: { contains: search, mode: "insensitive" } } },
        { supplier: { gstin: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.purchaseInvoice.count({ where }),
      prisma.purchaseInvoice.findMany({
        where,
        include: {
          supplier: true,
          branch: { select: { id: true, name: true } },
          items: true,
          payments: { select: { id: true, paymentNumber: true, amount: true, paymentMethod: true, paymentDate: true } },
          metalReceipts: { select: { id: true, receiptNumber: true, actualGrossWeight: true, status: true } },
          creditNotes: { select: { id: true, creditNoteNumber: true, totalAmount: true } },
          debitNotes: { select: { id: true, debitNoteNumber: true, totalAmount: true } },
          documents: { select: { id: true, documentNumber: true, documentType: true, storageUrl: true } },
        },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, invoices };
  }
}
