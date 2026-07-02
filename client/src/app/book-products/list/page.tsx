"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingList } from "@/hooks/useBookings";
import { BookingStatusBadge } from "@/components/Bookings/BookingStatusBadge";
import { AdvanceProgressBar } from "@/components/Bookings/AdvanceProgressBar";
import { formatINR, isPastDue, isWithinDays } from "@/lib/booking-utils";
import type { BookingStatus, BookingListParams } from "@/lib/types/booking";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  PackageCheck,
  MoreHorizontal,
  Eye,
  Edit3,
  Banknote,
  Truck,
  XCircle,
  ArrowRightLeft,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_STATUSES: BookingStatus[] = ["ACTIVE", "RATE_LOCKED", "PARTIAL_LOCK", "DELIVERY_PENDING", "EXPIRED", "CANCELLED", "DELIVERED"];

function BookingListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([]);
  const [rateLocked, setRateLocked] = useState(false);
  const [expiredOnly, setExpiredOnly] = useState(false);
  const [readyForDelivery, setReadyForDelivery] = useState(searchParams.get("filter") === "ready");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: BookingListParams = useMemo(() => ({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    rateLocked: rateLocked || undefined,
    expiredOnly: expiredOnly || undefined,
    readyForDelivery: readyForDelivery || undefined,
  }), [page, debouncedSearch, selectedStatuses, rateLocked, expiredOnly, readyForDelivery]);

  const { data, isLoading, isFetching } = useBookingList(params);
  const bookings = data?.bookings ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1, limit: 20 };

  function toggleStatus(s: BookingStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllRows() {
    if (selectedRows.size === bookings.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(bookings.map((b) => b.id)));
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Filter Sidebar */}
      {showFilters && (
        <aside className="w-[260px] shrink-0 bg-onyx-surface border-r border-onyx-border p-5 space-y-6 hidden lg:block">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-platinum uppercase tracking-wider">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-platinum-muted hover:text-platinum">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Filter */}
          <div>
            <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-2 font-medium">Status</p>
            <div className="space-y-1.5">
              {ALL_STATUSES.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(s)}
                    onChange={() => toggleStatus(s)}
                    className="w-3.5 h-3.5 rounded border-onyx-border bg-onyx-elevated accent-gold"
                  />
                  <BookingStatusBadge status={s} size="sm" />
                </label>
              ))}
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-[12px] text-platinum-muted group-hover:text-platinum">Rate Locked Only</span>
              <button
                onClick={() => { setRateLocked(!rateLocked); setPage(1); }}
                className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
                  rateLocked ? "bg-gold" : "bg-onyx-border"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  rateLocked ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-[12px] text-platinum-muted group-hover:text-platinum">Expired Only</span>
              <button
                onClick={() => { setExpiredOnly(!expiredOnly); setPage(1); }}
                className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
                  expiredOnly ? "bg-red-500" : "bg-onyx-border"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  expiredOnly ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-[12px] text-platinum-muted group-hover:text-platinum">Ready For Delivery</span>
              <button
                onClick={() => { setReadyForDelivery(!readyForDelivery); setPage(1); }}
                className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
                  readyForDelivery ? "bg-emerald-500" : "bg-onyx-border"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  readyForDelivery ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
            </label>
          </div>

          {/* Clear All */}
          <button
            onClick={() => {
              setSelectedStatuses([]);
              setRateLocked(false);
              setExpiredOnly(false);
              setReadyForDelivery(false);
              setPage(1);
            }}
            className="w-full py-2 rounded-lg border border-onyx-border text-[11px] text-platinum-muted hover:text-platinum hover:border-gold/30 transition-colors uppercase tracking-wider"
          >
            Clear All Filters
          </button>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {!showFilters && (
              <button
                onClick={() => setShowFilters(true)}
                className="p-2 rounded-lg border border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/30 transition-colors lg:flex hidden"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-[24px] font-heading font-semibold text-platinum">Booking List</h1>
              <p className="text-[11px] text-platinum-muted mt-0.5">
                {pagination.total} booking{pagination.total !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
          <input
            type="text"
            placeholder="Search booking number, customer name, or mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-onyx-surface border border-onyx-border text-[13px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 transition-colors"
          />
          {isFetching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedRows.size > 0 && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-gold-muted border border-gold/20">
            <span className="text-[12px] text-gold font-medium">{selectedRows.size} selected</span>
            <button className="px-3 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border text-[11px] text-platinum hover:border-gold/30 transition-colors flex items-center gap-1.5">
              <Download className="w-3 h-3" /> Export CSV
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border text-[11px] text-platinum hover:border-gold/30 transition-colors flex items-center gap-1.5">
              <PackageCheck className="w-3 h-3" /> Mark Ready
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-onyx-surface rounded-xl gold-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-onyx-border">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === bookings.length && bookings.length > 0}
                      onChange={toggleAllRows}
                      className="w-3.5 h-3.5 rounded border-onyx-border bg-onyx-elevated accent-gold"
                    />
                  </th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Booking No</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Customer</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Product</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Branch</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Date</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-right">Value</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-right">Advance</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Due Date</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Status</th>
                  <th className="p-3 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-onyx-border/50">
                      <td colSpan={11} className="p-4">
                        <div className="h-10 bg-onyx-elevated rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-16 text-center text-platinum-muted text-[13px]">
                      No bookings found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const overdue = isPastDue(b.deliveryDueDate) && b.status !== "DELIVERED" && b.status !== "CANCELLED";
                    const urgent = !overdue && isWithinDays(b.deliveryDueDate, 3);

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-onyx-border/50 hover:bg-onyx-elevated/50 transition-colors"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(b.id)}
                            onChange={() => toggleRow(b.id)}
                            className="w-3.5 h-3.5 rounded border-onyx-border bg-onyx-elevated accent-gold"
                          />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => router.push(`/book-products/${b.id}`)}
                            className="font-mono text-[12px] text-gold hover:text-gold-light transition-colors underline underline-offset-2"
                          >
                            {b.bookingNumber}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-semibold text-gold shrink-0">
                              {b.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] text-platinum truncate">{b.customerName}</p>
                              <span className="text-[9px] text-gold/60 uppercase tracking-wider font-medium">{b.customerTier}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-[12px] text-platinum truncate max-w-[140px]">{b.productName}</p>
                          <p className="text-[10px] font-mono text-platinum-muted">{b.productCode}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-onyx-elevated border border-onyx-border text-[10px] text-platinum-muted">
                            {b.branchName}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-platinum-muted tabular-nums">
                          {format(new Date(b.bookingDate), "dd MMM yy")}
                        </td>
                        <td className="p-3 text-right text-[12px] text-platinum tabular-nums font-medium">
                          {formatINR(b.bookingValue)}
                        </td>
                        <td className="p-3 text-right">
                          <p className="text-[12px] text-gold tabular-nums font-medium">{formatINR(b.advanceReceived)}</p>
                          <div className="mt-1 w-16 ml-auto">
                            <AdvanceProgressBar percentage={b.advancePercent} size="sm" showLabel={false} />
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "text-[11px] tabular-nums",
                            overdue ? "text-red-400 font-medium" : urgent ? "text-amber-400" : "text-platinum-muted"
                          )}>
                            {format(new Date(b.deliveryDueDate), "dd MMM yy")}
                          </span>
                        </td>
                        <td className="p-3">
                          <BookingStatusBadge status={b.status} size="sm" />
                        </td>
                        <td className="p-3 relative">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1.5 rounded-lg hover:bg-onyx-elevated transition-colors text-platinum-muted hover:text-platinum"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-onyx-elevated border-onyx-border rounded-xl shadow-2xl p-1.5">
                              {[
                                { icon: Eye, label: "View Details", onClick: () => router.push(`/book-products/${b.id}`) },
                                { icon: Edit3, label: "Edit Booking", onClick: () => router.push(`/book-products/${b.id}`) },
                                { icon: Banknote, label: "Receive Advance", onClick: () => router.push(`/book-products/${b.id}?action=advance&tab=advances`) },
                                { icon: Truck, label: "Delivery", onClick: () => router.push(`/book-products/${b.id}?action=delivery&tab=delivery`) },
                                { icon: XCircle, label: "Cancel", onClick: () => router.push(`/book-products/${b.id}?action=cancel`), danger: true },
                                { icon: ArrowRightLeft, label: "Transfer", onClick: () => router.push(`/book-products/${b.id}?action=transfer`) },
                              ].map((action, ai) => (
                                <DropdownMenuItem
                                  key={ai}
                                  onClick={action.onClick}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3.5 py-2 text-[12px] transition-colors cursor-pointer rounded-lg",
                                    (action as { danger?: boolean }).danger
                                      ? "text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
                                      : "text-platinum-muted hover:text-platinum hover:bg-onyx-surface focus:bg-onyx-surface focus:text-platinum"
                                  )}
                                >
                                  <action.icon className="w-3.5 h-3.5" />
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-onyx-border">
              <p className="text-[12px] text-platinum-muted tabular-nums">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-onyx-border flex items-center justify-center text-platinum-muted hover:text-platinum disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-lg border text-[12px] tabular-nums transition-colors",
                      page === i + 1
                        ? "border-gold text-gold bg-gold-muted"
                        : "border-onyx-border text-platinum-muted hover:text-platinum"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="w-8 h-8 rounded-lg border border-onyx-border flex items-center justify-center text-platinum-muted hover:text-platinum disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingListPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center text-platinum-muted">Loading bookings...</div>}>
      <BookingListContent />
    </Suspense>
  );
}
