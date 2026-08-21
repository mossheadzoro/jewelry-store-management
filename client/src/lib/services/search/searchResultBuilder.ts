// ============================================================================
// Search Result Builder — Transforms raw Prisma results into SearchResultDTO
// ============================================================================
// - Minimum necessary fields (no PAN/Aadhaar leakage)
// - Masked sensitive data
// - Computed metrics
// - Navigation URLs
// ============================================================================

import { SearchResultDTO, Badge, Metric, MatchType, SearchEntityType } from '@/lib/types/search';
import { calculateScore } from './resultRanking';

// --- Masking Utilities ---

function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return '—';
  if (mobile.length <= 4) return mobile;
  return '●●●●●●' + mobile.slice(-4);
}

function maskPan(pan: string | null | undefined): string {
  if (!pan) return '';
  return pan.slice(0, 2) + '●●●●●' + pan.slice(-1);
}

// --- Badge Helpers ---

function paymentBadge(isFullyPaid?: boolean): Badge {
  return isFullyPaid
    ? { label: 'PAID', variant: 'success' }
    : { label: 'UNPAID', variant: 'warning' };
}

function statusBadge(status: string): Badge {
  const map: Record<string, Badge['variant']> = {
    CREATED: 'outline',
    ASSIGNED: 'default',
    IN_PROGRESS: 'default',
    COMPLETED: 'success',
    DELIVERED: 'success',
    CANCELLED: 'destructive',
    RETURNED: 'destructive',
    ACTIVE: 'success',
    RATE_LOCKED: 'gold',
    EXPIRED: 'destructive',
    MATURED: 'success',
    REDEEMED: 'success',
    OPEN: 'default',
    CLOSED: 'outline',
  };
  return { label: status, variant: map[status] || 'outline' };
}

// --- Format Helpers ---

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatWeight(grams: number | null | undefined): string {
  if (grams == null) return '0g';
  return `${grams.toFixed(2)}g`;
}

// ============================================================================
// Entity-specific builders
// ============================================================================

export function buildCustomerResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  const invoiceCount = raw._count?.invoices ?? 0;
  const orderCount = raw._count?.Order ?? 0;

  return {
    id: raw.id,
    entityType: 'customer',
    title: raw.name,
    subtitle: `CUST-${raw.id}`,
    description: `${maskMobile(raw.mobile)} · ${raw.city || '—'}`,
    badges: [],
    metrics: [
      { label: 'Outstanding', value: formatCurrency(raw.walletBalance) },
      { label: 'Invoices', value: String(invoiceCount) },
      { label: 'Orders', value: String(orderCount) },
    ],
    branchName,
    branchId: 0,  // Customers aren't branch-specific
    navigationUrl: `/customer/${raw.id}`,
    matchType,
    score: calculateScore(matchType, 'customer', raw.createdAt),
  };
}

