// client/src/lib/services/purchase/PurchaseBookingService.ts
// Purchase Booking Service — 24K Bullion / Metal Bookings & Rate Locks

import { prisma, MetalCategory, RateSourceType, PurchaseBookingStatus } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { VerificationService } from "./VerificationService";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export interface CreateBookingParams {
  branchId: number;
  supplierId: string;
  metalCategory: MetalCategory;
  purityPercent?: number;
  grossWeight: number; // in grams
  bookingRate: number; // rate per gram
  marketRate?: number; // live MCX / IBJA rate
  rateSource?: RateSourceType;
  isRateOverride?: boolean;
  overrideReason?: string;
  overrideUserId?: number;
  expectedReceiptDate?: Date | string;
  notes?: string;
  createdById: number;
  autoApprove?: boolean;
  reqContext?: any;
  gstCondition?: "WITH_GST" | "WITHOUT_GST";
  calculateGst?: boolean;
}

export class PurchaseBookingService {
  /**
   * Creates a purchase booking with fine weight computation, rate locking, and optional verification.
   */
  public static async createBooking(params: CreateBookingParams) {
    const {
      branchId,
      supplierId,
      metalCategory = "GOLD_24K",
      grossWeight,
      bookingRate,
      marketRate = bookingRate,
      rateSource = "LIVE_MCX",
      isRateOverride = false,
      overrideReason,
      overrideUserId,
      expectedReceiptDate,
      notes,
      createdById,
      autoApprove = false,
      reqContext,
      gstCondition = "WITHOUT_GST",
      calculateGst = true,
    } = params;

    if (grossWeight <= 0) {
      throw new Error("Gross weight must be greater than zero.");
    }
    if (bookingRate <= 0) {
      throw new Error("Booking rate per gram must be greater than zero.");
    }

    // Default purity percentages based on category (24K bullion standard is 99.50% in Indian bullion market)
    let defaultPurity = 99.50;
    if (metalCategory === "GOLD_24K") defaultPurity = 99.50;
    if (metalCategory === "GOLD_22K") defaultPurity = 91.60;
    if (metalCategory === "GOLD_18K") defaultPurity = 75.00;
    if (metalCategory === "GOLD_14K") defaultPurity = 58.50;
    if (metalCategory === "SILVER_999") defaultPurity = 99.90;
    if (metalCategory === "SILVER_925") defaultPurity = 92.50;

    const purityPercent = params.purityPercent || defaultPurity;
    // 24K bullion is 99.50% standard purity as traded. Gross weight is full 24K metal weight (no fining deduction needed).
    const fineWeight = (metalCategory === "GOLD_24K" && purityPercent >= 99.50)
      ? Number(grossWeight.toFixed(3))
      : Number(((grossWeight * purityPercent) / 99.50).toFixed(3));

    // Financial calculations based on Rate Condition (With GST vs Without GST)
    let actualBaseRate: number;
    let taxableValue: number;
    let estimatedGst: number;
    let totalAmount: number;
    let effectiveRate: number;

    if (gstCondition === "WITH_GST") {
      // Entered bookingRate includes 3% GST. Recalculate base rate and GST.
      actualBaseRate = Number((bookingRate / 1.03).toFixed(2));
      totalAmount = Number((grossWeight * bookingRate).toFixed(2));
      taxableValue = Number((totalAmount / 1.03).toFixed(2));
      estimatedGst = Number((totalAmount - taxableValue).toFixed(2));
      effectiveRate = actualBaseRate;
    } else {
      // Entered bookingRate is without GST
      actualBaseRate = bookingRate;
      taxableValue = Number((grossWeight * bookingRate).toFixed(2));
      if (calculateGst) {
        estimatedGst = Number((taxableValue * 0.03).toFixed(2));
        totalAmount = Number((taxableValue + estimatedGst).toFixed(2));
      } else {
        estimatedGst = 0;
        totalAmount = taxableValue;
      }
      effectiveRate = bookingRate;
    }

    const supplier = await prisma.bullionSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new Error(`Bullion supplier ${supplierId} not found.`);
    }

    const bookingNumber = await PurchaseNumberingService.generateNumber("PURCHASE_BOOKING", branchId);

    // Evaluate Verification Trigger: Rate variance against market spot (compared on base rate) > 1.5% or Total Value > ₹1,000,000 or manual override
    const baseRateForComparison = gstCondition === "WITH_GST" ? actualBaseRate : bookingRate;
    const rateDiff = Math.abs(baseRateForComparison - marketRate);
    const rateDiffPct = marketRate > 0 ? (rateDiff / marketRate) * 100 : 0;
    const isHighValue = totalAmount > 1000000;
    const requiresVerification = !autoApprove && (isRateOverride || rateDiffPct > 1.5 || isHighValue);

    const initialStatus = requiresVerification
      ? PurchaseBookingStatus.PENDING_VERIFICATION
      : PurchaseBookingStatus.BOOKED;

