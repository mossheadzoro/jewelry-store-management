// ===== Aurum ERP — Booking Utility Functions =====

import type { BookingStatus, PaymentMode } from "@/lib/types/booking";

/**
 * Format a number as Indian Rupee currency string.
 * e.g., 1234567 → "₹12,34,567"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as INR with decimals for precise values.
 */
export function formatINRPrecise(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format weight in grams with 2 decimal places.
 * e.g., 45.3 → "45.30g"
 */
export function formatWeight(grams: number): string {
  return `${grams.toFixed(2)}g`;
}

/**
 * Format purity for display.
 * e.g., 0.916 → "22K", 0.999 → "24K", 0.75 → "18K"
 */
export function formatPurity(purity: number): string {
  if (purity >= 0.995) return "24K";
  if (purity >= 0.91) return "22K";
  if (purity >= 0.833) return "20K";
  if (purity >= 0.75) return "18K";
  if (purity >= 0.585) return "14K";
  return `${(purity * 24).toFixed(0)}K`;
}

/**
 * Get the color class for advance percentage.
 * <30% → red, 30–79% → amber, ≥80% → emerald
 */
export function getAdvanceColor(percentage: number): {
  text: string;
  bg: string;
  border: string;
  label: string;
} {
  if (percentage >= 80) {
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      label: "RATE LOCK ELIGIBLE",
    };
  }
  if (percentage >= 30) {
    return {
      text: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
      label: "PARTIAL LOCK",
    };
  }
  return {
    text: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    label: "MINIMUM REQUIRED",
  };
}

/**
 * Get color and icon config for booking status.
 */
export function getStatusConfig(status: BookingStatus): {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
} {
  const configs: Record<BookingStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    ACTIVE: {
      label: "Active",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    RATE_LOCKED: {
      label: "Rate Locked",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      dot: "bg-blue-400",
    },
    PARTIAL_LOCK: {
      label: "Partial Lock",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
      dot: "bg-amber-400",
    },
    DELIVERY_PENDING: {
      label: "Delivery Pending",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/30",
      dot: "bg-blue-400",
    },
    EXPIRED: {
      label: "Expired",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      dot: "bg-red-400",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      dot: "bg-red-400",
    },
    DELIVERED: {
      label: "Delivered",
      color: "text-gold",
      bg: "bg-gold-muted",
      border: "border-gold/30",
      dot: "bg-gold",
    },
  };
  return configs[status];
}

/**
 * Get display label for payment mode.
 */
export function getPaymentModeLabel(mode: PaymentMode): string {
  const labels: Record<PaymentMode, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    BANK_TRANSFER: "Bank Transfer",
    WALLET: "Wallet",
    GOLD_22K: "22K Gold",
    GOLD_24K: "24K Gold",
  };
  return labels[mode];
}

/**
 * Calculate booking value given product weight, purity, rate, and making charge.
 */
export function calcBookingValue(
  ntWeight: number,
  purity: number, // Kept for signature compatibility but not used in math if rate is per gram
  ratePerGram: number,
  makingChargePercent: number
): number {
  const metalValue = ntWeight * ratePerGram;
  const makingCharge = metalValue * (makingChargePercent / 100);
  return Math.round(metalValue + makingCharge);
}

/**
 * Calculate advance percentage.
 */
export function calcAdvancePercent(advanceTotal: number, bookingValue: number): number {
  if (bookingValue <= 0) return 0;
  return Math.min(100, Math.round((advanceTotal / bookingValue) * 100));
}

/**
 * Check if a date is past due.
 */
export function isPastDue(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

/**
 * Check if a date is within N days from now.
 */
export function isWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

/**
 * Generate a unique ID for wizard entries.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
