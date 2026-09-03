// client/src/app/(main)/purchase/components/BookingsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconCoins,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconScale,
  IconLock,
  IconBuildingStore,
  IconPrinter,
  IconShieldCheck,
  IconChevronRight,
  IconArrowUpRight,
  IconCash,
} from "@tabler/icons-react";

interface BookingsPanelProps {
  onRefreshOverview: () => void;
}

export default function BookingsPanel({ onRefreshOverview }: BookingsPanelProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [metalCategoryFilter, setMetalCategoryFilter] = useState("ALL");
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingForVerify, setSelectedBookingForVerify] = useState<any | null>(null);

  const initialFormData = {
    supplierId: "",
    metalCategory: "GOLD_24K",
    purityPercent: 99.50,
    grossWeight: 0 as number | string,
    bookingRate: 0 as number | string,
    marketRate: 0 as number | string,
    rateSource: "LIVE_MCX",
    isRateOverride: false,
    overrideReason: "",
    expectedReceiptDate: "",
    notes: "",
    gstCondition: "WITHOUT_GST" as "WITHOUT_GST" | "WITH_GST",
    calculateGst: true,
  };

  // New Booking Form State
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNumberInput = (field: "grossWeight" | "bookingRate" | "marketRate", rawValue: string) => {
    let val = rawValue;
    // If typing digits directly over 0 (e.g. typing 5 makes "05"), strip the leading 0 while preserving decimals (e.g. "0.5")
    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "");
    }
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNumberBlur = (field: "grossWeight" | "bookingRate" | "marketRate") => {
    setFormData((prev) => {
      const v = prev[field];
      if (v === "" || isNaN(Number(v))) {
        return { ...prev, [field]: 0 };
      }
      return { ...prev, [field]: Number(v) };
    });
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (metalCategoryFilter !== "ALL") params.set("metalCategory", metalCategoryFilter);

      const [resBookings, resSuppliers] = await Promise.all([
        fetch(`/api/purchase/bookings?${params.toString()}`),
        fetch(`/api/purchase/suppliers?isActive=true`),
      ]);

      if (resBookings.ok) {
        const json = await resBookings.json();
        if (json.success) setBookings(json.bookings || []);
      }
      if (resSuppliers.ok) {
        const json = await resSuppliers.json();
        if (json.success) setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, metalCategoryFilter]);

  const numWeight = Number(formData.grossWeight) || 0;
  const numBookingRate = Number(formData.bookingRate) || 0;
  const numMarketRate = Number(formData.marketRate) || 0;

  // Live calculations: 24K bullion standard purity is 99.50%
  const fineWeight = (formData.metalCategory === "GOLD_24K" && formData.purityPercent >= 99.50)
    ? Number(numWeight.toFixed(3))
    : Number(((numWeight * formData.purityPercent) / 99.50).toFixed(3));

  // Financial calculations based on Rate Condition
  let actualBaseRate = 0;
  let taxableValue = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  if (formData.gstCondition === "WITH_GST") {
    // Rate is entered with 3% GST (Inclusive)
    // Actual Base Rate = enteredRate / 1.03
    actualBaseRate = numBookingRate > 0 ? Number((numBookingRate / 1.03).toFixed(2)) : 0;
    totalAmount = Number((numWeight * numBookingRate).toFixed(2));
    taxableValue = Number((totalAmount / 1.03).toFixed(2));
    gstAmount = Number((totalAmount - taxableValue).toFixed(2));
  } else {
    // Rate is entered without GST (Exclusive)
    actualBaseRate = numBookingRate;
    taxableValue = Number((numWeight * numBookingRate).toFixed(2));
    if (formData.calculateGst) {
      gstAmount = Number((taxableValue * 0.03).toFixed(2));
      totalAmount = Number((taxableValue + gstAmount).toFixed(2));
    } else {
      gstAmount = 0;
      totalAmount = taxableValue;
    }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setErrorMsg("Please select a bullion supplier.");
      return;
    }
    if (numWeight <= 0) {
      setErrorMsg("Gross weight to book must be greater than 0.");
      return;
    }
    if (numBookingRate <= 0) {
      setErrorMsg("Agreed booking rate must be greater than 0.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          grossWeight: numWeight,
          bookingRate: numBookingRate,
          marketRate: numMarketRate || numBookingRate,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create booking");
      }

      setIsNewBookingModalOpen(false);
      setFormData(initialFormData);
      await fetchBookings();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/purchase/bookings/${bookingId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVED", decisionNotes: "Approved by manager" }),
      });
      if (res.ok) {
        await fetchBookings();
        onRefreshOverview();
      }
    } catch (err) {
      console.error("Approve booking error:", err);
    }
  };

  // Advance Payment State & Handlers
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [advancePaymentData, setAdvancePaymentData] = useState({
    amount: 0 as number | string,
    paymentMethod: "RTGS",
    referenceNumber: "",
    bankName: "HDFC Bank",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleOpenAdvanceModal = (booking: any) => {
    setSelectedBookingForPayment(booking);
    setAdvancePaymentData({
      amount: booking.balancePayment > 0 ? booking.balancePayment : booking.totalAmount,
      paymentMethod: "RTGS",
      referenceNumber: "",
      bankName: "HDFC Bank",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: `Advance disbursement for Booking ${booking.bookingNumber}`,
    });
    setPaymentError(null);
  };

  const handleRecordAdvancePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;
    const numAmount = Number(advancePaymentData.amount) || 0;
    if (numAmount <= 0) {
      setPaymentError("Please enter a valid disbursement amount greater than 0.");
      return;
    }
    setPaymentError(null);
    setSubmittingPayment(true);

    try {
      const res = await fetch("/api/purchase/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedBookingForPayment.supplierId,
          purchaseBookingId: selectedBookingForPayment.id,
          amount: numAmount,
          paymentMethod: advancePaymentData.paymentMethod,
          paymentType: "ADVANCE",
          referenceNumber: advancePaymentData.referenceNumber,
          bankName: advancePaymentData.bankName,
          paymentDate: advancePaymentData.paymentDate,
          notes: advancePaymentData.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record advance payment");
      }

      setSelectedBookingForPayment(null);
      await fetchBookings();
      onRefreshOverview();
    } catch (err: any) {
      setPaymentError(err.message || "An error occurred");
    } finally {
      setSubmittingPayment(false);
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
              placeholder="Search booking number, supplier, rate..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={fetchBookings}
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
            <option value="ALL">All Booking Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="FULLY_RECEIVED">Fully Received</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={metalCategoryFilter}
            onChange={(e) => setMetalCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Metal Types</option>
            <option value="GOLD_24K">Gold 24K (99.50% Standard Bullion)</option>
            <option value="GOLD_22K">Gold 22K (91.6% 916)</option>
            <option value="SILVER_999">Silver 999</option>
          </select>

          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconPlus className="w-4 h-4" />
            <span>Book 24K Bullion</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Booking No / Date</th>
                <th className="py-3.5 px-4">Bullion Supplier</th>
                <th className="py-3.5 px-4">Metal & Weight</th>
                <th className="py-3.5 px-4">Locked Rate</th>
                <th className="py-3.5 px-4">Total Amount (₹)</th>
                <th className="py-3.5 px-4">Intake Status</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconCoins className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No bullion bookings found.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">{b.bookingNumber}</div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(b.bookingDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{b.supplier?.businessName}</div>
                      <span className="text-[10px] text-gold font-mono">{b.supplier?.code}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum">{b.grossWeight.toFixed(3)}g</div>
                      <span className="text-[10px] text-platinum-muted">
                        {b.metalCategory.replace("_", " ")} ({b.fineWeight.toFixed(3)}g Pure)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-platinum">₹{b.bookingRate.toLocaleString("en-IN")}/g</div>
                      {b.rateSnapshots?.[0]?.metadata?.gstCondition === "WITH_GST" || b.notes?.includes("WITH GST") ? (
                        <div className="flex flex-col mt-0.5">
                          <span className="text-[10px] text-cyan-300 font-semibold">Incl. 3% GST</span>
                          <span className="text-[9.5px] text-platinum-muted font-mono">Base: ₹{b.effectiveRate?.toLocaleString("en-IN")}/g</span>
                        </div>
                      ) : b.estimatedGst > 0 ? (
                        <span className="text-[10px] text-platinum-muted font-medium block mt-0.5">+3% GST</span>
                      ) : (
                        <span className="text-[10px] text-platinum-muted/70 font-medium block mt-0.5">No GST</span>
                      )}
                      {b.isRateOverride && (
                        <span className="text-[10px] text-amber-400 font-medium block mt-0.5">Rate Override</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gold">₹{b.totalAmount.toLocaleString("en-IN")}</div>
                      <span className="text-[10px] text-platinum-muted">
                        Paid: ₹{b.paidAmount.toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-semibold text-platinum">
                        {b.receivedGrossWeight.toFixed(3)}g received
                      </div>
                      <span className="text-[10px] text-platinum-muted">
                        Pending: {b.pendingGrossWeight.toFixed(3)}g
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        b.status === "BOOKED" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
                        b.status === "PENDING_VERIFICATION" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse" :
                        b.status === "FULLY_RECEIVED" ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" :
                        b.status === "CLOSED" ? "bg-onyx-elevated text-platinum-muted border border-onyx-border" :
                        "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {b.status === "PENDING_VERIFICATION" ? (
                        <button
                          onClick={() => handleApproveBooking(b.id)}
                          className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold text-[10px] transition-colors"
                        >
                          Authorize
                        </button>
                      ) : b.status === "BOOKED" || b.status === "PARTIALLY_RECEIVED" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {b.balancePayment > 0 ? (
                            <button
                              onClick={() => handleOpenAdvanceModal(b)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold text-[10px] transition-all shadow-sm"
                              title="Disburse advance payment to bullion supplier"
                            >
                              <IconCash className="w-3.5 h-3.5" />
                              <span>Pay Advance</span>
                            </button>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                              Paid in Full
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-platinum-muted font-medium">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Bullion Booking Wizard Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconCoins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Book 24K Bullion / Raw Metal</h2>
                  <p className="text-[11px] text-platinum-muted">Rate Lock & Procurement Commitment</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
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
                    <option value="">-- Choose Registered Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} ({s.code}) - {s.city}
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
                    onChange={(e) => {
                      const cat = e.target.value;
                      let purity = 99.50;
                      if (cat === "GOLD_22K") purity = 91.60;
                      if (cat === "GOLD_18K") purity = 75.00;
                      if (cat === "SILVER_999") purity = 99.90;
                      setFormData({ ...formData, metalCategory: cat, purityPercent: purity });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="GOLD_24K">Gold 24K (99.50% Standard Bullion)</option>
                    <option value="GOLD_22K">Gold 22K (91.60% 916)</option>
                    <option value="GOLD_18K">Gold 18K (75.00%)</option>
                    <option value="SILVER_999">Silver 999 Fine</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Gross Weight to Book (Grams) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={formData.grossWeight}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleNumberInput("grossWeight", e.target.value)}
                    onBlur={() => handleNumberBlur("grossWeight")}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-platinum">
                      Agreed Booking Rate (₹ / Gram) *
                    </label>
                    <span className="text-[10px] text-platinum-muted">
                      {formData.gstCondition === "WITH_GST" ? "3% GST Inclusive" : "GST Exclusive"}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.bookingRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleNumberInput("bookingRate", e.target.value)}
                    onBlur={() => handleNumberBlur("bookingRate")}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Live Benchmark / Market Rate (₹ / Gram)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.marketRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleNumberInput("marketRate", e.target.value)}
                    onBlur={() => handleNumberBlur("marketRate")}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono outline-none focus:border-gold"
                  />
                </div>

                {/* Rate Condition / GST Mode Selector */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-onyx-elevated/80 border border-onyx-border space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-platinum">
                        Rate Condition & GST Treatment *
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-gold/15 text-gold border border-gold/30">
                        Bullion Tax Policy (3% GST)
                      </span>
                    </div>
                    <p className="text-[11px] text-platinum-muted mt-0.5">
                      Specify whether the supplier quote is exclusive of GST or includes 3% GST.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Rate is without GST */}
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, gstCondition: "WITHOUT_GST" }))}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        formData.gstCondition === "WITHOUT_GST"
                          ? "bg-gold/10 border-gold shadow-sm shadow-gold/10"
                          : "bg-onyx border-onyx-border hover:border-onyx-border/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-platinum">Rate is WITHOUT GST</span>
                        <input
                          type="radio"
                          name="gstCondition"
                          checked={formData.gstCondition === "WITHOUT_GST"}
                          onChange={() => setFormData((prev) => ({ ...prev, gstCondition: "WITHOUT_GST" }))}
                          className="accent-gold"
                        />
                      </div>
                      <p className="text-[10.5px] text-platinum-muted">
                        Agreed rate is base rate before tax. Option to calculate 3% GST or 0% GST.
                      </p>
                    </div>

                    {/* Option 2: Rate is with GST */}
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, gstCondition: "WITH_GST" }))}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        formData.gstCondition === "WITH_GST"
                          ? "bg-gold/10 border-gold shadow-sm shadow-gold/10"
                          : "bg-onyx border-onyx-border hover:border-onyx-border/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-platinum">Rate is WITH GST</span>
                        <input
                          type="radio"
                          name="gstCondition"
                          checked={formData.gstCondition === "WITH_GST"}
                          onChange={() => setFormData((prev) => ({ ...prev, gstCondition: "WITH_GST" }))}
                          className="accent-gold"
                        />
                      </div>
                      <p className="text-[10.5px] text-platinum-muted">
                        Agreed rate is inclusive of 3% GST. System back-calculates the actual base rate.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic sub-options / recalculated view */}
                  {formData.gstCondition === "WITHOUT_GST" ? (
                    <div className="flex items-center gap-2.5 pt-2 border-t border-onyx-border/60">
                      <input
                        type="checkbox"
                        id="calculateGstCheck"
                        checked={formData.calculateGst}
                        onChange={(e) => setFormData((prev) => ({ ...prev, calculateGst: e.target.checked }))}
                        className="rounded border-onyx-border accent-gold w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="calculateGstCheck" className="text-xs text-platinum font-medium cursor-pointer">
                        Calculate GST (3%) on this booking
                        <span className="text-[10.5px] text-platinum-muted block font-normal">
                          {formData.calculateGst
                            ? `+₹${gstAmount.toLocaleString("en-IN")} GST (3%) will be added to the final commitment amount.`
                            : "0% GST will be applied (pure metal exchange / direct bullion without GST)."}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-semibold text-[11px]">
                          Recalculated Actual Base Rate (excl. GST):
                        </span>
                        <span className="font-mono font-bold text-cyan-200 text-sm">
                          ₹{actualBaseRate.toLocaleString("en-IN")}/g
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-cyan-300/80">
                        <span>GST Component (3%):</span>
                        <span className="font-mono font-medium">₹{(numBookingRate - actualBaseRate).toFixed(2)}/g (Total GST: ₹{gstAmount.toLocaleString("en-IN")})</span>
                      </div>
                      <div className="text-[10px] text-cyan-200/60 pt-1 border-t border-cyan-500/20 flex items-center justify-between">
                        <span>Calculation Formula: Base Rate = Entered Rate / 1.03</span>
                        <span className="font-mono font-semibold text-cyan-300">₹{numBookingRate} / 1.03 = ₹{actualBaseRate}/g</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Expected Physical Receipt Date
                  </label>
                  <input
                    type="date"
                    value={formData.expectedReceiptDate}
                    onChange={(e) => setFormData({ ...formData, expectedReceiptDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Rate Source Reference
                  </label>
                  <select
                    value={formData.rateSource}
                    onChange={(e) => setFormData({ ...formData, rateSource: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="LIVE_MCX">Live MCX Spot</option>
                    <option value="IBJA_BENCHMARK">IBJA Benchmark Rate</option>
                    <option value="SUPPLIER_FIXED">Supplier Fixed Contract</option>
                    <option value="MANUAL_OVERRIDE">Negotiated / Manual Override</option>
                  </select>
                </div>

                {/* Flag as Rate Override / Manager Exception explanation */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-onyx-elevated border border-onyx-border space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="overrideCheck"
                      checked={formData.isRateOverride}
                      onChange={(e) => setFormData({ ...formData, isRateOverride: e.target.checked })}
                      className="mt-0.5 rounded border-onyx-border accent-gold w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label htmlFor="overrideCheck" className="text-xs text-platinum font-semibold cursor-pointer">
                          Flag as Rate Override / Manager Exception
                        </label>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                          Requires Manager Approval
                        </span>
                      </div>
                      <p className="text-[11px] text-platinum-muted mt-0.5 leading-relaxed">
                        Check this when the booking rate deviates from standard live market benchmarks (e.g. bulk discount, refinery negotiated rate, or special terms). The booking will enter <strong>Manager Exception (Pending Verification)</strong> and must be authorized by a Store Manager before intake or payments.
                      </p>
                    </div>
                  </div>

                  {formData.isRateOverride && (
                    <div className="pt-2 border-t border-onyx-border/60">
                      <label className="text-[11px] font-semibold text-amber-300 block mb-1">
                        Override Reason / Justification *
                      </label>
                      <input
                        type="text"
                        required={formData.isRateOverride}
                        value={formData.overrideReason}
                        onChange={(e) => setFormData({ ...formData, overrideReason: e.target.value })}
                        placeholder="e.g. Bulk spot discount agreed with refinery director"
                        className="w-full px-3 py-2 rounded-lg bg-onyx border border-amber-500/40 text-platinum outline-none focus:border-amber-400 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-4 rounded-xl bg-onyx-elevated border border-gold/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gold tracking-wider block">
                    Computed Financial Summary
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-gold/10 text-gold border border-gold/20">
                    {formData.gstCondition === "WITH_GST"
                      ? "Rate with GST (3% Incl.)"
                      : formData.calculateGst
                      ? "Rate without GST (+3% Tax)"
                      : "Rate without GST (0% Tax)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Fine Weight (24K)</span>
                    <span className="font-bold text-platinum">{fineWeight.toFixed(3)}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">
                      {formData.gstCondition === "WITH_GST" ? "Actual Base Rate" : "Base Rate"}
                    </span>
                    <span className="font-bold text-platinum font-mono">₹{actualBaseRate.toLocaleString("en-IN")}/g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Taxable Base</span>
                    <span className="font-bold text-platinum font-mono">₹{taxableValue.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">
                      {formData.gstCondition === "WITH_GST" ? "GST (3% Incl.)" : formData.calculateGst ? "GST (3%)" : "GST (0%)"}
                    </span>
                    <span className="font-bold text-platinum font-mono">₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Total Commitment</span>
                    <span className="font-bold text-gold text-sm font-mono">₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Confirm & Lock Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Payment Modal */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <IconCash className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Send Booking Advance Payment</h2>
                  <p className="text-[11px] text-platinum-muted">
                    {selectedBookingForPayment.bookingNumber} • {selectedBookingForPayment.supplier?.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAdvancePayment} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {paymentError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {paymentError}
                </div>
              )}

              {/* Booking Financial Snapshot */}
              <div className="p-3 rounded-xl bg-onyx-elevated border border-onyx-border grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-platinum-muted block">Total Commitment</span>
                  <span className="font-bold text-platinum text-xs">
                    ₹{selectedBookingForPayment.totalAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-platinum-muted block">Already Paid</span>
                  <span className="font-bold text-emerald-400 text-xs">
                    ₹{selectedBookingForPayment.paidAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-platinum-muted block">Remaining Balance</span>
                  <span className="font-bold text-gold text-xs">
                    ₹{selectedBookingForPayment.balancePayment?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Disbursed Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={advancePaymentData.amount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                        val = val.replace(/^0+/, "");
                      }
                      setAdvancePaymentData((prev) => ({ ...prev, amount: val }));
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold text-sm outline-none focus:border-gold"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setAdvancePaymentData((prev) => ({ ...prev, amount: selectedBookingForPayment.balancePayment }))}
                      className="text-[10.5px] text-gold hover:underline font-medium"
                    >
                      Pay Full Remaining (₹{selectedBookingForPayment.balancePayment?.toLocaleString("en-IN")})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      Payment Mode / Method *
                    </label>
                    <select
                      value={advancePaymentData.paymentMethod}
                      onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    >
                      <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                      <option value="NEFT">NEFT (Electronic Transfer)</option>
                      <option value="IMPS">IMPS (Immediate Payment)</option>
                      <option value="CHEQUE">Cheque / Demand Draft</option>
                      <option value="UPI">UPI / Digital QR</option>
                      <option value="CASH">Cash on Hand</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      Disbursement Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={advancePaymentData.paymentDate}
                      onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      Bank Name / Source Account
                    </label>
                    <input
                      type="text"
                      value={advancePaymentData.bankName}
                      onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank - Current A/c"
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      UTR / Transaction Ref No.
                    </label>
                    <input
                      type="text"
                      value={advancePaymentData.referenceNumber}
                      onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, referenceNumber: e.target.value })}
                      placeholder="e.g. HDFCR52026090300..."
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Notes / Memo
                  </label>
                  <input
                    type="text"
                    value={advancePaymentData.notes}
                    onChange={(e) => setAdvancePaymentData({ ...advancePaymentData, notes: e.target.value })}
                    placeholder="e.g. 100g 24K bullion booking advance transfer"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPayment(null)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-lg bg-emerald-500 text-onyx font-bold hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <IconCash className="w-4 h-4" />
                  <span>{submittingPayment ? "Disbursing..." : "Confirm & Send Advance"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
