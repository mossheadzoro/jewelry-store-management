// client/src/app/(main)/purchase/components/ReceivingPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconScale,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconBuildingStore,
  IconCoins,
} from "@tabler/icons-react";

interface ReceivingPanelProps {
  onRefreshOverview: () => void;
}

export default function ReceivingPanel({ onRefreshOverview }: ReceivingPanelProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseBookingId: "",
    purchaseInvoiceId: "",
    supplierInvoiceNumber: "",
    metalCategory: "GOLD_24K",
    purityPercent: 99.50,
    expectedGrossWeight: 100.0,
    actualGrossWeight: 100.0,
    lotBatchNo: "",
    purityTestingResult: "99.52% via XRF Spectrometer",
    testCertificateNo: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [resReceipts, resSuppliers, resBookings] = await Promise.all([
        fetch(`/api/purchase/receiving?${params.toString()}`),
        fetch(`/api/purchase/suppliers?isActive=true`),
        fetch(`/api/purchase/bookings?status=ACTIVE`),
      ]);

      if (resReceipts.ok) {
        const json = await resReceipts.json();
        if (json.success) setReceipts(json.receipts || []);
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
      console.error("Fetch receipts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const weightDiff = Number((formData.actualGrossWeight - formData.expectedGrossWeight).toFixed(3));
  const isToleranceExceeded = Math.abs(weightDiff) > 0.050;

  const handleBookingSelect = (bookingId: string) => {
    const bk = bookings.find((b) => b.id === bookingId);
    if (bk) {
      setFormData({
        ...formData,
        purchaseBookingId: bk.id,
        supplierId: bk.supplierId,
        metalCategory: bk.metalCategory,
        purityPercent: bk.purityPercent,
        expectedGrossWeight: bk.pendingGrossWeight || bk.grossWeight,
        actualGrossWeight: bk.pendingGrossWeight || bk.grossWeight,
      });
    } else {
      setFormData({ ...formData, purchaseBookingId: "" });
    }
  };

  const handleRecordIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setErrorMsg("Please select a bullion supplier.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record metal receipt");
      }

      setIsRecordModalOpen(false);
      await fetchReceipts();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt number, lot number, supplier..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={fetchReceipts}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold transition-colors"
          >
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Receipt Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="VERIFIED">Verified</option>
            <option value="PARTIALLY_RECEIVED">Variance Flagged</option>
          </select>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconScale className="w-4 h-4" />
            <span>Digital Scale Intake</span>
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt GRN / Date</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Expected Weight</th>
                <th className="py-3.5 px-4">Actual Weighed</th>
                <th className="py-3.5 px-4">Variance / Difference</th>
                <th className="py-3.5 px-4">Purity & Lot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    Loading metal receipts...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconScale className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No physical metal receipts recorded.</p>
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">{r.receiptNumber}</div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(r.receiptDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{r.supplier?.businessName}</div>
                      <span className="text-[10px] text-gold font-mono">{r.supplier?.code}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum">
                      {r.expectedGrossWeight.toFixed(3)}g
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {r.actualGrossWeight.toFixed(3)}g
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-bold ${
                        r.weightDifference === 0 ? "text-platinum-muted" :
                        Math.abs(r.weightDifference) > 0.050 ? "text-amber-400" : "text-platinum"
                      }`}>
                        {r.weightDifference > 0 ? `+${r.weightDifference.toFixed(3)}g` : `${r.weightDifference.toFixed(3)}g`}
                      </span>
                      {r.isWeightDiscrepancy && (
                        <span className="text-[10px] text-amber-400 block font-semibold">Tolerance Exceeded</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-platinum font-semibold">{r.purityPercent}% ({r.metalCategory})</div>
                      <span className="text-[10px] text-platinum-muted font-mono">{r.lotBatchNo || "Standard"}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        r.status === "VERIFIED" || r.status === "RECEIVED"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-platinum-muted">
                      {r.receivedBy?.name || "Staff"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Scale Intake Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconScale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Physical Metal Receiving & Scale Intake</h2>
                  <p className="text-[11px] text-platinum-muted">Tolerance Verification & Automatic Inventory Intake</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordIntake} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Link to Purchase Booking (Optional)
                  </label>
                  <select
                    value={formData.purchaseBookingId}
                    onChange={(e) => handleBookingSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="">-- Direct Receipt / No Booking Link --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNumber} - {b.supplier?.businessName} ({b.grossWeight}g {b.metalCategory})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Supplier Bill / Invoice Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SB/2026/089 (Leave blank to auto-generate)"
                    value={formData.supplierInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, supplierInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum placeholder:text-platinum-muted/50 outline-none focus:border-gold"
                  />
                  <p className="text-[10px] text-platinum-muted mt-1">
                    Auto-creates Purchase Invoice, clears advance payments in ledger, and updates GST & ITC.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Bullion Supplier *
                  </label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Metal Category *
                  </label>
                  <select
                    value={formData.metalCategory}
                    onChange={(e) => setFormData({ ...formData, metalCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="GOLD_24K">Gold 24K (99.50% Standard Bullion)</option>
                    <option value="GOLD_22K">Gold 22K (91.60% 916)</option>
                    <option value="SILVER_999">Silver 999 Fine</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Expected Gross Weight (from Supplier Slip) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.expectedGrossWeight}
                    onChange={(e) => setFormData({ ...formData, expectedGrossWeight: Number(e.target.value) })}
                    placeholder="100.000"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">
                    Actual Weighed on Store Certified Scale (g) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.actualGrossWeight}
                    onChange={(e) => setFormData({ ...formData, actualGrossWeight: Number(e.target.value) })}
                    placeholder="100.000"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-emerald-500/40 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Lot / Refinery Batch No
                  </label>
                  <input
                    type="text"
                    value={formData.lotBatchNo}
                    onChange={(e) => setFormData({ ...formData, lotBatchNo: e.target.value })}
                    placeholder="e.g. LOT-PAMP-9921"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    XRF / Purity Testing Result
                  </label>
                  <input
                    type="text"
                    value={formData.purityTestingResult}
                    onChange={(e) => setFormData({ ...formData, purityTestingResult: e.target.value })}
                    placeholder="e.g. 99.52% via XRF Spectrometer"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Weight Difference & Tolerance Warning Alert */}
              <div className={`p-4 rounded-xl border space-y-1.5 ${
                isToleranceExceeded
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-onyx-elevated border-onyx-border text-platinum"
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Calculated Weight Differential:</span>
                  <span className="font-mono font-bold text-sm">
                    {weightDiff > 0 ? `+${weightDiff.toFixed(3)}g` : `${weightDiff.toFixed(3)}g`}
                  </span>
                </div>
                {isToleranceExceeded && (
                  <p className="text-[11px] text-amber-300">
                    Warning: Variance of {weightDiff}g exceeds standard bullion tolerance (±0.050g). This will trigger a manager verification alert.
                  </p>
                )}
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Intaking..." : "Confirm & Post Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
