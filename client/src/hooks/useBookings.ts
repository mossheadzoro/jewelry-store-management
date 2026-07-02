// ===== Aurum ERP — Booking React Query Hooks =====

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BookingListParams,
  BookingListResponse,
  Booking,
  BookingDashboardStats,
  BookingChartData,
  GoldRate,
  BookingListItem,
} from "@/lib/types/booking";


// ===== Dashboard =====

export const useBookingDashboard = () =>
  useQuery<{ stats: BookingDashboardStats; charts: BookingChartData }>({
    queryKey: ["booking-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/bookings/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      
      // Map backend data to frontend stats structure
      const stats: BookingDashboardStats = {
        totalActive: { label: "Active Bookings", value: data.totalActive },
        rateLocked: { label: "Rate Locked", value: data.rateLocked },
        deliveryDueThisWeek: { label: "Deliveries Due", value: data.deliveryDueThisWeek },
        expiredBookings: { label: "Expired", value: data.expired },
        bookingRevenue: { label: "Booking Revenue", value: data.bookingRevenue, prefix: "₹" },
        advanceCollected: { label: "Total Advance", value: data.advanceCollected, prefix: "₹" },
        goldAdvanceWeight: { label: "Gold Advance", value: data.goldAdvanceWeight, suffix: "g" },
        walletLiability: { label: "Wallet Liability", value: data.walletLiability, prefix: "₹" },
      };
      
      // Placeholder charts since the backend doesn't aggregate these yet
      const charts: BookingChartData = {
        bookingTrend: [],
        dailyAdvances: [],
        deliveryPipeline: [],
        cancellationTrend: []
      };

      return { stats, charts };
    },
  });

// ===== Booking List =====

