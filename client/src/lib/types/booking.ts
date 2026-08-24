// ===== Aurum ERP — Product Booking Type System =====

export type BookingStatus =
  | "ACTIVE"
  | "RATE_LOCKED"
  | "PARTIAL_LOCK"
  | "DELIVERY_PENDING"
  | "EXPIRED"
  | "CANCELLED"
  | "DELIVERED";

export type PaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "BANK_TRANSFER"
  | "WALLET"
  | "GOLD_22K"
  | "GOLD_24K"
  | "METAL_22K"
  | "METAL_24K";

export type CustomerTier = "ELITE" | "VIP" | "GOLD" | "SILVER" | "REGULAR";

export type DeliveryRatePlan =
  | "LOCK_NOW"
  | "SPLIT"
  | "MARKET_RATE"
  | "FIXED_RATE"
  | "OPTION_A_MARKET_RATE"
  | "OPTION_B_15_DAY_LOCK"
  | "OPTION_C_METAL_WALLET"
  | "OPTION_D_FIXED_RATE";

export type CancellationReason =
  | "CUSTOMER_REQUEST"
  | "RATE_DISSATISFACTION"
  | "PRODUCT_NOT_AVAILABLE"
  | "BRANCH_TRANSFER"
  | "OTHER";

export type RefundOption = "WALLET" | "REFUND_WITH_DEDUCTION";

// ----- Rate Lock Plans -----

export interface RateLockPlan {
  id: string;
  name: string;
  lockPeriodDays: number;
  minAdvancePercent: number;
  advanceRequiredToLock: number; // ₹ amount
  description?: string;
}

// ----- Gold Rate -----

export interface GoldRate {
  rate22K: number;
  rate24K: number;
  timestamp: string;
  change22K: number; // +/- from previous
  change24K: number;
}

// ----- Customer -----

export interface BookingCustomer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  gender?: string;
  city?: string;
  tier: CustomerTier;
  walletBalance: number;
  totalBookings: number;
}

// ----- Product -----

export interface BookingProduct {
  id: number;
  productCode: string;
  name: string;
  image?: string;
  gsWeight: number;
  ntWeight: number;
  purity: number;
  makingChargePercent: number;
  currentMarketValue: number;
  category: string;
  subCategory: string;
  branchId: number;
  branchName: string;
}

// ----- Advance / Payment -----

export interface BookingAdvance {
  id: string;
  date: string;
  type: PaymentMode;
  amount: number;
  metalWeight?: number;
  metalRate?: number;
  paymentRef?: string;
  branchName: string;
  receivedBy: string;
}

// ----- Booking -----

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: number;
  customer: BookingCustomer;
  items: any[];
  subTotal: number;
  additionalCharges: number;
  gstAmount: number;
  grandTotal: number;
  branchId: number;
  branchName: string;
  status: BookingStatus;
  bookingDate: string;
  bookingRate: number; // rate per gram at booking time
  currentRate: number;
  advanceTotal: number;
  advancePercent: number;
  lockedValue: number;
  lockedRate: number;
  rateLockPlan?: RateLockPlan;
  deliveryRatePlan: DeliveryRatePlan;
  deliveryDueDate: string;
  validityDate: string;
  advances: BookingAdvance[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ----- Booking List Item (lighter for tables) -----

export interface BookingListItem {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerTier: CustomerTier;
  customerAvatar?: string;
  productCode: string;
  productName: string;
  productThumbnail?: string;
  branchName: string;
  bookingDate: string;
  bookingValue: number;
  advanceReceived: number;
  advancePercent: number;
  lockedValue: number;
  rateLockStatus: BookingStatus;
  deliveryDueDate: string;
  status: BookingStatus;
}

// ----- Dashboard KPIs -----

export interface BookingKPI {
  label: string;
  value: number | string;
  trend?: number; // percentage change
  trendDirection?: "up" | "down" | "flat";
  suffix?: string;
  prefix?: string;
  subLabel?: string;
}

export interface BookingDashboardStats {
  totalActive: BookingKPI;
  rateLocked: BookingKPI;
  deliveryDueThisWeek: BookingKPI;
  expiredBookings: BookingKPI;
  bookingRevenue: BookingKPI;
  advanceCollected: BookingKPI;
  goldAdvanceWeight: BookingKPI;
  walletLiability: BookingKPI;
}

// ----- Chart Data -----

export interface BookingTrendPoint {
  date: string;
  bookings: number;
}

export interface DailyAdvancePoint {
  date: string;
  cash: number;
  upi: number;
  card: number;
  gold: number;
}

export interface DeliveryPipelinePoint {
  period: string;
  count: number;
}

export interface CancellationTrendPoint {
  date: string;
  cancellations: number;
}

export interface BookingChartData {
  bookingTrend: BookingTrendPoint[];
  dailyAdvances: DailyAdvancePoint[];
  deliveryPipeline: DeliveryPipelinePoint[];
  cancellationTrend: CancellationTrendPoint[];
}

// ----- Ledger Entry -----

export interface LedgerEntry {
  id: string;
  date: string;
  type: "BOOKING_CREATED" | "ADVANCE_ADDED" | "WALLET_USED" | "RATE_LOCKED" | "CANCELLATION" | "REFUND" | "DELIVERY";
  description: string;
  amount: number;
  isCredit: boolean;
  staffName: string;
}

// ----- Audit Log -----

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  changedBy: string;
  details: Record<string, unknown>;
}

// ----- Timeline Item -----

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: "booking" | "rate_lock" | "advance" | "ready" | "delivery" | "cancel";
  staffName?: string;
  metadata?: Record<string, unknown>;
}

// ----- Wizard State -----

export interface WizardAdvanceEntry {
  id: string;
  mode: PaymentMode;
  amount: number;
  metalWeight?: number;
  metalRate?: number;
  paymentRef?: string;
}

export interface BookingWizardState {
  step: number;
  selectedCustomer: BookingCustomer | null;
  selectedProduct: BookingProduct | null;
  rateLockPlan: RateLockPlan | null;
  deliveryRatePlan: DeliveryRatePlan | null;
  advances: WizardAdvanceEntry[];
  bookingValue: number;
  bookingRate: number;
}

// ----- API Params -----

export interface BookingListParams {
  page: number;
  limit: number;
  search?: string;
  status?: BookingStatus[];
  branch?: string[];
  dateFrom?: string;
  dateTo?: string;
  rateLocked?: boolean;
  expiredOnly?: boolean;
  readyForDelivery?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BookingListResponse {
  bookings: BookingListItem[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// ----- Transfer -----

export interface TransferRequest {
  bookingId: string;
  destinationBranchId: number;
  reason: string;
  notes?: string;
  transferDate: string;
}

// ----- Cancellation -----

export interface CancellationRequest {
  bookingId: string;
  refundOption: RefundOption;
  cancellationReason: CancellationReason;
  notes?: string;
  refundPaymentMethod?: PaymentMode;
}

// ----- Delivery -----

export interface DeliverySettlement {
  bookingId: string;
  lockedPortionValue: number;
  deliveryPortionValue: number;
  walletUsed: number;
  outstanding: number;
  paymentMode?: PaymentMode;
  paymentRef?: string;
}
