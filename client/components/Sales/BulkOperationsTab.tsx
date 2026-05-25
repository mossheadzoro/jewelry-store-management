"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import {
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  Hash,
  CalendarDays,
  Loader2,
  CheckCircle2,
  Shield,
  AlertCircle,
} from "lucide-react";

// ── Helpers ──
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Types ──
interface BulkPrintPreview {
  count: number;
  totalValue: number;
  invoices: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    customerName: string;
    date: string;
  }[];
}

interface ExportPreview {
  count: number;
  totalValue: number;
  totalGst: number;
}

export default function BulkOperationsTab() {
  const { selectedBranch } = useBranchStore();

  // ── Print Range State ──
  const [startInvoice, setStartInvoice] = useState("");
  const [endInvoice, setEndInvoice] = useState("");
  const [printPreview, setPrintPreview] = useState<BulkPrintPreview | null>(null);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // ── Export Range State ──
  const now = new Date();
  const [exportFrom, setExportFrom] = useState(
    formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [exportTo, setExportTo] = useState(formatDateInput(now));
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // ── Fetch Print Preview ──
  const fetchPrintPreview = useCallback(async () => {
    if (!selectedBranch || !startInvoice.trim() || !endInvoice.trim()) {
      setPrintPreview(null);
      return;
    }
    setIsPrintLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        startInvoice: startInvoice.trim(),
        endInvoice: endInvoice.trim(),
      });
      const res = await fetch(`/api/billing/bulk-print?${params}`);
      const data = await res.json();
      if (res.ok) setPrintPreview(data);
      else setPrintPreview(null);
    } catch {
      setPrintPreview(null);
    } finally {
      setIsPrintLoading(false);
    }
  }, [selectedBranch, startInvoice, endInvoice]);

  // Debounce print preview
  useEffect(() => {
    const t = setTimeout(() => fetchPrintPreview(), 500);
    return () => clearTimeout(t);
  }, [fetchPrintPreview]);

  // ── Fetch Export Preview ──
  const fetchExportPreview = useCallback(async () => {
    if (!selectedBranch || !exportFrom || !exportTo) {
      setExportPreview(null);
      return;
    }
    setIsExportLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        dateFrom: new Date(exportFrom).toISOString(),
        dateTo: new Date(exportTo).toISOString(),
        format: "json",
      });
      const res = await fetch(`/api/billing/export?${params}`);
      const data = await res.json();
      if (res.ok) {
        setExportPreview({
          count: data.count,
          totalValue: data.totalValue,
          totalGst: data.totalGst,
        });
      } else {
        setExportPreview(null);
      }
    } catch {
      setExportPreview(null);
    } finally {
      setIsExportLoading(false);
    }
  }, [selectedBranch, exportFrom, exportTo]);

  useEffect(() => {
    const t = setTimeout(() => fetchExportPreview(), 500);
    return () => clearTimeout(t);
  }, [fetchExportPreview]);

  // ── Actions ──
  const handleBulkPrint = async () => {
    if (!printPreview || printPreview.count === 0) return;
    setIsPrinting(true);
    // Open each invoice in a new window for sequential printing
    for (const inv of printPreview.invoices) {
      window.open(`/billing/invoice/${inv.id}`, "_blank");
    }
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleExportExcel = async () => {
    if (!selectedBranch) return;
    setIsExporting(true);
    setExportSuccess(null);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        dateFrom: new Date(exportFrom).toISOString(),
        dateTo: new Date(exportTo).toISOString(),
        format: "excel",
      });
      const res = await fetch(`/api/billing/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Report_${exportFrom}_to_${exportTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess("excel");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllPDFs = async () => {
    if (!printPreview && !exportPreview) return;
    setIsExporting(true);
    // Fetch invoices for the date range and open them all
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch!.id.toString(),
        dateFrom: new Date(exportFrom).toISOString(),
        dateTo: new Date(exportTo).toISOString(),
        format: "json",
      });
      const res = await fetch(`/api/billing/export?${params}`);
      const data = await res.json();
      if (res.ok && data.invoices) {
        for (const inv of data.invoices) {
          window.open(`/billing/invoice/${inv.id}`, "_blank");
        }
      }
      setExportSuccess("pdf");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D4A843]/10 border border-[#D4A843]/20 mb-4">
          <FileText className="w-7 h-7 text-[#D4A843]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Bulk Operations</h2>
        <p className="text-sm text-[#666] mt-1.5 max-w-md mx-auto">
          Process multiple invoices securely. Generate combined PDFs or export
          detailed ledger data for accounting.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Print Range Card ── */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 hover:border-[#333] transition-all duration-300">
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#D4A843]/10 flex items-center justify-center">
              <Printer className="w-5 h-5 text-[#D4A843]" />
            </div>
            <h3 className="text-lg font-semibold text-white">Print Range</h3>
          </div>

          {/* Invoice Number Inputs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Start Invoice No.
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type="text"
                  value={startInvoice}
                  onChange={(e) => setStartInvoice(e.target.value)}
                  placeholder="INV-000001"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D4A843]/50 focus:ring-1 focus:ring-[#D4A843]/20 transition-all font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                End Invoice No.
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type="text"
                  value={endInvoice}
                  onChange={(e) => setEndInvoice(e.target.value)}
                  placeholder="INV-000099"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D4A843]/50 focus:ring-1 focus:ring-[#D4A843]/20 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Preview Result */}
          <div className="rounded-lg bg-[#0d0d0d] border border-[#1e1e1e] px-4 py-3 mb-5 flex items-center justify-between">
            <span className="text-sm text-[#888]">Selected range:</span>
            {isPrintLoading ? (
              <Loader2 className="w-4 h-4 text-[#D4A843] animate-spin" />
            ) : printPreview ? (
              <span className="text-sm font-bold text-[#D4A843] tabular-nums">
                {printPreview.count} Invoice{printPreview.count !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-sm text-[#555]">—</span>
            )}
          </div>

          {/* Print Button */}
          <button
            onClick={handleBulkPrint}
            disabled={!printPreview || printPreview.count === 0 || isPrinting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#D4A843] text-black text-sm font-bold hover:bg-[#e6be5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Print Combined PDF
          </button>
        </div>

        {/* ── Export Range Card ── */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 hover:border-[#333] transition-all duration-300">
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#D4A843]/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-[#D4A843]" />
            </div>
            <h3 className="text-lg font-semibold text-white">Export Range</h3>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Date From
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white focus:outline-none focus:border-[#D4A843]/50 focus:ring-1 focus:ring-[#D4A843]/20 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Date To
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white focus:outline-none focus:border-[#D4A843]/50 focus:ring-1 focus:ring-[#D4A843]/20 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Preview Result */}
          <div className="rounded-lg bg-[#0d0d0d] border border-[#1e1e1e] px-4 py-3 mb-5 flex items-center justify-between">
            <span className="text-sm text-[#888]">Total Value:</span>
            {isExportLoading ? (
              <Loader2 className="w-4 h-4 text-[#D4A843] animate-spin" />
            ) : exportPreview ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#666]">
                  {exportPreview.count} invoices
                </span>
                <span className="text-sm font-bold text-[#D4A843] tabular-nums">
                  {formatCurrency(exportPreview.totalValue)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[#555]">—</span>
            )}
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportAllPDFs}
              disabled={!exportPreview || exportPreview.count === 0 || isExporting}
              className="flex items-center justify-center gap-2 py-3 rounded-lg border border-[#D4A843]/30 bg-[#D4A843]/10 text-[#D4A843] text-sm font-bold hover:bg-[#D4A843]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {isExporting && exportSuccess !== "excel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : exportSuccess === "pdf" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export All PDFs
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!exportPreview || exportPreview.count === 0 || isExporting}
              className="flex items-center justify-center gap-2 py-3 rounded-lg border border-[#D4A843]/30 bg-[#D4A843]/10 text-[#D4A843] text-sm font-bold hover:bg-[#D4A843]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {isExporting && exportSuccess !== "pdf" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : exportSuccess === "excel" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#444] pt-2">
        <Shield className="w-3.5 h-3.5" />
        <span>Encryption active for all exports</span>
      </div>

      {/* Recent Exports / Print Preview Table */}
      {printPreview && printPreview.count > 0 && (
        <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4A843]" />
            Print Preview — {printPreview.count} Invoices
          </h3>
          <div className="overflow-hidden rounded-lg border border-[#1e1e1e]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111] border-b border-[#222]">
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Invoice No.
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {printPreview.invoices.slice(0, 10).map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[#ccc] font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {inv.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#888]">
                      {new Date(inv.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#D4A843] tabular-nums text-right">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                  </tr>
                ))}
                {printPreview.count > 10 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-center text-xs text-[#555]"
                    >
                      … and {printPreview.count - 10} more invoices
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-xs text-[#666]">
              Total: {printPreview.count} invoices
            </span>
            <span className="text-sm font-bold text-[#D4A843] tabular-nums">
              {formatCurrency(printPreview.totalValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
