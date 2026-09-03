// client/src/app/(main)/purchase/components/OverviewPanel.tsx
"use client";

import React from "react";
import {
  IconBuildingBank,
  IconCoins,
  IconReceiptTax,
  IconScale,
  IconTruckDelivery,
  IconCash,
  IconReportMoney,
  IconArrowsRightLeft,
  IconChevronRight,
  IconTrendingUp,
  IconAlertTriangle,
  IconShieldCheck,
  IconWallet,
  IconFileText,
} from "@tabler/icons-react";
import { PurchaseTab } from "../page";

interface OverviewPanelProps {
  data: any;
  loading: boolean;
  onOpenCashDrawer: () => void;
  onNavigate: (tab: PurchaseTab) => void;
  onRefresh: () => void;
}

export default function OverviewPanel({
  data,
  loading,
  onOpenCashDrawer,
  onNavigate,
  onRefresh,
}: OverviewPanelProps) {
  const kpis = data?.kpis || {
    availableCash: 0,
    committedPurchases: 0,
    netCashLeftToBook: 0,
    totalBookedGrossWeight: 0,
    totalBookedFineWeight: 0,
    totalPendingIntakeGross: 0,
    totalSupplierPayables: 0,
    totalSupplierAdvances: 0,
    netSupplierPosition: 0,
    activeSuppliersCount: 0,
    activeBookingsCount: 0,
    pendingVerificationCount: 0,
    monthlyGSTStatus: "DRAFT",
  };

  const liquidity = data?.liquidity;
  const recent = data?.recentActivity || {
    bookings: [],
    invoices: [],
    receipts: [],
    payments: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Liquidity Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Cash Left to Book Highlight Card */}
        <div
          onClick={onOpenCashDrawer}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-onyx-surface to-onyx-elevated border border-gold/40 p-4 sm:p-5 shadow-lg shadow-gold/5 hover:border-gold hover:shadow-gold/15 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                <IconWallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-platinum uppercase tracking-wider">
                Net Cash Left to Book
              </span>
            </div>
            <span className="text-[10px] text-gold group-hover:underline flex items-center gap-0.5">
              Breakdown <IconChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4">
            <div className={`text-xl sm:text-2xl font-bold tracking-tight ${kpis.netCashLeftToBook >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              ₹{kpis.netCashLeftToBook.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-platinum-muted mt-1">
              Available Cash minus Pending Commitments
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-onyx-border grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-platinum-muted block text-[10px]">Available Cash</span>
              <span className="font-semibold text-platinum">₹{kpis.availableCash.toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-platinum-muted block text-[10px]">Committed Purchases</span>
              <span className="font-semibold text-amber-400">₹{kpis.committedPurchases.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* 24K Metal Procurement Pipeline Card */}
        <div
          onClick={() => onNavigate("bookings")}
          className="group cursor-pointer rounded-2xl bg-onyx-surface border border-onyx-border p-4 sm:p-5 hover:border-gold/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                <IconCoins className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-platinum uppercase tracking-wider">
                24K Metal Pipeline
              </span>
            </div>
            <span className="text-[10px] text-platinum-muted group-hover:text-gold flex items-center gap-0.5">
              Bookings <IconChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4">
            <div className="text-xl sm:text-2xl font-bold text-platinum">
              {kpis.totalBookedGrossWeight.toFixed(3)} <span className="text-sm font-normal text-platinum-muted">grams</span>
            </div>
            <p className="text-[11px] text-platinum-muted mt-1">
              {kpis.totalBookedFineWeight.toFixed(3)}g 24K Metal (99.5%) across {kpis.activeBookingsCount} active bookings
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-onyx-border grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-platinum-muted block text-[10px]">Pending Intake</span>
              <span className="font-semibold text-amber-400">{kpis.totalPendingIntakeGross.toFixed(3)}g</span>
            </div>
            <div>
              <span className="text-platinum-muted block text-[10px]">Active Bookings</span>
              <span className="font-semibold text-platinum">{kpis.activeBookingsCount} Orders</span>
            </div>
          </div>
        </div>

        {/* Supplier Payables & GST Status Card */}
        <div
          onClick={() => onNavigate("supplier-ledger")}
          className="group cursor-pointer rounded-2xl bg-onyx-surface border border-onyx-border p-4 sm:p-5 hover:border-gold/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                <IconReportMoney className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-platinum uppercase tracking-wider">
                Supplier Payables
              </span>
            </div>
            <span className="text-[10px] text-platinum-muted group-hover:text-gold flex items-center gap-0.5">
              Ledgers <IconChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-4">
            <div className={`text-xl sm:text-2xl font-bold ${
              kpis.totalSupplierPayables > 0 ? "text-rose-400" : "text-emerald-400"
            }`}>
              ₹{kpis.totalSupplierPayables.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-platinum-muted mt-1">
              {kpis.totalSupplierPayables > 0
                ? `Outstanding liability across ${kpis.activeSuppliersCount} registered bullion suppliers`
                : (kpis.totalSupplierAdvances || 0) > 0
                ? `₹${(kpis.totalSupplierAdvances || 0).toLocaleString("en-IN")} advance with suppliers • ₹0 payable`
                : `All supplier accounts settled (₹0 liability)`}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-onyx-border flex items-center justify-between text-xs">
            <div>
              <span className="text-platinum-muted block text-[10px]">Monthly GST Period</span>
              <span className="font-semibold text-platinum uppercase">{kpis.monthlyGSTStatus}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate("gst-itc");
              }}
              className="px-2 py-1 text-[11px] font-medium rounded bg-gold/15 text-gold hover:bg-gold/25"
            >
              GST / ITC →
            </button>
          </div>
        </div>
      </div>

      {/* Payment Method Liquidity Matrix */}
      {liquidity?.paymentMethods && (
        <div className="rounded-2xl bg-onyx-surface border border-onyx-border p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-platinum">Branch Cash & Payment Visibility</h2>
              <p className="text-xs text-platinum-muted">
                Real-time liquidity, inflows, and disbursements by payment channel
              </p>
            </div>
            <button
              onClick={onOpenCashDrawer}
              className="text-xs text-gold hover:underline font-medium"
            >
              View Full Cash Flow Formula →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {liquidity.paymentMethods.map((m: any) => (
              <div
                key={m.method}
                className="p-3 rounded-xl bg-onyx-elevated border border-onyx-border/80 space-y-1.5"
              >
                <span className="text-[11px] font-semibold text-platinum block">{m.label}</span>
                <div className="text-sm sm:text-base font-bold text-platinum">
                  ₹{m.periodInflow.toLocaleString("en-IN")}
                </div>
                <div className="flex items-center justify-between text-[10px] text-platinum-muted pt-1 border-t border-onyx-border/60">
                  <span>Out: ₹{m.periodOutflow.toLocaleString("en-IN")}</span>
                  <span>{m.txnCount} txns</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access Function Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: "Book 24K Gold", tab: "bookings", icon: IconCoins, color: "text-amber-400" },
          { label: "Record Invoice", tab: "invoices", icon: IconFileText, color: "text-blue-400" },
          { label: "Scale Intake", tab: "receiving", icon: IconScale, color: "text-emerald-400" },
          { label: "Karigar Transfer", tab: "transfers", icon: IconTruckDelivery, color: "text-purple-400" },
          { label: "Pay Supplier", tab: "payments", icon: IconCash, color: "text-green-400" },
          { label: "Purchase Returns", tab: "returns", icon: IconArrowsRightLeft, color: "text-rose-400" },
          { label: "ITC Reconcile", tab: "gst-itc", icon: IconReceiptTax, color: "text-gold" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.tab as PurchaseTab)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-onyx-surface border border-onyx-border hover:border-gold/50 hover:bg-onyx-elevated transition-all gap-2 text-center group"
            >
              <div className={`p-2 rounded-lg bg-onyx-elevated group-hover:scale-110 transition-transform ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-platinum">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent Transactions Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Bullion Bookings */}
        <div className="rounded-2xl bg-onyx-surface border border-onyx-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
              Recent Bullion Bookings
            </h3>
            <button
              onClick={() => onNavigate("bookings")}
              className="text-[11px] text-gold hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-onyx-border/60 text-xs">
            {recent.bookings.length === 0 ? (
              <p className="py-4 text-center text-platinum-muted">No purchase bookings recorded yet.</p>
            ) : (
              recent.bookings.map((b: any) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-platinum">{b.bookingNumber}</div>
                    <div className="text-[11px] text-platinum-muted">
                      {b.supplier?.businessName} • {b.grossWeight}g @ ₹{b.bookingRate}/g
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gold">₹{b.totalAmount.toLocaleString("en-IN")}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      b.status === "BOOKED" ? "bg-emerald-500/15 text-emerald-300" :
                      b.status === "PENDING_VERIFICATION" ? "bg-amber-500/15 text-amber-300" :
                      b.status === "FULLY_RECEIVED" ? "bg-blue-500/15 text-blue-300" : "bg-onyx-elevated text-platinum-muted"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchase Payments */}
        <div className="rounded-2xl bg-onyx-surface border border-onyx-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
              Recent Supplier Disbursements
            </h3>
            <button
              onClick={() => onNavigate("payments")}
              className="text-[11px] text-gold hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-onyx-border/60 text-xs">
            {recent.payments.length === 0 ? (
              <p className="py-4 text-center text-platinum-muted">No purchase payments recorded yet.</p>
            ) : (
              recent.payments.map((p: any) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-platinum">{p.paymentNumber}</div>
                    <div className="text-[11px] text-platinum-muted">
                      {p.supplier?.businessName} • {p.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">₹{p.amount.toLocaleString("en-IN")}</div>
                    <span className="text-[10px] text-platinum-muted">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
