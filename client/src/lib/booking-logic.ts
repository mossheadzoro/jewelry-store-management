import { PrismaClient, RateLockPlan, ProductBooking, RateLockStatus } from "@prisma/client";

// Determine rate lock status from advance % (Rule 4 & 5)
export function getRateLockStatus(advancePercent: number): RateLockStatus {
  // Rule 4: Advance >= 80% gets FULL_LOCK for 15 days
  if (advancePercent >= 80) return 'FULL_LOCK';
  // Rule 5: Advance < 80% gets PARTIAL_LOCK
  return 'PARTIAL_LOCK';
}

// Calculate metal advance value
export function metalAdvanceValue(weightGrams: number, purity: '22K' | '24K', ratePerGram22K: number): number {
  const purityFactor = purity === '24K' ? (24 / 22) : 1;
  return weightGrams * ratePerGram22K * purityFactor;
}

export function calculateDeliverySettlement(
  booking: ProductBooking & { items: any[] },
  currentRate: number,
  walletUsed: number
) {
  // Base fixed costs (Making Charges + Additional Charges + GST)
  // We assume these do not fluctuate with gold rate at delivery
  // Metal Value at Booking = sum(item.weightGrams * item.purity) * bookingGoldRate
  let totalMetalWeight = 0;
  for (const item of booking.items) {
    totalMetalWeight += item.weightGrams * item.purity;
  }
  
  const bookingRate = booking.lockedRate || booking.bookingGoldRate;
  const originalMetalValue = totalMetalWeight * bookingRate;
  const fixedCharges = booking.grandTotal - originalMetalValue;

  let lockedMetalValue = 0;

  if (booking.deliveryRatePlan === "OPTION_A_MARKET_RATE" || booking.deliveryRatePlan === "MARKET_RATE") {
    lockedMetalValue = 0;
  } else if (booking.deliveryRatePlan === "OPTION_D_FIXED_RATE" || booking.deliveryRatePlan === "FIXED_RATE") {
    lockedMetalValue = originalMetalValue;
  } else if (booking.deliveryRatePlan === "OPTION_B_15_DAY_LOCK") {
    const isExpired = Date.now() > new Date(booking.expiryDate).getTime();
    if (booking.rateLockStatus === "FULL_LOCK" && !isExpired) {
      lockedMetalValue = originalMetalValue;
    } else {
      lockedMetalValue = 0;
    }
  } else if (booking.deliveryRatePlan === "OPTION_C_METAL_WALLET") {
    // Option C uses the wallet metal at delivery.
    // It's effectively market rate here, and the API will deduct the metal from the wallet.
    lockedMetalValue = 0;
  } else {
    // Legacy support
    const isExpired = Date.now() > new Date(booking.expiryDate).getTime();
    if (booking.rateLockStatus === "FULL_LOCK" && !isExpired) {
      lockedMetalValue = originalMetalValue;
    } else {
      lockedMetalValue = Math.min(booking.totalAdvance, originalMetalValue);
    }
  }

  const unlockedMetalValueAtBooking = originalMetalValue - lockedMetalValue;
  const unlockedMetalWeight = unlockedMetalValueAtBooking / bookingRate;
  const deliveryUnlockedMetalValue = unlockedMetalWeight * currentRate;

  const finalTotal = lockedMetalValue + deliveryUnlockedMetalValue + fixedCharges;
  const outstanding = Math.max(0, finalTotal - booking.totalAdvance - walletUsed);
  
  return { 
    lockedValue: lockedMetalValue, 
    deliveryValue: deliveryUnlockedMetalValue, 
    finalTotal, 
    outstanding 
  };
}

// Generate booking number
export async function generateBookingNumber(prisma: PrismaClient): Promise<string> {
  const now = new Date();
  const prefix = `BKG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await prisma.productBooking.count({ where: { bookingNumber: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}
