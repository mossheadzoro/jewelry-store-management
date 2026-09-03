// src/lib/services/returns/TaxDocumentService.ts
// GST Credit Note & Debit Note Generation and Immutability Engine

import { prisma } from "@/lib/prisma";
import { ReturnNumberingService } from "./ReturnNumberingService";

export interface CreateTaxDocumentParams {
  transactionId?: string;
  originalInvoiceId: number;
  branchId: number;
  customerId: number;
  documentType: "CREDIT_NOTE" | "DEBIT_NOTE";
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount?: number;
  cessAmount?: number;
  totalAmount: number;
  reason?: string;
  customDate?: Date;
}

export class TaxDocumentService {
  /**
   * Creates an immutable GST Credit Note or Debit Note record inside a Prisma transaction.
   */
  public static async createTaxDocument(tx: any, params: CreateTaxDocumentParams) {
    const {
      transactionId,
      originalInvoiceId,
      branchId,
      customerId,
      documentType,
      taxableValue,
      cgstAmount,
      sgstAmount,
      igstAmount = 0,
      cessAmount = 0,
      totalAmount,
      reason,
      customDate = new Date(),
    } = params;

    // Fetch original invoice with branch and customer details for snapshots
    const invoice = await tx.invoice.findUnique({
      where: { id: originalInvoiceId },
      include: {
        branch: { include: { settings: true } },
        customer: true,
      },
    });

    if (!invoice) {
      throw new Error(`Original invoice ${originalInvoiceId} not found.`);
    }

    // Generate unique, financial-year sequence number
    const { documentNumber, financialYear } = await ReturnNumberingService.generateDocumentNumber(
      tx,
      branchId,
      documentType,
      customDate
    );

    // Build immutable Supplier snapshot
    const branchSettings = invoice.branch.settings;
    const supplierSnapshot = {
      shopName: branchSettings?.shopName || invoice.branch.name,
      branchName: invoice.branch.name,
      gstin: branchSettings?.gstNumber || "UNREGISTERED",
      pan: branchSettings?.pan || null,
      address: branchSettings?.address || invoice.branch.address,
      city: invoice.branch.city,
      state: invoice.branch.state,
      pincode: invoice.branch.pincode,
      phone: branchSettings?.phoneNumbers || invoice.branch.phone,
      email: branchSettings?.email || invoice.branch.email,
    };

    // Build immutable Recipient snapshot
    const recipientSnapshot = {
      name: invoice.customer.name,
      mobile: invoice.customer.mobile,
      gstin: invoice.customer.gstin || null,
      pan: invoice.customer.pan || null,
      address: invoice.customer.address,
      city: invoice.customer.city,
      state: invoice.customer.state,
      pincode: invoice.customer.pincode,
    };

    const placeOfSupply = `${invoice.branch.state} (${invoice.branch.city})`;
    const totalTax = cgstAmount + sgstAmount + igstAmount + cessAmount;

    // Persist TaxDocument
    const taxDoc = await tx.taxDocument.create({
      data: {
        documentNumber,
        financialYear,
        documentType,
        issueDate: customDate,
        branchId,
        customerId,
        transactionId: transactionId || null,
        originalInvoiceId,
        originalInvoiceNumber: invoice.invoiceNumber,
        originalInvoiceDate: invoice.createdAt,
        supplierSnapshot,
        recipientSnapshot,
        recipientGstin: invoice.customer.gstin || null,
        placeOfSupply,
        reason: reason || "Return of Goods under Rule 46 / Section 34 CGST Act",
        taxableValue,
        cgstAmount,
        sgstAmount,
        igstAmount,
        cessAmount,
        totalTax,
        totalAmount,
        status: "ISSUED",
        reportingStatus: "PENDING",
      },
    });

    return taxDoc;
  }

  /**
   * Retrieves a single TaxDocument with all relations.
   */
  public static async getTaxDocument(idOrNumber: string) {
    const doc = await prisma.taxDocument.findFirst({
      where: {
        OR: [
          { id: idOrNumber },
          { documentNumber: idOrNumber },
        ],
      },
      include: {
        branch: { include: { settings: true } },
        customer: true,
        originalInvoice: {
          include: {
            items: { include: { product: true } },
          },
        },
        transaction: {
          include: {
            items: {
              include: {
                originalInvoiceItem: { include: { product: true } },
                originalProductItem: true,
                photos: true,
              },
            },
          },
        },
      },
    });

    return doc;
  }
}
