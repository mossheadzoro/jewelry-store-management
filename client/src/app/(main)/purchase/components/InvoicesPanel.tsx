// client/src/app/(main)/purchase/components/InvoicesPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconFileText,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconReceiptTax,
  IconX,
  IconCheck,
  IconTrash,
  IconBuildingStore,
} from "@tabler/icons-react";

interface InvoicesPanelProps {
  onRefreshOverview: () => void;
}

export default function InvoicesPanel({ onRefreshOverview }: InvoicesPanelProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);

  // New Invoice Form State
  const [formData, setFormData] = useState({
    supplierId: "",
    bookingId: "",
    supplierInvoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    placeOfSupply: "West Bengal (19)",
    isReverseCharge: false,
    isInterState: false,
    notes: "",
    items: [
      {
        hsnCode: "7108",
        description: "Gold 24K Bullion Bar (995.0)",
        metalCategory: "GOLD_24K",
        purityPercent: 99.50,
        grossWeight: 100,
        netWeight: 100,
        ratePerGram: 7250,
      },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (paymentFilter !== "ALL") params.set("paymentStatus", paymentFilter);

      const [resInvoices, resSuppliers, resBookings] = await Promise.all([
        fetch(`/api/purchase/invoices?${params.toString()}`),
        fetch(`/api/purchase/suppliers?isActive=true`),
        fetch(`/api/purchase/bookings?status=ACTIVE`),
      ]);

      if (resInvoices.ok) {
        const json = await resInvoices.json();
        if (json.success) setInvoices(json.invoices || []);
      }
      if (resSuppliers.ok) {
        const json = await resSuppliers.json();
        if (json.success) setSuppliers(json.data || []);
      }
      if (resBookings.ok) {
        const json = await resBookings.json();
        if (json.success) setBookings(json.bookings || []);
      }
    } catch (err) {
      console.error("Fetch purchase invoices error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSelect = (bkId: string) => {
    const bk = bookings.find((b) => b.id === bkId);
    if (bk) {
      const isWithGst = bk.notes?.includes("WITH GST") || (bk.rateSnapshots?.[0]?.metadata as any)?.gstCondition === "WITH_GST";
      const ratePerGram = isWithGst && bk.effectiveRate ? bk.effectiveRate : bk.bookingRate;
      setFormData({
        ...formData,
        bookingId: bk.id,
        supplierId: bk.supplierId,
        supplierInvoiceNumber: `INV-${bk.bookingNumber}`,
        notes: `From Booking ${bk.bookingNumber}`,
        items: [
          {
            hsnCode: bk.metalCategory.startsWith("GOLD") ? "7108" : "7106",
            description: `${bk.metalCategory.replace("_", " ")} Raw Bullion Bar (${bk.bookingNumber})`,
            metalCategory: bk.metalCategory,
            purityPercent: bk.purityPercent,
            grossWeight: bk.grossWeight,
            netWeight: bk.grossWeight,
            ratePerGram,
          },
        ],
      });
    } else {
      setFormData({ ...formData, bookingId: "" });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, paymentFilter]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          hsnCode: "7108",
          description: "Gold 24K Bullion Bar (995.0)",
          metalCategory: "GOLD_24K",
          purityPercent: 99.50,
          grossWeight: 100,
          netWeight: 100,
          ratePerGram: 7250,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  // Computations
  const totalTaxable = formData.items.reduce((sum, item) => sum + item.grossWeight * item.ratePerGram, 0);
  const totalGst = Number((totalTaxable * 0.03).toFixed(2));
  const invoiceTotal = Math.round(totalTaxable + totalGst);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setErrorMsg("Please select a bullion supplier.");
      return;
    }
    if (!formData.supplierInvoiceNumber) {
      setErrorMsg("Supplier Invoice Number is required.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create invoice");
      }

      setIsAddInvoiceModalOpen(false);
      await fetchInvoices();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number, supplier, GSTIN..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={fetchInvoices}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold transition-colors"
          >
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>

          <button
            onClick={() => setIsAddInvoiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconPlus className="w-4 h-4" />
            <span>Record Purchase Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice No / Date</th>
                <th className="py-3.5 px-4">Supplier Invoice Ref</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Weight (Gross / Fine)</th>
                <th className="py-3.5 px-4">Taxable Value</th>
                <th className="py-3.5 px-4">GST Tax</th>
                <th className="py-3.5 px-4">Invoice Total</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">ITC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-platinum-muted">
                    Loading purchase invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconFileText className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No purchase invoices found.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">{inv.invoiceNumber}</div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-gold font-semibold">{inv.supplierInvoiceNumber}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{inv.supplier?.businessName}</div>
                      <span className="text-[10px] text-platinum-muted font-mono">{inv.supplier?.gstin || "Unregistered"}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum">{inv.totalGrossWeight.toFixed(3)}g</div>
                      <span className="text-[10px] text-platinum-muted">
                        Fine: {inv.totalFineWeight.toFixed(3)}g
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum">
                      ₹{inv.taxableValue.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-platinum">
                        ₹{(inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-platinum-muted">
                        {inv.isInterState ? `IGST ₹${inv.igstAmount}` : `CGST+SGST ₹${inv.cgstAmount * 2}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gold">
                      ₹{inv.invoiceTotal.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        inv.paymentStatus === "PAID" ? "bg-emerald-500/15 text-emerald-300" :
                        inv.paymentStatus === "PARTIALLY_PAID" ? "bg-amber-500/15 text-amber-300" :
                        "bg-rose-500/15 text-rose-300"
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-onyx-elevated border border-onyx-border text-platinum-muted">
                        {inv.itcStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Invoice Modal */}
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconFileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Record Purchase Invoice</h2>
                  <p className="text-[11px] text-platinum-muted">GST Input Tax Credit & Supplier Payable Booking</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddInvoiceModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* Master Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {bookings.length > 0 && (
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      Import from Bullion Booking (Optional)
                    </label>
                    <select
                      value={formData.bookingId || ""}
                      onChange={(e) => handleBookingSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-gold/40 text-gold font-medium outline-none focus:border-gold"
                    >
                      <option value="">-- Manual Invoice / Direct Purchase --</option>
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bookingNumber} - {b.supplier?.businessName} ({b.grossWeight}g {b.metalCategory}) • ₹{b.totalAmount.toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-platinum-muted mt-1">
                      Selecting a booking pre-fills items, locked rates, and applies already disbursed advance payments.
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Bullion Supplier *
                  </label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="">-- Select Bullion Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} ({s.code}) - {s.gstin || "Unregistered"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Supplier Invoice No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplierInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, supplierInvoiceNumber: e.target.value })}
                    placeholder="e.g. INV-2026-9812"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={formData.placeOfSupply}
                    onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-platinum">
                    <input
                      type="checkbox"
                      checked={formData.isInterState}
                      onChange={(e) => setFormData({ ...formData, isInterState: e.target.checked })}
                      className="rounded border-onyx-border accent-gold"
                    />
                    <span>Inter-State (3% IGST)</span>
                  </label>
                </div>
              </div>

              {/* Invoice Line Items */}
              <div className="space-y-3 pt-3 border-t border-onyx-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-platinum uppercase tracking-wider">
                    Purchased Bullion / Metal Items
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-gold hover:underline font-semibold"
                  >
                    + Add Item Line
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-onyx-elevated border border-onyx-border space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-platinum-muted block mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].description = e.target.value;
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-onyx border border-onyx-border text-platinum outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-platinum-muted block mb-1">Metal Category</label>
                          <select
                            value={item.metalCategory}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].metalCategory = e.target.value as any;
                              if (e.target.value === "GOLD_24K") updated[idx].purityPercent = 99.50;
                              if (e.target.value === "GOLD_22K") updated[idx].purityPercent = 91.60;
                              if (e.target.value === "SILVER_999") updated[idx].purityPercent = 99.90;
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-onyx border border-onyx-border text-platinum outline-none focus:border-gold"
                          >
                            <option value="GOLD_24K">Gold 24K (99.50% Standard Bullion)</option>
                            <option value="GOLD_22K">Gold 22K (91.6%)</option>
                            <option value="GOLD_18K">Gold 18K (75.0%)</option>
                            <option value="SILVER_999">Silver 999 Fine</option>
                          </select>
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <label className="text-[10px] text-platinum-muted block mb-1">HSN Code</label>
                            <input
                              type="text"
                              value={item.hsnCode}
                              onChange={(e) => {
                                const updated = [...formData.items];
                                updated[idx].hsnCode = e.target.value;
                                setFormData({ ...formData, items: updated });
                              }}
                              className="w-full px-2.5 py-1.5 rounded bg-onyx border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                            />
                          </div>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-2 ml-2 rounded text-rose-400 hover:bg-rose-500/15"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] text-platinum-muted block mb-1">Gross Weight (g)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.grossWeight}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].grossWeight = Number(e.target.value);
                              updated[idx].netWeight = Number(e.target.value);
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-onyx border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-platinum-muted block mb-1">Purity (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.purityPercent}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].purityPercent = Number(e.target.value);
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-onyx border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-platinum-muted block mb-1">Rate (₹ / g)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.ratePerGram}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].ratePerGram = Number(e.target.value);
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-onyx border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-platinum-muted block mb-1">Taxable Subtotal</label>
                          <div className="px-2.5 py-1.5 rounded bg-onyx/60 border border-onyx-border text-platinum font-mono font-bold">
                            ₹{(item.grossWeight * item.ratePerGram).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-4 rounded-xl bg-onyx-elevated border border-gold/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-platinum">
                  <span>Total Taxable Value:</span>
                  <span className="font-mono font-bold">₹{totalTaxable.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-platinum">
                  <span>
                    Total GST Tax (3% {formData.isInterState ? "IGST" : "CGST 1.5% + SGST 1.5%"}):
                  </span>
                  <span className="font-mono font-bold">₹{totalGst.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-onyx-border flex items-center justify-between text-sm font-bold text-gold">
                  <span>Final Invoice Total (Rounded):</span>
                  <span className="text-base font-mono">₹{invoiceTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post Purchase Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
