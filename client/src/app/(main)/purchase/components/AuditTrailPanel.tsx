// client/src/app/(main)/purchase/components/AuditTrailPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconHistory,
  IconSearch,
  IconRefresh,
  IconShieldCheck,
  IconChevronDown,
  IconChevronUp,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileText,
  IconDownload,
  IconSortAscending,
  IconSortDescending,
  IconCalendar,
  IconX,
} from "@tabler/icons-react";

type DateRangePreset = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "ALL_TIME";

export default function AuditTrailPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<DateRangePreset>("TODAY");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // 'asc' = date & time onwards
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute exact Date Range ISO boundaries based on preset
  const getDateRangeBoundaries = (preset: DateRangePreset): { from?: string; to?: string; label: string } => {
    const now = new Date();

    if (preset === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString(), label: "Today" };
    }

    if (preset === "YESTERDAY") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString(), label: "Yesterday" };
    }

    if (preset === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now);
      monday.setDate(diff);
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString(), label: "This Week" };
    }

    if (preset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString(), label: "This Month" };
    }

    if (preset === "THIS_YEAR") {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString(), label: "This Year" };
    }

    return { label: "All Time" };
  };

  const fetchLogs = async (overrideSearch?: string, overrideSort?: "asc" | "desc", overridePreset?: DateRangePreset) => {
    try {
      setLoading(true);
      const activeSearch = overrideSearch !== undefined ? overrideSearch : search;
      const activeSort = overrideSort !== undefined ? overrideSort : sortOrder;
      const activePreset = overridePreset !== undefined ? overridePreset : timeRange;

      const { from, to } = getDateRangeBoundaries(activePreset);
      const params = new URLSearchParams();

      if (activeSearch.trim()) params.set("search", activeSearch.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("sortOrder", activeSort);
      params.set("limit", "150");

      const res = await fetch(`/api/purchase/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogs(json.logs || []);
          setTotalCount(json.total || 0);
        }
      }
    } catch (err) {
      console.error("Fetch purchase audit logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with default TODAY filter
  useEffect(() => {
    fetchLogs();
  }, [timeRange, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    // If user enters a booking number like PB-..., default sort to 'asc' (date & time onwards) for chronological timeline
    if (trimmed.toUpperCase().startsWith("PB-") && sortOrder !== "asc") {
      setSortOrder("asc");
      fetchLogs(trimmed, "asc");
    } else {
      fetchLogs();
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    fetchLogs("");
  };

  // Generate Report & Trigger Download
  const handleGenerateReport = async (format: "xlsx" | "pdf" | "csv") => {
    try {
      setExporting(format);
      setIsExportMenuOpen(false);

      const { from, to } = getDateRangeBoundaries(timeRange);
      const params = new URLSearchParams();
      params.set("format", format);
      if (search.trim()) params.set("search", search.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("sortOrder", sortOrder);

      const url = `/api/purchase/audit/export?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate report file");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `Purchase_Audit_Report_${timeRange}_${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      } else {
        filename += `.${format}`;
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Generate report error:", err);
      alert("Failed to download audit report. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const datePresetOptions: { key: DateRangePreset; label: string }[] = [
    { key: "TODAY", label: "Today" },
    { key: "YESTERDAY", label: "Yesterday" },
    { key: "THIS_WEEK", label: "This Week" },
    { key: "THIS_MONTH", label: "This Month" },
    { key: "THIS_YEAR", label: "This Year" },
    { key: "ALL_TIME", label: "All Time" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-onyx-surface border border-onyx-border p-4 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <IconSearch className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Booking Number (e.g. PB-2026-000001), action, or user..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-onyx text-platinum-muted hover:text-platinum"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-onyx-elevated border border-onyx-border text-xs font-semibold text-platinum hover:text-gold hover:border-gold transition-all"
            >
              Search
            </button>
          </form>

          {/* Action Tools: Sort Toggle & Generate Report */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            {/* Sorting Toggle: Ascending ("Date & Time Onwards") vs Descending */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                sortOrder === "asc"
                  ? "bg-gold/15 text-gold border-gold/40 shadow-sm"
                  : "bg-onyx-elevated text-platinum-muted border-onyx-border hover:text-platinum"
              }`}
              title={sortOrder === "asc" ? "Sorting chronologically: Date & time onwards" : "Sorting recent first"}
            >
              {sortOrder === "asc" ? (
                <>
                  <IconSortAscending className="w-4 h-4 text-gold" />
                  <span>Date & Time Onwards</span>
                </>
              ) : (
                <>
                  <IconSortDescending className="w-4 h-4" />
                  <span>Newest First</span>
                </>
              )}
            </button>

            {/* Generate Report Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
              >
                <IconDownload className="w-4 h-4" />
                <span>{exporting ? `Generating ${exporting.toUpperCase()}...` : "Generate Report"}</span>
                <IconChevronDown className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-onyx-surface border border-onyx-border rounded-xl shadow-2xl z-30 py-1.5 animate-in fade-in zoom-in-95 text-xs">
                  <div className="px-3 py-1.5 border-b border-onyx-border text-[10px] text-platinum-muted uppercase font-bold tracking-wider">
                    Select Export Format
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateReport("xlsx")}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-onyx-elevated text-left text-platinum hover:text-gold transition-colors"
                  >
                    <IconFileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="block font-semibold">Excel Sheet (.xlsx)</span>
                      <span className="text-[10px] text-platinum-muted">Multi-sheet summary & data</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateReport("pdf")}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-onyx-elevated text-left text-platinum hover:text-gold transition-colors"
                  >
                    <IconFileTypePdf className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="block font-semibold">PDF Document (.pdf)</span>
                      <span className="text-[10px] text-platinum-muted">Printable landscape report</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateReport("csv")}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-onyx-elevated text-left text-platinum hover:text-gold transition-colors"
                  >
                    <IconFileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="block font-semibold">CSV Spreadsheet (.csv)</span>
                      <span className="text-[10px] text-platinum-muted">Universal comma-delimited</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchLogs()}
              className="p-2 rounded-xl bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum"
              title="Refresh Audit Trail"
            >
              <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-gold" : ""}`} />
            </button>
          </div>
        </div>

        {/* Date Presets Row: TODAY, YESTERDAY, THIS WEEK, THIS MONTH, THIS YEAR, ALL TIME */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-onyx-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-platinum-muted flex items-center gap-1 mr-1">
              <IconCalendar className="w-3.5 h-3.5 text-gold" />
              <span>Timeframe:</span>
            </span>
            {datePresetOptions.map((opt) => {
              const isActive = timeRange === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTimeRange(opt.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gold text-onyx font-bold shadow-sm shadow-gold/20"
                      : "bg-onyx-elevated text-platinum-muted hover:text-platinum hover:bg-onyx border border-onyx-border"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-platinum-muted font-mono">
            <span>Showing: </span>
            <span className="text-gold font-semibold">{logs.length}</span>
            <span> of </span>
            <span className="text-platinum font-semibold">{totalCount}</span>
            <span> events</span>
            {search && <span className="text-amber-300 ml-1.5">• Filter: &quot;{search}&quot;</span>}
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-onyx-border bg-onyx-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconShieldCheck className="w-5 h-5 text-gold" />
            <div>
              <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
                Immutable Purchase Audit Stream
              </h3>
              <p className="text-[11px] text-platinum-muted">
                Tamper-evident record of bookings, authorizations, advance disbursements, and metal receipts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-onyx border border-onyx-border text-platinum-muted font-mono">
              {sortOrder === "asc" ? "⏱ Chronological (Asc)" : "⬇ Latest First (Desc)"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-onyx-border/60 text-xs">
          {loading ? (
            <div className="py-16 text-center text-platinum-muted space-y-2">
              <IconRefresh className="w-6 h-6 mx-auto animate-spin text-gold" />
              <p>Filtering and retrieving audit trail...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-platinum-muted space-y-2">
              <IconHistory className="w-10 h-10 mx-auto text-platinum-muted/40" />
              <p className="text-sm font-semibold text-platinum">No audit events found</p>
              <p className="text-xs text-platinum-muted max-w-sm mx-auto">
                No transactions matched your selected timeframe ({timeRange})
                {search ? ` and search criteria "${search}"` : ""}. Try switching the filter to &quot;This Month&quot; or &quot;All Time&quot;.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setTimeRange("ALL_TIME")}
                  className="px-3.5 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border text-xs text-gold hover:underline font-semibold"
                >
                  View All Time Logs
                </button>
              </div>
            </div>
          ) : (
            logs.map((log, index) => {
              const isExpanded = expandedLogId === log.id;
              const isBookingAction = log.action.includes("BOOKING");
              const isPaymentAction = log.action.includes("PAYMENT");
              const isReceiptAction = log.action.includes("RECEIP") || log.action.includes("METAL");
              const isApprovalAction = log.action.includes("APPROV") || log.action.includes("AUTHORIZ");

              return (
                <div key={log.id} className="p-4 hover:bg-onyx-elevated/40 transition-colors space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Event Index & Chronological Indicator */}
                        <span className="text-[10px] text-platinum-muted font-mono">
                          #{index + 1}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                            log.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : log.severity === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {log.severity || "INFO"}
                        </span>

                        {/* Action Badge with domain-specific coloring */}
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                            isBookingAction
                              ? "bg-gold/15 text-gold border border-gold/30"
                              : isPaymentAction
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : isReceiptAction
                              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                              : isApprovalAction
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : "bg-onyx text-platinum border border-onyx-border"
                          }`}
                        >
                          {log.action}
                        </span>

                        <span className="text-platinum-muted text-[10px]">•</span>
                        <span className="text-platinum-muted text-[11px]">{log.module}</span>
                      </div>

                      {/* Event Description */}
                      <p className="text-platinum font-medium text-xs leading-relaxed">
                        {log.description}
                      </p>
                    </div>

                    {/* Timestamp & User */}
                    <div className="text-right shrink-0">
                      <span className="text-xs text-platinum-muted block font-mono font-medium">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <span className="text-[11px] text-platinum font-semibold">
                        {log.userNameSnapshot || "System"}
                      </span>
                      {log.roleSnapshot && (
                        <span className="text-[10px] text-platinum-muted block">
                          ({log.roleSnapshot})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata and Snapshot Inspection Toggle */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-platinum-muted pt-1 border-t border-onyx-border/30">
                    <div className="flex items-center gap-3">
                      <span>IP: <span className="font-mono text-platinum">{log.ipAddress || "127.0.0.1"}</span></span>
                      {log.entityDisplayName && (
                        <span>
                          Reference: <span className="font-semibold text-gold">{log.entityDisplayName}</span>
                        </span>
                      )}
                    </div>

                    {(log.before || log.after) && (
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-gold hover:underline flex items-center gap-1 font-semibold transition-colors"
                      >
                        <span>{isExpanded ? "Hide Audit Snapshot" : "Inspect State Snapshot"}</span>
                        {isExpanded ? <IconChevronUp className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON Snapshot */}
                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-xl bg-onyx border border-onyx-border font-mono text-[11px] overflow-x-auto text-platinum-muted space-y-3">
                      {log.before && (
                        <div>
                          <span className="text-rose-400 font-bold block mb-1">State Before Change:</span>
                          <pre className="p-2 rounded bg-black/40 text-rose-200/80 overflow-x-auto">
                            {JSON.stringify(log.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after && (
                        <div>
                          <span className="text-gold font-bold block mb-1">State After Action:</span>
                          <pre className="p-2 rounded bg-black/40 text-platinum overflow-x-auto">
                            {JSON.stringify(log.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
