// client/src/app/(main)/purchase/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  IconBuildingBank,
  IconCoins,
  IconReceiptTax,
  IconScale,
  IconTruckDelivery,
  IconCash,
  IconReportMoney,
  IconArrowsRightLeft,
  IconFileText,
  IconHistory,
  IconShieldCheck,
  IconRefresh,
  IconBuildingStore,
  IconFileCheck,
  IconTrendingUp,
} from "@tabler/icons-react";

import OverviewPanel from "./components/OverviewPanel";
import BullionsPanel from "./components/BullionsPanel";
import BookingsPanel from "./components/BookingsPanel";
import InvoicesPanel from "./components/InvoicesPanel";
import ReceivingPanel from "./components/ReceivingPanel";
import TransfersPanel from "./components/TransfersPanel";
import PaymentsPanel from "./components/PaymentsPanel";
import SupplierLedgerPanel from "./components/SupplierLedgerPanel";
import ReturnsPanel from "./components/ReturnsPanel";
import CreditDebitNotesPanel from "./components/CreditDebitNotesPanel";
import PurchaseGSTPanel from "./components/PurchaseGSTPanel";
import DocumentsPanel from "./components/DocumentsPanel";
import ReconciliationPanel from "./components/ReconciliationPanel";
import AuditTrailPanel from "./components/AuditTrailPanel";
import VerificationQueueModal from "./components/VerificationQueueModal";
import CashMovementDrawer from "./components/CashMovementDrawer";

export type PurchaseTab =
  | "overview"
  | "bullions"
  | "bookings"
  | "invoices"
  | "receiving"
  | "transfers"
  | "payments"
  | "supplier-ledger"
  | "returns"
  | "credit-debit-notes"
  | "gst-itc"
  | "documents"
  | "reconciliation"
  | "reports"
  | "audit";

const TAB_GROUPS: Array<{
  category: string;
  tabs: Array<{ id: PurchaseTab; label: string; icon: any }>;
}> = [
  {
    category: "Procurement & Metals",
    tabs: [
      { id: "overview", label: "Overview", icon: IconBuildingBank },
      { id: "bullions", label: "Suppliers", icon: IconBuildingStore },
      { id: "bookings", label: "Bookings", icon: IconCoins },
      { id: "invoices", label: "Invoices", icon: IconFileText },
      { id: "receiving", label: "Receiving", icon: IconScale },
      { id: "transfers", label: "Transfers", icon: IconTruckDelivery },
    ],
  },
  {
    category: "Finance & Ledgers",
    tabs: [
      { id: "payments", label: "Payments", icon: IconCash },
      { id: "supplier-ledger", label: "Ledgers", icon: IconReportMoney },
      { id: "returns", label: "Returns", icon: IconArrowsRightLeft },
      { id: "credit-debit-notes", label: "Credit / Debit", icon: IconFileCheck },
    ],
  },
  {
    category: "Tax & Compliance",
    tabs: [
      { id: "gst-itc", label: "GST & ITC", icon: IconReceiptTax },
      { id: "documents", label: "Documents", icon: IconFileText },
      { id: "reconciliation", label: "Reconciliation", icon: IconRefresh },
      { id: "audit", label: "Reports & Trail", icon: IconHistory },
    ],
  },
];

export default function PurchasePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<PurchaseTab>("overview");
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  // Modals & Drawers
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase/overview");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOverviewData(json.data);
          setPendingVerificationsCount(json.data.kpis?.pendingVerificationCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load purchase overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="flex-1 min-w-0 w-full min-h-screen bg-onyx-background text-platinum overflow-x-hidden flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-onyx-border bg-onyx-surface/95 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-sm shadow-gold/10 shrink-0">
              <IconBuildingBank className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-platinum">
                  Purchase & Bullion Procurement Panel
                </h1>
                <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase rounded-full bg-gold/15 text-gold border border-gold/30 whitespace-nowrap">
                  Central Controlled
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-platinum-muted">
                24K Metal Bookings, Supplier Ledgers, GST ITC, Receiving & Transfers
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Liquidity Net Cash Quick Badge */}
            {overviewData?.kpis && (
              <button
                onClick={() => setIsCashDrawerOpen(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border hover:border-gold/50 transition-all text-xs"
                title="Click to view Cash Liquidity Breakdown"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[9px] sm:text-[10px] text-platinum-muted uppercase font-semibold">Net Cash to Book</span>
                  <span className={`font-bold text-xs ${overviewData.kpis.netCashLeftToBook >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    ₹{overviewData.kpis.netCashLeftToBook.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse shrink-0" />
              </button>
            )}

            {/* Pending Verifications Button */}
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                pendingVerificationsCount > 0
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 animate-pulse"
                  : "bg-onyx-elevated border-onyx-border text-platinum-muted hover:text-platinum"
              }`}
            >
              <IconShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Verification Queue</span>
              <span className="sm:hidden">Queue</span>
              {pendingVerificationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-onyx font-bold text-[10px]">
                  {pendingVerificationsCount}
                </span>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-1.5 sm:p-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-gold" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs Bar — Fully Visible, Zero Horizontal Scroll */}
      <nav className="sticky top-[57px] z-20 w-full border-b border-onyx-border bg-onyx-surface/98 backdrop-blur-md shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {TAB_GROUPS.map((group, groupIdx) => (
            <React.Fragment key={group.category}>
              {groupIdx > 0 && (
                <div className="hidden md:block w-[1px] h-5 bg-onyx-border/80 mx-1 shrink-0" />
              )}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-gold text-onyx shadow-md shadow-gold/25 font-bold scale-[1.02]"
                          : "text-platinum-muted hover:text-platinum hover:bg-onyx-elevated"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === "overview" && (
          <OverviewPanel
            data={overviewData}
            loading={loading}
            onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
            onNavigate={(tab) => setActiveTab(tab)}
            onRefresh={fetchOverview}
          />
        )}
        {activeTab === "bullions" && <BullionsPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "bookings" && <BookingsPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "invoices" && <InvoicesPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "receiving" && <ReceivingPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "transfers" && <TransfersPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "payments" && <PaymentsPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "supplier-ledger" && <SupplierLedgerPanel />}
        {activeTab === "returns" && <ReturnsPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "credit-debit-notes" && <CreditDebitNotesPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "gst-itc" && <PurchaseGSTPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "documents" && <DocumentsPanel onRefreshOverview={fetchOverview} />}
        {activeTab === "reconciliation" && <ReconciliationPanel />}
        {activeTab === "audit" && <AuditTrailPanel />}
      </main>

      {/* Verification Queue Modal */}
      {isVerificationModalOpen && (
        <VerificationQueueModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            fetchOverview();
          }}
          onDecisionMade={() => {
            fetchOverview();
          }}
        />
      )}

      {/* Cash Movement Liquidity Drawer */}
      {isCashDrawerOpen && (
        <CashMovementDrawer
          isOpen={isCashDrawerOpen}
          onClose={() => setIsCashDrawerOpen(false)}
          liquidityData={overviewData?.liquidity}
        />
      )}
    </div>
  );
}
