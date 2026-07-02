// ===== Aurum ERP — Realistic Mock Data for Booking Module =====

import type {
  Booking,
  BookingListItem,
  BookingDashboardStats,
  BookingChartData,
  BookingTrendPoint,
  DailyAdvancePoint,
  DeliveryPipelinePoint,
  CancellationTrendPoint,
  GoldRate,
  BookingCustomer,
  BookingProduct,
  BookingAdvance,
  RateLockPlan,
  LedgerEntry,
  AuditLogEntry,
  TimelineItem,
  BookingStatus,
} from "@/lib/types/booking";

// ----- Gold Rate -----

export const mockGoldRate: GoldRate = {
  rate22K: 6850,
  rate24K: 7475,
  timestamp: new Date().toISOString(),
  change22K: 45,
  change24K: 52,
};

// ----- Rate Lock Plans -----

export const mockRateLockPlans: RateLockPlan[] = [
  {
    id: "plan-15d",
    name: "15-Day Lock",
    lockPeriodDays: 15,
    minAdvancePercent: 30,
    advanceRequiredToLock: 25000,
    description: "Short-term rate protection. Rate expires in 15 days. Advance must reach 80% to extend.",
  },
  {
    id: "plan-30d",
    name: "30-Day Lock",
    lockPeriodDays: 30,
    minAdvancePercent: 50,
    advanceRequiredToLock: 50000,
    description: "Standard lock with 30-day protection window.",
  },
  {
    id: "plan-60d",
    name: "60-Day Premium Lock",
    lockPeriodDays: 60,
    minAdvancePercent: 60,
    advanceRequiredToLock: 75000,
    description: "Extended protection for high-value bookings. Includes 1 free extension.",
  },
  {
    id: "plan-90d",
    name: "90-Day Elite Lock",
    lockPeriodDays: 90,
    minAdvancePercent: 80,
    advanceRequiredToLock: 100000,
    description: "Maximum protection for elite clientele. Full rate guarantee.",
  },
];

// ----- Mock Customers -----

export const mockCustomers: BookingCustomer[] = [
  { id: 1, name: "Priya Sharma", mobile: "9876543210", email: "priya@email.com", gender: "Female", city: "Mumbai", tier: "ELITE", walletBalance: 125000, totalBookings: 14 },
  { id: 2, name: "Rajesh Mehta", mobile: "9876543211", email: "rajesh@email.com", gender: "Male", city: "Ahmedabad", tier: "VIP", walletBalance: 45000, totalBookings: 8 },
  { id: 3, name: "Anjali Patel", mobile: "9876543212", email: "anjali@email.com", gender: "Female", city: "Surat", tier: "GOLD", walletBalance: 18000, totalBookings: 5 },
  { id: 4, name: "Vikram Singh", mobile: "9876543213", gender: "Male", city: "Delhi", tier: "SILVER", walletBalance: 5000, totalBookings: 3 },
  { id: 5, name: "Meera Joshi", mobile: "9876543214", email: "meera@email.com", gender: "Female", city: "Pune", tier: "REGULAR", walletBalance: 0, totalBookings: 1 },
  { id: 6, name: "Arjun Kapoor", mobile: "9876543215", gender: "Male", city: "Jaipur", tier: "VIP", walletBalance: 67000, totalBookings: 11 },
  { id: 7, name: "Nisha Agarwal", mobile: "9876543216", email: "nisha@email.com", gender: "Female", city: "Kolkata", tier: "GOLD", walletBalance: 22000, totalBookings: 6 },
  { id: 8, name: "Suresh Reddy", mobile: "9876543217", gender: "Male", city: "Hyderabad", tier: "ELITE", walletBalance: 250000, totalBookings: 22 },
];

// ----- Mock Products -----

