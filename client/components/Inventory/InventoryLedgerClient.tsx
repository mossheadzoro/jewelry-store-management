"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileText,
  User,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { useUserStore } from "@/lib/store/useUserStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Transaction styling mappings
const TXN_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PURCHASE_IN: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Purchase In" },
  SALE_OUT: { bg: "bg-red-500/10", text: "text-red-400", label: "Sale Out" },
  TRANSFER_OUT: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Transfer Out" },
  TRANSFER_IN: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Transfer In" },
  KARIGAR_ISSUE_OUT: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Karigar Issue" },
  KARIGAR_RECEIVE_IN: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Karigar Receive" },
  ADJUSTMENT_IN: { bg: "bg-lime-500/10", text: "text-lime-400", label: "Adjust In" },
  ADJUSTMENT_OUT: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Adjust Out" },
  OPENING: { bg: "bg-white/10", text: "text-white", label: "Opening" },
  MANUFACTURE_IN: { bg: "bg-teal-500/10", text: "text-teal-400", label: "Manufacture" },
  DAMAGE_OUT: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Damage" },
  RESERVE_OUT: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Reserved" },
  UNRESERVE_IN: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Unreserved" },
  HALLMARK_OUT: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Hallmark Out" },
  HALLMARK_IN: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Hallmark In" },
  REPAIR_ISSUE_OUT: { bg: "bg-indigo-500/10", text: "text-indigo-400", label: "Repair Issue" },
  REPAIR_RECEIVE_IN: { bg: "bg-violet-500/10", text: "text-violet-400", label: "Repair Receive" },
  APPROVAL_OUT: { bg: "bg-pink-500/10", text: "text-pink-400", label: "Approval Out" },
  APPROVAL_IN: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", label: "Approval In" },
  CONSIGNMENT_OUT: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Consignment Out" },
  CONSIGNMENT_IN: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Consignment In" },
  ASSAY_OUT: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Assay Out" },
  ASSAY_IN: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Assay In" },
  REMELTING_IN: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Remelting In" },
  BREAKAGE_ADJUST: { bg: "bg-red-500/10", text: "text-red-400", label: "Breakage Adjust" },
  CLOSING_SNAPSHOT: { bg: "bg-neutral-500/10", text: "text-neutral-400", label: "Closing Snapshot" }
};

const TXN_TYPES = [
  "ALL",
  "PURCHASE_IN",
  "SALE_OUT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "KARIGAR_ISSUE_OUT",
  "KARIGAR_RECEIVE_IN",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "HALLMARK_OUT",
  "HALLMARK_IN",
  "REPAIR_ISSUE_OUT",
  "REPAIR_RECEIVE_IN",
  "APPROVAL_OUT",
  "APPROVAL_IN",
  "CONSIGNMENT_OUT",
  "CONSIGNMENT_IN",
  "ASSAY_OUT",
  "ASSAY_IN",
  "REMELTING_IN",
  "BREAKAGE_ADJUST",
  "CLOSING_SNAPSHOT"
];

// Helper to format currency in INR
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(val);
};

