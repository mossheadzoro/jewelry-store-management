// client/src/app/(main)/purchase/components/PaymentsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconCash,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconBuildingBank,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconBuildingStore,
} from "@tabler/icons-react";

interface PaymentsPanelProps {
  onRefreshOverview: () => void;
}

export default function PaymentsPanel({ onRefreshOverview }: PaymentsPanelProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseInvoiceId: "",
    purchaseBookingId: "",
    amount: 0 as number | string,
    paymentMethod: "RTGS",
    paymentType: "INVOICE_PAYMENT",
    referenceNumber: "",
    chequeNumber: "",
    chequeDate: "",
    bankName: "HDFC Bank",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (methodFilter !== "ALL") params.set("paymentMethod", methodFilter);

      const [resPayments, resSuppliers, resInvoices, resBookings] = await Promise.all([
        fetch(`/api/purchase/payments?${params.toString()}`),
        fetch(`/api/purchase/suppliers?isActive=true`),
        fetch(`/api/purchase/invoices?paymentStatus=UNPAID`),
        fetch(`/api/purchase/bookings?status=BOOKED`),
      ]);

      if (resPayments.ok) {
        const json = await resPayments.json();
        if (json.success) setPayments(json.payments || []);
      }
      if (resSuppliers.ok) {
        const json = await resSuppliers.json();
        if (json.success) setSuppliers(json.data || []);
      }
      if (resInvoices.ok) {
        const json = await resInvoices.json();
        if (json.success) setInvoices(json.invoices || []);
      }
      if (resBookings.ok) {
        const json = await resBookings.json();
        if (json.success) setBookings(json.bookings || []);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  const isCashComplianceWarning = formData.paymentMethod === "CASH" && formData.amount >= 200000;

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setErrorMsg("Please select a bullion supplier.");
      return;
    }
    const numAmount = Number(formData.amount) || 0;
    if (numAmount <= 0) {
      setErrorMsg("Please enter a valid disbursed amount greater than 0.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: numAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record payment");
      }

      setIsRecordPaymentModalOpen(false);
      await fetchPayments();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChequeStatusUpdate = async (paymentId: string, chequeStatus: string) => {
    try {
      const res = await fetch(`/api/purchase/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chequeStatus }),
      });
      if (res.ok) {
        await fetchPayments();
        onRefreshOverview();
      }
    } catch (err) {
      console.error("Update cheque status error:", err);
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
              placeholder="Search payment voucher, reference, supplier..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={fetchPayments}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold transition-colors"
          >
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
            <option value="NEFT">NEFT (Electronic Funds Transfer)</option>
            <option value="CHEQUE">Cheque / Demand Draft</option>
            <option value="CASH">Cash on Hand</option>
            <option value="UPI">UPI / QR Code</option>
          </select>

          <button
            onClick={() => setIsRecordPaymentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconPlus className="w-4 h-4" />
            <span>Disburse Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Voucher No / Date</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Disbursed Amount (₹)</th>
                <th className="py-3.5 px-4">Payment Channel</th>
                <th className="py-3.5 px-4">Reference / UTR / Cheque</th>
                <th className="py-3.5 px-4">Cheque Status</th>
                <th className="py-3.5 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-platinum-muted">
                    Loading supplier payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconCash className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No supplier disbursements recorded.</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">{p.paymentNumber}</div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{p.supplier?.businessName}</div>
                      <span className="text-[10px] text-gold font-mono">{p.supplier?.code}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{p.paymentMethod}</div>
                      <span className="text-[10px] text-platinum-muted">{p.paymentType}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-platinum">
                      {p.referenceNumber || p.transactionId || p.chequeNumber || "-"}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.paymentMethod === "CHEQUE" ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            p.chequeStatus === "CLEARED" ? "bg-emerald-500/15 text-emerald-300" :
                            p.chequeStatus === "BOUNCED" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"
                          }`}>
                            {p.chequeStatus || "ISSUED"}
                          </span>
                          {p.chequeStatus === "ISSUED" && (
                            <button
                              onClick={() => handleChequeStatusUpdate(p.id, "CLEARED")}
                              className="text-[10px] text-gold hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-platinum-muted">N/A (Direct)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        p.status === "COMPLETED" || p.status === "VERIFIED"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconCash className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Record Supplier Disbursement</h2>
                  <p className="text-[11px] text-platinum-muted">Ledger Debit & Section 269ST Compliance Check</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Select Bullion Supplier *
                  </label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="">-- Choose Bullion Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} ({s.code}) - Current Payable: ₹{s.currentPayable.toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Payment Allocation Type *
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="INVOICE_PAYMENT">Invoice Settlement</option>
                    <option value="ADVANCE">Booking Advance</option>
                    <option value="SETTLEMENT">On Account / Settlement</option>
                  </select>
                </div>

                {formData.paymentType === "ADVANCE" && (
                  <div>
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      Link to Purchase Booking (Advance Rate Lock)
                    </label>
                    <select
                      value={formData.purchaseBookingId}
                      onChange={(e) => {
                        const bkId = e.target.value;
                        const bk = bookings.find((b) => b.id === bkId);
                        if (bk) {
                          setFormData({
                            ...formData,
                            purchaseBookingId: bk.id,
                            supplierId: bk.supplierId,
                            amount: bk.balancePayment > 0 ? bk.balancePayment : bk.totalAmount,
                            notes: `Advance disbursement for Booking ${bk.bookingNumber}`,
                          });
                        } else {
                          setFormData({ ...formData, purchaseBookingId: "" });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    >
                      <option value="">-- General Advance / No Direct Booking --</option>
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bookingNumber} - {b.supplier?.businessName} ({b.grossWeight}g @ ₹{b.bookingRate}/g | Bal: ₹{b.balancePayment?.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Payment Method / Mode *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="NEFT">NEFT (Electronic Funds Transfer)</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="UPI">UPI / Digital QR</option>
                    <option value="CASH">Cash on Hand</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Disbursed Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.amount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                        val = val.replace(/^0+/, "");
                      }
                      setFormData({ ...formData, amount: val });
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold text-sm outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Disbursement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Bank Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="e.g. UTR1289471923"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                  />
                </div>

                {formData.paymentMethod === "CHEQUE" && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-platinum block mb-1">
                        Cheque Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.chequeNumber}
                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                        placeholder="000124"
                        className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-platinum block mb-1">
                        Cheque Date
                      </label>
                      <input
                        type="date"
                        value={formData.chequeDate}
                        onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Section 269ST Compliance Alert */}
              {isCashComplianceWarning && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <IconAlertTriangle className="w-4 h-4" />
                    Section 269ST Compliance Trigger
                  </div>
                  <p className="text-[11px]">
                    Cash transaction is ₹2,00,000 or above. Income Tax Section 269ST restricts single-day cash transactions above ₹2 Lakhs. This requires executive approval before completion.
                  </p>
                </div>
              )}

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Disburse Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
