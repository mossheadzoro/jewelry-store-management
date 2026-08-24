// ============================================================================
// Entity Searchers — Stage 1 (Instant) + Stage 2 (Expanded)
// ============================================================================
// Each searcher knows:
// - Which fields to query
// - Which fields to select (minimum for DTO)
// - How to apply branch scoping
// ============================================================================

import { prisma } from "@/lib/prisma";
import { SearchPermissionScope, SearchResultDTO } from '@/lib/types/search';
import { determineMatchType } from './resultRanking';
import {
  buildCustomerResult,
  buildProductResult,
  buildInvoiceResult,
  buildOrderResult,
  buildBookingResult,
  buildKarigarResult,
  buildWholesalerResult,
  buildSchemeResult,
  buildHuidResult,
  buildAdvanceResult,
  buildRfidTagResult,
} from './searchResultBuilder';

// Utility: get branch name map for display
async function getBranchNameMap(): Promise<Record<number, string>> {
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(branches.map((b: { id: number; name: string }) => [b.id, b.name]));
}

let _branchNameCache: Record<number, string> | null = null;
let _branchCacheTime = 0;

async function branchNameMap(): Promise<Record<number, string>> {
  // Cache for 60 seconds
  if (_branchNameCache && Date.now() - _branchCacheTime < 60000) {
    return _branchNameCache;
  }
  _branchNameCache = await getBranchNameMap();
  _branchCacheTime = Date.now();
  return _branchNameCache;
}

// ============================================================================
// STAGE 1: Instant Search (5 entities)
// ============================================================================

export async function searchCustomers(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  // Build where clause
  const where: any = {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { mobile: { contains: query } },
      { email: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
    ],
  };

  // For exact identifier searches
  if (/^\d{10}$/.test(query)) {
    where.OR = [{ mobile: { equals: query } }];
  }

  const results = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      mobile: true,
      city: true,
      walletBalance: true,
      createdAt: true,
      _count: {
        select: {
          invoices: true,
          Order: true,
        },
      },
    },
    take: limit,
    orderBy: { name: 'asc' },
  });

  return results.map((r: any) => {
    const matchType = determineMatchType(query, r.name) === 'exact'
      ? 'exact'
      : determineMatchType(query, r.mobile);
    return buildCustomerResult(r, matchType);
  });
}

