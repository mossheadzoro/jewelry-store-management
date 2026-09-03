// client/src/app/(main)/purchase/components/ReturnsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconArrowsRightLeft,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconFileText,
} from "@tabler/icons-react";

interface ReturnsPanelProps {
  onRefreshOverview: () => void;
}

export default function ReturnsPanel({ onRefreshOverview }: ReturnsPanelProps) {
  const [returns, setReturns] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    purchaseInvoiceId: "",
    returnedGrossWeight: 10.0,
    reason: "Purity defect observed in spectrometer test",
    inspectionNotes: "",
    autoCreditNote: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const [resReturns, resInvoices] = await Promise.all([
        fetch(`/api/purchase/returns?${params.toString()}`),
        fetch(`/api/purchase/invoices`),
      ]);

      if (resReturns.ok) {
        const json = await resReturns.json();
        if (json.success) setReturns(json.data || []);
      }
      if (resInvoices.ok) {
        const json = await resInvoices.json();
        if (json.success) setInvoices(json.invoices || []);
      }
    } catch (err) {
      console.error("Fetch purchase returns error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purchaseInvoiceId) {
      setErrorMsg("Please select an original purchase invoice.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process return");
      }

      setIsAddReturnModalOpen(false);
      await fetchReturns();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search return number, supplier, reason..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
          />
        </div>

        <button
          onClick={() => setIsAddReturnModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
        >
          <IconPlus className="w-4 h-4" />
          <span>Create Purchase Return</span>
        </button>
      </div>

      {/* Returns Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Return No / Date</th>
                <th className="py-3.5 px-4">Original Invoice</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Returned Weight</th>
                <th className="py-3.5 px-4">Return Value (₹)</th>
                <th className="py-3.5 px-4">Credit Note Ref</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    Loading purchase returns...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconArrowsRightLeft className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No purchase returns recorded.</p>
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">{r.returnNumber}</div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(r.returnDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-platinum">
                      {r.invoice?.invoiceNumber || "-"}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-platinum">
                      {r.supplier?.businessName}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                      {r.returnedGrossWeight.toFixed(3)}g
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gold">
                      ₹{r.totalAmount.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-400">
                      {r.creditNote?.creditNoteNumber || "Auto-Created"}
                    </td>

                    <td className="py-3.5 px-4 text-platinum-muted max-w-xs truncate">
                      {r.reason}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/15 text-emerald-300">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Return Modal */}
      {isAddReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconArrowsRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Initiate Purchase Return</h2>
                  <p className="text-[11px] text-platinum-muted">Metal Outflow & Supplier Credit Note Generation</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddReturnModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Select Original Purchase Invoice *
                  </label>
                  <select
                    required
                    value={formData.purchaseInvoiceId}
                    onChange={(e) => setFormData({ ...formData, purchaseInvoiceId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="">-- Choose Purchase Invoice --</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} ({inv.supplier?.businessName}) - {inv.totalGrossWeight}g - ₹{inv.invoiceTotal.toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Gross Weight to Return (g) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.returnedGrossWeight}
                    onChange={(e) => setFormData({ ...formData, returnedGrossWeight: Number(e.target.value) })}
                    placeholder="10.000"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Return Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. Purity discrepancy or manufacturing surface defect"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Inspection / Testing Notes
                  </label>
                  <textarea
                    value={formData.inspectionNotes}
                    onChange={(e) => setFormData({ ...formData, inspectionNotes: e.target.value })}
                    placeholder="Laboratory assay remarks..."
                    className="w-full h-16 p-2.5 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoCreditCheck"
                    checked={formData.autoCreditNote}
                    onChange={(e) => setFormData({ ...formData, autoCreditNote: e.target.checked })}
                    className="rounded border-onyx-border accent-gold"
                  />
                  <label htmlFor="autoCreditCheck" className="text-xs text-platinum font-medium cursor-pointer">
                    Automatically generate Supplier Credit Note and adjust payable ledger
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsAddReturnModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
