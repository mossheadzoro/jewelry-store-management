// client/src/app/(main)/purchase/components/PurchaseGSTPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconReceiptTax,
  IconLock,
  IconLockOpen,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconBuildingStore,
  IconFileText,
} from "@tabler/icons-react";

interface PurchaseGSTPanelProps {
  onRefreshOverview: () => void;
}

export default function PurchaseGSTPanel({ onRefreshOverview }: PurchaseGSTPanelProps) {
  const [gstData, setGstData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [periodMonth, setPeriodMonth] = useState<number>(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState<number>(new Date().getFullYear());
  const [locking, setLocking] = useState(false);

  const fetchGST = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        financialYear,
        periodMonth: periodMonth.toString(),
        periodYear: periodYear.toString(),
      });

      const res = await fetch(`/api/purchase/gst?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setGstData(json.data);
      }
    } catch (err) {
      console.error("Fetch purchase GST summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGST();
  }, [financialYear, periodMonth]);

  const handleToggleLock = async () => {
    if (!gstData) return;
    const newStatus = gstData.periodStatus === "LOCKED" ? "DRAFT" : "LOCKED";
    try {
      setLocking(true);
      const res = await fetch("/api/purchase/gst/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialYear,
          periodMonth,
          periodYear,
          status: newStatus,
        }),
      });
      if (res.ok) {
        await fetchGST();
        onRefreshOverview();
      }
    } catch (err) {
      console.error("Set GST period lock error:", err);
    } finally {
      setLocking(false);
    }
  };

  const handleReconcile = async (recordId: string, status: string) => {
    try {
      const res = await fetch("/api/purchase/gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          reconciliationStatus: status,
        }),
      });
      if (res.ok) {
        await fetchGST();
        onRefreshOverview();
      }
    } catch (err) {
      console.error("Reconcile error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector & Lock Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] uppercase font-bold text-platinum-muted block mb-1">Financial Year</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
            >
              <option value="2026-2027">FY 2026 - 2027</option>
              <option value="2025-2026">FY 2025 - 2026</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-platinum-muted block mb-1">Return Month</label>
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Month {m} ({new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" })})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchGST}
            className="mt-4 p-2 rounded-xl bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-gold" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-platinum-muted uppercase block">Period Status</span>
            <span className={`text-xs font-bold uppercase ${
              gstData?.periodStatus === "LOCKED" ? "text-emerald-400" : "text-amber-400"
            }`}>
              {gstData?.periodStatus || "DRAFT"}
            </span>
          </div>

          <button
            onClick={handleToggleLock}
            disabled={locking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              gstData?.periodStatus === "LOCKED"
                ? "bg-onyx-elevated border border-onyx-border text-platinum hover:text-rose-300 hover:border-rose-400"
                : "bg-gold text-onyx hover:bg-gold/90 shadow-gold/20"
            }`}
          >
            {gstData?.periodStatus === "LOCKED" ? (
              <>
                <IconLock className="w-4 h-4 text-emerald-400" />
                <span>Unlock Period (Admin)</span>
              </>
            ) : (
              <>
                <IconLock className="w-4 h-4" />
                <span>Lock Monthly Period</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ITC Summary Cards */}
      {gstData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
            <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Gross Taxable Purchases</span>
            <div className="text-lg font-bold text-platinum">
              ₹{gstData.totalTaxableValue.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
            <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Gross Input Tax Paid</span>
            <div className="text-lg font-bold text-blue-400">
              ₹{gstData.totalTax.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-onyx-surface border border-emerald-500/30 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Eligible Input Tax Credit (ITC)</span>
            <div className="text-lg font-bold text-emerald-400">
              ₹{gstData.eligibleItc.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-onyx-surface border border-gold/40 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-gold block">GSTR-2B Matched Count</span>
            <div className="text-lg font-bold text-gold">
              {gstData.matchedCount} / {gstData.recordCount} records
            </div>
          </div>
        </div>
      )}

      {/* GST Records & GSTR-2B Reconciliation Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-onyx-border flex items-center justify-between bg-onyx-elevated">
          <div className="flex items-center gap-2">
            <IconReceiptTax className="w-5 h-5 text-gold" />
            <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
              Purchase GST Invoices & GSTR-2B Matching
            </h3>
          </div>
          <span className="text-xs text-platinum-muted font-medium">
            3% Standard Gold Rate (CGST 1.5% + SGST 1.5% or IGST 3%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/80 border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Supplier GSTIN / Name</th>
                <th className="py-3.5 px-4">Invoice Ref / Date</th>
                <th className="py-3.5 px-4">Taxable Value (₹)</th>
                <th className="py-3.5 px-4">CGST + SGST (₹)</th>
                <th className="py-3.5 px-4">IGST (₹)</th>
                <th className="py-3.5 px-4">Total Tax (₹)</th>
                <th className="py-3.5 px-4">GSTR-2B Status</th>
                <th className="py-3.5 px-4 text-right">Reconciliation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    Loading GST records...
                  </td>
                </tr>
              ) : !gstData?.records || gstData.records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    No GST purchase records for this period.
                  </td>
                </tr>
              ) : (
                gstData.records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{r.supplier?.businessName}</div>
                      <span className="text-[10px] text-gold font-mono">{r.gstin || "Unregistered"}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-platinum">
                        {r.invoice?.supplierInvoiceNumber || r.invoice?.invoiceNumber || "-"}
                      </div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      ₹{r.taxableValue.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum-muted">
                      ₹{(r.cgst + r.sgst).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum-muted">
                      ₹{r.igst.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      ₹{r.totalTax.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        r.reconciliationStatus === "MATCHED" ? "bg-emerald-500/15 text-emerald-300" :
                        r.reconciliationStatus === "MISMATCH" ? "bg-rose-500/15 text-rose-300" :
                        "bg-amber-500/15 text-amber-300"
                      }`}>
                        {r.reconciliationStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {r.reconciliationStatus !== "MATCHED" ? (
                        <button
                          onClick={() => handleReconcile(r.id, "MATCHED")}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-semibold text-[10px]"
                        >
                          Mark Matched
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">Matched 2B</span>
                      )}
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