export async function searchProducts(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  const results = await prisma.productItem.findMany({
    where: {
      ...branchFilter,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { productCode: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { huidNumber: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      productCode: true,
      barcode: true,
      huidNumber: true,
      gsWeight: true,
      ntWeight: true,
      purity: true,
      quantity: true,
      branchId: true,
      createdAt: true,
      subCategory: {
        select: {
          name: true,
          category: { select: { name: true } },
        },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.productCode);
    return buildProductResult(r, mt, branchMap[r.branchId] || '');
  });
}

export async function searchInvoices(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  // Additional filter for salesman: only invoices they created
  const createdByFilter = scope.additionalFilters?.createdByUserId
    ? { createdById: scope.additionalFilters.createdByUserId }
    : {};

  const results = await prisma.invoice.findMany({
    where: {
      ...branchFilter,
      ...createdByFilter,
      OR: [
        { invoiceNumber: { contains: query, mode: 'insensitive' } },
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { customer: { mobile: { contains: query } } },
      ],
    },
    select: {
      id: true,
      invoiceNumber: true,
      customerId: true,
      branchId: true,
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
      isFullyPaid: true,
      createdAt: true,
      customer: {
        select: { name: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.invoiceNumber);
    return buildInvoiceResult(r, mt, branchMap[r.branchId] || '');
  });
}

export async function searchOrders(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  const results = await prisma.order.findMany({
    where: {
      ...branchFilter,
      OR: [
        { orderNumber: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerMobile: { contains: query } },
      ],
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerMobile: true,
      customerId: true,
      status: true,
      priority: true,
      deliveryDate: true,
      branchId: true,
      createdAt: true,
      items: { select: { id: true } },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.orderNumber);
    return buildOrderResult(r, mt, branchMap[r.branchId] || '');
  });
}

export async function searchBookings(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  const results = await prisma.productBooking.findMany({
    where: {
      ...branchFilter,
      OR: [
        { bookingNumber: { contains: query, mode: 'insensitive' } },
        { Customer: { name: { contains: query, mode: 'insensitive' } } },
        { Customer: { mobile: { contains: query } } },
      ],
    },
    select: {
      id: true,
      bookingNumber: true,
      customerId: true,
      branchId: true,
      bookingGoldRate: true,
      status: true,
      grandTotal: true,
      totalAdvance: true,
      totalWeightGrams: true,
      createdAt: true,
      Customer: {
        select: { name: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.bookingNumber);
    return buildBookingResult(r, mt, branchMap[r.branchId] || '');
  });
}

// ============================================================================
// STAGE 2: Expanded Search (5 entities)
// ============================================================================

export async function searchKarigars(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const results = await prisma.karigar.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query } },
        { speciality: { hasSome: [query] } },
      ],
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      department: true,
      speciality: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { jobs: true },
      },
    },
    take: limit,
    orderBy: { name: 'asc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.name);
    return buildKarigarResult(r, mt);
  });
}

export async function searchWholesalers(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  const results = await prisma.wholesaler.findMany({
    where: {
      ...branchFilter,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { ownerName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      code: true,
      ownerName: true,
      phone: true,
      city: true,
      goldBal: true,
      silverBal: true,
      moneyBal: true,
      isActive: true,
      branchId: true,
      createdAt: true,
    },
    take: limit,
    orderBy: { name: 'asc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.name);
    return buildWholesalerResult(r, mt, branchMap[r.branchId] || '');
  });
}

export async function searchSchemes(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  const results = await prisma.savingScheme.findMany({
    where: {
      ...branchFilter,
      OR: [
        { schemeNumber: { contains: query, mode: 'insensitive' } },
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { physicalCardNumber: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      schemeNumber: true,
      type: true,
      status: true,
      customerId: true,
      branchId: true,
      totalCashDeposited: true,
      totalGoldDepositedGm: true,
      depositCount: true,
      createdAt: true,
      customer: {
        select: { name: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.schemeNumber);
    return buildSchemeResult(r, mt, branchMap[r.branchId] || '');
  });
}

export async function searchHuids(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();

  const branchFilter = scope.branchIds.length > 0
    ? { branchId: { in: scope.branchIds } }
    : {};

  const results = await prisma.productItem.findMany({
    where: {
      ...branchFilter,
      huidNumber: { not: null },
      OR: [
        { huidNumber: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      productCode: true,
      huidNumber: true,
      gsWeight: true,
      ntWeight: true,
      purity: true,
      quantity: true,
      branchId: true,
      createdAt: true,
      subCategory: {
        select: {
          name: true,
          category: { select: { name: true } },
        },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.huidNumber || '');
    return buildHuidResult(r, mt, branchMap[r.branchId] || '');
  });
}

export async function searchAdvances(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const results = await prisma.advance.findMany({
    where: {
      OR: [
        { advanceReceiptNumber: { contains: query, mode: 'insensitive' } },
        { customer: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    select: {
      id: true,
      advanceReceiptNumber: true,
      customerId: true,
      moneyAmount: true,
      metalWeight: true,
      isApplied: true,
      createdAt: true,
      customer: {
        select: { name: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.advanceReceiptNumber);
    return buildAdvanceResult(r, mt);
  });
}

export async function searchRfidTags(
  query: string,
  scope: SearchPermissionScope,
  limit: number = 5,
): Promise<SearchResultDTO[]> {
  const branchMap = await branchNameMap();
  const where: any = {
    OR: [
      { epc: { contains: query, mode: 'insensitive' } },
      { tid: { contains: query, mode: 'insensitive' } },
      { productItem: { name: { contains: query, mode: 'insensitive' } } },
      { productItem: { productCode: { contains: query, mode: 'insensitive' } } },
      { productItem: { barcode: { contains: query, mode: 'insensitive' } } },
      { productItem: { huidNumber: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (!scope.isGlobal && scope.branchIds.length > 0) {
    where.branchId = { in: scope.branchIds };
  }

  const results = await prisma.rFIDTag.findMany({
    where,
    include: {
      productItem: {
        include: {
          subCategory: { include: { category: true } },
        },
      },
      currentZone: true,
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });

  return results.map((r: any) => {
    const mt = determineMatchType(query, r.epc);
    return buildRfidTagResult(r, mt, branchMap[r.branchId] || '');
  });
}

