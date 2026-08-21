"use client";

import React, { useState } from "react";
import {
  X,
  Banknote,
  Gem,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface RecordDepositModalProps {
  scheme: any;
  onClose: () => void;
  onDeposited: () => void;
}

export default function RecordDepositModal({ scheme, onClose, onDeposited }: RecordDepositModalProps) {
  const [depositType, setDepositType] = useState<"CASH" | "GOLD" | "SILVER" | "OTHER_METAL">(
    scheme.type === "GOLD_DEPOSIT" ? "GOLD" : "CASH"
  );
  const [cashAmount, setCashAmount] = useState(
    scheme.type === "FIXED_MONTHLY" && scheme.fixedMonthlyAmount
      ? scheme.fixedMonthlyAmount.toString()
      : ""
  );
  const [metalWeight, setMetalWeight] = useState("");
  const [metalPurity, setMetalPurity] = useState("22");
  const [metalType, setMetalType] = useState("GOLD");
  const [metalRate, setMetalRate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // How many months paid already (for Type 1)
  const paidMonths = scheme.deposits?.filter((d: any) => !d.isBonus).length || 0;
  const nextMonth = paidMonths + 1;

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const body: any = {
        depositType,
        remarks,
      };

      if (depositType === "CASH") {
        body.cashAmount = Number(cashAmount);
      } else {
        body.metalWeightGm = Number(metalWeight);
        body.metalPurity = Number(metalPurity);
        body.metalType = metalType;
        body.metalRatePerGm = metalRate ? Number(metalRate) : null;
      }

      const res = await fetch(`/api/schemes/${scheme.id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onDeposited();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to record deposit");
      }
    } catch (e) {
      setError("Network error");
    }
    setSubmitting(false);
  };

  const isFixedMonthly = scheme.type === "FIXED_MONTHLY";
  const isAnonymous = scheme.type === "ANONYMOUS_DEPOSIT";
  const isGoldDeposit = scheme.type === "GOLD_DEPOSIT";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D0D0F] border border-[#1F1F24] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#1F1F24] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F0EBE0]">Record Deposit</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1A1A1D] text-[#6B6560] hover:text-[#F0EBE0] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Scheme info bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#111113] border border-[#1F1F24]">
            <div>
              <p className="text-xs text-[#6B6560]">{scheme.schemeNumber}</p>
              <p className="text-sm text-[#F0EBE0] font-medium">{scheme.customer?.name}</p>
            </div>
            {isFixedMonthly && (
              <div className="text-right">
                <p className="text-xs text-[#C9943A] font-semibold">Month {nextMonth}</p>
                <p className="text-[10px] text-[#6B6560]">of {scheme.maxDurationMonths}</p>
              </div>
            )}
          </div>

          {/* Deposit Type Toggle (only for Anonymous) */}
          {isAnonymous && (
            <div>
              <label className="text-sm font-medium text-[#F0EBE0] mb-2 block">Deposit Type</label>
              <div className="flex gap-2">
                {(["CASH", "GOLD", "SILVER", "OTHER_METAL"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDepositType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      depositType === t
                        ? "bg-[#C9943A]/10 border-[#C9943A]/40 text-[#C9943A]"
                        : "border-[#1F1F24] text-[#6B6560] hover:text-[#F0EBE0]"
                    }`}
                  >
                    {t === "OTHER_METAL" ? "Other" : t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cash Amount */}
          {(depositType === "CASH" && !isGoldDeposit) && (
            <div>
              <label className="text-sm font-medium text-[#F0EBE0] mb-2 block flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[#C9943A]" />
                Amount (₹)
              </label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                min={isFixedMonthly ? 1000 : 500}
                max={isFixedMonthly ? 5000 : undefined}
                placeholder={isFixedMonthly ? "₹1,000 – ₹5,000" : "Min ₹500"}
                className="w-full px-4 py-3 rounded-xl bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50 font-mono text-lg"
                autoFocus
              />
              {isFixedMonthly && (
                <p className="text-[10px] text-[#6B6560] mt-1">Fixed amount: ₹1,000 – ₹5,000 per month</p>
              )}
              {isAnonymous && (
                <p className="text-[10px] text-[#6B6560] mt-1">Minimum deposit: ₹500</p>
              )}
            </div>
          )}

          {/* Metal fields */}
          {(depositType !== "CASH" || isGoldDeposit) && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#F0EBE0] mb-2 block flex items-center gap-2">
                  <Gem className="w-4 h-4 text-amber-400" />
                  Weight (grams)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={metalWeight}
                  onChange={(e) => setMetalWeight(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50 font-mono text-lg"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B6560] mb-1 block">Purity (K)</label>
                  <select
                    value={metalPurity}
                    onChange={(e) => setMetalPurity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50"
                  >
                    <option value="24">24K</option>
                    <option value="22">22K</option>
                    <option value="18">18K</option>
                    <option value="14">14K</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B6560] mb-1 block">Rate (₹/gm)</label>
                  <input
                    type="number"
                    value={metalRate}
                    onChange={(e) => setMetalRate(e.target.value)}
                    placeholder="Current rate"
                    className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50"
                  />
                </div>
              </div>
              {!isGoldDeposit && (
                <div>
                  <label className="text-xs text-[#6B6560] mb-1 block">Metal Type</label>
                  <select
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="text-xs text-[#6B6560] mb-1 block">Remarks (optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any notes…"
              className="w-full px-4 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-[#C9943A]/20 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Record Deposit
          </button>
        </div>
      </div>
    </div>
  );
}