export const mockProducts: BookingProduct[] = [
  { id: 101, productCode: "GN-22K-001", name: "Lakshmi Temple Necklace", gsWeight: 52.5, ntWeight: 48.2, purity: 0.916, makingChargePercent: 14, currentMarketValue: 345000, category: "Necklace", subCategory: "Temple", branchId: 1, branchName: "Main Branch", image: undefined },
  { id: 102, productCode: "GB-22K-012", name: "Antique Kundan Bangle Set", gsWeight: 38.0, ntWeight: 35.8, purity: 0.916, makingChargePercent: 18, currentMarketValue: 280000, category: "Bangle", subCategory: "Kundan", branchId: 1, branchName: "Main Branch", image: undefined },
  { id: 103, productCode: "GR-22K-045", name: "Solitaire Diamond Ring", gsWeight: 8.2, ntWeight: 6.5, purity: 0.75, makingChargePercent: 22, currentMarketValue: 95000, category: "Ring", subCategory: "Diamond", branchId: 1, branchName: "Main Branch", image: undefined },
  { id: 104, productCode: "GE-22K-023", name: "Chandbali Earrings", gsWeight: 18.5, ntWeight: 16.8, purity: 0.916, makingChargePercent: 16, currentMarketValue: 125000, category: "Earring", subCategory: "Traditional", branchId: 2, branchName: "Mall Branch", image: undefined },
  { id: 105, productCode: "GC-24K-007", name: "24K Gold Coin (10g)", gsWeight: 10.0, ntWeight: 10.0, purity: 0.999, makingChargePercent: 3, currentMarketValue: 77000, category: "Coin", subCategory: "Bullion", branchId: 1, branchName: "Main Branch", image: undefined },
  { id: 106, productCode: "GP-22K-088", name: "Bridal Choker Set", gsWeight: 85.0, ntWeight: 78.3, purity: 0.916, makingChargePercent: 12, currentMarketValue: 565000, category: "Necklace", subCategory: "Bridal", branchId: 1, branchName: "Main Branch", image: undefined },
  { id: 107, productCode: "GM-22K-034", name: "Mangalsutra Chain", gsWeight: 22.0, ntWeight: 20.5, purity: 0.916, makingChargePercent: 10, currentMarketValue: 145000, category: "Chain", subCategory: "Mangalsutra", branchId: 2, branchName: "Mall Branch", image: undefined },
  { id: 108, productCode: "GA-22K-056", name: "Antique Armlet (Bajuband)", gsWeight: 32.0, ntWeight: 29.4, purity: 0.916, makingChargePercent: 20, currentMarketValue: 228000, category: "Armlet", subCategory: "Traditional", branchId: 1, branchName: "Main Branch", image: undefined },
];

// ----- Helper to generate dates -----

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ----- Mock Advances -----

function makeAdvances(bookingId: string): BookingAdvance[] {
  return [
    { id: `${bookingId}-adv-1`, date: daysAgo(10), type: "CASH", amount: 50000, branchName: "Main Branch", receivedBy: "Ravi Kumar" },
    { id: `${bookingId}-adv-2`, date: daysAgo(5), type: "UPI", amount: 30000, paymentRef: "UPI-REF-45692", branchName: "Main Branch", receivedBy: "Ravi Kumar" },
    { id: `${bookingId}-adv-3`, date: daysAgo(2), type: "GOLD_22K", amount: 68500, metalWeight: 10, metalRate: 6850, branchName: "Main Branch", receivedBy: "Sunita Devi" },
  ];
}

// ----- Build 12 mock bookings -----

const statuses: BookingStatus[] = ["ACTIVE", "RATE_LOCKED", "PARTIAL_LOCK", "DELIVERY_PENDING", "EXPIRED", "CANCELLED", "DELIVERED", "ACTIVE", "RATE_LOCKED", "EXPIRED", "ACTIVE", "DELIVERY_PENDING"];