export const useBookingList = (params: BookingListParams) =>
  useQuery<BookingListResponse>({
    queryKey: ["bookings", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(params.page));
      searchParams.set("limit", String(params.limit));
      if (params.search) searchParams.set("search", params.search);
      if (params.status?.length) searchParams.set("status", params.status.join(","));
      if (params.rateLocked !== undefined) searchParams.set("rateLocked", String(params.rateLocked));
      if (params.expiredOnly) searchParams.set("expiredOnly", "true");
      if (params.readyForDelivery) searchParams.set("readyForDelivery", "true");

      const res = await fetch(`/api/bookings?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();

      // Map raw prisma models to frontend BookingListItem
      const mappedBookings: BookingListItem[] = data.bookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customer?.name || "Unknown",
        customerTier: "REGULAR", // fallback
        productCode: b.items?.[0]?.product?.productCode || "UNK",
        productName: b.items?.length > 0 ? `${b.items[0].product.name}${b.items.length > 1 ? ` (+${b.items.length - 1})` : ''}` : "Unknown Product",
        branchName: `Branch ${b.branchId}`,
        bookingDate: b.bookingDate,
        bookingValue: b.grandTotal,
        advanceReceived: b.totalAdvance,
        advancePercent: b.advancePercent,
        lockedValue: b.lockedPortion || 0,
        rateLockStatus: b.rateLockStatus,
        deliveryDueDate: b.deliveryDueDate || b.expiryDate,
        status: b.status,
      }));

      return {
        bookings: mappedBookings,
        pagination: {
          total: data.count,
          page: params.page,
          totalPages: Math.ceil(data.count / params.limit),
          limit: params.limit,
        },
      };
    },
    placeholderData: (prev) => prev,
  });

// ===== Single Booking =====

export const useBooking = (id: string) =>
  useQuery<Booking>({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error("Booking not found");
      const b = await res.json();
      
      // Adapt the raw prisma object to the frontend Booking shape
      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerId: b.customerId,
        customer: {
          id: b.customer?.id,
          name: b.customer?.name,
          mobile: b.customer?.mobile,
          tier: "REGULAR",
          walletBalance: b.customer?.walletBalance,
          totalBookings: 0
        },
        items: b.items?.map((i: any) => ({
          id: i.id,
          makingChargePercent: i.makingChargePercent,
          weightGrams: i.weightGrams,
          purity: i.purity,
          itemValue: i.itemValue,
          product: {
            id: i.product?.id,
            productCode: i.product?.productCode,
            name: i.product?.name,
            gsWeight: i.product?.gsWeight,
            ntWeight: i.product?.ntWeight,
            purity: i.product?.purity,
            makingChargePercent: i.product?.makingChargePercent,
            currentMarketValue: i.itemValue,
            category: i.product?.category,
            subCategory: i.product?.subCategory,
          }
        })) || [],
        subTotal: b.subTotal,
        additionalCharges: b.additionalCharges,
        gstAmount: b.gstAmount,
        grandTotal: b.grandTotal,
        branchId: b.branchId,
        branchName: `Branch ${b.branchId}`,
        status: b.status,
        bookingDate: b.bookingDate,
        bookingRate: b.bookingGoldRate,
        currentRate: b.bookingGoldRate,
        advanceTotal: b.totalAdvance,
        advancePercent: b.advancePercent,
        lockedValue: b.lockedPortion || 0,
        lockedRate: b.lockedRate || 0,
        rateLockPlan: b.rateLockPlan,
        deliveryRatePlan: b.deliveryRatePlan,
        deliveryDueDate: b.deliveryDueDate || b.expiryDate,
        validityDate: b.expiryDate,
        advances: b.advances.map((a: any) => ({
          id: a.id,
          date: a.createdAt,
          type: a.advanceType,
          amount: a.netValue,
          metalWeight: a.metalWeight,
          metalRate: a.metalRateApplied,
          paymentRef: a.paymentRef,
          branchName: `Branch ${a.branchId}`,
          receivedBy: a.receivedById ? `User ${a.receivedById}` : "System"
        })),
        ledger: b.ledger.map((l: any) => ({
          id: l.id,
          date: l.createdAt,
          type: l.entryType,
          description: l.description,
          amount: l.amount,
          isCredit: true,
          staffName: "System"
        })),
        auditLogs: b.auditLogs.map((log: any) => ({
          id: log.id,
          timestamp: log.createdAt,
          action: log.action,
          changedBy: "System",
          details: log.newValue || {}
        })),
        createdBy: "System",
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      } as any;
    },
    enabled: !!id,
  });

// ===== Expired Bookings =====

export const useExpiredBookings = () =>
  useQuery<{
    today: BookingListItem[];
    thisWeek: BookingListItem[];
    thisMonth: BookingListItem[];
    stats: { today: number; thisWeek: number; thisMonth: number };
  }>({
    queryKey: ["bookings-expired"],
    queryFn: async () => {
      const res = await fetch("/api/bookings/expired");
      if (!res.ok) throw new Error("Failed to fetch expired bookings");
      const data = await res.json();
      
      const mapItem = (b: any): BookingListItem => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customer?.name || "Unknown",
        customerTier: "REGULAR",
        productCode: b.items?.[0]?.product?.productCode || "UNK",
        productName: b.items?.length > 0 ? `${b.items[0].product.name}${b.items.length > 1 ? ` (+${b.items.length - 1})` : ''}` : "Unknown Product",
        branchName: `Branch ${b.branchId}`,
        bookingDate: b.bookingDate,
        bookingValue: b.grandTotal,
        advanceReceived: b.totalAdvance,
        advancePercent: b.advancePercent,
        lockedValue: b.lockedPortion || 0,
        rateLockStatus: b.rateLockStatus,
        deliveryDueDate: b.deliveryDueDate || b.expiryDate,
        status: b.status,
      });

      return {
        today: data.expiredToday.map(mapItem),
        thisWeek: data.expiredThisWeek.map(mapItem),
        thisMonth: data.expiredThisMonth.map(mapItem),
        stats: {
          today: data.expiredToday.length,
          thisWeek: data.expiredThisWeek.length,
          thisMonth: data.expiredThisMonth.length,
        },
      };
    },
  });

// ===== Mutations =====

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-dashboard"] });
    },
  });
};

export const useAddAdvance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      ...data
    }: {
      bookingId: string;
      advanceType: string;
      cashAmount?: number;
      paymentRef?: string;
      metalWeight?: number;
    }) => {
      const res = await fetch(`/api/bookings/${bookingId}/advances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add advance");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-dashboard"] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string; reason: string; refundOption: string; notes?: string }) => {
      const res = await fetch(`/api/bookings/${data.bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: data.reason,
          refundOption: data.refundOption,
          notes: data.notes
        }),
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useDeliverBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string; paymentMode?: string; paymentRef?: string; walletUsed?: number }) => {
      const res = await fetch(`/api/bookings/${data.bookingId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryType: "FULL", // default
          walletAmountUsed: data.walletUsed,
          outstandingPaymentMethod: data.paymentMode,
          outstandingPaymentRef: data.paymentRef
        }),
      });
      if (!res.ok) throw new Error("Failed to complete delivery");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useTransferBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string; destinationBranchId: number; reason: string; notes?: string }) => {
      const res = await fetch(`/api/bookings/${data.bookingId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toBranchId: data.destinationBranchId,
          reason: data.reason,
          notes: data.notes
        }),
      });
      if (!res.ok) throw new Error("Failed to transfer booking");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};
