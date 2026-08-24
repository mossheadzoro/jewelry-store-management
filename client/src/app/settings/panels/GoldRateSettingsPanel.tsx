"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Save,
  Loader2,
  RefreshCw,
  AlertCircle,
  Edit3,
  History,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Building,
  CheckCircle2,
} from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

export default function GoldRateSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();

  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const [config, setConfig] = useState<any>({
    isLive: true,
    manualRates: {
      "24k": 0,
      "22k": 0,
      "18k": 0,
      "14k": 0,
      silver: 95,
    },
  });

  const [liveRates, setLiveRates] = useState<any>(null);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // History Ledger State
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyMetrics, setHistoryMetrics] = useState<any>({
    latest24k: 0,
    latest22k: 0,
    high24k: 0,
    low24k: 0,
    totalSnapshots: 0,
    lastUpdated: null,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const fetchLiveRates = async () => {
    try {
      setFetchingLive(true);
      const res = await fetch("/api/gold-rates?forceLive=true");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLiveRates(data.ratesPerGram);
      setLastFetched(new Date(data.timestamp || Date.now()));
    } catch (e) {
      console.error("Failed to fetch live gold rates", e);
    } finally {
      setFetchingLive(false);
    }
  };

  const fetchHistoryLedger = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch?.id) params.set("branchId", String(selectedBranch.id));
      if (sourceFilter) params.set("source", sourceFilter);

      const res = await fetch(`/api/gold-rates/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryEntries(data.entries || []);
        if (data.metrics) setHistoryMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Failed to fetch gold rate history ledger:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedBranch?.id, sourceFilter]);

  useEffect(() => {
    fetchLiveRates();
    fetchHistoryLedger();
    const interval = setInterval(() => {
      fetchLiveRates();
      fetchHistoryLedger();
    }, 300000); // 5-minute background sync
    return () => clearInterval(interval);
  }, [fetchHistoryLedger]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.goldRateConfig) {
      setConfig((prev: any) => ({
        ...prev,
        ...globalSettings.goldRateConfig,
      }));
    }
  }, [globalSettings]);

  const handleSave = async (applyToAllBranches: boolean) => {
    if (applyToAllBranches) setSavingAll(true);
    else setSaving(true);
    setSaveSuccessMsg("");

    try {
      await fetch("/api/settings/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          goldRateConfig: config,
          applyToAllBranches,
        }),
      });

      setSaveSuccessMsg(
        applyToAllBranches
          ? "Applied rate configuration to ALL enterprise branches."
          : `Saved rate configuration for ${selectedBranch?.name || "current branch"}.`
      );
      setTimeout(() => setSaveSuccessMsg(""), 4000);

      if (selectedBranch?.id) {
        await fetchGlobalSettings(selectedBranch.id);
      }
      await fetchHistoryLedger();
    } catch (e) {
      console.error(e);
      alert("Failed to save gold rate configuration.");
    } finally {
      setSaving(false);
      setSavingAll(false);
    }
  };

  const updateManualRate = (carat: string, value: number | string) => {
    setConfig((prev: any) => ({
      ...prev,
      manualRates: {
        ...prev.manualRates,
        [carat]: value,
      },
    }));
  };

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return historyEntries;
    const q = historySearch.toLowerCase();
    return historyEntries.filter(
      (item) =>
        item.source?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.branch?.name?.toLowerCase().includes(q) ||
        String(item.rate24k).includes(q)
    );
  }, [historyEntries, historySearch]);

  if (loading && !globalSettings) {
    return (
      <div className="p-8 text-center text-platinum-muted animate-pulse">
        Loading configurations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-heading font-semibold text-platinum flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9943A]" />
            Gold Rate Settings & Auto-Ledger
          </h2>
          <p className="text-[12.5px] text-platinum-muted mt-0.5">
            Real-time bullion API price streaming, store branch overrides, and automated 5-minute ledger recording.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSave(true)}
              disabled={saving || savingAll}
              className="bg-onyx-surface border border-onyx-border text-platinum px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium hover:text-[#C9943A] hover:border-[#C9943A]/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building className="w-3.5 h-3.5 text-[#C9943A]" />}
              {savingAll ? "Applying..." : "Save for All Branches"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || savingAll}
              className="bg-[#C9943A] text-foreground px-4 py-1.5 rounded-lg text-[12.5px] font-semibold hover:bg-[#E8B84B] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save for this branch"}
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[12px] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION 1: Sourcing & Manual Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sourcing Mode & Inputs */}
        <div className="space-y-4">
          <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-platinum">Rate Sourcing Mode</h3>
                <p className="text-[11px] text-platinum-muted">Live external bullion API vs fixed store rates.</p>
              </div>
              <div className="flex bg-[#0A0A0B] border border-[#1F1F24] rounded-lg p-0.5">
                <button
                  onClick={() => isAdmin && setConfig((prev: any) => ({ ...prev, isLive: true }))}
                  disabled={!isAdmin}
                  className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md transition-colors cursor-pointer ${
                    config.isLive
                      ? "bg-[#C9943A] text-foreground shadow-sm"
                      : "text-platinum-muted hover:text-platinum"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Live API (5-Min)
                  </div>
                </button>
                <button
                  onClick={() => isAdmin && setConfig((prev: any) => ({ ...prev, isLive: false }))}
                  disabled={!isAdmin}
                  className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md transition-colors cursor-pointer ${
                    !config.isLive
                      ? "bg-[#C9943A] text-foreground shadow-sm"
                      : "text-platinum-muted hover:text-platinum"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    Manual Fixed
                  </div>
                </button>
              </div>
            </div>

            {config.isLive ? (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11.5px] text-blue-200 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Live API Mode Active</strong>: Automatically synchronizes and logs bullion rates every 5 minutes into the ledger.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11.5px] text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Manual Mode Active</strong>: Invoices, POS checkout, and quotations will use your defined fixed rates below.
                </p>
              </div>
            )}
          </div>

          <div
            className={`bg-[#111113] rounded-xl border border-[#1F1F24] p-4 space-y-3 transition-opacity ${
              config.isLive ? "opacity-50" : "opacity-100"
            }`}
          >
            <h3 className="text-[13px] font-semibold text-platinum flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-[#C9943A]" />
              Manual Rate Inputs (₹ / gram)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["24k", "22k", "18k", "14k", "silver"].map((carat) => (
                <div key={carat} className="space-y-1">
                  <label className="text-[10px] text-platinum-muted uppercase font-bold tracking-wider">
                    {carat === "silver" ? "Silver 1g" : `${carat} Gold`}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-platinum-muted">₹</span>
                    <input
                      type="number"
                      value={config.manualRates?.[carat] ?? ""}
                      onChange={(e) =>
                        updateManualRate(carat, e.target.value === "" ? "" : Number(e.target.value))
                      }
                      disabled={!isAdmin || config.isLive}
                      className="w-full h-8 pl-6 pr-2 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[12px] text-platinum focus:border-[#C9943A]/40 outline-none font-mono disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Market Reference Table */}
        <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[13px] font-semibold text-platinum flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Live Market Rates (External API)
                </h3>
                <p className="text-[11px] text-platinum-muted">Updated every 5 minutes from bullion exchanges.</p>
              </div>
              <button
                onClick={fetchLiveRates}
                disabled={fetchingLive}
                className="text-[#888] hover:text-platinum transition-colors p-1 rounded-md bg-onyx-elevated border border-[#222] cursor-pointer"
                title="Refresh Live API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingLive ? "animate-spin text-[#C9943A]" : ""}`} />
              </button>
            </div>

            <div className="bg-[#0A0A0B] rounded-lg border border-[#1F1F24] overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#151518] text-platinum-muted uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-3 py-2">Purity</th>
                    <th className="px-3 py-2 text-right">Rate (₹ / g)</th>
                    <th className="px-3 py-2 text-right">Rate (₹ / 10g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {["24k", "22k", "18k", "14k"].map((carat) => {
                    const ratePerGram = liveRates?.[carat] || 0;
                    const ratePer10Gram = ratePerGram * 10;

                    return (
                      <tr key={`live-${carat}`} className="hover:bg-[#151518]/50">
                        <td className="px-3 py-2 text-platinum font-semibold">{carat.toUpperCase()}</td>
                        <td className="px-3 py-2 text-[#C9943A] font-mono font-bold text-right">
                          {fetchingLive ? (
                            <div className="h-3.5 bg-[#1F1F24] rounded animate-pulse w-14 ml-auto" />
                          ) : (
                            `₹${ratePerGram.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-platinum-muted font-mono text-right">
                          {fetchingLive ? (
                            <div className="h-3.5 bg-[#1F1F24] rounded animate-pulse w-16 ml-auto" />
                          ) : (
                            `₹${ratePer10Gram.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-onyx border border-[#1F1F24] flex items-center justify-between text-[11px] text-[#777]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Automated 5-Min Sync Active
            </span>
            {lastFetched && <span>Synced: {lastFetched.toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>

      {/* SECTION 2: Compact Gold Rate History Ledger */}
      <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-4 space-y-4">
        {/* Ledger Header & KPI Strip */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#C9943A]" />
            <h3 className="text-[14px] font-bold text-platinum">
              Gold Rate History Ledger (5-Minute Cycles)
            </h3>
            <span className="text-[11px] text-[#666] bg-onyx px-2 py-0.5 rounded border border-onyx-border">
              {historyMetrics.totalSnapshots} Records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistoryLedger}
              disabled={historyLoading}
              className="h-7 px-2.5 rounded-lg bg-onyx border border-onyx-border text-[11.5px] text-platinum hover:text-[#C9943A] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${historyLoading ? "animate-spin text-[#C9943A]" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="h-7 px-2.5 rounded-lg bg-onyx border border-onyx-border text-[11.5px] text-platinum-muted hover:text-platinum flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {/* 4 Compact Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-onyx rounded-lg border border-onyx-border p-3">
            <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">Today&apos;s High (24K)</span>
            <p className="text-[16px] font-bold text-emerald-400 font-mono mt-0.5">
              ₹{historyMetrics.high24k.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-onyx rounded-lg border border-onyx-border p-3">
            <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">Today&apos;s Low (24K)</span>
            <p className="text-[16px] font-bold text-amber-400 font-mono mt-0.5">
              ₹{historyMetrics.low24k.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-onyx rounded-lg border border-onyx-border p-3">
            <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">Latest 24K Rate</span>
            <p className="text-[16px] font-bold text-[#C9943A] font-mono mt-0.5">
              ₹{historyMetrics.latest24k.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-onyx rounded-lg border border-onyx-border p-3">
            <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">Latest 22K Rate</span>
            <p className="text-[16px] font-bold text-platinum font-mono mt-0.5">
              ₹{historyMetrics.latest22k.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-platinum-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-onyx pl-8 pr-3 py-1 rounded-lg border border-onyx-border text-[12px] text-platinum placeholder:text-platinum-muted focus:outline-none focus:border-[#C9943A]"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-onyx border border-onyx-border text-platinum text-[11.5px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#C9943A] cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="LIVE_API">Live API (5-Min)</option>
              <option value="MANUAL_OVERRIDE">Manual Overrides</option>
            </select>
          </div>

          <div className="text-[11px] text-[#666]">
            Showing {filteredHistory.length} ledger entries
          </div>
        </div>

        {/* Lightweight Table */}
        <div className="bg-[#0A0A0B] rounded-lg border border-[#1F1F24] overflow-hidden">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#151518] text-platinum-muted uppercase text-[10px] font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-2.5">Recorded Time</th>
                  <th className="px-3.5 py-2.5">Source</th>
                  <th className="px-3.5 py-2.5 text-right">24K (₹/g)</th>
                  <th className="px-3.5 py-2.5 text-right">22K (₹/g)</th>
                  <th className="px-3.5 py-2.5 text-right">18K (₹/g)</th>
                  <th className="px-3.5 py-2.5 text-right">14K (₹/g)</th>
                  <th className="px-3.5 py-2.5 text-center">Movement</th>
                  <th className="px-3.5 py-2.5">Branch Scope</th>
                  <th className="px-3.5 py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24] text-platinum">
                {historyLoading && historyEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3.5 py-8 text-center text-[#777]">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#C9943A] mb-1.5" />
                      Loading history ledger...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3.5 py-8 text-center text-[#777]">
                      No gold rate history entries found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row) => {
                    const delta = Number(row.changeFromPrev) || 0;
                    const dateObj = new Date(row.recordedAt);
                    const timeStr = dateObj.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });
                    const dateStr = dateObj.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    });

                    return (
                      <tr key={row.id} className="hover:bg-[#151518]/50">
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          <span className="font-mono text-foreground">{timeStr}</span>
                          <span className="text-[10px] text-[#666] ml-1.5">({dateStr})</span>
                        </td>
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          {row.source === "LIVE_API" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              Live 5-Min
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#C9943A]/15 text-[#C9943A] border border-[#C9943A]/30 uppercase tracking-wider inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9943A]" />
                              Manual Override
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 font-mono font-bold text-[#C9943A] text-right">
                          ₹{Number(row.rate24k).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-platinum text-right">
                          ₹{Number(row.rate22k).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-platinum-muted text-right">
                          ₹{Number(row.rate18k).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-platinum-muted text-right">
                          ₹{Number(row.rate14k).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-2 text-center whitespace-nowrap">
                          {delta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-400 font-mono text-[10.5px]">
                              <ArrowUpRight className="w-3 h-3" />
                              +₹{delta.toFixed(2)}
                            </span>
                          ) : delta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-red-400 font-mono text-[10.5px]">
                              <ArrowDownRight className="w-3 h-3" />
                              -₹{Math.abs(delta).toFixed(2)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[#666] font-mono text-[10.5px]">
                              <Minus className="w-3 h-3" />
                              ₹0.00
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-[11px] text-platinum-muted whitespace-nowrap">
                          {row.branch ? (
                            <span className="bg-onyx px-1.5 py-0.5 rounded border border-onyx-border text-[#aaa]">
                              {row.branch.name}
                            </span>
                          ) : (
                            <span className="text-[#666] italic">Global</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-[11px] text-[#777] max-w-[200px] truncate">
                          {row.notes || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
