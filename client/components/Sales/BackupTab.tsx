"use client";

import React, { useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { Database, Download, Calendar, Loader2, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";

export default function BackupTab() {
  const { selectedBranch } = useBranchStore();

  // Form State
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(now.toISOString().split("T")[0]);
  
  const [includes, setIncludes] = useState<string[]>([
    "invoices",
    "payments",
    "customers",
    "stock",
    "karigar",
  ]);
  const [format, setFormat] = useState<"excel" | "json">("excel");
  
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const fetchLastBackupStatus = () => {
    if (!selectedBranch) return;
    setIsLoadingStatus(true);
    fetch(`/api/backup/last?branchId=${selectedBranch.id}`)
      .then((res) => res.json())
      .then((data) => {
        setLastBackup(data);
      })
      .catch((err) => console.error("Failed to load backup status:", err))
      .finally(() => setIsLoadingStatus(false));
  };

  useEffect(() => {
    fetchLastBackupStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  const handleToggleInclude = (key: string) => {
    setIncludes((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleDownloadBackup = async () => {
    if (!selectedBranch) return;
    if (includes.length === 0) {
      toast.error("Please select at least one dataset to include.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Preparing database backup snapshots...");

    try {
      const res = await fetch("/api/backup/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch.id.toString(),
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo).toISOString(),
          format,
          includes,
        }),
      });

      if (!res.ok) throw new Error("Database export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${selectedBranch.id}_${Date.now()}.${format === "json" ? "json" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Backup snapshot download ready ✅", { id: toastId });
      fetchLastBackupStatus(); // reload status
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to compile backup", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto pt-4">
      {/* Parameters Panel */}
      <div className="lg:col-span-2 rounded-xl border border-[#1F1F24] bg-[#111113] p-6 hover:border-[#3A2E18] transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#C9943A]/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-[#C9943A]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0EBE0] font-serif">Export & Backup</h3>
            <p className="text-xs text-[#6B6560]">Select tables to compile database snapshot</p>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
              Date From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
              Date To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Dataset check-list */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
            Datasets to Include
          </label>
          <div className="grid grid-cols-2 gap-3 text-xs text-[#F0EBE0]">
            {[
              { id: "invoices", label: "Invoices Ledger" },
              { id: "payments", label: "Invoice Payments" },
              { id: "customers", label: "Customers Data" },
              { id: "stock", label: "Stock Movements" },
              { id: "karigar", label: "Karigar Jobs" },
            ].map((d) => (
              <label
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#1A1A1E] hover:border-[#3A2E18]/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={includes.includes(d.id)}
                  onChange={() => handleToggleInclude(d.id)}
                  className="rounded border-[#1F1F24] text-[#C9943A] focus:ring-[#C9943A]/20 bg-[#111113] w-4 h-4"
                />
                <span className="font-semibold">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Format Select */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2.5">
            File Export Format
          </label>
          <div className="flex gap-4 text-xs text-[#F0EBE0]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={format === "excel"}
                onChange={() => setFormat("excel")}
                className="border-[#1F1F24] text-[#C9943A] focus:ring-[#C9943A]/20 bg-[#111113] w-4 h-4"
              />
              <span className="font-semibold">Microsoft Excel (.xlsx)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={format === "json"}
                onChange={() => setFormat("json")}
                className="border-[#1F1F24] text-[#C9943A] focus:ring-[#C9943A]/20 bg-[#111113] w-4 h-4"
              />
              <span className="font-semibold">Structured JSON File (.json)</span>
            </label>
          </div>
        </div>

        {/* Download Trigger */}
        <button
          onClick={handleDownloadBackup}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#C9943A] hover:bg-[#E8B84B] text-foreground text-sm font-bold disabled:opacity-50 transition-colors cursor-pointer border-0"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Database Backup
        </button>
      </div>

      {/* Catalog / Log side Card */}
      <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6 hover:border-[#3A2E18] transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#C9943A]/10 flex items-center justify-center">
            <History className="w-5 h-5 text-[#C9943A]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0EBE0] font-serif">Recovery Catalog</h3>
            <p className="text-xs text-[#6B6560]">Latest catalog backups</p>
          </div>
        </div>

        {isLoadingStatus ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#C9943A] animate-spin" />
          </div>
        ) : lastBackup && lastBackup.lastBackupAt ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#1A1A1E] border border-[#1F1F24] p-4 text-xs text-[#F0EBE0]">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                <CheckCircle2 className="w-4 h-4" />
                Active Database Connection
              </div>
              <div className="space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Last Export:</span>
                  <span>{new Date(lastBackup.lastBackupAt).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Snapshot Size:</span>
                  <span>{lastBackup.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">File Format:</span>
                  <span>{lastBackup.format}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#6B6560] leading-relaxed">
              Backups are stored locally inside the system archive. Use catalog restore profiles to rollback configurations or sync inventory items.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-[#1A1A1E] border border-[#1F1F24] p-6 text-center text-xs text-[#6B6560]">
            <p className="font-semibold text-[#F0EBE0]">No Backups Recorded</p>
            <p className="mt-1">First-time initialization required. Select datasets and click Download above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
