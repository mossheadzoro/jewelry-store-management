// client/src/app/(main)/purchase/components/ReportsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconTrendingUp,
  IconPrinter,
  IconDownload,
  IconRefresh,
  IconFileText,
  IconCoins,
  IconCash,
} from "@tabler/icons-react";

export default function ReportsPanel() {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reportType, setReportType] = useState("PROCUREMENT_SUMMARY");

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ reportType });
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/purchase/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setReportData(json.data);
      }
    } catch (err) {
      console.error("Fetch purchase report error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] uppercase font-bold text-platinum-muted block mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
            >
              <option value="PROCUREMENT_SUMMARY">Procurement & Bullion Summary</option>
              <option value="MONTHLY_GST">Monthly Purchase GST Audit</option>
              <option value="KARIGAR_METALS">Karigar Metal Issue Statement</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-platinum-muted block mb-1">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-platinum-muted block mb-1">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
            />
          </div>

          <button
            onClick={fetchReport}
            className="mt-4 px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold"
          >
            Generate
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
        >
          <IconPrinter className="w-4 h-4" />
          <span>Print Executive Statement</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
            <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Total Purchases</span>
            <div className="text-lg font-bold text-platinum">
              ₹{reportData.summary.totalPurchasedValue.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-platinum-muted">{reportData.summary.totalInvoicesCount} invoices</span>
          </div>

          <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
            <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Total Bullion Weight</span>
            <div className="text-lg font-bold text-gold">
              {reportData.summary.totalGrossWeight}g
            </div>
            <span className="text-[10px] text-platinum-muted">Pure Fine: {reportData.summary.totalFineWeight}g</span>
          </div>

          <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
            <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Total GST Input Tax</span>
            <div className="text-lg font-bold text-blue-400">
              ₹{reportData.summary.totalTaxPaid.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
            <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Supplier Disbursements</span>
            <div className="text-lg font-bold text-emerald-400">
              ₹{reportData.summary.totalPaymentsDisbursed.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* Invoices Breakdown Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
          <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
            Procurement Statement Invoices Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/80 border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice No / Date</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Weight (Gross / Fine)</th>
                <th className="py-3.5 px-4">Taxable (₹)</th>
                <th className="py-3.5 px-4">GST (₹)</th>
                <th className="py-3.5 px-4">Invoice Total (₹)</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-platinum-muted">
                    Loading report...
                  </td>
                </tr>
              ) : !reportData?.invoices || reportData.invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-platinum-muted">
                    No procurement records for this period.
                  </td>
                </tr>
              ) : (
                reportData.invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-platinum">
                      {inv.invoiceNumber}
                      <span className="block text-[10px] text-platinum-muted font-normal">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-platinum">{inv.supplier?.businessName}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-platinum">
                      {inv.totalGrossWeight.toFixed(3)}g ({inv.totalFineWeight.toFixed(3)}g pure)
                    </td>
                    <td className="py-3.5 px-4 font-mono">₹{inv.taxableValue.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-mono text-platinum-muted">
                      ₹{(inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gold">₹{inv.invoiceTotal.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        inv.paymentStatus === "PAID" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