    const gstInfo = gstCondition === "WITH_GST"
      ? `[Rate Condition: WITH GST (3% Incl.) | Base Rate: ₹${actualBaseRate}/g | GST: ₹${estimatedGst}]`
      : calculateGst
      ? `[Rate Condition: WITHOUT GST | GST Added: ₹${estimatedGst} (3%)]`
      : `[Rate Condition: WITHOUT GST | GST Not Applied (0%)]`;
    const finalNotes = notes ? `${notes} • ${gstInfo}` : gstInfo;

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseBooking.create({
        data: {
          bookingNumber,
          supplierId,
          branchId,
          bookingDate: new Date(),
          transactionAt: new Date(),
          expectedReceiptDate: expectedReceiptDate ? new Date(expectedReceiptDate) : null,
          metalCategory,
          purityPercent,
          grossWeight,
          fineWeight,
          marketRate,
          bookingRate,
          effectiveRate,
          rateSource,
          rateTimestamp: new Date(),
          isRateLocked: true,
          isRateOverride: isRateOverride || rateDiffPct > 1.5,
          overrideReason: overrideReason || (rateDiffPct > 1.5 ? `Base rate differs from market rate by ${rateDiffPct.toFixed(2)}%` : null),
          overrideUserId,
          taxableValue,
          estimatedGst,
          totalAmount,
          paidAmount: 0,
          balancePayment: totalAmount,
          receivedGrossWeight: 0,
          receivedFineWeight: 0,
          pendingGrossWeight: grossWeight,
          status: initialStatus,
          paymentStatus: "PAYMENT_PENDING",
          metalReceiptStatus: "PENDING",
          notes: finalNotes,
          createdById,
          verifiedById: autoApprove ? createdById : null,
          rateSnapshots: {
            create: {
              marketRate,
              supplierRate: bookingRate,
              finalRate: effectiveRate,
              source: rateSource,
              capturedById: createdById,
              metadata: {
                gstCondition,
                calculateGst: gstCondition === "WITH_GST" ? true : calculateGst,
                gstPercent: (gstCondition === "WITH_GST" || calculateGst) ? 3.0 : 0,
                enteredRate: bookingRate,
                actualBaseRate,
                taxableValue,
                estimatedGst,
                totalAmount,
              },
            },
          },
        },
        include: {
          supplier: true,
          branch: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return created;
    });

    // If verification required, dispatch VerificationRequest
    if (requiresVerification) {
      const verificationItems = [
        {
          itemKey: "BOOKING_RATE",
          label: "Agreed Booking Rate (₹/g)",
          expectedValue: `₹${marketRate.toFixed(2)}`,
          actualValue: `₹${bookingRate.toFixed(2)}`,
          difference: rateDiffPct > 0 ? `${rateDiffPct.toFixed(2)}% variance` : "Standard",
          isFlagged: rateDiffPct > 1.5 || isRateOverride,
          notes: overrideReason,
        },
        {
          itemKey: "GROSS_WEIGHT",
          label: "Booked Gross Weight (g)",
          expectedValue: `${grossWeight.toFixed(3)}g`,
          actualValue: `${grossWeight.toFixed(3)}g`,
          difference: "0.000g",
          isFlagged: false,
        },
        {
          itemKey: "TOTAL_VALUE",
          label: "Total Booking Value (₹)",
          expectedValue: "< ₹1,000,000",
          actualValue: `₹${totalAmount.toLocaleString("en-IN")}`,
          difference: isHighValue ? "High Value Booking" : "Normal",
          isFlagged: isHighValue,
        },
      ];

      const vReq = await VerificationService.createRequest({
        branchId,
        actionType: isRateOverride ? "RATE_OVERRIDE" : "HIGH_VALUE_PURCHASE",
        title: `Bullion Booking Approval: ${bookingNumber} (${grossWeight}g ${metalCategory})`,
        description: `Booking with ${supplier.businessName} for ₹${totalAmount.toLocaleString("en-IN")}`,
        entityType: "PURCHASE_BOOKING",
        entityId: booking.id,
        entityNumber: bookingNumber,
        amount: totalAmount,
        requiredRole: isHighValue ? "ADMIN" : "MANAGER",
        riskLevel: isHighValue ? "HIGH" : "MEDIUM",
        requestedById: createdById,
        items: verificationItems,
        reqContext,
      });

      await prisma.purchaseBooking.update({
        where: { id: booking.id },
        data: { verificationId: vReq.id },
      });
    }

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_BOOKING",
      action: "BOOKING_CREATED",
      entityType: "PURCHASE_BOOKING",
      entityId: booking.id,
      entityDisplayName: `${booking.bookingNumber} (${booking.grossWeight}g ${metalCategory})`,
      description: `Purchase booking ${booking.bookingNumber} created for supplier ${supplier.businessName} at ₹${bookingRate}/g`,
      after: booking,
      severity: isHighValue ? "HIGH" : "INFO",
    });

    return booking;
  }

  /**
   * Retrieves bookings list with rich filtering and aggregations.
   */
  public static async getBookings(params: {
    branchId?: number;
    supplierId?: string;
    status?: string;
    metalCategory?: string;
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
      metalCategory,
      from,
      to,
      search,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (supplierId) where.supplierId = supplierId;
    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        where.status = { in: ["BOOKED", "PARTIALLY_RECEIVED"] };
      } else {
        where.status = status;
      }
    }
    if (metalCategory && metalCategory !== "ALL") where.metalCategory = metalCategory;

    if (from || to) {
      where.bookingDate = {};
      if (from) where.bookingDate.gte = new Date(from);
      if (to) where.bookingDate.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: "insensitive" } },
        { supplier: { businessName: { contains: search, mode: "insensitive" } } },
        { supplier: { code: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.purchaseBooking.count({ where }),
      prisma.purchaseBooking.findMany({
        where,
        include: {
          supplier: true,
          branch: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          verifiedBy: { select: { id: true, name: true } },
          invoices: { select: { id: true, invoiceNumber: true, invoiceTotal: true, status: true } },
          payments: { select: { id: true, paymentNumber: true, amount: true, paymentMethod: true } },
          metalReceipts: { select: { id: true, receiptNumber: true, actualGrossWeight: true, status: true } },
          rateSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, bookings };
  }
}
