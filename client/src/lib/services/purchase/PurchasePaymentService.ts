// client/src/lib/services/purchase/PurchasePaymentService.ts
// Purchase Payment Management — Advances, Invoices, Cheques, Idempotency & Ledgers

import { prisma, PaymentMethod, PurchasePaymentType, ChequeStatus } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { VerificationService } from "./VerificationService";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export interface RecordPurchasePaymentParams {
  branchId: number;
  supplierId: string;
  purchaseInvoiceId?: string;
  purchaseBookingId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType?: PurchasePaymentType;
  referenceNumber?: string;
  chequeNumber?: string;
  chequeDate?: Date | string;
  bankName?: string;
  transactionId?: string;
  paymentDate?: Date | string;
  idempotencyKey?: string;
  notes?: string;
  createdById: number;
  autoApprove?: boolean;
  reqContext?: any;
}

export class PurchasePaymentService {
  /**
   * Records a payment to a bullion supplier, decrements payable balance, and updates invoice/booking.
   */
  public static async recordPayment(params: RecordPurchasePaymentParams) {
    const {
      branchId,
      supplierId,
      purchaseInvoiceId,
      purchaseBookingId,
      amount,
      paymentMethod = "NEFT",
      paymentType = "INVOICE_PAYMENT",
      referenceNumber,
      chequeNumber,
      chequeDate,
      bankName,
      transactionId,
      paymentDate = new Date(),
      idempotencyKey,
      notes,
      createdById,
      autoApprove = false,
      reqContext,
    } = params;

    if (amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    // Check idempotency
    if (idempotencyKey) {
      const existingPayment = await prisma.purchasePayment.findUnique({
        where: { idempotencyKey },
        include: { supplier: true, invoice: true, booking: true },
      });
      if (existingPayment) {
        return existingPayment;
      }
    }

    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new Error(`Bullion supplier ${supplierId} not found.`);
    }

    // Compliance Check: Section 269ST Income Tax Act limits cash receipt/payment to < ₹200,000 per day/event
    const isHighCash = paymentMethod === "CASH" && amount >= 200000;
    const isHighValue = amount >= 1000000;
    const requiresVerification = !autoApprove && (isHighCash || isHighValue);

    const paymentNumber = await PurchaseNumberingService.generateNumber("PURCHASE_PAYMENT", branchId);
    const payDateObj = new Date(paymentDate);

    const initialStatus = requiresVerification ? "PENDING" : "COMPLETED";

    const normalizedPaymentType: PurchasePaymentType =
      (paymentType as string) === "ADVANCE_BOOKING" || (paymentType as string) === "ADVANCE" || (!purchaseInvoiceId && !!purchaseBookingId)
        ? PurchasePaymentType.ADVANCE
        : (paymentType as PurchasePaymentType) || PurchasePaymentType.INVOICE_PAYMENT;

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const created = await tx.purchasePayment.create({
        data: {
          paymentNumber,
          supplierId,
          branchId,
          purchaseInvoiceId,
          purchaseBookingId,
          amount,
          paymentMethod,
          paymentType: normalizedPaymentType,
          referenceNumber,
          chequeNumber,
          chequeDate: chequeDate ? new Date(chequeDate) : null,
          chequeStatus: chequeNumber ? ChequeStatus.ISSUED : null,
          bankName,
          transactionId,
          paymentDate: payDateObj,
          transactionAt: new Date(),
          status: initialStatus,
          idempotencyKey,
          notes,
          createdById,
          verifiedById: autoApprove ? createdById : null,
        },
        include: {
          supplier: true,
          invoice: true,
          booking: true,
        },
      });

      // 2. Decrement supplier payable balance
      const newPayable = Number((supplier.currentPayable - amount).toFixed(2));
      await tx.bullionSupplier.update({
        where: { id: supplierId },
        data: { currentPayable: newPayable },
      });

      // 3. Post to SupplierLedgerEntry (Debit reduces payable)
      await tx.supplierLedgerEntry.create({
        data: {
          supplierId,
          branchId,
          entryType: paymentType === "ADVANCE" ? "ADVANCE" : "PAYMENT",
          debit: amount,
          credit: 0,
          balance: newPayable,
          referenceType: "PURCHASE_PAYMENT",
          referenceId: created.id,
          documentNumber: paymentNumber,
          description: `Payment ${paymentNumber} via ${paymentMethod} (${referenceNumber || chequeNumber || "Direct"}) - ₹${amount.toLocaleString("en-IN")}`,
          transactionDate: payDateObj,
          transactionAt: new Date(),
          createdById,
        },
      });

      // 4. If linked to Purchase Invoice, update invoice balance
      if (purchaseInvoiceId) {
        const inv = await tx.purchaseInvoice.findUnique({
          where: { id: purchaseInvoiceId },
        });
        if (inv) {
          const newPaid = Number((inv.paidAmount + amount).toFixed(2));
          const newBal = Math.max(0, Number((inv.invoiceTotal - newPaid).toFixed(2)));
          const payStatus = newBal <= 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";

          await tx.purchaseInvoice.update({
            where: { id: purchaseInvoiceId },
            data: {
              paidAmount: newPaid,
              balanceAmount: newBal,
              paymentStatus: payStatus,
            },
          });
        }
      }

      // 5. If linked to Purchase Booking, update booking balance
      if (purchaseBookingId) {
        const bk = await tx.purchaseBooking.findUnique({
          where: { id: purchaseBookingId },
        });
        if (bk) {
          const newPaid = Number((bk.paidAmount + amount).toFixed(2));
          const newBal = Math.max(0, Number((bk.totalAmount - newPaid).toFixed(2)));
          const payStatus = newBal <= 0 ? "FULLY_PAID" : newPaid > 0 ? "PARTIAL_PAYMENT" : "PAYMENT_PENDING";

          await tx.purchaseBooking.update({
            where: { id: purchaseBookingId },
            data: {
              paidAmount: newPaid,
              balancePayment: newBal,
              paymentStatus: payStatus,
            },
          });
        }
      }

      return created;
    });

    // Verification trigger if high cash or high value
    if (requiresVerification) {
      const vReq = await VerificationService.createRequest({
        branchId,
        actionType: isHighCash ? "CASH_PAYMENT_THRESHOLD" : "PAYMENT_THRESHOLD",
        title: `Payment Authorization: ${paymentNumber} (₹${amount.toLocaleString("en-IN")} via ${paymentMethod})`,
        description: `Supplier payment to ${supplier.businessName}`,
        entityType: "PURCHASE_PAYMENT",
        entityId: payment.id,
        entityNumber: paymentNumber,
        amount,
        requiredRole: "ADMIN",
        riskLevel: isHighCash ? "CRITICAL" : "HIGH",
        reason: isHighCash ? "Cash payment equals or exceeds statutory threshold ₹200,000" : "High value disbursement",
        requestedById: createdById,
        items: [
          {
            itemKey: "PAYMENT_AMOUNT",
            label: "Payment Amount",
            expectedValue: "< ₹200,000 (Cash limit)",
            actualValue: `₹${amount.toLocaleString("en-IN")}`,
            difference: `₹${amount.toLocaleString("en-IN")}`,
            isFlagged: isHighCash,
          },
          {
            itemKey: "PAYMENT_METHOD",
            label: "Payment Method",
            expectedValue: "BANK / RTGS",
            actualValue: paymentMethod,
            isFlagged: isHighCash,
          },
        ],
        reqContext,
      });

      await prisma.purchasePayment.update({
        where: { id: payment.id },
        data: { verificationId: vReq.id },
      });
    }

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_PAYMENT",
      action: "PAYMENT_RECORDED",
      entityType: "PURCHASE_PAYMENT",
      entityId: payment.id,
      entityDisplayName: `${payment.paymentNumber} (₹${payment.amount.toLocaleString("en-IN")})`,
      description: `Payment of ₹${amount} recorded for supplier ${supplier.businessName} via ${paymentMethod}`,
      after: payment,
      severity: isHighCash || isHighValue ? "HIGH" : "INFO",
    });

    return payment;
  }

  /**
   * Updates cheque status (CLEARED, BOUNCED, CANCELLED).
   */
  public static async updateChequeStatus(paymentId: string, chequeStatus: ChequeStatus, actorId: number) {
    const payment = await prisma.purchasePayment.findUnique({
      where: { id: paymentId },
      include: { supplier: true },
    });
    if (!payment) throw new Error(`Payment ${paymentId} not found.`);

    const updated = await prisma.$transaction(async (tx) => {
      // If bounced, reverse supplier payable credit
      if (chequeStatus === ChequeStatus.BOUNCED || chequeStatus === ChequeStatus.CANCELLED) {
        if (payment.chequeStatus !== ChequeStatus.BOUNCED && payment.chequeStatus !== ChequeStatus.CANCELLED) {
          const newPayable = Number((payment.supplier.currentPayable + payment.amount).toFixed(2));
          await tx.bullionSupplier.update({
            where: { id: payment.supplierId },
            data: { currentPayable: newPayable },
          });

          await tx.supplierLedgerEntry.create({
            data: {
              supplierId: payment.supplierId,
              branchId: payment.branchId,
              entryType: "ADJUSTMENT",
              debit: 0,
              credit: payment.amount,
              balance: newPayable,
              referenceType: "PURCHASE_PAYMENT",
              referenceId: payment.id,
              documentNumber: payment.paymentNumber,
              description: `Cheque ${payment.chequeNumber || payment.paymentNumber} ${chequeStatus} - Reversed payable adjustment`,
              transactionDate: new Date(),
              createdById: actorId,
            },
          });
        }
      }

      return tx.purchasePayment.update({
        where: { id: paymentId },
        data: { chequeStatus },
      });
    });

    return updated;
  }

  /**
   * Retrieves payments list with filters.
   */
  public static async getPayments(params: {
    branchId?: number;
    supplierId?: string;
    paymentMethod?: string;
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
      paymentMethod,
      status,
      from,
      to,
      search,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (supplierId) where.supplierId = supplierId;
    if (paymentMethod && paymentMethod !== "ALL") where.paymentMethod = paymentMethod as any;
    if (status && status !== "ALL") where.status = status as any;

    if (from || to) {
      where.paymentDate = {};
      if (from) where.paymentDate.gte = new Date(from);
      if (to) where.paymentDate.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: "insensitive" } },
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { chequeNumber: { contains: search, mode: "insensitive" } },
        { supplier: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.purchasePayment.count({ where }),
      prisma.purchasePayment.findMany({
        where,
        include: {
          supplier: true,
          branch: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true, invoiceTotal: true } },
          booking: { select: { id: true, bookingNumber: true, totalAmount: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, payments };
  }
}