export function buildProductResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  const categoryName = raw.subCategory?.category?.name || '';
  const subCategoryName = raw.subCategory?.name || '';

  return {
    id: raw.id,
    entityType: 'product',
    title: raw.name,
    subtitle: raw.productCode,
    description: [
      categoryName,
      subCategoryName,
      raw.huidNumber ? `HUID: ${raw.huidNumber}` : null,
      `${formatWeight(raw.gsWeight)} Gross`,
    ].filter(Boolean).join(' · '),
    badges: raw.quantity <= 0
      ? [{ label: 'OUT OF STOCK', variant: 'destructive' as const }]
      : [],
    metrics: [
      { label: 'Net Wt', value: formatWeight(raw.ntWeight) },
      { label: 'Purity', value: `${raw.purity}` },
      { label: 'Qty', value: String(raw.quantity ?? 0) },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/inventory`,
    matchType,
    score: calculateScore(matchType, 'product', raw.createdAt),
  };
}

export function buildInvoiceResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'invoice',
    title: raw.invoiceNumber,
    subtitle: raw.customer?.name || `Customer #${raw.customerId}`,
    description: [
      formatCurrency(raw.totalAmount),
      new Date(raw.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    ].join(' · '),
    badges: [paymentBadge(raw.isFullyPaid)],
    metrics: [
      { label: 'Total', value: formatCurrency(raw.totalAmount) },
      { label: 'Paid', value: formatCurrency(raw.paidAmount) },
      { label: 'Balance', value: formatCurrency(raw.balanceAmount) },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/sales`,
    matchType,
    score: calculateScore(matchType, 'invoice', raw.createdAt, raw.totalAmount),
  };
}

export function buildOrderResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'order',
    title: raw.orderNumber,
    subtitle: raw.customerName || `Customer #${raw.customerId}`,
    description: [
      raw.status,
      raw.priority !== 'STANDARD' ? raw.priority : null,
      `Due: ${new Date(raw.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    ].filter(Boolean).join(' · '),
    badges: [statusBadge(raw.status)],
    metrics: [
      { label: 'Priority', value: raw.priority },
      { label: 'Items', value: String(raw.items?.length ?? 0) },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/orderBook`,
    matchType,
    score: calculateScore(matchType, 'order', raw.createdAt),
  };
}

export function buildBookingResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'booking',
    title: raw.bookingNumber,
    subtitle: raw.Customer?.name || `Customer #${raw.customerId}`,
    description: [
      formatCurrency(raw.grandTotal),
      raw.status,
      raw.bookingGoldRate ? `Rate: ₹${raw.bookingGoldRate}/g` : null,
    ].filter(Boolean).join(' · '),
    badges: [statusBadge(raw.status)],
    metrics: [
      { label: 'Total', value: formatCurrency(raw.grandTotal) },
      { label: 'Advance', value: formatCurrency(raw.totalAdvance) },
      { label: 'Weight', value: formatWeight(raw.totalWeightGrams) },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/book-products/${raw.id}`,
    matchType,
    score: calculateScore(matchType, 'booking', raw.createdAt, raw.grandTotal),
  };
}

export function buildKarigarResult(
  raw: any,
  matchType: MatchType,
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'karigar',
    title: raw.name,
    subtitle: raw.department,
    description: [
      maskMobile(raw.phoneNumber),
      raw.speciality?.join(', '),
    ].filter(Boolean).join(' · '),
    badges: raw.isActive
      ? [{ label: 'ACTIVE', variant: 'success' as const }]
      : [{ label: 'INACTIVE', variant: 'outline' as const }],
    metrics: [
      { label: 'Active Jobs', value: String(raw._count?.jobs ?? 0) },
    ],
    branchName: '',
    branchId: 0,
    navigationUrl: `/karigar`,
    matchType,
    score: calculateScore(matchType, 'karigar', raw.createdAt),
  };
}

export function buildWholesalerResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'wholesaler',
    title: raw.name,
    subtitle: raw.code,
    description: [
      raw.city,
      raw.ownerName ? `Owner: ${raw.ownerName}` : null,
    ].filter(Boolean).join(' · '),
    badges: raw.isActive
      ? [{ label: 'ACTIVE', variant: 'success' as const }]
      : [{ label: 'INACTIVE', variant: 'outline' as const }],
    metrics: [
      { label: 'Gold Bal', value: formatWeight(raw.goldBal) },
      { label: 'Silver Bal', value: formatWeight(raw.silverBal) },
      { label: 'Cash Bal', value: formatCurrency(raw.moneyBal) },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/wholesaler/${raw.id}`,
    matchType,
    score: calculateScore(matchType, 'wholesaler', raw.createdAt),
  };
}

export function buildSchemeResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'scheme',
    title: raw.schemeNumber,
    subtitle: raw.customer?.name || `Customer #${raw.customerId}`,
    description: [
      raw.type,
      `Deposited: ${formatCurrency(raw.totalCashDeposited)}`,
    ].join(' · '),
    badges: [statusBadge(raw.status)],
    metrics: [
      { label: 'Cash', value: formatCurrency(raw.totalCashDeposited) },
      { label: 'Gold', value: formatWeight(raw.totalGoldDepositedGm) },
      { label: 'Deposits', value: String(raw.depositCount) },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/saving-schemes`,
    matchType,
    score: calculateScore(matchType, 'scheme', raw.createdAt, raw.totalCashDeposited),
  };
}

export function buildHuidResult(
  raw: any,
  matchType: MatchType,
  branchName: string = '',
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'huid',
    title: raw.huidNumber || 'Unknown HUID',
    subtitle: raw.name || raw.productCode || '',
    description: [
      raw.subCategory?.category?.name,
      raw.subCategory?.name,
      formatWeight(raw.gsWeight),
    ].filter(Boolean).join(' · '),
    badges: raw.quantity <= 0
      ? [{ label: 'SOLD', variant: 'outline' as const }]
      : [{ label: 'IN STOCK', variant: 'success' as const }],
    metrics: [
      { label: 'Net Wt', value: formatWeight(raw.ntWeight) },
      { label: 'Purity', value: `${raw.purity}` },
    ],
    branchName,
    branchId: raw.branchId,
    navigationUrl: `/inventory`,
    matchType,
    score: calculateScore(matchType, 'huid', raw.createdAt),
  };
}

export function buildAdvanceResult(
  raw: any,
  matchType: MatchType,
): SearchResultDTO {
  return {
    id: raw.id,
    entityType: 'advance',
    title: raw.advanceReceiptNumber,
    subtitle: raw.customer?.name || `Customer #${raw.customerId}`,
    description: [
      raw.moneyAmount ? formatCurrency(raw.moneyAmount) : null,
      raw.metalWeight ? `Metal: ${formatWeight(raw.metalWeight)}` : null,
      raw.isApplied ? 'Applied' : 'Pending',
    ].filter(Boolean).join(' · '),
    badges: [
      raw.isApplied
        ? { label: 'APPLIED', variant: 'success' as const }
        : { label: 'PENDING', variant: 'warning' as const },
    ],
    metrics: [
      { label: 'Amount', value: formatCurrency(raw.moneyAmount) },
      { label: 'Metal', value: formatWeight(raw.metalWeight) },
    ],
    branchName: '',
    branchId: 0,
    navigationUrl: `/orderBook`,
    matchType,
    score: calculateScore(matchType, 'advance', raw.createdAt, raw.moneyAmount),
  };
}