export const mockBookings: Booking[] = statuses.map((status, i) => {
  const cust = mockCustomers[i % mockCustomers.length];
  const prod = mockProducts[i % mockProducts.length];
  const advances = makeAdvances(`BK-${String(1001 + i)}`);
  const advanceTotal = advances.reduce((s, a) => s + a.amount, 0);
  const bookingValue = prod.currentMarketValue;
  return {
    id: `bk-${i + 1}`,
    bookingNumber: `BK-${String(1001 + i).padStart(6, "0")}`,
    customerId: cust.id,
    customer: cust,
    productId: prod.id,
    product: prod,
    branchId: prod.branchId,
    branchName: prod.branchName,
    status,
    bookingDate: daysAgo(30 - i * 2),
    bookingValue,
    bookingRate: 6780 + i * 15,
    currentRate: mockGoldRate.rate22K,
    advanceTotal,
    advancePercent: Math.min(100, Math.round((advanceTotal / bookingValue) * 100)),
    lockedValue: status === "RATE_LOCKED" ? bookingValue : status === "PARTIAL_LOCK" ? Math.round(bookingValue * 0.5) : 0,
    lockedRate: status === "RATE_LOCKED" || status === "PARTIAL_LOCK" ? 6780 + i * 15 : 0,
    rateLockPlan: status === "RATE_LOCKED" ? mockRateLockPlans[1] : status === "PARTIAL_LOCK" ? mockRateLockPlans[0] : undefined,
    deliveryRatePlan: status === "RATE_LOCKED" ? "LOCK_NOW" : status === "PARTIAL_LOCK" ? "SPLIT" : "MARKET_RATE",
    deliveryDueDate: status === "EXPIRED" ? daysAgo(3) : daysFromNow(7 + i * 3),
    validityDate: daysFromNow(30 + i * 5),
    advances,
    createdBy: "Ravi Kumar",
    createdAt: daysAgo(30 - i * 2),
    updatedAt: daysAgo(1),
  };
});

// ----- Mock Booking List Items -----

export const mockBookingListItems: BookingListItem[] = mockBookings.map((b) => ({
  id: b.id,
  bookingNumber: b.bookingNumber,
  customerName: b.customer.name,
  customerTier: b.customer.tier,
  productCode: b.product.productCode,
  productName: b.product.name,
  branchName: b.branchName,
  bookingDate: b.bookingDate,
  bookingValue: b.bookingValue,
  advanceReceived: b.advanceTotal,
  advancePercent: b.advancePercent,
  lockedValue: b.lockedValue,
  rateLockStatus: b.status,
  deliveryDueDate: b.deliveryDueDate,
  status: b.status,
}));

// ----- Dashboard Stats -----

export const mockDashboardStats: BookingDashboardStats = {
  totalActive: { label: "Total Active Bookings", value: 47, trend: 12, trendDirection: "up" },
  rateLocked: { label: "Rate Locked Bookings", value: 18, trend: 38, trendDirection: "up", suffix: "%" , subLabel: "of active" },
  deliveryDueThisWeek: { label: "Delivery Due This Week", value: 5, trend: -2, trendDirection: "down" },
  expiredBookings: { label: "Expired Bookings", value: 3, trend: 1, trendDirection: "up" },
  bookingRevenue: { label: "Booking Revenue", value: "₹2,34,50,000", prefix: "₹", subLabel: "This Month" },
  advanceCollected: { label: "Advance Collected", value: "₹89,20,000", prefix: "₹" },
  goldAdvanceWeight: { label: "Gold Advance Weight", value: "245.8g", subLabel: "22K: 198.3g · 24K: 47.5g" },
  walletLiability: { label: "Wallet Balance Liability", value: "₹15,60,000", prefix: "₹" },
};

// ----- Chart Data -----

function generateTrendData(): BookingTrendPoint[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i).split("T")[0],
    bookings: Math.floor(Math.random() * 8) + 2,
  }));
}

function generateAdvanceData(): DailyAdvancePoint[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i).split("T")[0],
    cash: Math.floor(Math.random() * 200000) + 50000,
    upi: Math.floor(Math.random() * 150000) + 30000,
    card: Math.floor(Math.random() * 100000) + 10000,
    gold: Math.floor(Math.random() * 300000),
  }));
}

function generateCancellationData(): CancellationTrendPoint[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i).split("T")[0],
    cancellations: Math.floor(Math.random() * 3),
  }));
}

export const mockChartData: BookingChartData = {
  bookingTrend: generateTrendData(),
  dailyAdvances: generateAdvanceData(),
  deliveryPipeline: [
    { period: "This Week", count: 5 },
    { period: "Next Week", count: 8 },
    { period: "Later", count: 14 },
  ],
  cancellationTrend: generateCancellationData(),
};

// ----- Ledger Entries -----

