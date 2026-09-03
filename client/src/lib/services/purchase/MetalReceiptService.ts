// client/src/lib/services/purchase/MetalReceiptService.ts
// Physical Metal Receiving, Weight Tolerance Verification & Inventory Intake

import { prisma, MetalCategory } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { VerificationService } from "./VerificationService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { insertLedgerEntry } from "@/lib/inventoryLedger";
import { PurchaseInvoiceService } from "./PurchaseInvoiceService";

export interface RecordMetalReceiptParams {
  branchId: number;
  supplierId: string;
  purchaseInvoiceId?: string;
  purchaseBookingId?: string;
  supplierInvoiceNumber?: string;
  metalCategory: MetalCategory;
  purityPercent?: number;
  expectedGrossWeight: number; // from supplier slip / invoice
  actualGrossWeight: number;   // weighed on in-store certified scale
  lotBatchNo?: string;
  purityTestingResult?: string;
  testCertificateNo?: string;
  notes?: string;
  receivedById: number;
  autoApprove?: boolean;
  reqContext?: any;
}

export class MetalReceiptService {
  /**
   * Records physical metal intake, checks weight discrepancy, updates booking/invoice and posts to InventoryLedger.
   */
  public static async recordReceipt(params: RecordMetalReceiptParams) {
    const {
      branchId,
      supplierId,
      purchaseInvoiceId,
      purchaseBookingId,
      metalCategory = "GOLD_24K",
      expectedGrossWeight,
      actualGrossWeight,
      lotBatchNo,
      purityTestingResult,
      testCertificateNo,
      notes,
      receivedById,
      autoApprove = false,
      reqContext,
    } = params;

    if (actualGrossWeight <= 0) {
      throw new Error("Actual gross weight must be greater than zero.");
    }

    let defaultPurity = 99.50;
    let karatage = 24;
    if (metalCategory === "GOLD_24K") { defaultPurity = 99.50; karatage = 24; }
    else if (metalCategory === "GOLD_22K") { defaultPurity = 91.60; karatage = 22; }
    else if (metalCategory === "GOLD_18K") { defaultPurity = 75.00; karatage = 18; }
    else if (metalCategory === "GOLD_14K") { defaultPurity = 58.50; karatage = 14; }
    else if (metalCategory === "SILVER_999") { defaultPurity = 99.90; karatage = 0; }
    else if (metalCategory === "SILVER_925") { defaultPurity = 92.50; karatage = 0; }

    const purityPercent = params.purityPercent || defaultPurity;
    // 24K bullion is 99.50% standard — fine weight equals gross weight for 24K metal
    const expectedFineWeight = (metalCategory === "GOLD_24K" && purityPercent >= 99.50)
      ? Number(expectedGrossWeight.toFixed(3))
      : Number(((expectedGrossWeight * purityPercent) / 99.50).toFixed(3));
    const actualFineWeight = (metalCategory === "GOLD_24K" && purityPercent >= 99.50)
      ? Number(actualGrossWeight.toFixed(3))
      : Number(((actualGrossWeight * purityPercent) / 99.50).toFixed(3));
    const weightDifference = Number((actualGrossWeight - expectedGrossWeight).toFixed(3));

    // Tolerance check: Weight difference exceeds ±0.050g for bullion bars
    const isWeightDiscrepancy = Math.abs(weightDifference) > 0.050;
    const requiresVerification = !autoApprove && isWeightDiscrepancy;

    const receiptNumber = await PurchaseNumberingService.generateNumber("METAL_RECEIPT", branchId);
    const initialStatus = requiresVerification ? "PARTIALLY_RECEIVED" : "RECEIVED";

    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new Error(`Bullion supplier ${supplierId} not found.`);

    // Find or create standard Bullion Product Item for inventory tracking
    let bullionProduct = await prisma.productItem.findFirst({
      where: {
        branchId,
        productCode: `BULLION-${metalCategory}`,
      },
    });

    if (!bullionProduct) {
      // Find subcategory or first available
      const subCategory = await prisma.subCategory.findFirst({
        where: { category: { branchId } },
      }) || await prisma.subCategory.findFirst();

      if (subCategory) {
        bullionProduct = await prisma.productItem.create({
          data: {
            branchId,
            subCategoryId: subCategory.id,
            name: `${metalCategory.replace("_", " ")} Raw Bullion Bar`,
            productCode: `BULLION-${metalCategory}`,
            barcode: `BUL-${metalCategory}-${branchId}-${Date.now().toString().slice(-4)}`,
            gsWeight: actualGrossWeight,
            ntWeight: actualGrossWeight,
            purity: purityPercent,
            quantity: 1,
            allowNegativeStock: true,
          },
        });
      }
    }

    const receipt = await prisma.$transaction(async (tx) => {
      // 1. Create PurchaseMetalReceipt record
      const created = await tx.purchaseMetalReceipt.create({
        data: {
          receiptNumber,
          supplierId,
          receivingBranchId: branchId,
          purchaseInvoiceId,
          purchaseBookingId,
          metalCategory,
          purityPercent,
          expectedGrossWeight,
          actualGrossWeight,
          expectedFineWeight,
          actualFineWeight,
          weightDifference,
          receiptDate: new Date(),
          receivedAt: new Date(),
          lotBatchNo: lotBatchNo || `LOT-${receiptNumber}`,
          purityTestingResult,
          testCertificateNo,
          isWeightDiscrepancy,
          discrepancyReason: isWeightDiscrepancy
            ? `Weight discrepancy of ${weightDifference > 0 ? "+" : ""}${weightDifference.toFixed(3)}g exceeds standard tolerance (±0.050g)`
            : null,
          status: initialStatus,
          notes,
          receivedById,
          verifiedById: autoApprove ? receivedById : null,
        },
        include: {
          supplier: true,
          branch: { select: { id: true, name: true } },
          receivedBy: { select: { id: true, name: true } },
        },
      });

      // 2. Post atomic entry to InventoryLedger
      if (bullionProduct) {
        await insertLedgerEntry(
          tx,
          {
            productId: bullionProduct.id,
            branchId,
            txnType: "PURCHASE_IN",
            refType: "PURCHASE",
            refId: created.id,
            qtyIn: 1,
            grossWeightIn: actualGrossWeight,
            netWeightIn: actualGrossWeight,
            unitCost: 0,
            totalValue: 0,
            remarks: `Metal receipt ${receiptNumber} from ${supplier.businessName} (${metalCategory} ${actualGrossWeight.toFixed(3)}g)`,
            createdById: receivedById,
          },
          {
            karatage,
            purityPercent,
            batchLotNo: lotBatchNo || created.lotBatchNo || undefined,
            hallmarkCertNo: testCertificateNo || undefined,
          }
        );

        // Update productItem physical stock
        await tx.productItem.update({
          where: { id: bullionProduct.id },
          data: {
            gsWeight: { increment: actualGrossWeight },
            ntWeight: { increment: actualGrossWeight },
            quantity: { increment: 1 },
          },
        });
      }

      // 3. Update PurchaseBooking received progress
      if (purchaseBookingId) {
        const bk = await tx.purchaseBooking.findUnique({
          where: { id: purchaseBookingId },
        });
        if (bk) {
          const newGrossReceived = Number((bk.receivedGrossWeight + actualGrossWeight).toFixed(3));
          const newFineReceived = Number((bk.receivedFineWeight + actualFineWeight).toFixed(3));
          const newPendingGross = Math.max(0, Number((bk.grossWeight - newGrossReceived).toFixed(3)));
          const receiptStatus = newPendingGross <= 0.050 ? "FULLY_RECEIVED" : "PARTIALLY_RECEIVED";

          await tx.purchaseBooking.update({
            where: { id: purchaseBookingId },
            data: {
              receivedGrossWeight: newGrossReceived,
              receivedFineWeight: newFineReceived,
              pendingGrossWeight: newPendingGross,
              metalReceiptStatus: receiptStatus,
              status: receiptStatus === "FULLY_RECEIVED" && bk.paymentStatus === "FULLY_PAID" ? "CLOSED" : bk.status,
            },
          });
        }
      }

      // 4. Update PurchaseInvoice metal status
      if (purchaseInvoiceId) {
        await tx.purchaseInvoice.update({
          where: { id: purchaseInvoiceId },
          data: { metalReceiptStatus: "FULLY_RECEIVED" },
        });
      }

      return created;
    });

    // Auto-generate or link Purchase Invoice for booking intake
    if (purchaseBookingId && !purchaseInvoiceId) {
      try {
        const bk = await prisma.purchaseBooking.findUnique({
          where: { id: purchaseBookingId },
          include: { rateSnapshots: true, invoices: true },
        });

        if (bk && bk.invoices.length === 0) {
          const rateSnapshot = bk.rateSnapshots?.[0]?.metadata as any;
          const isWithGst = rateSnapshot?.gstCondition === "WITH_GST" || bk.notes?.includes("WITH GST");
          const ratePerGram = isWithGst && bk.effectiveRate ? bk.effectiveRate : bk.bookingRate;

          const invNumber = params.supplierInvoiceNumber?.trim() || `BILL-${receiptNumber}`;

          const invoice = await PurchaseInvoiceService.createInvoice({
            branchId,
            supplierId,
            supplierInvoiceNumber: invNumber,
            bookingId: purchaseBookingId,
            invoiceDate: new Date(),
            placeOfSupply: supplier.state ? `${supplier.state} (${supplier.stateCode || "19"})` : "West Bengal (19)",
            isInterState: false,
            isReverseCharge: false,
            items: [
              {
                hsnCode: metalCategory.startsWith("GOLD") ? "7108" : "7106",
                description: `${metalCategory.replace("_", " ")} Raw Bullion Bar (${bk.bookingNumber})`,
                metalCategory,
                purityPercent,
                grossWeight: actualGrossWeight,
                netWeight: actualGrossWeight,
                ratePerGram,
              },
            ],
            notes: `Auto-generated on metal intake ${receiptNumber} for Booking ${bk.bookingNumber}`,
            createdById: receivedById,
            reqContext,
          });

          await prisma.purchaseMetalReceipt.update({
            where: { id: receipt.id },
            data: { purchaseInvoiceId: invoice.id },
          });

          (receipt as any).purchaseInvoiceId = invoice.id;
        } else if (bk && bk.invoices.length > 0) {
          await prisma.purchaseMetalReceipt.update({
            where: { id: receipt.id },
            data: { purchaseInvoiceId: bk.invoices[0].id },
          });
          (receipt as any).purchaseInvoiceId = bk.invoices[0].id;
        }
      } catch (invErr) {
        console.error("Failed to auto-generate purchase invoice for metal receipt:", invErr);
      }
    }

    // Verification trigger if discrepancy exists
    if (requiresVerification) {
      const vReq = await VerificationService.createRequest({
        branchId,
        actionType: "WEIGHT_DISCREPANCY",
        title: `Weight Variance Alert: ${receiptNumber} (${weightDifference > 0 ? "+" : ""}${weightDifference.toFixed(3)}g)`,
        description: `Physical scale intake discrepancy on ${receiptNumber} from ${supplier.businessName}`,
        entityType: "METAL_RECEIPT",
        entityId: receipt.id,
        entityNumber: receiptNumber,
        requiredRole: "MANAGER",
        riskLevel: Math.abs(weightDifference) > 0.5 ? "HIGH" : "MEDIUM",
        reason: `Weight variance of ${weightDifference.toFixed(3)}g between invoice and certified scale`,
        requestedById: receivedById,
        items: [
          {
            itemKey: "EXPECTED_WEIGHT",
            label: "Expected Gross Weight",
            expectedValue: `${expectedGrossWeight.toFixed(3)}g`,
            actualValue: `${actualGrossWeight.toFixed(3)}g`,
            difference: `${weightDifference > 0 ? "+" : ""}${weightDifference.toFixed(3)}g`,
            isFlagged: true,
            notes: "Certified digital scale reading",
          },
        ],
        reqContext,
      });

      await prisma.purchaseMetalReceipt.update({
        where: { id: receipt.id },
        data: { verificationId: vReq.id },
      });
    }

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_RECEIVING",
      action: "METAL_RECEIVED",
      entityType: "METAL_RECEIPT",
      entityId: receipt.id,
      entityDisplayName: `${receipt.receiptNumber} (${actualGrossWeight.toFixed(3)}g ${metalCategory})`,
      description: `Physical metal intake ${receipt.receiptNumber} recorded from ${supplier.businessName}. Weighed: ${actualGrossWeight}g`,
      after: receipt,
      severity: isWeightDiscrepancy ? "HIGH" : "INFO",
    });

    return receipt;
  }

  /**
   * Retrieves receipts list with search and pagination.
   */
  public static async getReceipts(params: {
    branchId?: number;
    supplierId?: string;
    status?: string;
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
      from,
      to,
      search,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};
    if (branchId) where.receivingBranchId = branchId;
    if (supplierId) where.supplierId = supplierId;
    if (status && status !== "ALL") where.status = status as any;

    if (from || to) {
      where.receiptDate = {};
      if (from) where.receiptDate.gte = new Date(from);
      if (to) where.receiptDate.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { lotBatchNo: { contains: search, mode: "insensitive" } },
        { supplier: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, receipts] = await Promise.all([
      prisma.purchaseMetalReceipt.count({ where }),
      prisma.purchaseMetalReceipt.findMany({
        where,
        include: {
          supplier: true,
          branch: { select: { id: true, name: true } },
          receivedBy: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          booking: { select: { id: true, bookingNumber: true } },
        },
        orderBy: { receiptDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, receipts };
  }
}
