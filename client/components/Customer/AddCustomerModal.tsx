"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (customer?: any) => void;
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

export default function AddCustomerModal({ open, onClose, onSuccess }: AddCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [manualTags, setManualTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [config, setConfig] = useState<any>(null);

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
    if (!open) return;
    const checkMobile = async () => {
      const cleanMobile = form.mobile.replace(/\D/g, "");
      if (cleanMobile.length >= 10) {
        setCheckingMobile(true);
        setMobileError("");
        try {
          const res = await fetch(`/api/customer/search?mobile=${cleanMobile}`);
          if (res.ok) {
            const data = await res.json();
            if (data.customer) {
              setMobileError(`Customer exists: ${data.customer.name}`);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingMobile(false);
        }
      } else {
        setMobileError("");
      }
    };
    
    const timer = setTimeout(checkMobile, 500);
    return () => clearTimeout(timer);
  }, [form.mobile, open]);

  // Fetch manual tag definitions on mount
  useEffect(() => {
    if (!open) return;
    const fetchDefinitions = async () => {
      try {
        const res = await fetch("/api/customer/tags/definitions");
        if (res.ok) {
          const data = await res.json();
          const manuals = data.definitions.filter((d: any) => d.type === "MANUAL");
          setManualTags(manuals);
        }
      } catch (err) {
        console.error("Failed to fetch manual tag definitions", err);
      }
    };
    fetchDefinitions();
    setSelectedTagIds([]);
  }, [open]);

  if (!open) return null;

  const getFieldStatus = (key: string) => {
    return config?.informationFields?.[key] || "optional";
  };
  const isHidden = (key: string) => getFieldStatus(key) === "hidden";
  const isMandatory = (key: string) => getFieldStatus(key) === "mandatory";
  const reqLabel = (base: string, key: string) => isMandatory(key) ? `${base} *` : base;

  const aadhaarStatus = config?.kyc?.aadhaarCollection || "optional";
  const gstinStatus = config?.kyc?.gstinCollection || "optional";

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mobileError) {
      setError("Cannot create customer. Mobile number already exists.");
      return;
    }

    let validationErrors: string[] = [];

    if (!form.name.trim()) validationErrors.push("Name is required");
    
    if (isMandatory("mobile") && !form.mobile.trim()) validationErrors.push("Mobile number is required");
    if (isMandatory("email") && !form.email.trim()) validationErrors.push("Email is required");
    if (isMandatory("dob") && !form.dob.trim()) validationErrors.push("Date of Birth is required");
    if (isMandatory("anniversary") && !form.anniversary.trim()) validationErrors.push("Anniversary is required");
    if (isMandatory("gender") && !form.gender.trim()) validationErrors.push("Gender is required");
    if (isMandatory("address") && !form.address.trim()) validationErrors.push("Address is required");
    if (isMandatory("city") && !form.city.trim()) validationErrors.push("City is required");
    if (isMandatory("state") && !form.state.trim()) validationErrors.push("State is required");
    if (isMandatory("pinCode") && !form.pincode.trim()) validationErrors.push("Pincode is required");

    if (aadhaarStatus === "mandatory" && !form.aadhar.trim()) validationErrors.push("Aadhar is required");
    if (gstinStatus === "mandatory" && !form.gstin.trim()) validationErrors.push("GSTIN is required");

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create customer.");
        return;
      }

      const newCustomer = await res.json();

      // Assign initial manual tags if selected
      if (selectedTagIds.length > 0) {
        await fetch("/api/customer/tags/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId: newCustomer.id, tagIds: selectedTagIds }),
        });
      }

      // Trigger automatic tag evaluations
      await fetch("/api/customer/tags/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: newCustomer.id }),
      }).catch((err) => console.error("Error evaluating customer tags:", err));

      // Reset form and close
      setForm({
        name: "", mobile: "", email: "", gender: "MALE",
        address: "", city: "", state: "Maharashtra", pincode: "",
        pan: "", gstin: "", aadhar: "", dob: "", anniversary: "",
        customerGroup: "",
        optInWhatsapp: true,
        optInSms: true,
        optInEmail: true,
        optInPromotions: true,
      });
      setSelectedTagIds([]);
      onSuccess(newCustomer);
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
            <div className="w-9 h-9 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-[#D4A843]" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-foreground">Add New Customer</h2>
              <p className="text-[12px] text-[#555]">Register a new client to the atelier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-onyx-elevated border border-[#252525] flex items-center justify-center text-[#666] hover:text-foreground hover:border-border transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          {/* Personal Info Section */}
          <div>
            <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Full Name *" value={form.name} onChange={(v) => handleChange("name", v)} placeholder="e.g. Sanya Arora" />
              {!isHidden("mobile") && (
                <InputField label={reqLabel("Mobile Number", "mobile")} value={form.mobile} onChange={(v) => handleChange("mobile", v)} placeholder="e.g. 9198102 33456" error={mobileError} />
              )}
              {!isHidden("email") && (
                <InputField label={reqLabel("Email", "email")} value={form.email} onChange={(v) => handleChange("email", v)} placeholder="e.g. sanya@mail.com" type="email" />
              )}
              {!isHidden("gender") && (
                <div>
                  <label className="block text-[12px] font-medium text-[#666] mb-1.5">{reqLabel("Gender", "gender")}</label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {!isHidden("dob") && (
                <InputField label={reqLabel("Date of Birth", "dob")} value={form.dob} onChange={(v) => handleChange("dob", v)} type="date" />
              )}
              {!isHidden("anniversary") && (
                <InputField label={reqLabel("Anniversary", "anniversary")} value={form.anniversary} onChange={(v) => handleChange("anniversary", v)} type="date" />
              )}
              {config?.groups && config.groups.length > 0 && (
                <div>
                  <label className="block text-[12px] font-medium text-[#666] mb-1.5">Customer Group</label>
                  <select
                    value={form.customerGroup}
                    onChange={(e) => handleChange("customerGroup", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer"
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

          {/* Address Section */}
          {(!isHidden("address") || !isHidden("city") || !isHidden("state") || !isHidden("pinCode")) && (
            <div>
              <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider mb-3">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                {!isHidden("address") && (
                  <div className="col-span-2">
                    <InputField label={reqLabel("Street Address", "address")} value={form.address} onChange={(v) => handleChange("address", v)} placeholder="e.g. 123, Main Road" />
                  </div>
                )}
                {!isHidden("city") && (
                  <InputField label={reqLabel("City", "city")} value={form.city} onChange={(v) => handleChange("city", v)} placeholder="e.g. South Delhi" />
                )}
                {!isHidden("state") && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#666] mb-1.5">{reqLabel("State", "state")}</label>
                    <select
                      value={form.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!isHidden("pinCode") && (
                  <InputField label={reqLabel("Pincode", "pinCode")} value={form.pincode} onChange={(v) => handleChange("pincode", v)} placeholder="e.g. 110001" />
                )}
              </div>
            </div>
          )}

          {/* ID Documents Section */}
          {(gstinStatus !== "disabled" || aadhaarStatus !== "disabled" || true) && (
            <div>
              <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider mb-3">ID Documents</h3>
              <div className="grid grid-cols-3 gap-4">
                <InputField label="PAN" value={form.pan} onChange={(v) => handleChange("pan", v)} placeholder="ABCDE1234F" />
                {gstinStatus !== "disabled" && (
                  <InputField label={gstinStatus === "mandatory" ? "GSTIN *" : "GSTIN"} value={form.gstin} onChange={(v) => handleChange("gstin", v)} placeholder="22AAAAA0000A1Z5" />
                )}
                {aadhaarStatus !== "disabled" && (
                  <InputField label={aadhaarStatus === "mandatory" ? "Aadhar *" : "Aadhar"} value={form.aadhar} onChange={(v) => handleChange("aadhar", v)} placeholder="XXXX XXXX XXXX" />
                )}
              </div>
            </div>
          )}

          {/* Communication Preferences Section */}
          {config && (config.notifications || config.marketing) && (
            <div>
              <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider mb-3">Communication & Marketing</h3>
              <div className="grid grid-cols-2 gap-3">
                {config.notifications?.whatsapp && (
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#1F1F24] bg-[#0c0c0c] cursor-pointer hover:border-border transition-colors">
                    <input type="checkbox" checked={form.optInWhatsapp} onChange={(e) => setForm(prev => ({ ...prev, optInWhatsapp: e.target.checked }))} className="accent-[#D4A843] w-4 h-4" />
                    <span className="text-[12px] text-[#aaa]">Opt-in to WhatsApp updates</span>
                  </label>
                )}
                {config.notifications?.sms && (
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#1F1F24] bg-[#0c0c0c] cursor-pointer hover:border-border transition-colors">
                    <input type="checkbox" checked={form.optInSms} onChange={(e) => setForm(prev => ({ ...prev, optInSms: e.target.checked }))} className="accent-[#D4A843] w-4 h-4" />
                    <span className="text-[12px] text-[#aaa]">Opt-in to SMS alerts</span>
                  </label>
                )}
                {config.notifications?.email && (
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#1F1F24] bg-[#0c0c0c] cursor-pointer hover:border-border transition-colors">
                    <input type="checkbox" checked={form.optInEmail} onChange={(e) => setForm(prev => ({ ...prev, optInEmail: e.target.checked }))} className="accent-[#D4A843] w-4 h-4" />
                    <span className="text-[12px] text-[#aaa]">Opt-in to Email notifications</span>
                  </label>
                )}
                {config.marketing?.receivePromotions && (
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#1F1F24] bg-[#0c0c0c] cursor-pointer hover:border-border transition-colors">
                    <input type="checkbox" checked={form.optInPromotions} onChange={(e) => setForm(prev => ({ ...prev, optInPromotions: e.target.checked }))} className="accent-[#D4A843] w-4 h-4" />
                    <span className="text-[12px] text-[#aaa]">Receive Promotional Offers</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Customer Tags Section */}
          {manualTags.length > 0 && (
            <div>
              <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider mb-3">Initial Tags</h3>
              <div className="flex flex-wrap gap-2">
                {manualTags.map((tag) => {
                  const isChecked = selectedTagIds.includes(tag.id);
                  const colorMap: Record<string, string> = {
                    gold: "border-[#D4A843]/30 text-[#D4A843] bg-[#D4A843]/10",
                    red: "border-red-500/30 text-red-400 bg-red-500/10",
                    blue: "border-blue-500/30 text-blue-400 bg-blue-500/10",
                    gray: "border-gray-500/30 text-muted-foreground bg-gray-500/10",
                    green: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                    orange: "border-orange-500/30 text-orange-400 bg-orange-500/10",
                    purple: "border-purple-500/30 text-purple-400 bg-purple-500/10",
                  };
                  const activeColorClass = colorMap[tag.color.toLowerCase()] || "border-gray-500/30 text-muted-foreground bg-gray-500/10";
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-[13px] transition-all flex items-center gap-2 cursor-pointer ${
                        isChecked
                          ? `${activeColorClass} font-semibold`
                          : "border-[#1f1f1f] bg-[#0c0c0c] text-[#666] hover:border-border hover:text-[#ccc]"
                      }`}
                    >
                      <span>{tag.label}</span>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${
                        isChecked ? "border-current text-current" : "border-[#444]"
                      }`}>
                        {isChecked && "✓"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f1f1f]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl text-[13px] font-medium text-[#999] bg-onyx-elevated border border-[#252525] hover:text-foreground hover:border-border transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || checkingMobile || !!mobileError}
            className="h-10 px-6 rounded-xl text-[13px] font-semibold bg-[#D4A843] text-foreground hover:bg-[#e6bc5a] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Add Customer
              </>
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
  error = "",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#666] mb-1.5">
        {label}
        {error && <span className="text-red-400 ml-2 text-[10px]">{error}</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10 px-3.5 rounded-xl bg-[#0c0c0c] border ${error ? 'border-red-500/50 focus:border-red-500/80' : 'border-[#1f1f1f] focus:border-[#D4A843]/40'} text-[13px] text-foreground placeholder:text-[#333] outline-none transition-colors [color-scheme:dark]`}
      />
    </div>
  );
}

