// client/components/RFID/RFIDInventoryAuditClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Checklist,
  Radio,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Zap,
  Filter,
  ArrowRight,
  ShieldCheck,
  Printer,
  Sparkles,
  FileCheck,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import { RFIDHistoryDialog } from "../Inventory/RFIDHistoryDialog";

export default function RFIDInventoryAuditClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"NEW" | "RESULTS" | "HISTORY">("NEW");

  // New Audit Wizard State
  const [auditName, setAuditName] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [isSafeOnly, setIsSafeOnly] = useState(false);

  // Active Session & Results State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyEpc, setHistoryEpc] = useState<string | null>(null);

  // Manager Approval Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  // 1. Fetch Zones & Readers
  const { data: zones = [] } = useQuery({
    queryKey: ["rfidZonesList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/zones");
      return res.data?.data || [];
    },
  });

  const { data: readers = [] } = useQuery({
    queryKey: ["rfidReadersList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/readers");
      return res.data?.data || [];
    },
  });

  // 2. Fetch Active Session Results
  const { data: resultsData, refetch: refetchResults, isLoading: loadingResults } = useQuery({
    queryKey: ["auditSessionResults", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;
      const res = await axios.get(`/api/rfid/scans/${activeSessionId}/results`);
      return res.data?.data;
    },
    enabled: !!activeSessionId,
    refetchInterval: isScanning ? 4000 : false,
  });

  // 3. Fetch Historical Audit Sessions
  const { data: pastSessionsData } = useQuery({
    queryKey: ["pastAuditSessions"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/scans", { params: { type: "INVENTORY_AUDIT" } });
      return res.data?.data || [];
    },
  });

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/scans", payload);
      return res.data;
    },
    onSuccess: (data) => {
      const session = data.data;
      setActiveSessionId(session.id);
      setActiveTab("RESULTS");
      toast.success(`Audit Session ${session.sessionNo} created!`);
      // Auto-start scanning
      handleStartScan(session.id);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create audit session");
    },
  });

  const handleStartScan = async (sessionId?: string) => {
    const targetId = sessionId || activeSessionId;
    if (!targetId) return;
    try {
      await axios.post(`/api/rfid/scans/${targetId}/start`);
      setIsScanning(true);
      toast.success("RFID scanning started! Receiving live item reads...");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start scan");
    }
  };

  const handleStopScan = async () => {
    if (!activeSessionId) return;
    try {
      await axios.post(`/api/rfid/scans/${activeSessionId}/stop`);
      setIsScanning(false);
      refetchResults();
      toast.success("Audit scan complete! Reconciliation report generated.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to stop scan");
    }
  };

  const handleSimulateBurst = async () => {
    if (!activeSessionId) return;
    try {
      const reader = readers[0];
      if (!reader) return;
      await axios.post(`/api/rfid/readers/${reader.id}/mock-trigger`, {
        scanSessionId: activeSessionId,
        count: 6,
      });
      refetchResults();
      toast.success("Simulated RFID detection burst!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Burst failed");
    }
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!activeSessionId) return;
      const res = await axios.post(`/api/rfid/scans/${activeSessionId}/approve`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Audit approved and closed successfully!");
      setApproveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pastAuditSessions"] });
      refetchResults();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to approve audit");
    },
  });

  const summary = resultsData?.summary || {
    totalExpected: 0,
    totalDetected: 0,
    matchedCount: 0,
    missingCount: 0,
    unexpectedCount: 0,
    wrongZoneCount: 0,
    wrongBranchCount: 0,
    statusMismatchCount: 0,
    accuracyPercentage: 100,
  };

  const items = resultsData?.items || [];
  const currentSession = resultsData?.session;

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesStatus = statusFilter === "ALL" || item.reconciliationStatus === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.epc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.huidNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Physical RFID Inventory Audit
            </h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40">
              Automated Variance Reconciliation
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Compare ERP expected stock against physical RFID reader detections with automated exception tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-onyx p-1 rounded-xl border border-onyx-border text-xs">
            <button
              onClick={() => setActiveTab("NEW")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "NEW" ? "bg-gold text-black" : "text-platinum-muted hover:text-platinum"
              }`}
            >
              New Audit Wizard
            </button>
            <button
              onClick={() => setActiveTab("RESULTS")}
              disabled={!activeSessionId}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "RESULTS"
                  ? "bg-gold text-black"
                  : activeSessionId
                  ? "text-platinum-muted hover:text-platinum"
                  : "text-platinum-faint cursor-not-allowed"
              }`}
            >
              Live Reconciliation {activeSessionId && "●"}
            </button>
            <button
              onClick={() => setActiveTab("HISTORY")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "HISTORY" ? "bg-gold text-black" : "text-platinum-muted hover:text-platinum"
              }`}
            >
              Audit History
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: NEW AUDIT WIZARD --- */}
      {activeTab === "NEW" && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="bg-onyx-surface border-onyx-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Radio className="w-5 h-5 text-gold" /> Step 1: Define Audit Scope
              </CardTitle>
              <CardDescription className="text-xs text-platinum-muted">
                Select the physical zone, reader hardware, and item categories to audit.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Audit Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Closing Audit — Diamond Counter"
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                    Target Physical Zone
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                  >
                    <option value="">Full Branch Showroom</option>
                    {zones.map((z: any) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                    RFID Reader Hardware
                  </label>
                  <select
                    value={selectedReaderId}
                    onChange={(e) => setSelectedReaderId(e.target.value)}
                    className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                  >
                    <option value="">Auto-Assign Closest Reader</option>
                    {readers.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-onyx rounded-xl border border-onyx-border space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="safeOnlyCheck"
                    checked={isSafeOnly}
                    onChange={(e) => setIsSafeOnly(e.target.checked)}
                    className="rounded border-onyx-border text-gold focus:ring-gold"
                  />
                  <label htmlFor="safeOnlyCheck" className="text-xs font-semibold text-platinum cursor-pointer">
                    Safe / Vault Audit (Strict High-Security Mode)
                  </label>
                </div>
                <p className="text-[11px] text-platinum-muted pl-5">
                  Flags any missing items as CRITICAL severity security exceptions requiring immediate manager investigation.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() =>
                    createSessionMutation.mutate({
                      name: auditName || undefined,
                      zoneId: selectedZoneId || undefined,
                      readerId: selectedReaderId || undefined,
                      type: "INVENTORY_AUDIT",
                    })
                  }
                  disabled={createSessionMutation.isPending}
                  className="w-full bg-gold hover:bg-gold-dark text-black font-semibold text-xs py-2.5 shadow-md gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Physical Audit Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TAB 2: ACTIVE AUDIT RECONCILIATION --- */}
      {activeTab === "RESULTS" && (
        <div className="space-y-6">
          {/* Audit Control Bar */}
          <div className="p-4 bg-onyx-surface rounded-xl border border-onyx-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">
                  {currentSession?.sessionNo || "ACTIVE AUDIT"}
                </span>
                <Badge
                  variant={isScanning ? "default" : "outline"}
                  className={isScanning ? "bg-amber-500 text-black animate-pulse" : "text-emerald-400 border-emerald-400/40"}
                >
                  {isScanning ? "SCANNING IN PROGRESS" : currentSession?.status || "REVIEW"}
                </Badge>
              </div>
              <h2 className="text-base font-bold text-foreground">{currentSession?.name || "Inventory Audit"}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateBurst}
                className="border-onyx-border text-xs gap-1.5 hover:text-gold"
              >
                <Zap className="w-3.5 h-3.5 text-gold" /> Simulate Scan Burst
              </Button>

              {isScanning ? (
                <Button
                  size="sm"
                  onClick={handleStopScan}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs gap-1.5 shadow-md"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop & Reconcile
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleStartScan()}
                  className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume Scan
                </Button>
              )}

              {currentSession?.status !== "CLOSED" && (
                <Button
                  size="sm"
                  onClick={() => setApproveModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-md"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Approve & Close Audit
                </Button>
              )}
            </div>
          </div>

          {/* Reconciliation Variance Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total Expected */}
            <div className="p-3 bg-onyx-surface rounded-xl border border-onyx-border text-center space-y-1">
              <div className="text-[10px] text-platinum-muted uppercase font-semibold">ERP Expected</div>
              <div className="text-xl font-bold text-platinum">{summary.totalExpected}</div>
            </div>

            {/* Total Detected */}
            <div className="p-3 bg-onyx-surface rounded-xl border border-onyx-border text-center space-y-1">
              <div className="text-[10px] text-platinum-muted uppercase font-semibold">RFID Detected</div>
              <div className="text-xl font-bold text-gold">{summary.totalDetected}</div>
            </div>

            {/* Matched */}
            <div className="p-3 bg-onyx-surface rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-1">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Matched</div>
              <div className="text-xl font-bold text-emerald-400">{summary.matchedCount}</div>
            </div>

            {/* Missing */}
            <div
              onClick={() => setStatusFilter("MISSING")}
              className="p-3 bg-onyx-surface rounded-xl border border-rose-500/30 bg-rose-500/5 text-center space-y-1 cursor-pointer hover:border-rose-500 transition-all"
            >
              <div className="text-[10px] text-rose-400 uppercase font-semibold">Missing</div>
              <div className="text-xl font-bold text-rose-400">{summary.missingCount}</div>
            </div>

            {/* Unexpected */}
            <div
              onClick={() => setStatusFilter("UNEXPECTED")}
              className="p-3 bg-onyx-surface rounded-xl border border-amber-500/30 bg-amber-500/5 text-center space-y-1 cursor-pointer hover:border-amber-500 transition-all"
            >
              <div className="text-[10px] text-amber-400 uppercase font-semibold">Unexpected</div>
              <div className="text-xl font-bold text-amber-400">{summary.unexpectedCount}</div>
            </div>

            {/* Wrong Zone */}
            <div
              onClick={() => setStatusFilter("WRONG_ZONE")}
              className="p-3 bg-onyx-surface rounded-xl border border-blue-500/30 bg-blue-500/5 text-center space-y-1 cursor-pointer hover:border-blue-500 transition-all"
            >
              <div className="text-[10px] text-blue-400 uppercase font-semibold">Wrong Zone</div>
              <div className="text-xl font-bold text-blue-400">{summary.wrongZoneCount}</div>
            </div>

            {/* Accuracy */}
            <div className="p-3 bg-onyx-surface rounded-xl border border-gold/30 bg-gold/5 text-center space-y-1">
              <div className="text-[10px] text-gold uppercase font-semibold">Accuracy</div>
              <div className="text-xl font-bold text-gold">{summary.accuracyPercentage}%</div>
            </div>
          </div>

          {/* Discrepancy Breakdown Table */}
          <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-onyx-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {["ALL", "MATCHED", "MISSING", "UNEXPECTED", "WRONG_ZONE", "WRONG_BRANCH", "SOLD_DETECTED"].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        statusFilter === st
                          ? "bg-gold text-black shadow-sm"
                          : "bg-onyx text-platinum-muted hover:text-platinum border border-onyx-border"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  )
                )}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter by name, EPC, HUID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-onyx px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum placeholder:text-platinum-faint focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-onyx/70 text-platinum-muted uppercase text-[10px] tracking-wider border-b border-onyx-border sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3">Reconciliation Status</th>
                    <th className="px-4 py-3">Jewellery Item</th>
                    <th className="px-4 py-3">EPC / Barcode / HUID</th>
                    <th className="px-4 py-3">Expected Location</th>
                    <th className="px-4 py-3">Detected Location</th>
                    <th className="px-4 py-3">Signal (RSSI)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-onyx-border/60">
                  {loadingResults ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted animate-pulse">
                        Calculating variance reconciliation...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted">
                        No items matching the selected reconciliation filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item: any, idx: number) => {
                      const isMatched = item.reconciliationStatus === "MATCHED";
                      const isMissing = item.reconciliationStatus === "MISSING";
                      const isWrongZone = item.reconciliationStatus === "WRONG_ZONE";
                      const isUnexpected = item.reconciliationStatus === "UNEXPECTED";
                      const isSoldDetected = item.reconciliationStatus === "SOLD_DETECTED";

                      return (
                        <tr key={idx} className="hover:bg-onyx/50 transition-colors">
                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                isMatched
                                  ? "default"
                                  : isMissing || isSoldDetected
                                  ? "destructive"
                                  : "outline"
                              }
                              className={`text-[10px] ${
                                isMatched
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : isWrongZone
                                  ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                                  : isUnexpected
                                  ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                                  : ""
                              }`}
                            >
                              {item.reconciliationStatus.replace(/_/g, " ")}
                            </Badge>
                          </td>

                          {/* Item Details */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-[11px] text-platinum-muted">
                              {item.category && `${item.category} · `}
                              {item.gsWeight ? `${item.gsWeight}g · ` : ""}
                              {item.purity ? `${item.purity}K` : ""}
                              {item.isHighValue && (
                                <span className="ml-1.5 font-bold text-amber-400">HIGH VALUE</span>
                              )}
                            </div>
                          </td>

                          {/* Identifiers */}
                          <td className="px-4 py-3.5 font-mono text-[11px]">
                            <div className="text-gold font-semibold">{item.epc}</div>
                            <div className="text-platinum-muted">
                              {item.productCode && `Code: ${item.productCode}`}
                              {item.huidNumber && ` · HUID: ${item.huidNumber}`}
                            </div>
                          </td>

                          {/* Expected Location */}
                          <td className="px-4 py-3.5">
                            <div className="text-platinum">
                              {item.expectedBranchName || "Current Branch"}
                            </div>
                            <div className="text-[10px] text-platinum-muted">
                              {item.expectedZoneName || "Showroom Floor"}
                            </div>
                          </td>

                          {/* Detected Location */}
                          <td className="px-4 py-3.5">
                            {isMissing ? (
                              <span className="text-rose-400 italic">Not Observed</span>
                            ) : (
                              <div>
                                <div className="text-platinum">{item.detectedBranchName || "Current Branch"}</div>
                                <div className="text-[10px] text-emerald-400 font-semibold">
                                  {item.detectedZoneName || "Scanned Area"}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Signal */}
                          <td className="px-4 py-3.5 font-mono text-platinum">
                            {item.lastRssi ? (
                              <div>
                                <span>{item.lastRssi} dBm</span>
                                {item.readCount && (
                                  <span className="block text-[10px] text-platinum-muted">{item.readCount} reads</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-platinum-faint">—</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3.5 text-right">
                            {item.epc && item.epc !== "UNASSIGNED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHistoryEpc(item.epc)}
                                className="text-xs text-platinum-muted hover:text-gold h-7"
                              >
                                Timeline →
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- TAB 3: AUDIT HISTORY --- */}
      {activeTab === "HISTORY" && (
        <Card className="bg-onyx-surface border-onyx-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-onyx-border">
            <CardTitle className="text-sm font-bold text-foreground">Past Audit Sessions</CardTitle>
            <CardDescription className="text-xs text-platinum-muted">
              Historical physical stock verification records and signed closing slips.
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-onyx/70 text-platinum-muted uppercase text-[10px] tracking-wider border-b border-onyx-border">
                <tr>
                  <th className="px-4 py-3">Audit Number</th>
                  <th className="px-4 py-3">Audit Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Detected</th>
                  <th className="px-4 py-3">Matched</th>
                  <th className="px-4 py-3">Missing</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-onyx-border/60">
                {pastSessionsData && pastSessionsData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-platinum-muted">
                      No audit history found.
                    </td>
                  </tr>
                ) : (
                  (pastSessionsData || []).map((session: any) => (
                    <tr key={session.id} className="hover:bg-onyx/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gold">{session.sessionNo}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{session.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={session.status === "CLOSED" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {session.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-platinum">{session.totalExpected}</td>
                      <td className="px-4 py-3 text-gold">{session.totalDetected}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{session.matchedCount}</td>
                      <td className="px-4 py-3 text-rose-400 font-semibold">{session.missingCount}</td>
                      <td className="px-4 py-3 text-platinum-muted">
                        {new Date(session.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveSessionId(session.id);
                            setActiveTab("RESULTS");
                          }}
                          className="text-xs text-gold hover:underline h-7"
                        >
                          View Report →
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* --- MODAL: APPROVE & CLOSE AUDIT --- */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Manager Approval & Audit Close
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Closing this audit will lock the reconciliation snapshot and automatically generate{" "}
              <span className="text-amber-400 font-semibold">
                {summary.missingCount + summary.unexpectedCount + summary.wrongZoneCount} Discrepancy Exceptions
              </span>{" "}
              for authorized investigation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-onyx rounded-xl border border-onyx-border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-platinum-muted">Audit Session:</span>
                <span className="font-mono text-gold">{currentSession?.sessionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-platinum-muted">Reconciliation Accuracy:</span>
                <span className="font-semibold text-emerald-400">{summary.accuracyPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-platinum-muted">Missing Items:</span>
                <span className="font-semibold text-rose-400">{summary.missingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-platinum-muted">Wrong Zone Items:</span>
                <span className="font-semibold text-blue-400">{summary.wrongZoneCount}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px]">
              <strong>Important Rule:</strong> Closing the audit does NOT alter ERP inventory records. Missing items generate Investigation Exceptions.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {approveMutation.isPending ? "Closing..." : "Approve & Generate Exceptions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <RFIDHistoryDialog
        epc={historyEpc}
        open={!!historyEpc}
        onOpenChange={(open) => !open && setHistoryEpc(null)}
      />
    </div>
  );
}