export default function InventoryLedgerClient() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<"ledger" | "karigar" | "approval">("ledger");
  const [branches, setBranches] = useState<any[]>([]);

  // --------------------------------------------------
  // Tab 1: Stock Ledger States
  // --------------------------------------------------
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any>(null);
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerBranchId, setLedgerBranchId] = useState("");
  const [ledgerTxnType, setLedgerTxnType] = useState("ALL");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // --------------------------------------------------
  // Tab 2: Karigar Reconciliation States
  // --------------------------------------------------
  const [karigarJobs, setKarigarJobs] = useState<any[]>([]);
  const [karigarTotals, setKarigarTotals] = useState<any>(null);
  const [karigarPagination, setKarigarPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [karigarLoading, setKarigarLoading] = useState(true);
  const [karigarBranchId, setKarigarBranchId] = useState("");
  const [karigarSearch, setKarigarSearch] = useState("");
  const [karigarStatus, setKarigarStatus] = useState("ALL");
  const [karigarDateFrom, setKarigarDateFrom] = useState("");
  const [karigarDateTo, setKarigarDateTo] = useState("");

  // --------------------------------------------------
  // Tab 3: Approval Outstanding States
  // --------------------------------------------------
  const [approvalMemos, setApprovalMemos] = useState<any[]>([]);
  const [approvalTotals, setApprovalTotals] = useState<any>(null);
  const [approvalPagination, setApprovalPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [approvalBranchId, setApprovalBranchId] = useState("");
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalOverdueDays, setApprovalOverdueDays] = useState("14");

  // --------------------------------------------------
  // Action/Modal States
  // --------------------------------------------------
  const [locking, setLocking] = useState(false);
  const [showYearEndModal, setShowYearEndModal] = useState(false);
  const [closingYear, setClosingYear] = useState("2024-25");
  const [closingLoading, setClosingLoading] = useState(false);

  const [showHuidAuditModal, setShowHuidAuditModal] = useState(false);
  const [huidAuditData, setHuidAuditData] = useState<any>(null);
  const [huidAuditLoading, setHuidAuditLoading] = useState(false);

  const [showStockSummaryModal, setShowStockSummaryModal] = useState(false);
  const [stockSummaryData, setStockSummaryData] = useState<any>(null);
  const [stockSummaryLoading, setStockSummaryLoading] = useState(false);

  // --------------------------------------------------
  // Data Fetching Hooks
  // --------------------------------------------------
  useEffect(() => {
    fetch("/api/branch/fetch")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data);
        } else if (data && Array.isArray(data.branches)) {
          setBranches(data.branches);
        } else {
          setBranches([
            { id: 1, name: "Delhi Atelier" },
            { id: 2, name: "Mumbai Atelier" },
            { id: 3, name: "Kolkata Atelier" }
          ]);
        }
      })
      .catch(() => {
        setBranches([
          { id: 1, name: "Delhi Atelier" },
          { id: 2, name: "Mumbai Atelier" },
          { id: 3, name: "Kolkata Atelier" }
        ]);
      });
  }, []);

  const fetchLedger = useCallback(async (page = 1) => {
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (ledgerBranchId) params.set("branchId", ledgerBranchId);
      if (ledgerTxnType !== "ALL") params.set("txnType", ledgerTxnType);
      if (ledgerDateFrom) params.set("dateFrom", ledgerDateFrom);
      if (ledgerDateTo) params.set("dateTo", ledgerDateTo);
      // Backend handles database search, but we also filter locally for SKU/Product
      const res = await fetch(`/api/inventory/ledger?${params}`);
      const data = await res.json();
      setLedgerEntries(data.entries || []);
      setLedgerSummary(data.summary || {});
      setLedgerPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerBranchId, ledgerTxnType, ledgerDateFrom, ledgerDateTo]);

  const fetchKarigar = useCallback(async (page = 1) => {
    setKarigarLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (karigarBranchId) params.set("branchId", karigarBranchId);
      if (karigarStatus !== "ALL") params.set("status", karigarStatus);
      if (karigarDateFrom) params.set("dateFrom", karigarDateFrom);
      if (karigarDateTo) params.set("dateTo", karigarDateTo);

      const res = await fetch(`/api/inventory/karigar-reconciliation?${params}`);
      const data = await res.json();
      setKarigarJobs(data.items || []);
      setKarigarTotals(data.totals || {});
      setKarigarPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setKarigarLoading(false);
    }
  }, [karigarBranchId, karigarStatus, karigarDateFrom, karigarDateTo]);

  const fetchApproval = useCallback(async (page = 1) => {
    setApprovalLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (approvalBranchId) params.set("branchId", approvalBranchId);
      if (approvalOverdueDays) params.set("overdueDays", approvalOverdueDays);

      const res = await fetch(`/api/inventory/approval-outstanding?${params}`);
      const data = await res.json();
      setApprovalMemos(data.items || []);
      setApprovalTotals(data.totals || {});
      setApprovalPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setApprovalLoading(false);
    }
  }, [approvalBranchId, approvalOverdueDays]);

  // Trigger fetches
  useEffect(() => {
    if (activeTab === "ledger") {
      fetchLedger(1);
    } else if (activeTab === "karigar") {
      fetchKarigar(1);
    } else if (activeTab === "approval") {
      fetchApproval(1);
    }
  }, [activeTab, fetchLedger, fetchKarigar, fetchApproval]);

  // --------------------------------------------------
  // Lock / Closing Handlers
  // --------------------------------------------------
  const handleLockEntries = async () => {
    if (!confirm("Are you sure you want to lock old ledger entries? Locked entries represent a verified audit trail and cannot be modified or deleted.")) {
      return;
    }
    setLocking(true);
    try {
      const res = await fetch("/api/inventory/ledger/lock-old-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        if (activeTab === "ledger") fetchLedger(ledgerPagination.page);
      } else {
        alert(data.error || "Failed to lock entries");
      }
    } catch (err: any) {
      alert("Error locking entries: " + err.message);
    } finally {
      setLocking(false);
    }
  };

  const handleRunYearEndClosing = async () => {
    if (!confirm(`Are you sure you want to execute Year-End Closing for FY ${closingYear}? This will snapshot all balances and lock them.`)) {
      return;
    }
    setClosingLoading(true);
    try {
      const res = await fetch("/api/inventory/year-end-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialYear: closingYear })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowYearEndModal(false);
        if (activeTab === "ledger") fetchLedger(1);
      } else {
        alert(data.error || "Failed to run closing");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setClosingLoading(false);
    }
  };

  const handleOpenHuidAudit = async () => {
    setShowHuidAuditModal(true);
    setHuidAuditLoading(true);
    try {
      const res = await fetch("/api/inventory/huid-audit");
      const data = await res.json();
      setHuidAuditData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHuidAuditLoading(false);
    }
  };

  const handleOpenStockSummary = async () => {
    setShowStockSummaryModal(true);
    setStockSummaryLoading(true);
    try {
      const res = await fetch("/api/inventory/stock-summary?limit=100");
      const data = await res.json();
      setStockSummaryData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStockSummaryLoading(false);
    }
  };

  // Local filter for ledger items
  const filteredLedgerEntries = ledgerSearch
    ? ledgerEntries.filter(
        (e) =>
          e.product?.name?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
          e.product?.productCode?.toLowerCase().includes(ledgerSearch.toLowerCase())
      )
    : ledgerEntries;

  // Local filter for karigar items
  const filteredKarigarJobs = karigarSearch
    ? karigarJobs.filter(
        (j) =>
          j.karigarName?.toLowerCase().includes(karigarSearch.toLowerCase()) ||
          j.jobRefId?.toLowerCase().includes(karigarSearch.toLowerCase())
      )
    : karigarJobs;

  // Local filter for approval items
  const filteredApprovalMemos = approvalSearch
    ? approvalMemos.filter(
        (a) =>
          a.productName?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
          a.productCode?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
          a.approvalRefId?.toLowerCase().includes(approvalSearch.toLowerCase())
      )
    : approvalMemos;

  return (
    <main className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto select-none">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 mb-8 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-1 flex-wrap">
           
            <button
              onClick={() => setActiveTab("ledger")}
              className={`h-10 px-5 text-[14px] font-medium transition-all relative cursor-pointer ${
                activeTab === "ledger" ? "text-[#D4A843]" : "text-zinc-500 hover:text-white"
              }`}
            >
              Stock Ledger
              {activeTab === "ledger" && (
                <div className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#D4A843]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("karigar")}
              className={`h-10 px-5 text-[14px] font-medium transition-all relative cursor-pointer ${
                activeTab === "karigar" ? "text-[#D4A843]" : "text-zinc-500 hover:text-white"
              }`}
            >
              Karigar Reconciliation
              {activeTab === "karigar" && (
                <div className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#D4A843]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("approval")}
              className={`h-10 px-5 text-[14px] font-medium transition-all relative cursor-pointer ${
                activeTab === "approval" ? "text-[#D4A843]" : "text-zinc-500 hover:text-white"
              }`}
            >
              Approval Outstanding
              {activeTab === "approval" && (
                <div className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#D4A843]" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenHuidAudit}
              className="h-9 px-4 rounded-lg bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20 text-[11px] font-bold tracking-wider hover:bg-[#D4A843]/20 active:scale-95 transition-all uppercase cursor-pointer"
            >
              HUID Audit
            </button>
            <button
              onClick={() => setShowYearEndModal(true)}
              className="h-9 px-4 rounded-lg bg-transparent text-zinc-300 border border-zinc-700 text-[11px] font-medium hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              Year-End Closing
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: STOCK LEDGER */}
        {/* ========================================================================= */}
        {activeTab === "ledger" && (
          <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-[32px] font-bold text-white tracking-tight">Stock Ledger</h1>
                <p className="text-[14px] text-zinc-500 mt-1">Complete immutable audit trail of all inventory movements</p>
              </div>
              <div className="flex items-center gap-3">
                {(user?.systemRole === "ADMIN" || user?.role === "ADMIN") && (
                  <button
                    disabled={locking}
                    onClick={handleLockEntries}
                    className="h-10 px-5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-[13px] font-medium flex items-center gap-2 hover:bg-red-500/10 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {locking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Lock Old Entries
                  </button>
                )}
                <button
                  onClick={() => fetchLedger(ledgerPagination.page)}
                  className="h-10 px-5 rounded-full border border-zinc-700 text-zinc-300 text-[13px] font-medium flex items-center gap-2 hover:bg-zinc-900 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Ledger Summary Cards */}
            {ledgerSummary && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: "Qty In", value: `${ledgerSummary.totalQtyIn} pcs`, icon: <ArrowDownLeft className="w-4 h-4 text-emerald-400" />, color: "text-emerald-400" },
                  { label: "Qty Out", value: `${ledgerSummary.totalQtyOut} pcs`, icon: <ArrowUpRight className="w-4 h-4 text-rose-400" />, color: "text-rose-400" },
                  { label: "Net Weight In", value: `${(ledgerSummary.totalNetWtIn || 0).toFixed(3)} g`, icon: <ArrowDownLeft className="w-4 h-4 text-[#D4A843]" />, color: "text-[#D4A843]" },
                  { label: "Net Weight Out", value: `${(ledgerSummary.totalNetWtOut || 0).toFixed(3)} g`, icon: <ArrowUpRight className="w-4 h-4 text-orange-400" />, color: "text-orange-400" },
                  { label: "Fine Weight In", value: `${(ledgerSummary.totalFineWtIn || 0).toFixed(3)} g`, icon: <ArrowDownLeft className="w-4 h-4 text-cyan-400" />, color: "text-cyan-400" },
                  { label: "Fine Weight Out", value: `${(ledgerSummary.totalFineWtOut || 0).toFixed(3)} g`, icon: <ArrowUpRight className="w-4 h-4 text-purple-400" />, color: "text-purple-400" }
                ].map((card, i) => (
                  <div key={i} className="bg-[#121212]/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-default group">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                        {card.icon}
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{card.label}</p>
                    </div>
                    <p className={`text-[20px] font-bold ${card.color} tracking-tight`}>{card.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters panel */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 mb-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Branch</label>
                  <select
                    value={ledgerBranchId}
                    onChange={(e) => setLedgerBranchId(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[13px] outline-none cursor-pointer focus:border-[#D4A843]/50 transition-colors"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Product Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="SKU or Item Name..."
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-[13px] placeholder:text-zinc-600 outline-none focus:border-[#D4A843]/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tx Type</label>
                  <select
                    value={ledgerTxnType}
                    onChange={(e) => setLedgerTxnType(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[13px] outline-none cursor-pointer focus:border-[#D4A843]/50 transition-colors"
                  >
                    {TXN_TYPES.map((t) => <option key={t} value={t}>{t === "ALL" ? "All Types" : (TXN_COLORS[t]?.label || t)}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={ledgerDateFrom}
                      onChange={(e) => setLedgerDateFrom(e.target.value)}
                      className="h-10 px-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[12px] outline-none flex-1 focus:border-[#D4A843]/50"
                    />
                    <span className="text-zinc-600 text-[11px]">to</span>
                    <input
                      type="date"
                      value={ledgerDateTo}
                      onChange={(e) => setLedgerDateTo(e.target.value)}
                      className="h-10 px-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[12px] outline-none flex-1 focus:border-[#D4A843]/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 mt-4 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchLedger(1)}
                    className="h-9 px-6 rounded-lg bg-[#D4A843] text-zinc-950 text-[12px] font-bold uppercase tracking-wider hover:bg-[#C69D35] active:scale-95 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setLedgerSearch("");
                      setLedgerBranchId("");
                      setLedgerTxnType("ALL");
                      setLedgerDateFrom("");
                      setLedgerDateTo("");
                      setTimeout(() => fetchLedger(1), 10);
                    }}
                    className="h-9 px-6 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-[12px] font-medium hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <button
                  onClick={handleOpenStockSummary}
                  className="text-[#D4A843] hover:underline text-[12px] font-semibold flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  Stock Summary ↗
                </button>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <div className="grid grid-cols-[60px_1fr_130px_130px_90px_110px_110px_130px_130px] gap-4 px-6 py-4 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#0d0d0d]">
                <span>#</span>
                <span>Product</span>
                <span>Type / Ref</span>
                <span>Purity / HUID</span>
                <span>Qty</span>
                <span>Net Weight</span>
                <span>Fine Weight</span>
                <span>Running Balance</span>
                <span>Date & Status</span>
              </div>

              {ledgerLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" /></div>
              ) : filteredLedgerEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20"><p className="text-zinc-500 text-[14px]">No ledger entries found.</p></div>
              ) : (
                filteredLedgerEntries.map((entry: any, index) => {
                  const style = TXN_COLORS[entry.txnType] || { bg: "bg-white/5", text: "text-zinc-400", label: entry.txnType };
                  const formattedSeq = (entry.sequenceNo ?? 0).toString().padStart(3, "0");

                  const isQtyIn = entry.qtyIn > 0;
                  const isQtyOut = entry.qtyOut > 0;
                  const qtyDisplay = isQtyIn ? `+${entry.qtyIn}` : isQtyOut ? `-${entry.qtyOut}` : "0";
                  const qtyColor = isQtyIn ? "text-emerald-400 font-semibold" : isQtyOut ? "text-rose-400 font-semibold" : "text-zinc-600";

                  const isWtIn = entry.netWeightIn > 0;
                  const isWtOut = entry.netWeightOut > 0;
                  const wtDisplay = isWtIn ? `+${entry.netWeightIn.toFixed(3)}g` : isWtOut ? `-${entry.netWeightOut.toFixed(3)}g` : "—";
                  const wtColor = isWtIn ? "text-emerald-400/80 font-medium" : isWtOut ? "text-rose-400/80 font-medium" : "text-zinc-500";

                  const isFineIn = entry.fineWeightIn > 0;
                  const isFineOut = entry.fineWeightOut > 0;
                  const fineDisplay = isFineIn ? `+${entry.fineWeightIn.toFixed(3)}g` : isFineOut ? `-${entry.fineWeightOut.toFixed(3)}g` : "—";
                  const fineColor = isFineIn ? "text-cyan-400/85 font-medium" : isFineOut ? "text-purple-400/85 font-medium" : "text-zinc-500";

                  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = new Date(entry.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="grid grid-cols-[60px_1fr_130px_130px_90px_110px_110px_130px_130px] gap-4 px-6 py-4 border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors text-[13px] items-center cursor-pointer"
                    >
                      {/* Seq No */}
                      <span className="font-mono text-zinc-500">{formattedSeq}</span>

                      {/* Product */}
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate" title={entry.product?.name}>{entry.product?.name || "—"}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{entry.product?.productCode || ""}</p>
                      </div>

                      {/* Type / Ref */}
                      <div className="flex flex-col gap-1">
                        <div>
                          {entry.txnType === 'RESERVE_OUT' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${style.bg} ${style.text} cursor-help underline decoration-dashed underline-offset-2`}>
                                    {style.label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#1a1a1a] border border-gray-800 text-gray-200">
                                  <p className="font-semibold text-amber-500 mb-1">Reservation Details</p>
                                  <p>Type: <span className="text-white">{entry.refType}</span></p>
                                  {entry.refId && <p>Ref ID: <span className="text-white font-mono">{entry.refId}</span></p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${style.bg} ${style.text}`}>
                              {style.label}
                            </span>
                          )}
                        </div>
                        {entry.refType !== "MANUAL" && (
                          <span className="text-[11px] text-zinc-500 font-mono truncate" title={entry.refDetails || `${entry.refType}: ${entry.refId || ""}`}>
                            {entry.refDetails ? entry.refDetails : `${entry.refType}${entry.refId ? `: ${entry.refId}` : ""}`}
                          </span>
                        )}
                      </div>

                      {/* Purity / HUID */}
                      <div className="flex flex-col gap-0.5">
                        {entry.karatage ? (
                          <span className="text-white font-medium">
                            {entry.karatage}K <span className="text-[11px] text-zinc-500">({entry.purityPercent}%)</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">No Purity</span>
                        )}
                        {entry.huidNumber ? (
                          <span className="text-[11px] text-[#D4A843]/80 font-mono font-semibold truncate" title={entry.huidNumber}>
                            {entry.huidNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono">No HUID</span>
                        )}
                      </div>

                      {/* Qty */}
                      <p className={qtyColor}>{qtyDisplay}</p>

                      {/* Net Weight */}
                      <p className={wtColor}>{wtDisplay}</p>

                      {/* Fine Weight */}
                      <p className={fineColor}>{fineDisplay}</p>

                      {/* Running Balance */}
                      <div className="flex flex-col gap-0.5">
                        <p className="text-white font-bold">{entry.balanceQty} pcs</p>
                        <p className="text-[11px] text-zinc-500">Net: <span className="text-zinc-300 font-medium">{entry.balanceNetWt.toFixed(3)}g</span></p>
                        <p className="text-[11px] text-cyan-500/60">Fine: <span className="text-cyan-400/80 font-medium">{entry.balanceFineWt.toFixed(3)}g</span></p>
                      </div>

                      {/* Date & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{formattedDate}</span>
                          <span className="text-[11px] text-zinc-600">{formattedTime}</span>
                        </div>
                        <div>
                          {entry.isLocked ? (
                            <div className="flex items-center gap-1 bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-red-500/20" title="Locked audit log: immutable">
                              <Lock className="w-3 h-3 text-red-400" />
                              <span>Locked</span>
                            </div>
                          ) : (
                            <div className="text-zinc-700" title="Unlocked: active ledger entry">
                              <Unlock className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {ledgerPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-[12px] text-zinc-500">Showing page {ledgerPagination.page} of {ledgerPagination.totalPages} ({ledgerPagination.total} entries)</p>
                <div className="flex gap-2">
                  <button disabled={ledgerPagination.page <= 1} onClick={() => fetchLedger(ledgerPagination.page - 1)} className="h-9 w-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-950 disabled:opacity-30 transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={ledgerPagination.page >= ledgerPagination.totalPages} onClick={() => fetchLedger(ledgerPagination.page + 1)} className="h-9 w-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-950 disabled:opacity-30 transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KARIGAR RECONCILIATION */}
        {/* ========================================================================= */}
        {activeTab === "karigar" && (
          <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-[32px] font-bold text-white tracking-tight">Karigar Reconciliation</h1>
                <p className="text-[14px] text-zinc-500 mt-1">Monitor metal issuance, receipt, and wastage variance across all artisan workshops. High-stakes auditing for precious material management.</p>
              </div>
              <button
                onClick={() => fetchKarigar(karigarPagination.page)}
                className="h-10 px-5 rounded-full border border-zinc-700 text-zinc-300 text-[13px] font-medium flex items-center gap-2 hover:bg-zinc-900 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Karigar Filters */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 mb-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Branch</label>
                  <select
                    value={karigarBranchId}
                    onChange={(e) => setKarigarBranchId(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[13px] outline-none cursor-pointer focus:border-[#D4A843]/50 transition-colors"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Karigar Selector</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      value={karigarSearch}
                      onChange={(e) => setKarigarSearch(e.target.value)}
                      placeholder="Search artisan..."
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-[13px] placeholder:text-zinc-600 outline-none focus:border-[#D4A843]/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                  <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-0.5 gap-0.5">
                    {["ALL", "OPEN", "CLOSED", "OVERDUE"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setKarigarStatus(s)}
                        className={`h-8 flex-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          karigarStatus === s ? "bg-[#D4A843] text-zinc-950" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={karigarDateFrom}
                      onChange={(e) => setKarigarDateFrom(e.target.value)}
                      className="h-10 px-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[12px] outline-none flex-1 focus:border-[#D4A843]/50"
                    />
                    <span className="text-zinc-600 text-[11px]">to</span>
                    <input
                      type="date"
                      value={karigarDateTo}
                      onChange={(e) => setKarigarDateTo(e.target.value)}
                      className="h-10 px-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[12px] outline-none flex-1 focus:border-[#D4A843]/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 mt-4 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchKarigar(1)}
                    className="h-9 px-6 rounded-lg bg-[#D4A843] text-zinc-950 text-[12px] font-bold uppercase tracking-wider hover:bg-[#C69D35] active:scale-95 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setKarigarSearch("");
                      setKarigarBranchId("");
                      setKarigarStatus("ALL");
                      setKarigarDateFrom("");
                      setKarigarDateTo("");
                      setTimeout(() => fetchKarigar(1), 10);
                    }}
                    className="h-9 px-6 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-[12px] font-medium hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Karigar Table */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 mb-8">
              <div className="grid grid-cols-[1.5fr_1.2fr_100px_100px_100px_100px_100px_150px_110px] gap-4 px-6 py-4 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#0d0d0d]">
                <span>Artisan Details</span>
                <span>Job Reference</span>
                <span>Issued</span>
                <span>Received</span>
                <span>O/S</span>
                <span>Allowed Wst</span>
                <span>Actual Wst</span>
                <span>Variance</span>
                <span>Status</span>
              </div>

              {karigarLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" /></div>
              ) : filteredKarigarJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20"><p className="text-zinc-500 text-[14px]">No karigar reconciliation jobs found.</p></div>
              ) : (
                filteredKarigarJobs.map((job: any) => {
                  let statusColor = "bg-zinc-800 text-zinc-400";
                  if (job.status === "OPEN") statusColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                  else if (job.status === "CLOSED") statusColor = "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
                  else if (job.status === "OVERDUE") statusColor = "bg-red-500/10 text-red-400 border border-red-500/20";

                  const varianceColor = job.wastageVariance > 0 ? "text-red-400 font-semibold" : job.wastageVariance < 0 ? "text-emerald-400 font-semibold" : "text-zinc-400";
                  const formattedDate = new Date(job.issuedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={job.jobRefId}
                      className="grid grid-cols-[1.5fr_1.2fr_100px_100px_100px_100px_100px_150px_110px] gap-4 px-6 py-4 border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors text-[13px] items-center"
                    >
                      {/* Artisan Details */}
                      <div>
                        <p className="text-white font-medium">{job.karigarName}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 uppercase tracking-wide font-semibold text-[10px]">
                          {job.karigarDepartment} WORKSHOP
                        </p>
                      </div>

                      {/* Job Reference */}
                      <div>
                        <p className="font-mono text-[#D4A843] font-medium">{job.jobRefId}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-mono uppercase">
                          Issued: {formattedDate}
                        </p>
                      </div>

                      {/* Issued */}
                      <p className="text-zinc-300 font-mono font-medium">{job.issuedNetWt.toFixed(3)}g</p>

                      {/* Received */}
                      <p className="text-zinc-300 font-mono font-medium">{job.receivedNetWt.toFixed(3)}g</p>

                      {/* Outstanding */}
                      <p className={`font-mono font-bold ${job.outstandingNetWt > 0 ? "text-[#D4A843]" : "text-zinc-600"}`}>
                        {job.outstandingNetWt.toFixed(3)}g
                      </p>

                      {/* Allowed Wastage */}
                      <p className="text-zinc-500 font-mono">{job.allowedWastage.toFixed(3)}g</p>

                      {/* Actual Wastage */}
                      <p className="text-zinc-400 font-mono">{job.actualWastage.toFixed(3)}g</p>

                      {/* Variance */}
                      <div className="flex flex-col">
                        <span className={`font-mono font-bold ${varianceColor}`}>
                          {job.wastageVariance > 0 ? `+${job.wastageVariance.toFixed(3)}g` : `${job.wastageVariance.toFixed(3)}g`}
                        </span>
                        {job.wastageVariance > 0 && (
                          <span className="text-[9px] text-red-500/80 font-bold uppercase tracking-wider mt-0.5">
                            Excess Wastage
                          </span>
                        )}
                        {job.wastageVariance < 0 && (
                          <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider mt-0.5">
                            Metal Saved
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${statusColor}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Karigar KPI Summary Cards (placed at the bottom matching Design 2) */}
            {karigarTotals && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#121212] border border-l-4 border-l-rose-500 border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Metal Variance</p>
                  <p className={`text-[28px] font-black ${karigarTotals.totalWastageVariance > 0 ? "text-rose-500" : "text-emerald-400"}`}>
                    {karigarTotals.totalWastageVariance > 0 ? `+${karigarTotals.totalWastageVariance.toFixed(3)}g` : `${karigarTotals.totalWastageVariance.toFixed(3)}g`}
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-2 font-medium">MTD Cumulative Loss</p>
                </div>
                <div className="bg-[#121212] border border-l-4 border-l-[#D4A843] border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Critical Jobs (Overdue)</p>
                  <p className="text-[28px] font-black text-[#D4A843]">
                    {karigarTotals.overdueJobs.toString().padStart(2, "0")} <span className="text-[14px] font-medium text-zinc-500">Actions Required</span>
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-2 font-medium">Open longer than 30 days</p>
                </div>
                <div className="bg-[#121212] border border-l-4 border-l-emerald-500 border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Karigar Efficiency Avg</p>
                  <p className="text-[28px] font-black text-emerald-400">
                    {karigarTotals.totalIssuedWt > 0
                      ? (Math.max(0, 100 - (Math.abs(karigarTotals.totalWastageVariance) / karigarTotals.totalIssuedWt) * 100)).toFixed(1)
                      : "99.2"}%
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-2 font-medium">Accuracy Score MTD</p>
                </div>
              </div>
            )}

            {/* Pagination */}
            {karigarPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-[12px] text-zinc-500">Showing page {karigarPagination.page} of {karigarPagination.totalPages} ({karigarPagination.total} jobs)</p>
                <div className="flex gap-2">
                  <button disabled={karigarPagination.page <= 1} onClick={() => fetchKarigar(karigarPagination.page - 1)} className="h-9 w-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-950 disabled:opacity-30 transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={karigarPagination.page >= karigarPagination.totalPages} onClick={() => fetchKarigar(karigarPagination.page + 1)} className="h-9 w-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-950 disabled:opacity-30 transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: APPROVAL OUTSTANDING */}
        {/* ========================================================================= */}
        {activeTab === "approval" && (
          <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-[32px] font-bold text-white tracking-tight">Approval Outstanding</h1>
                <p className="text-[14px] text-zinc-500 mt-1">Track high-value inventory sent on approval or memo to VIP clients and events</p>
              </div>
              <button
                onClick={() => fetchApproval(approvalPagination.page)}
                className="h-10 px-5 rounded-full border border-zinc-700 text-zinc-300 text-[13px] font-medium flex items-center gap-2 hover:bg-zinc-900 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Approval Totals KPI Cards (placed at the top) */}
            {approvalTotals && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                  { label: "Active Memos", value: approvalTotals.totalItems, color: "text-[#D4A843]", border: "border-zinc-800" },
                  { label: "Outstanding Qty", value: `${approvalTotals.totalQty} pcs`, color: "text-zinc-200", border: "border-zinc-800" },
                  { label: "Outstanding Weight", value: `${(approvalTotals.totalNetWt || 0).toFixed(3)}g`, color: "text-[#D4A843]", border: "border-zinc-800" },
                  { label: "Estimated Value", value: formatCurrency(approvalTotals.totalEstimatedValue || 0), color: "text-emerald-400", border: "border-zinc-800" },
                  { label: "Overdue Memos", value: approvalTotals.overdueCount, color: "text-rose-500", border: "border-rose-500/20 bg-rose-500/5" }
                ].map((card, i) => (
                  <div key={i} className={`border rounded-2xl p-4 flex flex-col justify-between shadow-md ${card.border} bg-[#121212]/50`}>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{card.label}</p>
                    <p className={`text-[20px] font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Approval Filters */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 mb-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Branch</label>
                  <select
                    value={approvalBranchId}
                    onChange={(e) => setApprovalBranchId(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[13px] outline-none cursor-pointer focus:border-[#D4A843]/50 transition-colors"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Search Memo / Customer</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      value={approvalSearch}
                      onChange={(e) => setApprovalSearch(e.target.value)}
                      placeholder="SKU, memo #, or customer..."
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-[13px] placeholder:text-zinc-600 outline-none focus:border-[#D4A843]/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overdue Threshold</label>
                  <select
                    value={approvalOverdueDays}
                    onChange={(e) => setApprovalOverdueDays(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[13px] outline-none cursor-pointer focus:border-[#D4A843]/50 transition-colors"
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days (Standard)</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-zinc-900 mt-4 pt-4">
                <button
                  onClick={() => fetchApproval(1)}
                  className="h-9 px-6 rounded-lg bg-[#D4A843] text-zinc-950 text-[12px] font-bold uppercase tracking-wider hover:bg-[#C69D35] active:scale-95 transition-all cursor-pointer"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setApprovalSearch("");
                    setApprovalBranchId("");
                    setApprovalOverdueDays("14");
                    setTimeout(() => fetchApproval(1), 10);
                  }}
                  className="h-9 px-6 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-[12px] font-medium hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Approval Table */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <div className="grid grid-cols-[1.2fr_1.2fr_100px_70px_100px_90px_120px_110px_1fr] gap-4 px-6 py-4 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#0d0d0d]">
                <span>Customer / Memo</span>
                <span>Product Details</span>
                <span>Branch</span>
                <span>Qty</span>
                <span>Net Weight</span>
                <span>Duration Out</span>
                <span>Estimated Value</span>
                <span>Status</span>
                <span>Remarks</span>
              </div>

              {approvalLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" /></div>
              ) : filteredApprovalMemos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20"><p className="text-zinc-500 text-[14px]">No outstanding approval items found.</p></div>
              ) : (
                filteredApprovalMemos.map((memo: any) => {
                  const sentDate = new Date(memo.sentAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={memo.ledgerEntryId}
                      className="grid grid-cols-[1.2fr_1.2fr_100px_70px_100px_90px_120px_110px_1fr] gap-4 px-6 py-4 border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors text-[13px] items-center"
                    >
                      {/* Customer / Memo */}
                      <div>
                        <p className="text-white font-medium">VIP Client / Customer</p>
                        <p className="text-[11px] text-[#D4A843] font-mono mt-0.5">{memo.approvalRefId}</p>
                      </div>

                      {/* Product Details */}
                      <div>
                        <p className="text-white font-medium truncate" title={memo.productName}>{memo.productName}</p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{memo.productCode}</p>
                      </div>

                      {/* Branch */}
                      <p className="text-zinc-300">{memo.branchName}</p>

                      {/* Qty */}
                      <p className="text-zinc-300 font-semibold">{memo.qty} pc</p>

                      {/* Net Weight */}
                      <p className="text-zinc-300 font-mono">{memo.netWt.toFixed(3)}g</p>

                      {/* Days Out */}
                      <div className="flex flex-col">
                        <span className={`font-medium ${memo.isOverdue ? "text-rose-400 font-bold" : "text-zinc-300"}`}>
                          {memo.daysOut} Days
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{sentDate}</span>
                      </div>

                      {/* Estimated Value */}
                      <p className="text-emerald-400 font-semibold font-mono">{formatCurrency(memo.estimatedValue)}</p>

                      {/* Status */}
                      <div>
                        {memo.isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            PENDING
                          </span>
                        )}
                      </div>

                      {/* Remarks */}
                      <p className="text-zinc-500 italic truncate" title={memo.remarks || "—"}>{memo.remarks || "—"}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {approvalPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-[12px] text-zinc-500">Showing page {approvalPagination.page} of {approvalPagination.totalPages} ({approvalPagination.total} memos)</p>
                <div className="flex gap-2">
                  <button disabled={approvalPagination.page <= 1} onClick={() => fetchApproval(approvalPagination.page - 1)} className="h-9 w-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-950 disabled:opacity-30 transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={approvalPagination.page >= approvalPagination.totalPages} onClick={() => fetchApproval(approvalPagination.page + 1)} className="h-9 w-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-950 disabled:opacity-30 transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* DETAILED SLIDE-OVER SIDEBAR: VAULT LEDGER DRAWER */}
      {/* ========================================================================= */}
      {selectedEntry && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          {/* Backdrop closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedEntry(null)} />
          
          <div className="relative w-full max-w-[500px] h-full bg-[#121212] border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    TXN_COLORS[selectedEntry.txnType]?.bg || "bg-white/5"
                  } ${TXN_COLORS[selectedEntry.txnType]?.text || "text-zinc-400"}`}>
                    {TXN_COLORS[selectedEntry.txnType]?.label || selectedEntry.txnType}
                  </span>
                  {selectedEntry.isLocked && (
                    <span className="flex items-center gap-1 bg-red-500/15 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-red-500/25">
                      <Lock className="w-2.5 h-2.5" /> Immutable Audit Log
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Date */}
              <div className="mb-8">
                <h2 className="text-[22px] font-bold text-white leading-tight font-serif tracking-wide">{selectedEntry.product?.name || "—"}</h2>
                <p className="text-[12px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedEntry.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  })}
                </p>
              </div>

              {/* Movement Details Cards */}
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-[#D4A843]" /> Movement Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Quantity</p>
                    <p className={`text-[16px] font-bold mt-1 ${
                      selectedEntry.qtyIn > 0 ? "text-emerald-400" : selectedEntry.qtyOut > 0 ? "text-rose-400" : "text-zinc-300"
                    }`}>
                      {selectedEntry.qtyIn > 0 ? `+${selectedEntry.qtyIn}` : selectedEntry.qtyOut > 0 ? `-${selectedEntry.qtyOut}` : "0"} pcs
                    </p>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Purity</p>
                    <p className="text-[16px] font-bold text-white mt-1">
                      {selectedEntry.karatage ? `${selectedEntry.karatage}K` : "—"}{" "}
                      <span className="text-[11px] text-zinc-500 font-medium">({selectedEntry.purityPercent ?? "0"}%)</span>
                    </p>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Gross Weight</p>
                    <p className="text-[16px] font-bold text-zinc-300 mt-1 font-mono">
                      {selectedEntry.grossWeightIn > 0 ? `+${selectedEntry.grossWeightIn.toFixed(3)}g` : selectedEntry.grossWeightOut > 0 ? `-${selectedEntry.grossWeightOut.toFixed(3)}g` : "0.000g"}
                    </p>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Net Weight</p>
                    <p className="text-[16px] font-bold text-zinc-300 mt-1 font-mono">
                      {selectedEntry.netWeightIn > 0 ? `+${selectedEntry.netWeightIn.toFixed(3)}g` : selectedEntry.netWeightOut > 0 ? `-${selectedEntry.netWeightOut.toFixed(3)}g` : "0.000g"}
                    </p>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 col-span-2 relative overflow-hidden group">
                    <div className="absolute right-3 top-3 opacity-10 text-cyan-400 group-hover:scale-110 transition-transform"><FileText className="w-12 h-12" /></div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Fine Gold Content</p>
                    <p className="text-[22px] font-black text-cyan-400 mt-1.5 font-mono">
                      {selectedEntry.fineWeightIn > 0 ? `+${selectedEntry.fineWeightIn.toFixed(3)} g` : selectedEntry.fineWeightOut > 0 ? `-${selectedEntry.fineWeightOut.toFixed(3)} g` : "0.000 g"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vault Balance After Txn */}
              <div className="mb-8 border-t border-zinc-900 pt-6">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-[#D4A843]" /> Vault Balance After Txn
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-900">
                    <span className="text-[12px] text-zinc-400 font-medium">Total Quantity</span>
                    <span className="text-[14px] font-extrabold text-white">{selectedEntry.balanceQty} pcs</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-900">
                    <span className="text-[12px] text-zinc-400 font-medium">Cumulative Net Weight</span>
                    <span className="text-[14px] font-bold text-zinc-300 font-mono">{(selectedEntry.balanceNetWt || 0).toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-900">
                    <span className="text-[12px] text-zinc-400 font-medium">Cumulative Fine Weight</span>
                    <span className="text-[14px] font-bold text-cyan-400 font-mono">{(selectedEntry.balanceFineWt || 0).toFixed(3)}g</span>
                  </div>
                </div>
              </div>

              {/* Financial Analysis */}
              {(selectedEntry.metalRateAtEntry || selectedEntry.unitCost) && (
                <div className="border-t border-zinc-900 pt-6">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-[#D4A843]" /> Financial Analysis
                  </h3>
                  <div className="bg-[#171717] rounded-2xl p-4 border border-zinc-800 shadow-inner">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-3">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase">Metal Rate (Gold)</p>
                        <p className="text-[14px] font-extrabold text-white mt-0.5">
                          {selectedEntry.metalRateAtEntry ? `₹${selectedEntry.metalRateAtEntry.toLocaleString()}/g` : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase">Unit Cost</p>
                        <p className="text-[14px] font-extrabold text-[#D4A843] mt-0.5 font-mono">
                          {selectedEntry.unitCost ? formatCurrency(selectedEntry.unitCost) : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[12px]">
                      <div className="flex justify-between text-zinc-400">
                        <span>Metal Value</span>
                        <span className="font-mono text-zinc-200">
                          {selectedEntry.metalCost ? formatCurrency(selectedEntry.metalCost) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Making Charges</span>
                        <span className="font-mono text-zinc-200">
                          {selectedEntry.makingCharges ? formatCurrency(selectedEntry.makingCharges) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Hallmarking & Other</span>
                        <span className="font-mono text-zinc-200">
                          {selectedEntry.otherCharges ? formatCurrency(selectedEntry.otherCharges) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-5 mt-6">
              <button
                onClick={() => alert("PDF report generated successfully.")}
                className="h-10 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-300 text-[12px] font-semibold uppercase tracking-wider hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
              >
                Generate PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href + "?entry=" + selectedEntry.id);
                  alert("Audit link copied to clipboard!");
                }}
                className="h-10 rounded-xl bg-[#D4A843] text-zinc-950 text-[12px] font-bold uppercase tracking-wider hover:bg-[#C69D35] active:scale-95 transition-all cursor-pointer"
              >
                Share Audit Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: HUID AUDIT REPORT */}
      {/* ========================================================================= */}
      {showHuidAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-[800px] bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setShowHuidAuditModal(false)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-4 mb-4">
              <ShieldAlert className="w-6 h-6 text-[#D4A843]" />
              <div>
                <h2 className="text-[20px] font-bold text-white tracking-wide font-serif">BIS HUID Compliance Audit</h2>
                <p className="text-[12px] text-zinc-500">Gold inventory without HUID codes (Mandatory for sale in India)</p>
              </div>
            </div>

            {huidAuditLoading ? (
              <div className="flex items-center justify-center py-20 flex-1"><Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" /></div>
            ) : !huidAuditData || huidAuditData.branches?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                <p className="text-zinc-300 font-bold text-[16px]">All items compliant!</p>
                <p className="text-zinc-500 text-[13px] mt-1">Every stock item has a registered HUID number.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                
                {/* Audit summary card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-4">
                  <div className="space-y-1">
                    <p className="text-[12px] text-zinc-400">Compliance Status:{" "}
                      <span className={`font-bold ${huidAuditData.complianceEnabled ? "text-emerald-400" : "text-amber-500"}`}>
                        {huidAuditData.complianceEnabled ? "Enforced (Strict)" : "Warn Only"}
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-500">{huidAuditData.message}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Unhallmarked Items</p>
                      <p className="text-[20px] font-black text-white">{huidAuditData.totals?.totalQty || 0} pcs</p>
                    </div>
                    <div className="text-right border-l border-zinc-800 pl-4">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Total Net Wt</p>
                      <p className="text-[20px] font-black text-[#D4A843]">{(huidAuditData.totals?.totalNetWt || 0).toFixed(3)}g</p>
                    </div>
                  </div>
                </div>

                {/* Grouped Lists */}
                {huidAuditData.branches.map((b: any) => (
                  <div key={b.branchId} className="space-y-4">
                    <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" /> Branch: {b.branchName}
                    </h3>
                    <div className="space-y-4 pl-3.5 border-l border-zinc-850">
                      {b.categories.map((cat: any) => (
                        <div key={cat.categoryId} className="space-y-2">
                          <p className="text-[11px] font-bold text-[#D4A843] uppercase tracking-widest">{cat.categoryName}</p>
                          <div className="bg-zinc-950/80 rounded-2xl border border-zinc-900 overflow-hidden divide-y divide-zinc-900/60">
                            {cat.items.map((item: any) => (
                              <div key={item.productId} className="flex justify-between items-center px-4 py-3 text-[13px]">
                                <div>
                                  <p className="text-white font-medium">{item.name}</p>
                                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{item.productCode} • {item.purity}% Purity</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-semibold">{item.quantity} pcs</p>
                                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Net Wt: {item.ntWeight}g</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t border-zinc-850 pt-4 mt-4 text-center">
              <button
                onClick={() => setShowHuidAuditModal(false)}
                className="h-10 px-8 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 text-[12px] font-semibold hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: YEAR-END CLOSING DIALOG */}
      {/* ========================================================================= */}
      {showYearEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-[440px] bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowYearEndModal(false)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-[20px] font-bold text-white tracking-wide font-serif mb-2">Year-End Closing Process</h2>
            <p className="text-[12px] text-zinc-500 leading-relaxed mb-6">
              Creates frozen snapshot entries (`CLOSING_SNAPSHOT`) for all active inventory. Year-end closing entries are immediately locked and serve as permanent audit records for tax assessments.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Financial Year</label>
                <select
                  value={closingYear}
                  onChange={(e) => setClosingYear(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[13px] outline-none cursor-pointer focus:border-[#D4A843]/50 transition-colors"
                >
                  <option value="2024-25">FY 2024-25 (Ending March 31, 2025)</option>
                  <option value="2025-26">FY 2025-26 (Ending March 31, 2026)</option>
                  <option value="2026-27">FY 2026-27 (Ending March 31, 2027)</option>
                </select>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex gap-3 text-[11px] text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="leading-normal font-medium">
                  <strong>Warning:</strong> This action cannot be undone. Balances will be locked as of March 31st. Ensure all pending transfers and adjustments for this financial year are completed first.
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowYearEndModal(false)}
                className="h-10 px-4 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-300 text-[12px] font-semibold hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={closingLoading}
                onClick={handleRunYearEndClosing}
                className="h-10 px-6 rounded-xl bg-[#D4A843] text-zinc-950 text-[12px] font-bold uppercase tracking-wider hover:bg-[#C69D35] active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {closingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Running...
                  </>
                ) : (
                  "Execute Closing"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK SUMMARY VALUATION REPORT */}
      {/* ========================================================================= */}
      {showStockSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-[1100px] bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setShowStockSummaryModal(false)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-white tracking-wide font-serif">Stock summary & valuation</h2>
                <p className="text-[12px] text-zinc-500">Live inventory valuation based on purchase averages (WAC) vs current market rate.</p>
              </div>
              {stockSummaryData?.metadata && (
                <div className="bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-800 text-right">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Today's Gold Rate (22K)</p>
                  <p className="text-[13px] font-bold text-[#D4A843]">
                    ₹{stockSummaryData.metadata.currentMetalRate.toLocaleString()}/g
                  </p>
                </div>
              )}
            </div>

            {stockSummaryLoading ? (
              <div className="flex items-center justify-center py-20 flex-1"><Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" /></div>
            ) : !stockSummaryData || stockSummaryData.items?.length === 0 ? (
              <div className="flex items-center justify-center py-20 flex-1"><p className="text-zinc-500">No stock summary records found.</p></div>
            ) : (
              <div className="overflow-hidden flex-col flex flex-1">
                
                {/* Valuations KPI totals */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5 bg-[#0d0d0d] p-4 rounded-2xl border border-zinc-900">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Items</p>
                    <p className="text-[18px] font-black text-white">{stockSummaryData.totals?.totalQty || 0} pcs</p>
                  </div>
                  <div className="text-left border-l border-zinc-850 pl-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Pure Weight (Fine)</p>
                    <p className="text-[18px] font-black text-cyan-400 font-mono">{(stockSummaryData.totals?.totalFineWt || 0).toFixed(3)}g</p>
                  </div>
                  <div className="text-left border-l border-zinc-850 pl-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Book Cost Value</p>
                    <p className="text-[18px] font-black text-[#D4A843] font-mono">{formatCurrency(stockSummaryData.totals?.totalCostValue || 0)}</p>
                  </div>
                  <div className="text-left border-l border-zinc-850 pl-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Market Valuation</p>
                    <p className="text-[18px] font-black text-emerald-400 font-mono">{formatCurrency(stockSummaryData.totals?.totalMarketValue || 0)}</p>
                  </div>
                  <div className="text-left border-l border-zinc-850 pl-3.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Unrealized Gain / Loss</p>
                    <p className={`text-[18px] font-black font-mono ${
                      stockSummaryData.totals?.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {stockSummaryData.totals?.totalGainLoss >= 0 ? "+" : ""}
                      {formatCurrency(stockSummaryData.totals?.totalGainLoss || 0)}
                    </p>
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-y-auto flex-1 rounded-2xl border border-zinc-800">
                  <div className="grid grid-cols-[1.5fr_1fr_90px_100px_100px_120px_120px_120px] gap-4 px-5 py-3 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/50">
                    <span>Product Name</span>
                    <span>Category</span>
                    <span>Karatage</span>
                    <span>Qty Balance</span>
                    <span>Fine Wt (g)</span>
                    <span>Avg Book Cost</span>
                    <span>Market Value</span>
                    <span>Gain / Loss</span>
                  </div>
                  <div className="divide-y divide-zinc-900">
                    {stockSummaryData.items.map((item: any) => {
                      const glColor = item.gainLoss >= 0 ? "text-emerald-400" : "text-rose-400";
                      return (
                        <div key={item.productId} className="grid grid-cols-[1.5fr_1fr_90px_100px_100px_120px_120px_120px] gap-4 px-5 py-3 text-[12px] items-center hover:bg-zinc-900/10">
                          <div>
                            <p className="text-white font-medium truncate" title={item.productName}>{item.productName}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{item.productCode}</p>
                          </div>
                          <p className="text-zinc-400 truncate">{item.category} • {item.subCategory}</p>
                          <p className="text-zinc-300 font-semibold">{item.karatage ? `${item.karatage}K` : "—"}</p>
                          <p className="text-white font-bold">{item.balanceQty} pcs</p>
                          <p className="text-cyan-400 font-mono font-medium">{item.balanceFineWt.toFixed(3)}g</p>
                          <p className="text-zinc-400 font-mono">{formatCurrency(item.avgCostPrice)}</p>
                          <p className="text-zinc-300 font-mono font-semibold">{formatCurrency(item.marketValue)}</p>
                          <p className={`font-mono font-bold ${glColor}`}>
                            {item.gainLoss >= 0 ? "+" : ""}
                            {formatCurrency(item.gainLoss)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <div className="border-t border-zinc-850 pt-4 mt-4 text-center">
              <button
                onClick={() => setShowStockSummaryModal(false)}
                className="h-10 px-8 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 text-[12px] font-semibold hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
              >
                Close Valuation Report
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
