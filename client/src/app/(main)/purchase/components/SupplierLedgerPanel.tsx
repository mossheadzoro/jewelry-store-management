// client/src/app/(main)/purchase/components/SupplierLedgerPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconReportMoney,
  IconSearch,
  IconRefresh,
  IconPrinter,
  IconDownload,
  IconBuildingStore,
  IconCalendar,
} from "@tabler/icons-react";

export default function SupplierLedgerPanel() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/purchase/suppliers?isActive=true");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setSuppliers(json.data);
          if (!selectedSupplierId) {
            setSelectedSupplierId(json.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Fetch suppliers for ledger error:", err);
    }
  };

  const fetchLedger = async () => {
    if (!selectedSupplierId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/purchase/suppliers/${selectedSupplierId}/ledger?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setLedgerData(json.data);
      }
    } catch (err) {
      console.error("Fetch supplier ledger error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchLedger();
    }
  }, [selectedSupplierId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!ledgerData?.entries) return;
    const headers = ["Date", "Document No", "Type", "Description", "Debit (₹)", "Credit (₹)", "Balance (₹)"];
    const rows = ledgerData.entries.map((e: any) => [
      new Date(e.transactionDate).toLocaleDateString("en-IN"),
      e.documentNumber || "",
      e.entryType,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.balance,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Supplier_Ledger_${ledgerData.supplier.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Supplier & Date Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="w-full max-w-xs">
            <label className="text-[10px] uppercase font-bold text-platinum-muted block mb-1">
              Select Bullion Supplier
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.businessName} ({s.code}) - {s.currentPayable < 0 ? `₹${Math.abs(s.currentPayable).toLocaleString("en-IN")} Dr (Advance)` : s.currentPayable > 0 ? `₹${s.currentPayable.toLocaleString("en-IN")} Cr (Payable)` : "Settled (₹0)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={fetchLedger}
              className="mt-4 px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold transition-colors"
          >
            <IconDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconPrinter className="w-4 h-4" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Ledger Summary Cards */}
      {ledgerData && (() => {
        const closingBal = ledgerData.summary?.currentPayable ?? 0;
        const isAdvance = closingBal < 0;
        const isDue = closingBal > 0;
        const absBal = Math.abs(closingBal);

        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
              <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Opening Balance</span>
              <div className="text-lg font-bold text-platinum font-mono">
                ₹{ledgerData.summary?.openingBalance?.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
              <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Total Debits (Disbursed Outflows)</span>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                ₹{ledgerData.summary?.totalDebit?.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-1">
              <span className="text-[10px] uppercase font-semibold text-platinum-muted block">Total Credits (Billed Invoices)</span>
              <div className="text-lg font-bold text-blue-400 font-mono">
                ₹{ledgerData.summary?.totalCredit?.toLocaleString("en-IN")}
              </div>
            </div>

            <div className={`p-4 rounded-2xl bg-onyx-surface border space-y-1 transition-all ${
              isAdvance ? "border-emerald-500/40 bg-emerald-500/5" : isDue ? "border-rose-500/40 bg-rose-500/5" : "border-onyx-border"
            }`}>
              <span className={`text-[10px] uppercase font-semibold block ${isAdvance ? "text-emerald-400" : isDue ? "text-rose-400" : "text-gold"}`}>
                {isAdvance ? "Advance Paid with Supplier (Dr)" : isDue ? "Current Closing Payable (Cr)" : "Closing Balance"}
              </span>
              <div className={`text-lg font-bold font-mono flex items-baseline gap-1.5 ${
                isAdvance ? "text-emerald-400" : isDue ? "text-rose-400" : "text-platinum"
              }`}>
                <span>₹{absBal.toLocaleString("en-IN")}</span>
                <span className="text-xs font-semibold uppercase">
                  {isAdvance ? "Dr (Adv)" : isDue ? "Cr (Due)" : "Settled"}
                </span>
              </div>
              {isAdvance && (
                <span className="text-[10px] text-emerald-300/80 block leading-tight">
                  Advance paid upfront; clears to ₹0 upon metal intake/invoice
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Chronological Running Ledger Statement */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-onyx-border flex items-center justify-between bg-onyx-elevated">
          <div className="flex items-center gap-2">
            <IconReportMoney className="w-5 h-5 text-gold" />
            <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
              Chronological Double-Entry Statement
            </h3>
          </div>
          {ledgerData?.supplier && (
            <span className="text-xs text-platinum-muted font-medium">
              {ledgerData.supplier.businessName} • GSTIN: {ledgerData.supplier.gstin || "Unregistered"}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/80 border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Document Ref</th>
                <th className="py-3.5 px-4">Entry Type</th>
                <th className="py-3.5 px-4">Description / Particulars</th>
                <th className="py-3.5 px-4 text-right">Debit Outflow (₹)</th>
                <th className="py-3.5 px-4 text-right">Credit Liability (₹)</th>
                <th className="py-3.5 px-4 text-right">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-platinum-muted">
                    Generating ledger statement...
                  </td>
                </tr>
              ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-platinum-muted">
                    No transactions recorded for this supplier.
                  </td>
                </tr>
              ) : (
                ledgerData.entries.map((e: any) => (
                  <tr key={e.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-platinum-muted whitespace-nowrap">
                      {new Date(e.transactionDate).toLocaleDateString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gold">
                      {e.documentNumber || "-"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        e.entryType === "PURCHASE_INVOICE" ? "bg-blue-500/15 text-blue-300" :
                        e.entryType === "PAYMENT" ? "bg-emerald-500/15 text-emerald-300" :
                        e.entryType === "CREDIT_NOTE" ? "bg-amber-500/15 text-amber-300" :
                        "bg-onyx-elevated text-platinum-muted"
                      }`}>
                        {e.entryType.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-platinum">
                      {e.description}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-right font-semibold text-emerald-400">
                      {e.debit > 0 ? `₹${e.debit.toLocaleString("en-IN")}` : "-"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-right font-semibold text-blue-400">
                      {e.credit > 0 ? `₹${e.credit.toLocaleString("en-IN")}` : "-"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-right font-bold">
                      {e.balance < 0 ? (
                        <span className="text-emerald-400">₹{Math.abs(e.balance).toLocaleString("en-IN")} Dr</span>
                      ) : e.balance > 0 ? (
                        <span className="text-rose-400">₹{e.balance.toLocaleString("en-IN")} Cr</span>
                      ) : (
                        <span className="text-platinum-muted">₹0.00</span>
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
