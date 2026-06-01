"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";

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
}

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: number | null;
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

export default function EditCustomerModal({ open, onClose, onSuccess, customerId }: EditCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  
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
  });

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails(customerId);
    }
  }, [open, customerId]);

  const fetchCustomerDetails = async (id: number) => {
    setFetching(true);
    setError("");
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
        dob: customer.dob ? new Date(customer.dob).toISOString().split('T')[0] : "",
        anniversary: customer.anniversary ? new Date(customer.anniversary).toISOString().split('T')[0] : "",
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

    if (!form.name.trim() || !form.mobile.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111] border border-[#222] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-white">Update Customer Details</h2>
              <p className="text-[13px] text-[#555]">Refine client dossier information.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-transparent hover:bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin mb-4" />
            <p className="text-[#666] text-[14px]">Loading customer details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                {error}
              </div>
            )}

            {/* Personal Info Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-[#D4A843] text-sm">👤</span>
                 <h3 className="text-[14px] font-semibold text-[#D4A843]">Personal Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Full Name" value={form.name} onChange={(v) => handleChange("name", v)} placeholder="e.g. Aisha Sharma" />
                <InputField label="Mobile Number" value={form.mobile} onChange={(v) => handleChange("mobile", v)} placeholder="e.g. +91 98765 43210" />
                <div className="col-span-2">
                  <InputField label="Email Address" value={form.email} onChange={(v) => handleChange("email", v)} placeholder="e.g. aisha.sharma@example.com" type="email" />
                </div>
                <div className="hidden">
                   {/* Gender is hidden in the design but we keep it in state */}
                  <label className="block text-[12px] font-medium text-[#666] mb-1.5">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#2a2a2a] border border-[#333] text-[13px] text-white outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#222]">
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-[#D4A843] text-sm">📍</span>
                 <h3 className="text-[14px] font-semibold text-[#D4A843]">Location Details</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <InputField bg="#2a2a2a" label="Street Address" value={form.address} onChange={(v) => handleChange("address", v)} placeholder="42, Velvet Avenue, Sector 5" />
                </div>
                <InputField bg="#2a2a2a" label="City" value={form.city} onChange={(v) => handleChange("city", v)} placeholder="Mumbai" />
                <InputField bg="#2a2a2a" label="State" value={form.state} onChange={(v) => handleChange("state", v)} placeholder="Maharashtra" />
                <InputField bg="#2a2a2a" label="Pincode" value={form.pincode} onChange={(v) => handleChange("pincode", v)} placeholder="400001" />
              </div>
            </div>

            {/* Milestones & Financial Section */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                   <span className="text-[#D4A843] text-sm">📅</span>
                   <h3 className="text-[14px] font-semibold text-[#D4A843]">Milestones</h3>
                </div>
                <InputField bg="#2a2a2a" label="Date of Birth" value={form.dob} onChange={(v) => handleChange("dob", v)} type="date" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                   <span className="text-[#D4A843] text-sm">🏦</span>
                   <h3 className="text-[14px] font-semibold text-[#D4A843]">Financial</h3>
                </div>
                <InputField bg="#2a2a2a" label="PAN Number" value={form.pan} onChange={(v) => handleChange("pan", v)} placeholder="ABCDE1234F" />
              </div>
            </div>

          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f1f1f]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-full text-[13px] font-medium text-[#ccc] bg-transparent border border-[#333] hover:text-white hover:border-[#444] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || fetching}
            className="h-10 px-6 rounded-full text-[13px] font-semibold bg-[#D4A843] text-black hover:bg-[#e6bc5a] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
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
  bg = "#2a2a2a"
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  bg?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#888] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10 px-3.5 rounded-xl border border-[#333] text-[13px] text-white placeholder:text-[#555] outline-none focus:border-[#D4A843]/40 transition-colors [color-scheme:dark]`}
        style={{ backgroundColor: bg }}
      />
    </div>
  );
}