export function getMockLedger(bookingId: string): LedgerEntry[] {
  return [
    { id: "led-1", date: daysAgo(30), type: "BOOKING_CREATED", description: "Booking created with initial product reservation", amount: 345000, isCredit: false, staffName: "Ravi Kumar" },
    { id: "led-2", date: daysAgo(28), type: "ADVANCE_ADDED", description: "Cash advance received", amount: 50000, isCredit: true, staffName: "Ravi Kumar" },
    { id: "led-3", date: daysAgo(20), type: "ADVANCE_ADDED", description: "UPI advance received (REF: UPI-45692)", amount: 30000, isCredit: true, staffName: "Ravi Kumar" },
    { id: "led-4", date: daysAgo(15), type: "RATE_LOCKED", description: "Rate locked at ₹6,850/g for 30 days", amount: 0, isCredit: false, staffName: "Sunita Devi" },
    { id: "led-5", date: daysAgo(5), type: "ADVANCE_ADDED", description: "22K Gold advance (10g @ ₹6,850/g)", amount: 68500, isCredit: true, staffName: "Sunita Devi" },
    { id: "led-6", date: daysAgo(2), type: "WALLET_USED", description: "Wallet balance applied", amount: 15000, isCredit: true, staffName: "Ravi Kumar" },
  ];
}

// ----- Audit Log -----

export function getMockAuditLog(bookingId: string): AuditLogEntry[] {
  return [
    { id: "aud-1", timestamp: daysAgo(30), action: "Booking Created", changedBy: "Ravi Kumar", details: { status: "ACTIVE", bookingValue: 345000 } },
    { id: "aud-2", timestamp: daysAgo(28), action: "Advance Added", changedBy: "Ravi Kumar", details: { type: "CASH", amount: 50000, newAdvancePercent: "14%" } },
    { id: "aud-3", timestamp: daysAgo(20), action: "Advance Added", changedBy: "Ravi Kumar", details: { type: "UPI", amount: 30000, ref: "UPI-45692" } },
    { id: "aud-4", timestamp: daysAgo(15), action: "Rate Locked", changedBy: "Sunita Devi", details: { plan: "30-Day Lock", rate: 6850, validUntil: daysFromNow(15) } },
    { id: "aud-5", timestamp: daysAgo(5), action: "Advance Added", changedBy: "Sunita Devi", details: { type: "GOLD_22K", weight: "10g", rate: 6850, value: 68500 } },
    { id: "aud-6", timestamp: daysAgo(2), action: "Status Changed", changedBy: "System", details: { from: "ACTIVE", to: "RATE_LOCKED" } },
  ];
}

// ----- Timeline -----

export function getMockTimeline(bookingId: string): TimelineItem[] {
  return [
    { id: "tl-1", date: daysAgo(30), title: "Booking Created", description: "Product reserved and booking initiated", type: "booking", staffName: "Ravi Kumar" },
    { id: "tl-2", date: daysAgo(28), title: "Advance Received — ₹50,000", description: "Cash payment", type: "advance", staffName: "Ravi Kumar" },
    { id: "tl-3", date: daysAgo(20), title: "Advance Received — ₹30,000", description: "UPI payment (REF: UPI-45692)", type: "advance", staffName: "Ravi Kumar" },
    { id: "tl-4", date: daysAgo(15), title: "Rate Locked at ₹6,850/g", description: "30-Day Lock plan activated", type: "rate_lock", staffName: "Sunita Devi", metadata: { rate: 6850, plan: "30-Day Lock" } },
    { id: "tl-5", date: daysAgo(5), title: "Gold Advance — 10g (22K)", description: "Metal advance valued at ₹68,500", type: "advance", staffName: "Sunita Devi" },
    { id: "tl-6", date: daysAgo(1), title: "Ready For Delivery", description: "All conditions met, awaiting final settlement", type: "ready", staffName: "Ravi Kumar" },
  ];
}

// ----- Expired bookings by period -----

export const mockExpiredToday: BookingListItem[] = mockBookingListItems.filter((b) => b.status === "EXPIRED").slice(0, 2);
export const mockExpiredThisWeek: BookingListItem[] = [
  ...mockExpiredToday,
  { ...mockBookingListItems[3], status: "EXPIRED", bookingNumber: "BK-001015", deliveryDueDate: daysAgo(5) },
];
export const mockExpiredThisMonth: BookingListItem[] = [
  ...mockExpiredThisWeek,
  { ...mockBookingListItems[6], status: "EXPIRED", bookingNumber: "BK-001018", deliveryDueDate: daysAgo(15) },
  { ...mockBookingListItems[7], status: "EXPIRED", bookingNumber: "BK-001019", deliveryDueDate: daysAgo(22) },
];
