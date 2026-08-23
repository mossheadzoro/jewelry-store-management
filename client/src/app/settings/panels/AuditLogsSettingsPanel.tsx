// client/src/app/settings/panels/AuditLogsSettingsPanel.tsx
"use client";

import React, { useState } from "react";
import { 
  History, Search, Filter, Download, RefreshCw, 
  CheckCircle2, AlertCircle, ShieldAlert, Clock, User, 
  MapPin, Eye, ChevronLeft, ChevronRight, Laptop, Calendar, 
  Layers, FileText, Check, AlertTriangle, Shield, Server,
  Code, Save, Loader2, ArrowRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import EntityActivityTimeline from "@/components/audit/EntityActivityTimeline";
import { toast } from "sonner";
import axios from "axios";

export default function AuditLogsSettingsPanel() {
  const queryClient = useQueryClient();
  const { selectedBranch, branches } = useBranchStore();
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  // Sub-Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "activity" | "timeline" | "user_activity" | "security_events" | "technical" | "retention"
  >("activity");

  // Query Filter States
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  // Selected Log for Detail Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Entity Investigation States
  const [investigateType, setInvestigateType] = useState("INVOICE");
  const [investigateId, setInvestigateId] = useState("");
  const [activeInvestigateId, setActiveInvestigateId] = useState("");

  // User Activity States
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Export State
  const [exporting, setExporting] = useState(false);

  // Retention States
  const [savingRetention, setSavingRetention] = useState(false);
  const [retentionForm, setRetentionForm] = useState({
    businessLogRetentionDays: 365,
    technicalLogRetentionDays: 30,
    autoArchiveEnabled: false,
    highRiskAlertEmail: "",
  });

  // ==========================================
  // 1. FETCH AUDIT KPI METRICS
  // ==========================================
  const { data: metricsData, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["auditMetrics", selectedBranch?.id],
    queryFn: async () => {
      const bParam = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
      const res = await axios.get(`/api/audit-logs/metrics${bParam}`);
      return res.data?.data;
    },
  });

  // ==========================================
  // 2. FETCH BUSINESS AUDIT LOGS (LAYER 2)
  // ==========================================
  const { data: auditData, isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: [
      "enterpriseAuditLogs",
      page,
      search,
      moduleFilter,
      actionFilter,
      roleFilter,
      branchFilter,
      statusFilter,
      severityFilter,
      fromDate,
      toDate,
      activeTab,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "15");
      if (search.trim()) params.append("search", search.trim());
      if (moduleFilter !== "ALL") params.append("module", moduleFilter);
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (branchFilter !== "ALL") params.append("branchId", branchFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (severityFilter !== "ALL") params.append("severity", severityFilter);
      if (activeTab === "security_events") params.append("isSecurityEvent", "true");
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await axios.get(`/api/audit-logs?${params.toString()}`);
      return res.data?.data;
    },
    enabled: activeTab === "activity" || activeTab === "security_events",
  });

  // ==========================================
  // 3. FETCH TECHNICAL REQUEST LOGS (LAYER 1)
  // ==========================================
  const [techPage, setTechPage] = useState(1);
  const [techSearch, setTechSearch] = useState("");
  const { data: technicalData, isLoading: loadingTech, refetch: refetchTech } = useQuery({
    queryKey: ["technicalLogs", techPage, techSearch],
    queryFn: async () => {
      const res = await axios.get(`/api/audit-logs/technical?page=${techPage}&limit=20&search=${encodeURIComponent(techSearch)}`);
      return res.data?.data;
    },
    enabled: activeTab === "technical",
  });

  // ==========================================
  // 4. FETCH USER ACTIVITY SUMMARY
  // ==========================================
  const { data: userSummaryData, isLoading: loadingUserSummary } = useQuery({
    queryKey: ["userAuditSummary", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await axios.get(`/api/audit-logs/user-summary?userId=${selectedUserId}`);
      return res.data?.data;
    },
    enabled: activeTab === "user_activity" && Boolean(selectedUserId),
  });

  // ==========================================
  // 5. FETCH RETENTION POLICY
  // ==========================================
  const { data: retentionData, refetch: refetchRetention } = useQuery({
    queryKey: ["auditRetentionPolicy"],
    queryFn: async () => {
      const res = await axios.get("/api/audit-logs/retention");
      if (res.data?.data) {
        setRetentionForm({
          businessLogRetentionDays: res.data.data.businessLogRetentionDays || 365,
          technicalLogRetentionDays: res.data.data.technicalLogRetentionDays || 30,
          autoArchiveEnabled: Boolean(res.data.data.autoArchiveEnabled),
          highRiskAlertEmail: res.data.data.highRiskAlertEmail || "",
        });
      }
      return res.data?.data;
    },
    enabled: activeTab === "retention",
  });

  // ==========================================
  // EXPORT HANDLER
  // ==========================================
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (moduleFilter !== "ALL") params.append("module", moduleFilter);
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await fetch(`/api/audit-logs/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export audit logs");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MOUAL_ERP_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success("Audit logs exported to CSV successfully!");
      refetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  // ==========================================
  // SAVE RETENTION HANDLER
  // ==========================================
  const handleSaveRetention = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRetention(true);
    try {
      const res = await axios.put("/api/audit-logs/retention", retentionForm);
      if (res.data?.success) {
        toast.success("Audit retention policy updated successfully!");
        refetchRetention();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update retention policy");
    } finally {
      setSavingRetention(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <History className="w-5 h-5 text-gold" />
            Enterprise Audit Logs & Activity Tracking
          </h2>
          <p className="text-[13px] text-platinum-muted mt-0.5">
            Immutable business activity trail recording who, what, when, where, before/after field changes, and authorization.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              refetchLogs();
              refetchMetrics();
            }}
            className="bg-[#111113] border border-[#25252B] hover:border-gold/40 text-platinum px-3 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="bg-gold text-onyx px-3.5 py-2 rounded-lg text-[13px] font-semibold hover:bg-gold-light transition-colors flex items-center gap-1.5 shadow-lg shadow-gold/10 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
          <div className="flex items-center justify-between text-platinum-muted text-[12px]">
            <span>Today's Total Events</span>
            <Layers className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-bold text-platinum font-mono">
            {metricsData?.totalToday || 0}
          </div>
          <div className="text-[11px] text-platinum-muted">Business mutations across all branches</div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
          <div className="flex items-center justify-between text-platinum-muted text-[12px]">
            <span>Successful Actions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metricsData?.successToday || 0}
          </div>
          <div className="text-[11px] text-platinum-muted">Completed business transactions</div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
          <div className="flex items-center justify-between text-platinum-muted text-[12px]">
            <span>Failed / Blocked Actions</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {metricsData?.failedToday || 0}
          </div>
          <div className="text-[11px] text-platinum-muted">Blocked or permission-denied events</div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
          <div className="flex items-center justify-between text-platinum-muted text-[12px]">
            <span>Security & 2FA Events</span>
            <ShieldAlert className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-bold text-gold font-mono">
            {metricsData?.securityEventsToday || 0}
          </div>
          <div className="text-[11px] text-platinum-muted">Logins, 2FA challenges & policy edits</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1F1F24] scrollbar-none text-[13px]">
        {[
          { id: "activity", label: "Business Activity Trail", icon: History },
          { id: "timeline", label: "Entity Lifecycle Timeline", icon: FileText },
          { id: "user_activity", label: "Employee Operations Inspector", icon: User },
          { id: "security_events", label: "Security & 2FA Audit Stream", icon: Shield },
          { id: "technical", label: "Technical API Logs (Layer 1)", icon: Code },
          { id: "retention", label: "Retention & Archival Policies", icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "text-platinum-muted hover:bg-[#111113] hover:text-platinum"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-platinum-muted"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: BUSINESS ACTIVITY TRAIL & SECURITY  */}
      {/* ========================================== */}
      {(activeTab === "activity" || activeTab === "security_events") && (
        <div className="space-y-4">
          {/* Multi-Filter Toolbar */}
          <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-platinum-muted" />
                <input
                  type="text"
                  placeholder="Search user, action, invoice #, HUID, IP..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg pl-9 pr-3 py-2 text-[12px] text-platinum placeholder:text-platinum-muted focus:border-gold outline-none"
                />
              </div>

              {/* Module Filter */}
              <div>
                <select
                  value={moduleFilter}
                  onChange={(e) => {
                    setModuleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value="ALL">All Modules</option>
                  <option value="BILLING">Billing & Invoices</option>
                  <option value="INVENTORY">Inventory & Products</option>
                  <option value="METAL">Metal & Rates</option>
                  <option value="PAYMENTS">Payments & GST</option>
                  <option value="USERS">Users & Roles</option>
                  <option value="SECURITY">Security & 2FA</option>
                  <option value="SETTINGS">Settings & Integrations</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="FAILED">Failed Only</option>
                  <option value="BLOCKED">Blocked Only</option>
                  <option value="DENIED">Access Denied</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="INFO">Info</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Sensitive)</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            {/* Date Range & Reset Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#1F1F24]/50 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="text-platinum-muted text-[11px] uppercase tracking-wider">Date Range:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#0A0A0B] border border-[#25252B] rounded-lg px-2.5 py-1 text-[11px] text-platinum focus:border-gold outline-none"
                />
                <span className="text-platinum-muted">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#0A0A0B] border border-[#25252B] rounded-lg px-2.5 py-1 text-[11px] text-platinum focus:border-gold outline-none"
                />
              </div>

              {(search || moduleFilter !== "ALL" || statusFilter !== "ALL" || severityFilter !== "ALL" || fromDate || toDate) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setModuleFilter("ALL");
                    setActionFilter("ALL");
                    setStatusFilter("ALL");
                    setSeverityFilter("ALL");
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                  }}
                  className="text-gold hover:underline text-[11px]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Activity Table */}
          <div className="bg-[#111113] rounded-xl border border-[#1F1F24] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-b border-[#1F1F24]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User Snapshot</th>
                    <th className="py-3 px-4">Action & Module</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Branch Scope</th>
                    <th className="py-3 px-4">Client IP</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-platinum-muted">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gold" /> Loading audit logs...
                        </div>
                      </td>
                    </tr>
                  ) : auditData?.logs?.length > 0 ? (
                    auditData.logs.map((log: any) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-[#16161A] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 text-[12px] text-platinum-muted whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-platinum">
                          <div>{log.userNameSnapshot || "System"}</div>
                          {log.roleSnapshot && (
                            <div className="text-[10px] text-platinum-muted font-mono">{log.roleSnapshot}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-platinum">{log.action}</div>
                          <div className="text-[11px] text-platinum-muted">{log.module}</div>
                        </td>

                        <td className="py-3.5 px-4 text-[12px] text-platinum">
                          <div>{log.entityDisplayName || log.entityId || "—"}</div>
                          {log.entityType && (
                            <div className="text-[10px] text-platinum-muted font-mono">{log.entityType}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[12px] text-platinum-muted">
                          {log.branchNameSnapshot ? (
                            <span>{log.branchNameSnapshot}</span>
                          ) : log.branchId ? (
                            `Branch #${log.branchId}`
                          ) : (
                            "All Branches"
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                          {log.ipAddress || "127.0.0.1"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : log.status === "FAILED" || log.status === "BLOCKED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}>
                            {log.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1.5 rounded-lg text-platinum-muted hover:text-gold hover:bg-[#0A0A0B] transition-colors"
                            title="Inspect Event"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-platinum-muted text-[13px]">
                        No business audit activity found matching your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Bar */}
            {auditData?.pagination && (
              <div className="p-4 bg-[#0A0A0B] border-t border-[#1F1F24] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-platinum-muted">
                <div>
                  Showing {auditData.logs?.length || 0} of {auditData.pagination.total} records (Page {auditData.pagination.page} of {auditData.pagination.totalPages})
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg bg-[#111113] border border-[#25252B] text-platinum hover:border-gold/40 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 bg-[#111113] border border-[#25252B] rounded-lg text-gold font-mono font-bold">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(auditData.pagination.totalPages, p + 1))}
                    disabled={page >= auditData.pagination.totalPages}
                    className="p-1.5 rounded-lg bg-[#111113] border border-[#25252B] text-platinum hover:border-gold/40 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: ENTITY LIFECYCLE INVESTIGATION      */}
      {/* ========================================== */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
            <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" /> Entity Investigation & Audit Timeline
            </h3>
            <p className="text-[12px] text-platinum-muted">
              Inspect the complete chronological history of any Invoice, Product, Stock Item, Metal Exchange, or User across their lifecycle.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveInvestigateId(investigateId.trim());
              }}
              className="flex flex-col sm:flex-row items-center gap-3 pt-2"
            >
              <select
                value={investigateType}
                onChange={(e) => setInvestigateType(e.target.value)}
                className="w-full sm:w-56 bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3 py-2.5 text-[13px] text-platinum focus:border-gold outline-none"
              >
                <option value="INVOICE">Invoice / Billing</option>
                <option value="PRODUCT">Product Item</option>
                <option value="PRODUCT_ITEM">Stock Barcode / Item</option>
                <option value="METAL_EXCHANGE">Metal Exchange Session</option>
                <option value="GOLD_RATE_CONFIG">Gold Rate Configuration</option>
                <option value="USER">User / Employee</option>
              </select>

              <input
                type="text"
                required
                placeholder="Enter Entity ID (e.g. 104, INV-2026-00452, prod_12)..."
                value={investigateId}
                onChange={(e) => setInvestigateId(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum focus:border-gold outline-none font-mono"
              />

              <button
                type="submit"
                className="w-full sm:w-auto bg-gold hover:bg-gold-light text-onyx font-semibold px-5 py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-gold/10 shrink-0"
              >
                <span>Investigate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {activeInvestigateId ? (
            <EntityActivityTimeline
              entityType={investigateType}
              entityId={activeInvestigateId}
              title={`Chronological Timeline for ${investigateType} #${activeInvestigateId}`}
            />
          ) : (
            <div className="p-12 text-center bg-[#111113] rounded-xl border border-[#1F1F24] text-platinum-muted text-[13px]">
              Enter an entity identifier above and click "Investigate" to render its chronological audit history.
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: USER OPERATIONS INSPECTOR           */}
      {/* ========================================== */}
      {activeTab === "user_activity" && (
        <div className="space-y-4">
          <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
            <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
              <User className="w-4 h-4 text-gold" /> Employee Activity & Operations Inspector
            </h3>
            <p className="text-[12px] text-platinum-muted">
              Inspect total operations performed by a staff member today and this week.
            </p>

            <div className="pt-2">
              <input
                type="number"
                placeholder="Enter User / Staff ID (e.g. 1)..."
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full max-w-xs bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3.5 py-2 text-[13px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
          </div>

          {selectedUserId && userSummaryData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24]">
                  <span className="text-[11px] text-platinum-muted uppercase tracking-wider block">Total Operations</span>
                  <span className="text-2xl font-bold text-gold font-mono">{userSummaryData.totalEvents}</span>
                </div>
                <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] sm:col-span-2">
                  <span className="text-[11px] text-platinum-muted uppercase tracking-wider block mb-2">Module Breakdown</span>
                  <div className="flex flex-wrap gap-2">
                    {userSummaryData.moduleBreakdown?.map((m: any) => (
                      <span key={m.module} className="px-2.5 py-1 rounded bg-[#0A0A0B] border border-[#25252B] text-[11px] text-platinum">
                        <strong>{m.module}:</strong> {m.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Logs Table */}
              <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-4">
                <h4 className="text-[14px] font-semibold text-platinum mb-3">Latest Operations by User #{selectedUserId}</h4>
                <div className="space-y-2">
                  {userSummaryData.recentLogs?.map((l: any) => (
                    <div key={l.id} className="p-3 bg-[#0A0A0B] rounded-lg border border-[#1F1F24] flex items-center justify-between text-[12px]">
                      <div>
                        <strong className="text-platinum">{l.action}</strong>
                        <div className="text-platinum-muted text-[11px]">{l.description || l.entityDisplayName}</div>
                      </div>
                      <div className="text-platinum-muted font-mono text-[11px]">
                        {new Date(l.createdAt).toLocaleTimeString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#111113] rounded-xl border border-[#1F1F24] text-platinum-muted text-[13px]">
              Enter a staff User ID above to inspect their audit activity trail.
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: TECHNICAL API LOGS (LAYER 1)        */}
      {/* ========================================== */}
      {activeTab === "technical" && (
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                <Code className="w-4 h-4 text-gold" /> Technical Request & API Performance Logs (Layer 1)
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Technical execution logs capturing API route endpoints, HTTP status codes, latency telemetry, and client IP addresses.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-platinum-muted" />
              <input
                type="text"
                placeholder="Filter route, status, IP..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="bg-[#0A0A0B] border border-[#25252B] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-y border-[#1F1F24]">
                <tr>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Client IP</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24] font-mono">
                {technicalData?.logs?.length > 0 ? (
                  technicalData.logs.map((t: any) => (
                    <tr key={t.id} className="hover:bg-[#16161A] transition-colors">
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.method === "GET" ? "bg-blue-500/10 text-blue-400" :
                          t.method === "POST" ? "bg-emerald-500/10 text-emerald-400" :
                          t.method === "PUT" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {t.method}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-platinum max-w-xs truncate">{t.route}</td>
                      <td className="py-2 px-3">
                        <span className={t.statusCode < 400 ? "text-emerald-400" : "text-rose-400"}>
                          {t.statusCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-platinum-muted">{t.responseTimeMs}ms</td>
                      <td className="py-2 px-3 text-neutral-500">{t.ipAddress || "127.0.0.1"}</td>
                      <td className="py-2 px-3 text-platinum-muted">{t.userNameSnapshot || "—"}</td>
                      <td className="py-2 px-3 text-platinum-muted text-[11px]">
                        {new Date(t.createdAt).toLocaleTimeString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-platinum-muted">
                      No technical API logs recorded in current session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: RETENTION & ARCHIVAL POLICIES       */}
      {/* ========================================== */}
      {activeTab === "retention" && (
        <form onSubmit={handleSaveRetention} className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
                <Server className="w-5 h-5 text-gold" /> Audit Log Retention & Archival Policies
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Configure compliance retention duration for financial and operational activity logs.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-[13px]">
            <div>
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                Business Audit Log Retention (Days)
              </label>
              <select
                value={retentionForm.businessLogRetentionDays}
                onChange={(e) => setRetentionForm({ ...retentionForm, businessLogRetentionDays: parseInt(e.target.value, 10) })}
                className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3.5 py-2.5 text-platinum focus:border-gold outline-none"
              >
                <option value={365}>1 Year (365 Days - Standard GST Compliance)</option>
                <option value={1095}>3 Years (1,095 Days - Financial Audit Standard)</option>
                <option value={1825}>5 Years (1,825 Days - Enterprise Corporate)</option>
                <option value={3650}>10 Years (3,650 Days - Permanent Ledger)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                Technical / API Request Log Retention (Days)
              </label>
              <input
                type="number"
                min="7"
                max="90"
                value={retentionForm.technicalLogRetentionDays}
                onChange={(e) => setRetentionForm({ ...retentionForm, technicalLogRetentionDays: parseInt(e.target.value, 10) })}
                className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3.5 py-2 text-platinum focus:border-gold outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                High-Risk Security Alert Notification Email
              </label>
              <input
                type="email"
                placeholder="compliance@royalheritage.com"
                value={retentionForm.highRiskAlertEmail}
                onChange={(e) => setRetentionForm({ ...retentionForm, highRiskAlertEmail: e.target.value })}
                className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3.5 py-2 text-platinum focus:border-gold outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0A0B] border border-[#1F1F24]">
              <div>
                <span className="text-platinum font-medium block">Auto-Archival to Cold Storage</span>
                <span className="text-[11px] text-platinum-muted">Compress and archive logs older than 180 days to maintain high query speed</span>
              </div>
              <input
                type="checkbox"
                checked={retentionForm.autoArchiveEnabled}
                onChange={(e) => setRetentionForm({ ...retentionForm, autoArchiveEnabled: e.target.checked })}
                className="accent-gold w-4 h-4"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingRetention}
            className="bg-gold text-onyx px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-gold-light transition-colors flex items-center gap-2 shadow-lg shadow-gold/10 disabled:opacity-50"
          >
            {savingRetention ? <Loader2 className="w-4 h-4 animate-spin text-onyx" /> : <Save className="w-4 h-4" />}
            <span>{savingRetention ? "Saving..." : "Save Retention Policy"}</span>
          </button>
        </form>
      )}

      {/* ========================================== */}
      {/* AUDIT DETAIL MODAL / DRAWER                */}
      {/* ========================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#25252B] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1F1F24] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-bold text-platinum font-heading">{selectedLog.action}</h3>
                  <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                    selectedLog.status === "SUCCESS"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
                <p className="text-[12px] text-platinum-muted mt-1">
                  Module: <strong className="text-gold">{selectedLog.module}</strong> | Event ID: <span className="font-mono">{selectedLog.id}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="text-platinum-muted hover:text-platinum text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Performed By & Device Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div className="p-3.5 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-1.5">
                <span className="text-[10px] text-platinum-muted uppercase font-bold tracking-wider block">Performed By</span>
                <div className="text-platinum font-semibold text-[13px]">{selectedLog.userNameSnapshot || "System"}</div>
                <div className="text-platinum-muted">Role: <strong className="text-platinum">{selectedLog.roleSnapshot || "N/A"}</strong></div>
                <div className="text-platinum-muted">Branch: <strong className="text-platinum">{selectedLog.branchNameSnapshot || `Branch #${selectedLog.branchId || "All"}`}</strong></div>
              </div>

              <div className="p-3.5 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-1.5">
                <span className="text-[10px] text-platinum-muted uppercase font-bold tracking-wider block">Network & Device</span>
                <div className="text-platinum font-mono">{selectedLog.ipAddress || "127.0.0.1"}</div>
                <div className="text-platinum-muted">Device: <strong className="text-platinum">{selectedLog.deviceInfo || "Web Browser"}</strong></div>
                <div className="text-platinum-muted truncate font-mono text-[10px]">Req: {selectedLog.requestId || "N/A"}</div>
              </div>
            </div>

            {/* Target Entity */}
            {selectedLog.entityId && (
              <div className="p-3 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] text-[12px] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-platinum-muted uppercase font-bold block">Target Record</span>
                  <span className="text-platinum font-semibold">{selectedLog.entityDisplayName || selectedLog.entityId}</span>
                </div>
                <span className="text-[11px] font-mono bg-[#16161A] px-2 py-1 rounded text-gold">
                  {selectedLog.entityType || "RECORD"}
                </span>
              </div>
            )}

            {/* Reason */}
            {selectedLog.reason && (
              <div className="p-3.5 rounded-xl bg-[#16161A] border border-gold/20 text-[12px] space-y-1">
                <span className="text-gold font-bold block">Reason / Justification:</span>
                <p className="text-platinum">{selectedLog.reason}</p>
              </div>
            )}

            {/* Before / After Visual Diff */}
            {(selectedLog.before || selectedLog.after) && (
              <div className="space-y-2 text-[12px]">
                <span className="text-[11px] font-bold text-platinum-muted uppercase tracking-wider block">
                  Field Level Changes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-3 rounded-xl bg-[#0A0A0B] border border-rose-500/30 space-y-1.5">
                    <span className="text-rose-400 font-bold block">Before:</span>
                    <pre className="whitespace-pre-wrap break-all text-neutral-400 text-[10px] max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedLog.before, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0A0A0B] border border-emerald-500/30 space-y-1.5">
                    <span className="text-emerald-400 font-bold block">After:</span>
                    <pre className="whitespace-pre-wrap break-all text-platinum text-[10px] max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedLog.after, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Inspector */}
            {selectedLog.metadata && (
              <div className="space-y-1 text-[11px]">
                <span className="text-platinum-muted uppercase font-bold tracking-wider block">Metadata:</span>
                <pre className="p-3 bg-[#0A0A0B] rounded-xl border border-[#25252B] text-neutral-400 text-[10px] max-h-32 overflow-y-auto font-mono">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-gold text-onyx font-semibold px-5 py-2 rounded-xl text-[13px] hover:bg-gold-light transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
