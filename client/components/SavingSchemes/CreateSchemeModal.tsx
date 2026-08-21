"use client";

import React, { useState, useEffect } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import {
  X,
  Search,
  CreditCard,
  Calendar,
  ChevronRight,
  ChevronLeft,
  PiggyBank,
  Banknote,
  Gem,
  CheckCircle2,
  Loader2,
  UserPlus,
} from "lucide-react";
import AddCustomerModal from "../Customer/AddCustomerModal";

interface CreateSchemeModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type SchemeType = "FIXED_MONTHLY" | "ANONYMOUS_DEPOSIT" | "GOLD_DEPOSIT";

const SCHEME_TYPES: {
  id: SchemeType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  features: string[];
}[] = [
  {
    id: "FIXED_MONTHLY",
    title: "Fixed Monthly",
    subtitle: "₹1,000 – ₹5,000/month",
    icon: <Calendar className="w-6 h-6" />,
    color: "text-[#C9943A]",
    border: "border-[#C9943A]",
    features: [
      "Fixed monthly deposits",
      "1 bonus month after 12 months",
      "2 bonus months after 24 months",
      "Max 2 year duration",
      "No cash return",
    ],
  },
  {
    id: "ANONYMOUS_DEPOSIT",
    title: "Anonymous Deposit",
    subtitle: "Flexible cash & metal deposits",
    icon: <Banknote className="w-6 h-6" />,
    color: "text-blue-400",
    border: "border-blue-400",
    features: [
      "Deposit anytime, any amount",
      "Cash minimum ₹500",
      "Accept gold, silver & metals",
      "Major making charge discount",
      "Redeem only as jewellery",
    ],
  },
  {
    id: "GOLD_DEPOSIT",
    title: "Gold Deposit",
    subtitle: "Deposit & book gold",
    icon: <Gem className="w-6 h-6" />,
    color: "text-amber-400",
    border: "border-amber-400",
    features: [
      "Deposit gold at any time",
      "Buy & book gold weight",
      "Must redeem as jewellery",
      "Gold rate at delivery time",
      "Custom duration",
    ],
  },
];

