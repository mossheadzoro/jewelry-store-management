// client/src/app/(main)/purchase/components/ReconciliationPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconRefresh,
  IconScale,
  IconWallet,
  IconReceiptTax,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";

export default function ReconciliationPanel() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase/reconciliation");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch (err) {
      console.error("Fetch reconciliation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div>
          <h2 className="text-sm font-bold text-platinum">Three-Way Purchase & Bullion Reconciliation</h2>
          <p className="text-xs text-platinum-muted">
            Continuous Cross-Verification: Metal Intake vs Financial Ledger vs GSTR-2B Input Tax
          </p>
        </div>
        <button
          onClick={fetchReconciliation}
          className="p-2 rounded-xl bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum"
        >
          <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-gold" : ""}`} />
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Metal Intake Variance Card */}
          <div className="p-5 rounded-2xl bg-onyx-surface border border-onyx-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-300">
                  <IconScale className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-platinum">Metal Reconciliation</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                data.metalReconciliation?.reconciliationStatus === "BALANCED"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}>
                {data.metalReconciliation?.reconciliationStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-onyx-border/60">
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Total Booked Gross Weight:</span>
                <span className="font-mono font-bold text-platinum">{data.metalReconciliation?.totalBookedGross}g</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Actual Physically Intaken:</span>
                <span className="font-mono font-bold text-emerald-400">{data.metalReconciliation?.totalReceivedGross}g</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Pending Delivery:</span>
                <span className="font-mono font-bold text-amber-400">{data.metalReconciliation?.totalPendingGross}g</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Net Weight Scale Variance:</span>
                <span className={`font-mono font-bold ${
                  data.metalReconciliation?.totalWeightVariance === 0 ? "text-platinum-muted" : "text-amber-400"
                }`}>
                  {data.metalReconciliation?.totalWeightVariance > 0
                    ? `+${data.metalReconciliation?.totalWeightVariance}g`
                    : `${data.metalReconciliation?.totalWeightVariance}g`}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Financial & Liquidity Reconciliation */}
          <div className="p-5 rounded-2xl bg-onyx-surface border border-onyx-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300">
                  <IconWallet className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-platinum">Financial Solvency</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                data.financialReconciliation?.reconciliationStatus === "SOLVENT"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-rose-500/15 text-rose-300"
              }`}>
                {data.financialReconciliation?.reconciliationStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-onyx-border/60">
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Total Invoiced Procurement:</span>
                <span className="font-mono font-bold text-platinum">₹{data.financialReconciliation?.totalInvoiced.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Total Payments Disbursed:</span>
                <span className="font-mono font-bold text-emerald-400">₹{data.financialReconciliation?.totalPaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Outstanding Supplier Liabilities:</span>
                <span className="font-mono font-bold text-rose-400">₹{data.financialReconciliation?.totalUnpaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Net Cash Left to Book:</span>
                <span className="font-mono font-bold text-gold">₹{data.financialReconciliation?.netCashLeftToBook.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* 3. GST ITC Reconciliation */}
          <div className="p-5 rounded-2xl bg-onyx-surface border border-onyx-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/15 text-blue-300">
                  <IconReceiptTax className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-platinum">GST 2B Audit</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                data.gstReconciliation?.reconciliationStatus === "RECONCILED"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}>
                {data.gstReconciliation?.reconciliationStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-onyx-border/60">
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Gross Taxable Purchases:</span>
                <span className="font-mono font-bold text-platinum">₹{data.gstReconciliation?.totalTaxableValue.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Eligible Input Tax Credit:</span>
                <span className="font-mono font-bold text-emerald-400">₹{data.gstReconciliation?.eligibleItc.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">GSTR-2B Matched Invoices:</span>
                <span className="font-mono font-bold text-platinum">{data.gstReconciliation?.matchedCount}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-platinum-muted">Pending Match / Discrepancy:</span>
                <span className="font-mono font-bold text-amber-400">{data.gstReconciliation?.unreconciledCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
