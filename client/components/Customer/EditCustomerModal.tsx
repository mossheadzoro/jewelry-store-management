"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Shield, UserCheck, Lock } from "lucide-react";

interface CustomerData {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pan: string | null;
  gstin: string | null;
  aadhar: string | null;
  dob: string | null;
  anniversary: string | null;
  customerGroup: string | null;
}

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: number | null;
  userRole?: string;
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export default function EditCustomerModal({
  open,
  onClose,
  onSuccess,
  customerId,
  userRole = "SALESMAN",
}: EditCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    gender: "MALE",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    pan: "",
    gstin: "",
    aadhar: "",
    dob: "",
    anniversary: "",
    customerGroup: "",
    optInWhatsapp: true,
    optInSms: true,
    optInEmail: true,
    optInPromotions: true,
  });

  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/settings/customer");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to fetch customer config", err);
      }
    };
    fetchConfig();
  }, [open]);

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails(customerId);
    }
  }, [open, customerId]);

  const fetchCustomerDetails = async (id: number) => {
    setFetching(true);
    setError("");
    setReason("");
    try {
      const res = await fetch(`/api/customer/${id}`);
      if (!res.ok) throw new Error("Failed to fetch customer details");
      const data = await res.json();
      const customer = data.customer;

      setForm({
        name: customer.name || "",
        mobile: customer.mobile || "",
        email: customer.email || "",
        gender: customer.gender || "MALE",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "Maharashtra",
        pincode: customer.pincode || "",
        pan: customer.pan || "",
        gstin: customer.gstin || "",
        aadhar: customer.aadhar || "",
        dob: customer.dob ? new Date(customer.dob).toISOString().split("T")[0] : "",
        anniversary: customer.anniversary ? new Date(customer.anniversary).toISOString().split("T")[0] : "",
        customerGroup: customer.customerGroup || "",
        optInWhatsapp: customer.optInWhatsapp ?? true,
        optInSms: customer.optInSms ?? true,
        optInEmail: customer.optInEmail ?? true,
        optInPromotions: customer.optInPromotions ?? true,
      });
    } catch (err) {
      setError("Failed to load customer data.");
    } finally {
      setFetching(false);
    }
  };

  if (!open) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.mobile.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          reason: reason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update customer.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111] border border-[#222] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isManagerOrAdmin
                  ? "bg-[#D4A843]/10 border-[#D4A843]/30 text-[#D4A843]"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}
            >
              {isManagerOrAdmin ? <Shield className="w-4.5 h-4.5" /> : <UserCheck className="w-4.5 h-4.5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-foreground">Update Customer Dossier</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    isManagerOrAdmin
                      ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                      : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {userRole} Mode
                </span>
              </div>
              <p className="text-[12px] text-[#555]">
                {isManagerOrAdmin
                  ? "Full Governance: Modifying profile attributes with comprehensive change ledger tracking."
                  : "Operational Edit: Updating customer contacts & preferences with audit logging."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-onyx-elevated border border-[#252525] flex items-center justify-center text-[#666] hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {fetching ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin mb-4" />
            <p className="text-[#666] text-[14px]">Loading customer details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                {error}
              </div>
            )}

            {/* Reason for Update (Recorded into Audit Ledger) */}
            <div className="p-3.5 rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5">
              <label className="block text-[11px] font-bold text-[#D4A843] uppercase tracking-wider mb-1.5">
                Reason for Update (Audit Ledger Note)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Updated primary phone number upon client request at front desk"
                className="w-full h-9 px-3 rounded-lg bg-[#0c0c0c] border border-[#222] text-[12px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/50 transition-colors"
              />
            </div>

            {/* Personal Info Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#D4A843] text-sm">👤</span>
                <h3 className="text-[13px] font-semibold text-[#D4A843]">Personal Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Full Name *" value={form.name} onChange={(v) => handleChange("name", v)} placeholder="e.g. Aisha Sharma" />
                <InputField label="Mobile Number *" value={form.mobile} onChange={(v) => handleChange("mobile", v)} placeholder="e.g. 9876543210" />
                <div className="col-span-2">
                  <InputField label="Email Address" value={form.email} onChange={(v) => handleChange("email", v)} placeholder="e.g. aisha.sharma@example.com" type="email" />
                </div>
                {config?.groups && config.groups.length > 0 && (
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[12px] font-medium text-[#888]">Customer Group</label>
                      {!isManagerOrAdmin && (
                        <span className="text-[10px] text-[#666] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#555]" /> Manager Only
                        </span>
                      )}
                    </div>
                    <select
                      value={form.customerGroup}
                      disabled={!isManagerOrAdmin}
                      onChange={(e) => handleChange("customerGroup", e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="">None</option>
                      {config.groups.map((g: any) => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Location Details Section */}
            <div className="bg-onyx-elevated p-4 rounded-xl border border-[#222]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#D4A843] text-sm">📍</span>
                <h3 className="text-[13px] font-semibold text-[#D4A843]">Location & Residence</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <InputField bg="#0c0c0c" label="Street Address" value={form.address} onChange={(v) => handleChange("address", v)} placeholder="42, Velvet Avenue, Sector 5" />
                </div>
                <InputField bg="#0c0c0c" label="City" value={form.city} onChange={(v) => handleChange("city", v)} placeholder="Mumbai" />
                <div>
                  <label className="block text-[12px] font-medium text-[#888] mb-1.5">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0c0c0c] border border-border text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <InputField bg="#0c0c0c" label="Pincode" value={form.pincode} onChange={(v) => handleChange("pincode", v)} placeholder="400001" />
              </div>
            </div>

            {/* Milestones & Tax Identifiers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#D4A843] text-sm">📅</span>
                  <h3 className="text-[13px] font-semibold text-[#D4A843]">Milestones</h3>
                </div>
                <InputField bg="#0c0c0c" label="Date of Birth" value={form.dob} onChange={(v) => handleChange("dob", v)} type="date" />
                <div className="mt-3">
                  <InputField bg="#0c0c0c" label="Anniversary" value={form.anniversary} onChange={(v) => handleChange("anniversary", v)} type="date" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#D4A843] text-sm">🛡️</span>
                    <h3 className="text-[13px] font-semibold text-[#D4A843]">Tax Identifiers</h3>
                  </div>
                  {!isManagerOrAdmin && (
                    <span className="text-[10px] text-[#666] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#555]" /> Protected
                    </span>
                  )}
                </div>
                <InputField
                  bg="#0c0c0c"
                  label="PAN Number"
                  value={form.pan}
                  onChange={(v) => handleChange("pan", v)}
                  placeholder="ABCDE1234F"
                  disabled={!isManagerOrAdmin && !!form.pan}
                />
                <div className="mt-3">
                  <InputField
                    bg="#0c0c0c"
                    label="GSTIN Number"
                    value={form.gstin}
                    onChange={(v) => handleChange("gstin", v)}
                    placeholder="22AAAAA0000A1Z5"
                    disabled={!isManagerOrAdmin && !!form.gstin}
                  />
                </div>
              </div>
            </div>

            {/* Communication Preferences */}
            <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c]">
              <h3 className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-2.5">
                Communication Preferences
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-[#1a1a1a] bg-onyx-elevated cursor-pointer hover:border-[#333] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.optInWhatsapp}
                    onChange={(e) => setForm((prev) => ({ ...prev, optInWhatsapp: e.target.checked }))}
                    className="accent-[#D4A843] w-4 h-4"
                  />
                  <span className="text-[12px] text-[#aaa]">WhatsApp Alerts</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-[#1a1a1a] bg-onyx-elevated cursor-pointer hover:border-[#333] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.optInSms}
                    onChange={(e) => setForm((prev) => ({ ...prev, optInSms: e.target.checked }))}
                    className="accent-[#D4A843] w-4 h-4"
                  />
                  <span className="text-[12px] text-[#aaa]">SMS Notifications</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-[#1a1a1a] bg-onyx-elevated cursor-pointer hover:border-[#333] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.optInEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, optInEmail: e.target.checked }))}
                    className="accent-[#D4A843] w-4 h-4"
                  />
                  <span className="text-[12px] text-[#aaa]">Email Invoices</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-[#1a1a1a] bg-onyx-elevated cursor-pointer hover:border-[#333] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.optInPromotions}
                    onChange={(e) => setForm((prev) => ({ ...prev, optInPromotions: e.target.checked }))}
                    className="accent-[#D4A843] w-4 h-4"
                  />
                  <span className="text-[12px] text-[#aaa]">Exclusive Promotions</span>
                </label>
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f1f1f]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl text-[13px] font-medium text-[#ccc] bg-transparent border border-border hover:text-foreground hover:border-[#444] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || fetching}
            className="h-10 px-6 rounded-xl text-[13px] font-semibold bg-[#D4A843] text-foreground hover:bg-[#e6bc5a] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Input
function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  bg = "#0c0c0c",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  bg?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#888] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10 px-3.5 rounded-xl border border-border text-[13px] text-foreground placeholder:text-[#555] outline-none focus:border-[#D4A843]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]`}
        style={{ backgroundColor: bg }}
      />
    </div>
  );
}
