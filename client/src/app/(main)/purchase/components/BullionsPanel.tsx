// client/src/app/(main)/purchase/components/BullionsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconBuildingStore,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconPhone,
  IconMail,
  IconMapPin,
  IconReceiptTax,
  IconBuildingBank,
  IconX,
  IconCheck,
  IconChevronRight,
  IconEye,
  IconEdit,
} from "@tabler/icons-react";

interface BullionsPanelProps {
  onRefreshOverview: () => void;
}

export default function BullionsPanel({ onRefreshOverview }: BullionsPanelProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [supplierType, setSupplierType] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  // Add Supplier Form State
  const [formData, setFormData] = useState({
    businessName: "",
    legalName: "",
    gstin: "",
    pan: "",
    supplierType: "BULLION_DEALER",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "West Bengal",
    stateCode: "19",
    pincode: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    paymentTermsDays: 0,
    creditLimit: 0,
    openingPayable: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (supplierType !== "ALL") params.set("supplierType", supplierType);

      const res = await fetch(`/api/purchase/suppliers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error("Fetch suppliers error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [supplierType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuppliers();
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create supplier");
      }

      setIsAddModalOpen(false);
      setFormData({
        businessName: "",
        legalName: "",
        gstin: "",
        pan: "",
        supplierType: "BULLION_DEALER",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "West Bengal",
        stateCode: "19",
        pincode: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        paymentTermsDays: 0,
        creditLimit: 0,
        openingPayable: 0,
        notes: "",
      });
      await fetchSuppliers();
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
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, supplier name, GSTIN, phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={supplierType}
            onChange={(e) => setSupplierType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Supplier Types</option>
            <option value="BULLION_DEALER">Bullion Dealer</option>
            <option value="REFINERY">Refinery</option>
            <option value="WHOLESALE_SUPPLIER">Wholesale Supplier</option>
            <option value="BANK">Nominated Bank</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconPlus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-platinum-muted">
            Loading bullion suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-platinum-muted space-y-2">
            <IconBuildingStore className="w-10 h-10 mx-auto text-platinum-muted/50" />
            <p>No bullion suppliers found. Click "Add Supplier" to register one.</p>
          </div>
        ) : (
          suppliers.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSupplier(s)}
              className="group cursor-pointer rounded-2xl bg-onyx-surface border border-onyx-border hover:border-gold/50 p-5 space-y-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/20">
                    {s.code}
                  </span>
                  <h3 className="text-sm font-bold text-platinum mt-2 group-hover:text-gold transition-colors">
                    {s.businessName}
                  </h3>
                  <span className="text-[10px] text-platinum-muted block">{s.supplierType.replace("_", " ")}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  s.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-onyx-elevated text-platinum-muted"
                }`}>
                  {s.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-platinum-muted border-t border-onyx-border/60 pt-3">
                <div className="flex items-center gap-2">
                  <IconReceiptTax className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="font-mono">{s.gstin || "Unregistered"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconPhone className="w-3.5 h-3.5 text-platinum-muted shrink-0" />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconMapPin className="w-3.5 h-3.5 text-platinum-muted shrink-0" />
                  <span className="truncate">{s.city}, {s.state}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-onyx-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-platinum-muted block uppercase">Current Payable</span>
                  <span className={`font-bold ${s.currentPayable > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    ₹{s.currentPayable.toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-[11px] text-gold font-medium group-hover:underline flex items-center">
                  Profile <IconChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconBuildingStore className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Register New Bullion Supplier</h2>
                  <p className="text-[11px] text-platinum-muted">Master Dealer & Refinery Setup</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Trade / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. MMTC-PAMP Bullion Depot"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Legal Name (as per PAN/GST)
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. MMTC-PAMP India Pvt Ltd"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Supplier Category *
                  </label>
                  <select
                    value={formData.supplierType}
                    onChange={(e) => setFormData({ ...formData, supplierType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="BULLION_DEALER">Bullion Dealer</option>
                    <option value="REFINERY">Refinery</option>
                    <option value="WHOLESALE_SUPPLIER">Wholesale Supplier</option>
                    <option value="BANK">Nominated Bank</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Rajat Verma"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Phone / Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="bullion@dealer.com"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="19AAAAA0000A1Z5"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono uppercase outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AAAAA0000A"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono uppercase outline-none focus:border-gold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 45, Bowbazar Gold Market"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kolkata"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="West Bengal"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="700012"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">Opening Payable Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.openingPayable}
                    onChange={(e) => setFormData({ ...formData, openingPayable: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Bank Details Collapsible / Section */}
              <div className="pt-3 border-t border-onyx-border space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold block">
                  Bank Settlement Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-platinum-muted block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="HDFC Bank"
                      className="w-full px-3 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum text-xs outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-platinum-muted block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="50200012345678"
                      className="w-full px-3 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum text-xs outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-platinum-muted block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="HDFC0001234"
                      className="w-full px-3 py-1.5 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono uppercase text-xs outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Bullion Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Supplier Detail Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-onyx-surface border-l border-onyx-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div>
                <span className="text-[10px] font-mono text-gold font-bold px-2 py-0.5 rounded bg-gold/10 border border-gold/20">
                  {selectedSupplier.code}
                </span>
                <h2 className="text-base font-bold text-platinum mt-1">{selectedSupplier.businessName}</h2>
                <span className="text-xs text-platinum-muted">{selectedSupplier.legalName || "No legal alias"}</span>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-onyx-elevated border border-onyx-border">
                <div>
                  <span className="text-[10px] text-platinum-muted uppercase block">Current Payable</span>
                  <span className="text-lg font-bold text-rose-400">
                    ₹{selectedSupplier.currentPayable.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-platinum-muted uppercase block">Total Purchases</span>
                  <span className="text-lg font-bold text-platinum">
                    ₹{selectedSupplier.totalPurchasedValue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Contact & Statutory Info */}
              <div className="space-y-2 rounded-xl bg-onyx-elevated border border-onyx-border p-4">
                <span className="text-[11px] font-bold text-gold uppercase tracking-wider block mb-2">
                  Statutory & Contact Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-platinum-muted block">GSTIN</span>
                    <span className="font-mono text-platinum">{selectedSupplier.gstin || "Unregistered"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">PAN</span>
                    <span className="font-mono text-platinum">{selectedSupplier.pan || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Phone</span>
                    <span className="text-platinum">{selectedSupplier.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Email</span>
                    <span className="text-platinum">{selectedSupplier.email || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-platinum-muted block">Address</span>
                    <span className="text-platinum">
                      {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.state} - {selectedSupplier.pincode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-2 rounded-xl bg-onyx-elevated border border-onyx-border p-4">
                <span className="text-[11px] font-bold text-gold uppercase tracking-wider block mb-2">
                  Bank Settlement Account
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Bank Name</span>
                    <span className="text-platinum">{selectedSupplier.bankName || "Not configured"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Account Number</span>
                    <span className="font-mono text-platinum">{selectedSupplier.accountNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">IFSC Code</span>
                    <span className="font-mono text-platinum">{selectedSupplier.ifscCode || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-platinum-muted block">Branch</span>
                    <span className="text-platinum">{selectedSupplier.branchName || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-onyx-border flex justify-end">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:bg-onyx"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
