"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  RotateCw,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Printer,
  User,
  Phone,
  Building,
  ShieldCheck,
  TrendingDown,
  Layers,
  Coins,
  FileText,
  Eye,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBranchStore } from "@/lib/store/useBranchStore";
import OldGoldSlipModal from "./OldGoldSlipModal";
import Link from "next/link";

interface TonchHistoryItem {
  id: string;
  queueId: string;
  customerId: number;
  customer?: {
    id: number;
    name: string;
    mobile: string;
    city: string;
    address: string;
    gstin?: string;
    pan?: string;
  };
  customerName: string;
  customerPhone: string;
  customerCity: string;
  description: string;
  metalType: "GOLD" | "SILVER";
  weightBefore: number;
  weightAfter: number | null;
  lossWeight: number;
  purityPercent: number | null;
  tonch: number | null;
  fineGold: number;
  status: "PENDING" | "PROCESSING" | "TONCHED";
  isLocked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TonchHistorySession {
  id: string;
  sessionNumber: string;
  date: string;
  createdAt: string;
  closedAt: string | null;
  isClosed: boolean;
  status: "CLOSED" | "ACTIVE";
  branchId: number;
  branchName: string;
  branchCity: string;
  createdById: number | null;
  createdByName: string;
  authorizedById: number | null;
  authorizedByName: string | null;
  remarks: string | null;
  totalItems: number;
  totalWeightBefore: number;
  totalWeightAfter: number;
  totalLoss: number;
  fineGold: number;
  fineSilver: number;
  items: TonchHistoryItem[];
  auditLogs: {
    id: string;
    action: string;
    performedByName: string;
    createdAt: string;
  }[];
}

interface TonchHistorySummary {
  totalSessions: number;
  totalItems: number;
  grossWeightBefore: number;
  totalWeightAfter: number;
  totalLossWeight: number;
  totalFineGold: number;
  totalFineSilver: number;
}

export default function TonchHistoryTab() {
  const { branches, selectedBranch } = useBranchStore();

  // State
  const [sessions, setSessions] = useState<TonchHistorySession[]>([]);
  const [summary, setSummary] = useState<TonchHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Print Slip Modal State
  const [selectedSlipItem, setSelectedSlipItem] = useState<{
    item: any;
    session: any;
  } | null>(null);

  // Date Presets Handler
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      setStartDate(weekAgo.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      setStartDate(monthAgo.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  // Fetch History Data
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        branchId: branchFilter,
        status: statusFilter,
        search,
      });

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await axios.get(`/api/metal-exchange/history?${params.toString()}`);
      if (res.data) {
        setSessions(res.data.sessions || []);
        setSummary(res.data.summary || null);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.totalCount || 0);

        // Auto-expand the first session by default
        if (res.data.sessions?.length > 0 && Object.keys(expandedSessions).length === 0) {
          setExpandedSessions({ [res.data.sessions[0].id]: true });
        }
      }
    } catch (err) {
      console.error("Failed to load metal exchange history:", err);
    } finally {
      setLoading(false);
    }
  }, [page, branchFilter, statusFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Toggle Session Expansion
  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // Format Helper
  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY METRIC CARDS */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Sessions */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Total Sessions</span>
              <Layers size={16} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{summary.totalSessions}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{summary.totalItems} Items Tested</p>
            </div>
          </div>

          {/* Gross Weight Before */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Gross Tested Wt</span>
              <Scale size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground font-mono">
                {summary.grossWeightBefore.toFixed(3)}<span className="text-xs font-normal text-muted-foreground">g</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Weight Before Tonch</p>
            </div>
          </div>

          {/* Weight After Tonch */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Melted Weight</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {summary.totalWeightAfter.toFixed(3)}<span className="text-xs font-normal text-muted-foreground">g</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Net Tested Metal</p>
            </div>
          </div>

          {/* Total Loss */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Total Loss</span>
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">
                -{summary.totalLossWeight.toFixed(3)}<span className="text-xs font-normal text-muted-foreground">g</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.grossWeightBefore > 0
                  ? `(${((summary.totalLossWeight / summary.grossWeightBefore) * 100).toFixed(1)}% burn loss)`
                  : "0% loss"}
              </p>
            </div>
          </div>

          {/* Fine Gold 24K */}
          <div className="p-4 rounded-xl bg-card border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/10 to-transparent shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold text-[#9C7A2E] dark:text-[#C9A84C]">Fine Gold 24K</span>
              <Sparkles size={16} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#9C7A2E] dark:text-[#C9A84C] font-mono">
                {summary.totalFineGold.toFixed(3)}<span className="text-xs font-normal">g</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Recovered Pure Gold</p>
            </div>
          </div>

          {/* Fine Silver */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Fine Silver</span>
              <Coins size={16} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground font-mono">
                {summary.totalFineSilver.toFixed(3)}<span className="text-xs font-normal text-muted-foreground">g</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Recovered Pure Silver</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Session Number, Customer, Phone, Remarks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="closed">Closed / Reconciled</option>
            <option value="active">In Progress (Active)</option>
          </select>

          {/* Date presets */}
          <div className="flex items-center bg-muted/60 rounded-lg p-0.5 border border-border">
            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "week", label: "7 Days" },
              { id: "month", label: "30 Days" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleDatePresetChange(p.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  datePreset === p.id
                    ? "bg-card text-[#9C7A2E] dark:text-[#C9A84C] shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={loading}
            className="h-8.5 px-3 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 3. HISTORIC TONCH SESSIONS LIST */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <RotateCw size={28} className="animate-spin text-[#C9A84C]" />
          <p className="text-xs text-muted-foreground">Loading historic metal exchange sessions…</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-card border border-border p-8">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Scale size={22} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No Historic Tonch Sessions Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No matching metal exchange sessions found with the current filters. Try selecting &quot;All Time&quot; or clearing your search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isExpanded = !!expandedSessions[session.id];

            return (
              <div
                key={session.id}
                className="rounded-xl border border-border bg-card shadow-xs transition-all overflow-hidden"
              >
                {/* SESSION HEADER / CARD BANNER */}
                <div
                  onClick={() => toggleSession(session.id)}
                  className="p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer hover:bg-accent/40 transition-colors"
                >
                  {/* Left: Session Number, Status, Branch, Timestamps */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                        <FileText size={16} className="text-[#C9A84C]" />
                        {session.sessionNumber}
                      </span>

                      {/* Status Badge */}
                      {session.isClosed ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-semibold text-[11px] px-2 py-0.5">
                          <CheckCircle2 size={11} className="mr-1" />
                          CLOSED / RECONCILED
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 font-semibold text-[11px] px-2 py-0.5">
                          <Clock size={11} className="mr-1" />
                          IN PROGRESS
                        </Badge>
                      )}

                      {/* Branch Badge */}
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border flex items-center gap-1">
                        <Building size={11} />
                        {session.branchName}
                      </span>
                    </div>

                    {/* Start & End Timestamps with Date */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground/70">Session Start:</span>
                        <span className="text-foreground font-medium flex items-center gap-1">
                          <Calendar size={12} className="text-[#C9A84C]" />
                          {formatDateTime(session.createdAt)}
                        </span>
                      </div>

                      <span className="text-border">|</span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground/70">Session End:</span>
                        <span className="text-foreground font-medium flex items-center gap-1">
                          <Clock size={12} className="text-blue-500" />
                          {session.closedAt ? formatDateTime(session.closedAt) : "Active (Not Closed)"}
                        </span>
                      </div>

                      {session.authorizedByName && (
                        <>
                          <span className="text-border">|</span>
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={12} />
                            <span>Auth: {session.authorizedByName}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Key Figures & Expand Chevron */}
                  <div className="flex items-center gap-4 lg:gap-6 self-end lg:self-center">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-right">
                      {/* Items */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Items</p>
                        <p className="text-sm font-bold text-foreground">{session.totalItems}</p>
                      </div>

                      {/* Tested Wt */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tested Gross</p>
                        <p className="text-sm font-bold font-mono text-foreground">{session.totalWeightBefore.toFixed(3)}g</p>
                      </div>

                      {/* Melted Wt */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Melted Net</p>
                        <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {session.totalWeightAfter.toFixed(3)}g
                        </p>
                      </div>

                      {/* Fine Gold */}
                      <div className="hidden sm:block">
                        <p className="text-[10px] uppercase tracking-wider text-[#9C7A2E] dark:text-[#C9A84C] font-semibold">Fine Gold 24K</p>
                        <p className="text-sm font-bold font-mono text-[#9C7A2E] dark:text-[#C9A84C]">{session.fineGold.toFixed(3)}g</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>

                {/* EXPANDABLE TONCH ITEMS TABLE */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Scale size={14} className="text-[#C9A84C]" />
                        Tested Items in this Session ({session.items.length})
                      </h4>
                      {session.remarks && (
                        <p className="text-xs text-muted-foreground italic">
                          Remarks: &quot;{session.remarks}&quot;
                        </p>
                      )}
                    </div>

                    {session.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        No items were recorded in this session.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border bg-card">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase text-[10px] border-b border-border tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3">Item #</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3">Metal / Description</th>
                              <th className="py-2.5 px-3 text-right">Weight Before (Gross)</th>
                              <th className="py-2.5 px-3 text-right">Weight After (Melted)</th>
                              <th className="py-2.5 px-3 text-right">Loss Weight</th>
                              <th className="py-2.5 px-3 text-right">Purity / Tonch</th>
                              <th className="py-2.5 px-3 text-right">Fine Metal (24K)</th>
                              <th className="py-2.5 px-3 text-center">Fine Status</th>
                              <th className="py-2.5 px-3 text-center">Slip</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {session.items.map((item, idx) => {
                              const loss = item.lossWeight;
                              const lossPercent =
                                item.weightBefore > 0
                                  ? ((loss / item.weightBefore) * 100).toFixed(1)
                                  : "0";

                              return (
                                <tr
                                  key={item.id}
                                  className="hover:bg-accent/30 transition-colors"
                                >
                                  {/* Item # */}
                                  <td className="py-2.5 px-3 font-mono font-medium text-muted-foreground">
                                    {item.queueId || `#${idx + 1}`}
                                  </td>

                                  {/* Customer */}
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-foreground">
                                      {item.customer ? (
                                        <Link
                                          href={`/customer/${item.customerId}`}
                                          className="hover:text-[#C9A84C] hover:underline"
                                        >
                                          {item.customerName}
                                        </Link>
                                      ) : (
                                        item.customerName
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Phone size={10} />
                                      {item.customerPhone}
                                      {item.customerCity && ` · ${item.customerCity}`}
                                    </div>
                                  </td>

                                  {/* Metal Type & Description */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1.5 py-0 font-bold ${
                                          item.metalType === "GOLD"
                                            ? "border-[#C9A84C]/40 text-[#9C7A2E] dark:text-[#C9A84C] bg-[#C9A84C]/10"
                                            : "border-slate-400 text-slate-500 bg-slate-100 dark:bg-slate-800"
                                        }`}
                                      >
                                        {item.metalType}
                                      </Badge>
                                      <span className="font-medium text-foreground truncate max-w-[140px]">
                                        {item.description}
                                      </span>
                                    </div>
                                    {item.notes && (
                                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                                        Note: {item.notes}
                                      </p>
                                    )}
                                  </td>

                                  {/* Weight Before */}
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                                    {item.weightBefore.toFixed(3)}g
                                  </td>

                                  {/* Weight After */}
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    {item.weightAfter != null ? `${item.weightAfter.toFixed(3)}g` : "—"}
                                  </td>

                                  {/* Loss Weight */}
                                  <td className="py-2.5 px-3 text-right font-mono text-red-600 dark:text-red-400">
                                    {item.weightAfter != null ? (
                                      <>
                                        -{loss.toFixed(3)}g
                                        <span className="text-[10px] text-muted-foreground block">
                                          ({lossPercent}%)
                                        </span>
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </td>

                                  {/* Purity / Tonch */}
                                  <td className="py-2.5 px-3 text-right font-mono">
                                    {item.purityPercent != null ? (
                                      <>
                                        <span className="font-bold text-foreground">
                                          {item.purityPercent.toFixed(2)}%
                                        </span>
                                        <span className="text-[10px] text-muted-foreground block">
                                          Tonch: {item.tonch ? item.tonch.toFixed(4) : (item.purityPercent / 100).toFixed(4)}
                                        </span>
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </td>

                                  {/* Fine Metal Recovered */}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#9C7A2E] dark:text-[#C9A84C]">
                                    {item.fineGold > 0 ? `${item.fineGold.toFixed(3)}g` : "—"}
                                  </td>

                                  {/* Fine Status */}
                                  <td className="py-2.5 px-3 text-center">
                                    {item.status === "TONCHED" ? (
                                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold text-[10px] px-2 py-0.5">
                                        TONCHED
                                      </Badge>
                                    ) : item.status === "PROCESSING" ? (
                                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 font-bold text-[10px] px-2 py-0.5">
                                        PROCESSING
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                                        PENDING
                                      </Badge>
                                    )}
                                  </td>

                                  {/* Print Slip */}
                                  <td className="py-2.5 px-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSlipItem({ item, session });
                                      }}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-[#C9A84C] cursor-pointer"
                                      title="Print Old Gold Slip"
                                    >
                                      <Printer size={14} />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-1 text-xs text-muted-foreground">
              <span>
                Showing page <strong className="text-foreground">{page}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong> ({totalCount} sessions)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 text-xs cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 text-xs cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. OLD GOLD SLIP MODAL */}
      {selectedSlipItem && (
        <OldGoldSlipModal
          open={!!selectedSlipItem}
          onClose={() => setSelectedSlipItem(null)}
          item={selectedSlipItem.item}
          session={selectedSlipItem.session}
          branchName={selectedSlipItem.session?.branchName}
        />
      )}
    </div>
  );
}
