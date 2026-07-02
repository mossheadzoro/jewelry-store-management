"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useBooking, useAddAdvance, useCancelBooking, useDeliverBooking, useTransferBooking } from "@/hooks/useBookings";
import { BookingStatusBadge } from "@/components/Bookings/BookingStatusBadge";
import { AdvanceProgressBar } from "@/components/Bookings/AdvanceProgressBar";
import { CurrencyDisplay } from "@/components/Bookings/CurrencyDisplay";
import { MetalWeightDisplay } from "@/components/Bookings/MetalWeightDisplay";

import {
  formatINR,
  getPaymentModeLabel,
  getStatusConfig,
} from "@/lib/booking-utils";
import { ReceiveAdvanceDrawer } from "@/components/Bookings/ReceiveAdvanceDrawer";
import { CancellationDialog } from "@/components/Bookings/CancellationDialog";
import { DeliverySettlementDialog } from "@/components/Bookings/DeliverySettlementDialog";
import { BranchTransferDialog } from "@/components/Bookings/BranchTransferDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Gem,
  Calendar,
  Edit3,
  Banknote,
  ArrowRightLeft,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Lock,
  CreditCard,
  Shield,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Coins,
  FileText,
  ChevronDown,
  Unlock,
} from "lucide-react";

type TabId = "overview" | "advances" | "ledger" | "delivery" | "audit";

// ===== Ledger Icon Map =====

const ledgerIcons: Record<string, { icon: React.ElementType; color: string }> = {
  BOOKING_CREATED: { icon: FileText, color: "text-gold" },
  ADVANCE_ADDED: { icon: Banknote, color: "text-emerald-400" },
  WALLET_USED: { icon: CreditCard, color: "text-blue-400" },
  RATE_LOCKED: { icon: Lock, color: "text-blue-400" },
  CANCELLATION: { icon: XCircle, color: "text-red-400" },
  REFUND: { icon: ArrowRightLeft, color: "text-amber-400" },
  DELIVERY: { icon: Truck, color: "text-gold" },
};

// ===== Timeline Icon Map =====

const timelineIcons: Record<string, { icon: React.ElementType; color: string }> = {
  booking: { icon: FileText, color: "bg-gold/20 text-gold" },
  rate_lock: { icon: Lock, color: "bg-blue-500/20 text-blue-400" },
  advance: { icon: Banknote, color: "bg-emerald-500/20 text-emerald-400" },
  ready: { icon: CheckCircle2, color: "bg-gold/20 text-gold" },
  delivery: { icon: Truck, color: "bg-gold/20 text-gold" },
  cancel: { icon: XCircle, color: "bg-red-500/20 text-red-400" },
};

import { Suspense } from "react";

function BookingDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const { data: booking, isLoading } = useBooking(id);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState<TabId>(() => {
    const tab = searchParams.get("tab");
    return (tab as TabId) || "overview";
  });
  
  const [activeDialog, setActiveDialog] = React.useState<"advance" | "cancel" | "delivery" | "transfer" | null>(() => {
    const action = searchParams.get("action");
    if (action === "advance" || action === "cancel" || action === "delivery" || action === "transfer") {
      return action;
    }
    return null;
  });

  // Remove query params after reading to avoid reopening on refresh
  React.useEffect(() => {
    if (searchParams.get("action") || searchParams.get("tab")) {
      router.replace(`/book-products/${id}`);
    }
  }, [id, router, searchParams]);

  const { mutate: addAdvance } = useAddAdvance();
  const { mutate: cancelBooking } = useCancelBooking();
  const { mutate: deliverBooking } = useDeliverBooking();
  const { mutate: transferBooking } = useTransferBooking();

  const auditLog = booking?.auditLogs || [];

  const timeline = React.useMemo(() => {
    return auditLog.map((log: any) => ({
      id: log.id,
      type: log.action === "CREATED" ? "booking" : 
            log.action === "DELIVERED" ? "delivery" : 
            log.action === "CANCELLED" ? "cancel" : "booking",
      title: log.action,
      description: "System Update",
      date: log.timestamp,
      staffName: log.changedBy
    }));
  }, [auditLog]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="h-32 bg-onyx-surface rounded-xl animate-pulse" />
          <div className="h-96 bg-onyx-surface rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-platinum-muted text-[14px]">Booking not found.</p>
      </div>
    );
  }

  const ledger = booking.ledger || [];
  const rateDiff = booking.currentRate - booking.bookingRate;
  const rateDiffPercent = ((rateDiff / booking.bookingRate) * 100).toFixed(1);

  const isLockExpired = booking.expiryDate ? Date.now() > new Date(booking.expiryDate).getTime() : false;
  const showFullLock = booking.rateLockStatus === "FULL_LOCK" && !isLockExpired;
  const showPartialLock = booking.rateLockStatus === "PARTIAL_LOCK" || (booking.rateLockStatus === "FULL_LOCK" && isLockExpired);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "advances", label: "Advances" },
    { id: "ledger", label: "Ledger" },
    { id: "delivery", label: "Delivery" },
    { id: "audit", label: "Audit Log" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-[32px] font-mono font-bold text-gold leading-none">{booking.bookingNumber}</h1>
              <BookingStatusBadge status={booking.status} size="md" />
              {booking.deliveryRatePlan !== "MARKET_RATE" && (
                 <div className={cn("px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider flex items-center gap-1.5",
                    showFullLock ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                 )}>
                   {showFullLock ? (
                     <><Shield className="w-3.5 h-3.5" /> FULL RATE LOCK (15 DAYS)</>
                   ) : (
                     <><Unlock className="w-3.5 h-3.5" /> PARTIAL RATE LOCK</>
                   )}
                 </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-[12px] text-platinum-muted">
              <span className="font-heading text-[20px] text-platinum font-semibold">{booking.customer.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-onyx-elevated border border-onyx-border text-[10px]">{booking.branchName}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(booking.createdAt), "dd MMM yyyy")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] font-medium transition-colors border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/30">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => setActiveDialog("advance")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] font-medium transition-colors border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/30">
              <Banknote className="w-3.5 h-3.5" /> Advance
            </button>
            <button onClick={() => setActiveDialog("transfer")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] font-medium transition-colors border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/30">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
            </button>
            <button onClick={() => setActiveDialog("cancel")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] font-medium transition-colors border-red-500/30 text-red-400 hover:bg-red-500/10">
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto border-b border-onyx-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-3 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap",
              activeTab === tab.id
                ? "border-gold text-gold"
                : "border-transparent text-platinum-muted hover:text-platinum"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Product List */}
          <div className="space-y-4">
            <div className="bg-onyx-surface rounded-xl gold-border p-6">
              <h3 className="text-[14px] font-medium text-platinum mb-4">Booked Items</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {booking.items?.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-lg bg-onyx-elevated border border-onyx-border">
                    <p className="text-[11px] font-mono text-gold mb-1">{item.product.productCode}</p>
                    <p className="text-[16px] font-heading font-semibold text-platinum mb-3">{item.product.name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Weight (Gross / Net)</span>
                        <span className="text-[12px] text-platinum tabular-nums">{item.product.gsWeight}g / {item.product.ntWeight}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Purity</span>
                        <MetalWeightDisplay weight={item.product.ntWeight} purity={item.product.purity} size="sm" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Making Charge</span>
                        <span className="text-[12px] text-platinum">{item.makingChargePercent}%</span>
                      </div>
                      <div className="flex justify-between border-t border-onyx-border pt-2 mt-2">
                        <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Item Value</span>
                        <span className="text-[13px] font-medium text-gold tabular-nums">{formatINR(item.itemValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals Summary */}
              <div className="mt-6 pt-4 border-t border-onyx-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-[12px] text-platinum-muted">Items SubTotal</span>
                  <span className="text-[13px] text-platinum tabular-nums">{formatINR(booking.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-platinum-muted">Tax & Extra Charges</span>
                  <span className="text-[13px] text-platinum tabular-nums">{formatINR(booking.additionalCharges + booking.gstAmount)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-onyx-border">
                  <span className="text-[14px] font-medium text-platinum">Grand Total</span>
                  <span className="text-[16px] font-semibold text-gold tabular-nums">{formatINR(booking.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Financial Summary */}
          <div className="space-y-6">
            {/* Rate Comparison */}
            <div className="bg-onyx-surface rounded-xl gold-border p-6">
              <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-4">Rate Comparison</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-platinum-muted mb-1">Booking Rate</p>
                  <p className="text-[22px] font-heading font-semibold text-platinum tabular-nums">{formatINR(booking.bookingRate)}</p>
                  <p className="text-[11px] text-platinum-muted">/gram</p>
                </div>
                <div>
                  <p className="text-[10px] text-platinum-muted mb-1">Current Rate</p>
                  <p className="text-[22px] font-heading font-semibold text-gold tabular-nums">{formatINR(booking.currentRate)}</p>
                  <p className="text-[11px] text-platinum-muted">/gram</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg",
                rateDiff >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                {rateDiff >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                <span className={cn("text-[13px] font-medium tabular-nums", rateDiff >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {rateDiff >= 0 ? "+" : ""}{formatINR(rateDiff)}/g ({rateDiffPercent}%)
                </span>
                <span className="text-[11px] text-platinum-muted ml-auto">
                  {rateDiff >= 0 ? "Favorable" : "Loss"} vs booking
                </span>
              </div>
            </div>

            {/* Booking Value & Advance */}
            <div className="bg-onyx-surface rounded-xl gold-border p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Booking Value</span>
                <CurrencyDisplay amount={booking.grandTotal} size="md" />
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Collected Advance</span>
                <span className="text-[16px] font-medium text-gold tabular-nums">{formatINR(booking.advanceTotal)} ({parseFloat(Number(booking.advancePercent).toFixed(2))}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Remaining</span>
                <span className="text-[16px] font-medium text-platinum tabular-nums">{formatINR(booking.grandTotal - booking.advanceTotal)}</span>
              </div>
              <div className="flex justify-center pt-4">
                <AdvanceProgressBar percentage={booking.advancePercent} variant="circular" size="lg" />
              </div>
            </div>
          </div>

          {/* Timeline — full width */}
          <div className="lg:col-span-2 bg-onyx-surface rounded-xl gold-border p-6">
            <h3 className="text-[14px] font-medium text-platinum mb-6">Timeline</h3>
            <div className="relative pl-8">
              {/* Gold connector line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" />

              {timeline.map((item, i) => {
                const config = timelineIcons[item.type] || timelineIcons.booking;
                const Icon = config.icon;
                return (
                  <div key={item.id} className="relative mb-6 last:mb-0">
                    <div className={cn("absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center", config.color)}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="ml-4">
                      <p className="text-[13px] font-medium text-platinum">{item.title}</p>
                      {item.description && <p className="text-[11px] text-platinum-muted mt-0.5">{item.description}</p>}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-platinum-muted">
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.date), "dd MMM yyyy, hh:mm a")}
                        {item.staffName && <span>· {item.staffName}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "advances" && (
        <div className="bg-onyx-surface rounded-xl gold-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-onyx-border">
            <h3 className="text-[14px] font-medium text-platinum">Advance Payments</h3>
            <button onClick={() => setActiveDialog("advance")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-onyx font-semibold text-[12px] hover:bg-gold-light transition-colors">
              <Banknote className="w-4 h-4" /> Add Advance
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-onyx-border">
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Date</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Type</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-right">Weight</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-right">Rate</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-right">Value</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Branch</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Received By</th>
              </tr>
            </thead>
            <tbody>
              {booking.advances.map((adv) => {
                const isConverted = booking.deliveryRatePlan === "OPTION_C_METAL_WALLET" && adv.type !== "METAL_22K" && adv.type !== "METAL_24K" && adv.amount >= 10000;
                const convertedGrams = isConverted ? (adv.amount / ((booking.currentRate || booking.bookingRate || 7000) * (24/22))).toFixed(3) : null;
                return (
                  <tr key={adv.id} className="border-b border-onyx-border/50 hover:bg-onyx-elevated/50 transition-colors">
                    <td className="p-4 text-[12px] text-platinum tabular-nums">{format(new Date(adv.date), "dd MMM yy")}</td>
                    <td className="p-4">
                      <span className="text-[11px] text-gold font-medium uppercase tracking-wider">{getPaymentModeLabel(adv.type)}</span>
                      {isConverted && (
                        <span className="block mt-1 text-[10px] text-blue-400">Converted to {convertedGrams}g 24K Metal</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-[12px] text-platinum-muted tabular-nums">{adv.metalWeight ? `${adv.metalWeight}g` : "—"}</td>
                    <td className="p-4 text-right text-[12px] text-platinum-muted tabular-nums">{adv.metalRate ? formatINR(adv.metalRate) : "—"}</td>
                    <td className="p-4 text-right text-[13px] text-gold font-medium tabular-nums">{formatINR(adv.amount)}</td>
                    <td className="p-4 text-[12px] text-platinum-muted">{adv.branchName}</td>
                    <td className="p-4 text-[12px] text-platinum-muted">{adv.receivedBy}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {(() => {
                let totalUnconvertedCash = 0;
                let total24KMetalGrams = 0;
                const rate24K = (booking.currentRate || booking.bookingRate || 7000) * (24 / 22);

                booking.advances.forEach((adv: any) => {
                  if (adv.type === "METAL_22K" && adv.metalWeight) {
                    total24KMetalGrams += adv.metalWeight * (22 / 24);
                  } else if (adv.type === "METAL_24K" && adv.metalWeight) {
                    total24KMetalGrams += adv.metalWeight;
                  } else {
                    const isConverted = booking.deliveryRatePlan === "OPTION_C_METAL_WALLET" && adv.amount >= 10000;
                    if (isConverted) {
                      total24KMetalGrams += adv.amount / rate24K;
                    } else {
                      totalUnconvertedCash += adv.amount;
                    }
                  }
                });

                return (
                  <tr className="border-t border-gold/20 bg-gold-muted">
                    <td colSpan={4} className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-gold font-semibold uppercase tracking-wider">Total Advance Breakdown</span>
                        <span className="text-[10px] text-gold/80 font-medium">Gross Cash Equivalent: {formatINR(booking.advanceTotal)}</span>
                      </div>
                    </td>
                    <td colSpan={3} className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-3 w-full">
                          <span className="text-[11px] text-gold/70 uppercase tracking-wide">Money (Unconverted):</span>
                          <span className="text-[14px] text-gold font-bold tabular-nums min-w-[80px] text-right">{formatINR(totalUnconvertedCash)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full">
                          <span className="text-[11px] text-blue-400 uppercase tracking-wide">24K Metal Wallet:</span>
                          <span className="text-[14px] text-blue-400 font-bold tabular-nums min-w-[80px] text-right">{total24KMetalGrams.toFixed(3)}g</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="bg-onyx-surface rounded-xl gold-border p-6">
          <h3 className="text-[14px] font-medium text-platinum mb-6">Financial Ledger</h3>
          <div className="space-y-4">
            {ledger.map((entry) => {
              const config = ledgerIcons[entry.type] || ledgerIcons.BOOKING_CREATED;
              const Icon = config.icon;
              return (
                <div key={entry.id} className="flex items-start gap-4 p-4 rounded-lg bg-onyx-elevated border border-onyx-border">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-onyx-surface", config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-platinum">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-platinum-muted">
                      <Clock className="w-3 h-3" />
                      {format(new Date(entry.date), "dd MMM yyyy")} · {entry.staffName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      "text-[14px] font-medium tabular-nums",
                      entry.isCredit ? "text-emerald-400" : "text-platinum-muted"
                    )}>
                      {entry.isCredit ? "+" : ""}
                      {formatINR(entry.amount)}
                    </span>
                    <p className="text-[9px] text-platinum-muted uppercase tracking-wider mt-0.5">
                      {entry.isCredit ? "Credit" : "Debit"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="space-y-6">
          <div className="bg-onyx-surface rounded-xl gold-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum mb-2">Delivery Settlement Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-onyx-elevated border border-onyx-border">
                <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-2">Remaining Amount</p>
                <CurrencyDisplay amount={booking.grandTotal - booking.advanceTotal} size="lg" />
              </div>
              <div className="p-4 rounded-lg bg-onyx-elevated border border-onyx-border">
                <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-2">Current Gold Rate</p>
                <p className="text-[20px] font-heading font-semibold text-platinum tabular-nums">{formatINR(booking.currentRate || 0)}</p>
                <p className="text-[11px] text-platinum-muted mt-1">/g</p>
              </div>
              {booking.lockedRate > 0 && (
                <div className="p-4 rounded-lg bg-onyx-elevated border border-blue-500/20">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">Locked Portion</p>
                  <p className="text-[20px] font-heading font-semibold text-blue-400 tabular-nums">{formatINR(booking.lockedValue)}</p>
                  <p className="text-[11px] text-platinum-muted mt-1">@ {formatINR(booking.lockedRate)}/g</p>
                </div>
              )}
              <div className="p-4 rounded-lg bg-onyx-elevated border border-gold/20">
                <p className="text-[10px] text-gold uppercase tracking-wider mb-2">Total to Collect</p>
                <p className="text-[20px] font-heading font-semibold text-gold tabular-nums">{formatINR(Math.max(0, booking.grandTotal - booking.advanceTotal))}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-onyx-border text-[12px] text-platinum-muted hover:text-platinum hover:border-gold/30 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Mark Ready For Delivery
            </button>
            <button onClick={() => setActiveDialog("delivery")} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-onyx font-semibold text-[12px] hover:bg-gold-light transition-colors">
              <Truck className="w-4 h-4" /> Complete Delivery
            </button>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-onyx-surface rounded-xl gold-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-onyx-border">
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Timestamp</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Action</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Changed By</th>
                <th className="p-4 text-[10px] text-platinum-muted uppercase tracking-wider font-semibold text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id} className="border-b border-onyx-border/50 hover:bg-onyx-elevated/50 transition-colors">
                  <td className="p-4 text-[12px] text-platinum-muted tabular-nums">{format(new Date(entry.timestamp), "dd MMM yy, hh:mm a")}</td>
                  <td className="p-4 text-[12px] text-platinum font-medium">{entry.action}</td>
                  <td className="p-4 text-[12px] text-platinum-muted">{entry.changedBy}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(entry.details).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-onyx-elevated border border-onyx-border text-[10px] text-platinum-muted">
                          <span className="text-platinum">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReceiveAdvanceDrawer
        booking={booking}
        isOpen={activeDialog === "advance"}
        onClose={() => setActiveDialog(null)}
        onConfirm={(data) => addAdvance({ bookingId: booking.id, advanceType: data.type, cashAmount: data.amount, metalWeight: data.metalWeight, paymentRef: data.paymentRef })}
      />
      <CancellationDialog
        booking={booking}
        isOpen={activeDialog === "cancel"}
        onClose={() => setActiveDialog(null)}
        onConfirm={(data) => cancelBooking({ bookingId: booking.id, ...data })}
      />
      <DeliverySettlementDialog
        booking={booking}
        isOpen={activeDialog === "delivery"}
        onClose={() => setActiveDialog(null)}
        onConfirm={(data) => deliverBooking({ bookingId: booking.id, ...data })}
      />
      <BranchTransferDialog
        booking={booking}
        isOpen={activeDialog === "transfer"}
        onClose={() => setActiveDialog(null)}
        onConfirm={(data) => transferBooking({ bookingId: booking.id, destinationBranchId: data.toBranchId, ...data })}
      />
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-platinum-muted">Loading booking details...</div>}>
      <BookingDetailContent />
    </Suspense>
  );
}
