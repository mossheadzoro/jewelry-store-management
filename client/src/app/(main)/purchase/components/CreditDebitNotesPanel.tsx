// client/src/app/(main)/purchase/components/CreditDebitNotesPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconFileCheck,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconX,
  IconCheck,
  IconReceiptTax,
} from "@tabler/icons-react";

interface CreditDebitNotesPanelProps {
  onRefreshOverview: () => void;
}

export default function CreditDebitNotesPanel({ onRefreshOverview }: CreditDebitNotesPanelProps) {
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    noteType: "CREDIT",
    supplierId: "",
    purchaseInvoiceId: "",
    originalInvoiceNumber: "",
    originalInvoiceDate: new Date().toISOString().split("T")[0],
    taxableValue: 10000,
    cgstAmount: 150,
    sgstAmount: 150,
    igstAmount: 0,
    reason: "Rate difference adjustment",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const [resNotes, resSuppliers, resInvoices] = await Promise.all([
        fetch(`/api/purchase/credit-debit-notes?type=ALL`),
        fetch(`/api/purchase/suppliers?isActive=true`),
        fetch(`/api/purchase/invoices`),
      ]);

      if (resNotes.ok) {
        const json = await resNotes.json();
        if (json.success) {
          setCreditNotes(json.data.creditNotes || []);
          setDebitNotes(json.data.debitNotes || []);
        }
      }
      if (resSuppliers.ok) {
        const json = await resSuppliers.json();
        if (json.success) setSuppliers(json.data || []);
      }
      if (resInvoices.ok) {
        const json = await resInvoices.json();
        if (json.success) setInvoices(json.invoices || []);
      }
    } catch (err) {
      console.error("Fetch credit/debit notes error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (invId: string) => {
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setFormData((prev) => ({
        ...prev,
        purchaseInvoiceId: inv.id,
        supplierId: inv.supplierId,
        originalInvoiceNumber: inv.invoiceNumber,
        originalInvoiceDate: new Date(inv.invoiceDate).toISOString().split("T")[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        purchaseInvoiceId: "",
      }));
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setErrorMsg("Please select a bullion supplier.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/credit-debit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create adjustment note");
      }

      setIsAddNoteModalOpen(false);
      await fetchNotes();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("CREDIT")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "CREDIT"
                ? "bg-gold text-onyx shadow-md shadow-gold/20"
                : "bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum"
            }`}
          >
            Supplier Credit Notes ({creditNotes.length})
          </button>
          <button
            onClick={() => setActiveSubTab("DEBIT")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "DEBIT"
                ? "bg-gold text-onyx shadow-md shadow-gold/20"
                : "bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum"
            }`}
          >
            Supplier Debit Notes ({debitNotes.length})
          </button>
        </div>

        <button
          onClick={() => {
            setFormData({ ...formData, noteType: activeSubTab });
            setIsAddNoteModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
        >
          <IconPlus className="w-4 h-4" />
          <span>Issue {activeSubTab === "CREDIT" ? "Credit Note" : "Debit Note"}</span>
        </button>
      </div>

      {/* Notes Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Note Ref / Date</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Original Invoice</th>
                <th className="py-3.5 px-4">Taxable Adjustment</th>
                <th className="py-3.5 px-4">GST Impact</th>
                <th className="py-3.5 px-4">Total Amount (₹)</th>
                <th className="py-3.5 px-4">Reason / Particulars</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    Loading notes...
                  </td>
                </tr>
              ) : (activeSubTab === "CREDIT" ? creditNotes : debitNotes).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconFileCheck className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No {activeSubTab.toLowerCase()} notes found.</p>
                  </td>
                </tr>
              ) : (
                (activeSubTab === "CREDIT" ? creditNotes : debitNotes).map((n) => (
                  <tr key={n.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">
                        {n.creditNoteNumber || n.debitNoteNumber}
                      </div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(n.issueDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-platinum">
                      {n.supplier?.businessName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum">
                      {n.originalInvoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum">
                      ₹{n.taxableValue.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum">
                      ₹{(n.cgstAmount + n.sgstAmount + n.igstAmount).toLocaleString("en-IN")}
                      <span className="text-[10px] text-platinum-muted block">
                        {activeSubTab === "CREDIT" ? "ITC Reversal" : "Additional ITC"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gold">
                      ₹{n.totalAmount.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-platinum-muted max-w-xs truncate">
                      {n.reason}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/15 text-emerald-300">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <h2 className="text-sm font-bold text-platinum">
                Issue {formData.noteType === "CREDIT" ? "Credit Note" : "Debit Note"}
              </h2>
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Bullion Supplier *
                </label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value, purchaseInvoiceId: "" })}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Link to Purchase Invoice (Recommended)
                </label>
                <select
                  value={formData.purchaseInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-gold/40 text-gold font-medium outline-none focus:border-gold"
                >
                  <option value="">-- Choose Purchase Invoice (or enter manual ref below) --</option>
                  {(formData.supplierId
                    ? invoices.filter((i) => i.supplierId === formData.supplierId)
                    : invoices
                  ).map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.supplier?.businessName} ({inv.totalGrossWeight}g - ₹{inv.invoiceTotal.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Invoice Number Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.originalInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, originalInvoiceNumber: e.target.value })}
                    placeholder="e.g. PUR-2026-000001"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Original Invoice Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.originalInvoiceDate}
                    onChange={(e) => setFormData({ ...formData, originalInvoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Taxable Adjustment (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.taxableValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({
                        ...formData,
                        taxableValue: val,
                        cgstAmount: Number((val * 0.015).toFixed(2)),
                        sgstAmount: Number((val * 0.015).toFixed(2)),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    GST Tax (3%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    readOnly
                    value={Number((formData.cgstAmount + formData.sgstAmount + formData.igstAmount).toFixed(2))}
                    className="w-full px-3 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Rate revision post settlement"
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                />
              </div>

              <div className="pt-3 border-t border-onyx-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Issuing..." : "Issue Adjustment Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
