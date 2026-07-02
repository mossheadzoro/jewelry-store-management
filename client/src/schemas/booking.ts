import { z } from "zod";

export const advanceSchema = z.object({
  advanceType: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "WALLET", "METAL_22K", "METAL_24K"]),
  cashAmount: z.number().optional(),
  paymentRef: z.string().optional(),
  metalWeight: z.number().optional(),
  metalPurity: z.string().optional(),
});

export const bookingItemSchema = z.object({
  productId: z.number(),
  makingChargePercent: z.number().optional().default(0),
});

export const createBookingSchema = z.object({
  customerId: z.number(),
  items: z.array(bookingItemSchema),
  branchId: z.number(),
  rateLockPlanId: z.string().optional(),
  deliveryRatePlan: z.enum(["LOCK_NOW", "SPLIT", "MARKET_RATE", "FIXED_RATE", "OPTION_A_MARKET_RATE", "OPTION_B_15_DAY_LOCK", "OPTION_C_METAL_WALLET", "OPTION_D_FIXED_RATE"]),
  deliveryDueDate: z.string().optional(),
  advances: z.array(advanceSchema),
  bookingRate: z.number().optional(), // manual override
  additionalCharges: z.number().optional().default(0),
});

export const cancelBookingSchema = z.object({
  reason: z.string(),
  refundOption: z.enum(["WALLET", "CASH_REFUND"]),
  notes: z.string().optional(),
});

export const deliverBookingSchema = z.object({
  deliveryType: z.enum(["FULL", "PARTIAL"]),
  walletAmountUsed: z.number().optional(),
  walletMetal24KUsedGrams: z.number().optional(),
  outstandingPaymentMethod: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "WALLET", "METAL_22K", "METAL_24K"]).optional(),
  outstandingPaymentRef: z.string().optional(),
  notes: z.string().optional(),
});

export const transferBookingSchema = z.object({
  toBranchId: z.number(),
  reason: z.string(),
  notes: z.string().optional(),
});

export const extendBookingSchema = z.object({
  newExpiryDate: z.string(),
});