export default function CreateSchemeModal({ onClose, onCreated }: CreateSchemeModalProps) {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, fetchGlobalSettings } = useProductSettingsStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  const defaultConfig = {
    allowedTypes: ["FIXED_MONTHLY", "ANONYMOUS_DEPOSIT", "GOLD_DEPOSIT"],
    fixedMonthly: { minDeposit: 1000, maxDeposit: 50000, durations: [12, 24], bonusMonths: { 12: 1, 24: 2 } },
  };

  const config = globalSettings?.schemeConfig 
    ? { ...defaultConfig, ...(globalSettings.schemeConfig as any) }
    : defaultConfig;

  const allowedSchemeTypes = SCHEME_TYPES.filter(t => config.allowedTypes.includes(t.id));

  // Step 1: Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Step 2: Scheme type
  const [selectedType, setSelectedType] = useState<SchemeType | null>(null);

  // Step 3: Configuration
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [duration, setDuration] = useState(12);
  const [cardNumber, setCardNumber] = useState("");

  // Search customers
  useEffect(() => {
    if (customerSearch.trim().length < 2) {
      setCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/customer/search?query=${encodeURIComponent(customerSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch (e) {}
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedType) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          branchId: selectedBranch?.id,
          type: selectedType,
          fixedMonthlyAmount: selectedType === "FIXED_MONTHLY" ? monthlyAmount : null,
          maxDurationMonths: duration,
          physicalCardNumber: cardNumber.trim() || null,
        }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create scheme");
      }
    } catch (e) {
      alert("Network error");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D0D0F] border border-[#1F1F24] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D0F] border-b border-[#1F1F24] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-5 h-5 text-[#C9943A]" />
            <h2 className="text-lg font-semibold text-[#F0EBE0]">Create Saving Scheme</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1A1A1D] text-[#6B6560] hover:text-[#F0EBE0] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s === step
                    ? "bg-[#C9943A] text-foreground"
                    : s < step
                    ? "bg-[#C9943A]/20 text-[#C9943A]"
                    : "bg-[#1A1A1D] text-[#6B6560]"
                }`}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? "bg-[#C9943A]/30" : "bg-[#1F1F24]"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 pb-6">
          {/* ─── Step 1: Customer ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#F0EBE0] mb-2 block">Find Customer</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
                  <input
                    type="text"
                    placeholder="Search by name, mobile, or email…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50"
                    autoFocus
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="flex items-center gap-1.5 text-xs text-[#C9943A] hover:text-[#E8B84B] transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add New Customer
                  </button>
                </div>
              </div>

              {searchLoading && (
                <div className="flex items-center justify-center py-6 text-[#6B6560]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}

              {customers.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setStep(2);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                        selectedCustomer?.id === c.id
                          ? "bg-[#C9943A]/10 border-[#C9943A]/30"
                          : "bg-[#111113] border-[#1F1F24] hover:border-[#C9943A]/20 hover:bg-[#1A1A1D]"
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#F0EBE0]">{c.name}</p>
                        <p className="text-xs text-[#6B6560]">{c.mobile}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6B6560]" />
                    </button>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="p-4 rounded-xl bg-[#C9943A]/5 border border-[#C9943A]/20">
                  <p className="text-xs text-[#C9943A] font-semibold uppercase mb-1">Selected</p>
                  <p className="text-sm text-[#F0EBE0] font-medium">{selectedCustomer.name}</p>
                  <p className="text-xs text-[#6B6560]">{selectedCustomer.mobile}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 2: Scheme Type ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-[#6B6560] mb-2">Select scheme type for <span className="text-[#F0EBE0] font-medium">{selectedCustomer?.name}</span></p>
              <div className="grid grid-cols-1 gap-4">
                {allowedSchemeTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedType(t.id);
                      if (t.id === "FIXED_MONTHLY") {
                        setDuration(config.fixedMonthly.durations[0] || 12);
                        setMonthlyAmount(config.fixedMonthly.minDeposit);
                      } else {
                        setDuration(12);
                      }
                    }}
                    className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedType === t.id
                        ? `${t.border} bg-[#1A1A1D]`
                        : "border-[#1F1F24] hover:border-border hover:bg-[#1A1A1D]/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${t.color} bg-[#111113]`}>
                        {t.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm font-semibold ${t.color}`}>{t.title}</h3>
                        <p className="text-xs text-[#6B6560] mt-0.5">{t.subtitle}</p>
                        <ul className="mt-3 space-y-1">
                          {t.id === "FIXED_MONTHLY" ? (
                            <>
                              <li className="text-xs text-[#888] flex items-center gap-1.5">
                                <span className={`w-1 h-1 rounded-full ${selectedType === t.id ? "bg-[#C9943A]" : "bg-[#444]"}`} />
                                Fixed monthly deposits
                              </li>
                              {config.fixedMonthly.durations?.map((d: number) => (
                                config.fixedMonthly.bonusMonths?.[d] > 0 && (
                                  <li key={d} className="text-xs text-[#888] flex items-center gap-1.5">
                                    <span className={`w-1 h-1 rounded-full ${selectedType === t.id ? "bg-[#C9943A]" : "bg-[#444]"}`} />
                                    {config.fixedMonthly.bonusMonths[d]} bonus month{config.fixedMonthly.bonusMonths[d] > 1 ? 's' : ''} after {d} months
                                  </li>
                                )
                              ))}
                              <li className="text-xs text-[#888] flex items-center gap-1.5">
                                <span className={`w-1 h-1 rounded-full ${selectedType === t.id ? "bg-[#C9943A]" : "bg-[#444]"}`} />
                                No cash return
                              </li>
                            </>
                          ) : t.features.map((f, i) => (
                            <li key={i} className="text-xs text-[#888] flex items-center gap-1.5">
                              <span className={`w-1 h-1 rounded-full ${selectedType === t.id ? "bg-[#C9943A]" : "bg-[#444]"}`} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {selectedType === t.id && (
                        <CheckCircle2 className={`w-5 h-5 ${t.color} shrink-0`} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 3: Configure ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-[#6B6560]">Configure scheme details</p>

              {/* Type 1: Monthly amount slider */}
              {selectedType === "FIXED_MONTHLY" && (
                <div>
                  <label className="text-sm font-medium text-[#F0EBE0] mb-2 block">
                    Monthly Deposit Amount
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={config.fixedMonthly.minDeposit}
                      max={config.fixedMonthly.maxDeposit}
                      step={500}
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                      className="flex-1 accent-[#C9943A]"
                    />
                    <span className="text-lg font-mono font-semibold text-[#C9943A] w-20 text-right">
                      ₹{monthlyAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6B6560] mt-1">
                    <span>₹{config.fixedMonthly.minDeposit.toLocaleString()}</span>
                    <span>₹{config.fixedMonthly.maxDeposit.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-[#F0EBE0] mb-2 block">Duration</label>
                {selectedType === "FIXED_MONTHLY" ? (
                  <div className="flex gap-3">
                    {config.fixedMonthly.durations?.map((d: number) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                          duration === d
                            ? "bg-[#C9943A]/10 border-[#C9943A]/40 text-[#C9943A]"
                            : "border-[#1F1F24] text-[#6B6560] hover:text-[#F0EBE0] hover:border-border"
                        }`}
                      >
                        {d} Months ({d / 12} Year{d > 12 ? "s" : ""})
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-24 px-4 py-2.5 rounded-xl bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50"
                    />
                    <span className="text-sm text-[#6B6560]">months</span>
                  </div>
                )}
              </div>

              {/* Physical Card Number */}
              <div>
                <label className="text-sm font-medium text-[#F0EBE0] mb-2 block flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#C9943A]" />
                  Physical Card Number <span className="text-[10px] text-[#6B6560]">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter card number from physical card"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50"
                />
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] space-y-2">
                <p className="text-xs font-semibold text-[#C9943A] uppercase">Summary</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-[#6B6560]">Customer</span>
                  <span className="text-[#F0EBE0]">{selectedCustomer?.name}</span>
                  <span className="text-[#6B6560]">Scheme Type</span>
                  <span className="text-[#F0EBE0]">{SCHEME_TYPES.find((t) => t.id === selectedType)?.title}</span>
                  {selectedType === "FIXED_MONTHLY" && (
                    <>
                      <span className="text-[#6B6560]">Monthly Amount</span>
                      <span className="text-[#F0EBE0]">₹{monthlyAmount.toLocaleString()}</span>
                    </>
                  )}
                  <span className="text-[#6B6560]">Duration</span>
                  <span className="text-[#F0EBE0]">{duration} months</span>
                  {selectedType === "FIXED_MONTHLY" && (
                    <>
                      <span className="text-[#6B6560]">Total Savings</span>
                      <span className="text-emerald-400 font-medium">
                        ₹{(monthlyAmount * duration).toLocaleString()}
                        {config.fixedMonthly.bonusMonths?.[duration] > 0 && ` + ₹${(monthlyAmount * config.fixedMonthly.bonusMonths[duration]).toLocaleString()} bonus`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#1F1F24]">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#6B6560] hover:text-[#F0EBE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !selectedCustomer) || (step === 2 && !selectedType)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C9943A] text-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-[#C9943A]/20 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Create Scheme
              </button>
            )}
          </div>
        </div>
      </div>
      <AddCustomerModal
        open={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={(customer) => {
          setShowAddCustomerModal(false);
          if (customer) {
            setSelectedCustomer(customer);
            setStep(2);
          }
        }}
      />
    </div>
  );
}
