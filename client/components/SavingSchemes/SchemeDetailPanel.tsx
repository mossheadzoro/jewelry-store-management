"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  PiggyBank,
  Calendar,
  CreditCard,
  User,
  Clock,
  Plus,
  Ban,
  ChevronUp,
  Coins,
  Gift,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
} from "lucide-react";
import RecordDepositModal from "./RecordDepositModal";

interface SchemeDetailPanelProps {
  schemeId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  FIXED_MONTHLY: { label: "Fixed Monthly", color: "text-[#C9943A]" },
  ANONYMOUS_DEPOSIT: { label: "Anonymous Deposit", color: "text-blue-400" },
  GOLD_DEPOSIT: { label: "Gold Deposit", color: "text-amber-400" },
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  MATURED: { label: "Matured", bg: "bg-[#C9943A]/10", text: "text-[#C9943A]" },
  REDEEMED: { label: "Redeemed", bg: "bg-blue-500/10", text: "text-blue-400" },
  PARTIALLY_REDEEMED: { label: "Partial Redeem", bg: "bg-purple-500/10", text: "text-purple-400" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-500/10", text: "text-red-400" },
  EXPIRED: { label: "Expired", bg: "bg-gray-500/10", text: "text-gray-400" },
};

export default function SchemeDetailPanel({ schemeId, onClose, onUpdated }: SchemeDetailPanelProps) {
  const [scheme, setScheme] = useState<any>(null);
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [extending, setExtending] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schemes/${schemeId}`);
      if (res.ok) {
        const data = await res.json();
        setScheme(data.scheme);
        setBonusInfo(data.bonusInfo);
      }
    } catch (e) {
      console.error("Failed to fetch scheme detail", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [schemeId]);

  const handleCancel = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/schemes/${schemeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      if (res.ok) {
        onUpdated();
        fetchDetail();
      }
    } catch (e) {}
    setCancelling(false);
  };

  const handleExtend = async (newDuration: number) => {
    if (!confirm(`Are you sure you want to continue this scheme for Part 2 (${newDuration} months)?`)) return;
    setExtending(true);
    try {
      const res = await fetch(`/api/schemes/${schemeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXTEND", maxDurationMonths: newDuration }),
      });
      if (res.ok) {
        onUpdated();
        fetchDetail();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to extend scheme");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to extend scheme");
    }
    setExtending(false);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const typeConf = scheme ? TYPE_LABELS[scheme.type] : null;
  const statusConf = scheme ? STATUS_BADGES[scheme.status] : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0D0D0F] border-l border-[#1F1F24] overflow-y-auto shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D0F] border-b border-[#1F1F24] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F0EBE0]">Scheme Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1A1A1D] text-[#6B6560] hover:text-[#F0EBE0] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#6B6560]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : scheme ? (
          <div className="px-6 py-6 space-y-6">
            {/* ─── Hero Card ─────────────────────────────────────── */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#111113] to-[#0A0A0B] border border-[#1F1F24]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-2xl font-mono font-bold text-[#C9943A]">{scheme.schemeNumber}</p>
                  {scheme.physicalCardNumber && (
                    <p className="text-xs text-[#6B6560] flex items-center gap-1 mt-1">
                      <CreditCard className="w-3 h-3" /> Card: {scheme.physicalCardNumber}
                    </p>
                  )}
                </div>
                {statusConf && (
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusConf.bg} ${statusConf.text}`}>
                    {statusConf.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#6B6560] text-xs mb-0.5">Customer</p>
                  <p className="text-[#F0EBE0] font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#6B6560]" />
                    {scheme.customer.name}
                  </p>
                  <p className="text-[10px] text-[#6B6560]">{scheme.customer.mobile}</p>
                </div>
                <div>
                  <p className="text-[#6B6560] text-xs mb-0.5">Type</p>
                  <p className={`font-medium ${typeConf?.color}`}>{typeConf?.label}</p>
                </div>
                <div>
                  <p className="text-[#6B6560] text-xs mb-0.5">Started</p>
                  <p className="text-[#F0EBE0]">{new Date(scheme.startDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[#6B6560] text-xs mb-0.5">Maturity</p>
                  <p className="text-[#F0EBE0]">
                    {scheme.maturityDate ? new Date(scheme.maturityDate).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Progress / Totals ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#111113] border border-[#1F1F24] text-center">
                <Coins className="w-5 h-5 text-[#C9943A] mx-auto mb-2" />
                <p className="text-lg font-mono font-semibold text-[#F0EBE0]">
                  {formatCurrency(scheme.totalCashDeposited)}
                </p>
                <p className="text-[10px] text-[#6B6560] uppercase">Cash Deposited</p>
              </div>
              <div className="p-4 rounded-xl bg-[#111113] border border-[#1F1F24] text-center">
                <Gift className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-lg font-mono font-semibold text-emerald-400">
                  {formatCurrency(scheme.totalBonusAmount)}
                </p>
                <p className="text-[10px] text-[#6B6560] uppercase">Bonus Credited</p>
              </div>
              <div className="p-4 rounded-xl bg-[#111113] border border-[#1F1F24] text-center">
                <ArrowUpCircle className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-lg font-mono font-semibold text-blue-400">
                  {formatCurrency(scheme.totalRedeemed)}
                </p>
                <p className="text-[10px] text-[#6B6560] uppercase">Redeemed</p>
              </div>
            </div>

            {/* Available Balance */}
            <div className="p-4 rounded-xl bg-[#C9943A]/5 border border-[#C9943A]/20 text-center">
              <p className="text-xs text-[#C9943A] font-semibold uppercase mb-1">Available Balance</p>
              <p className="text-3xl font-mono font-bold text-[#C9943A]">
                {formatCurrency(scheme.totalCashDeposited + scheme.totalBonusAmount - scheme.totalRedeemed)}
              </p>
              {scheme.totalGoldDepositedGm > 0 && (
                <p className="text-sm text-amber-400 mt-1">+ {scheme.totalGoldDepositedGm.toFixed(2)}g gold</p>
              )}
            </div>

            {/* Type 1 Bonus Info */}
            {bonusInfo && (
              <div className="p-4 rounded-xl bg-[#111113] border border-[#1F1F24]">
                <p className="text-xs font-semibold text-[#6B6560] uppercase mb-3">Fixed Monthly Progress</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 bg-[#1A1A1D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9943A] to-[#E8B84B] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (bonusInfo.paidMonths / scheme.maxDurationMonths) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#F0EBE0] font-mono">
                    {bonusInfo.paidMonths}/{scheme.maxDurationMonths}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {bonusInfo.eligibleForYear1Bonus && (
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                      🎉 Year 1 Bonus Available
                    </span>
                  )}
                  {bonusInfo.canRedeemPart1 && (
                    <span className="px-2 py-1 rounded-md bg-[#C9943A]/10 text-[#C9943A] font-medium">
                      Can redeem Part 1
                    </span>
                  )}
                  {bonusInfo.canRedeemPart1 && scheme.maxDurationMonths === 12 && (
                    <button
                      onClick={() => handleExtend(24)}
                      disabled={extending}
                      className="ml-auto px-3 py-1 rounded-md bg-[#C9943A] text-black font-bold hover:bg-[#E8B84B] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {extending ? "Continuing..." : "Continue Part 2"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Actions ────────────────────────────────────────── */}
            {scheme.status === "ACTIVE" && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-black text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Record Deposit
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/5 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ─── Deposit Timeline ────────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-[#F0EBE0] mb-4 flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-[#C9943A]" />
                Deposit History ({scheme.deposits.length})
              </h3>
              {scheme.deposits.length === 0 ? (
                <p className="text-xs text-[#6B6560] text-center py-6">No deposits yet</p>
              ) : (
                <div className="space-y-2">
                  {scheme.deposits.map((d: any) => (
                    <div
                      key={d.id}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                        d.isBonus
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-[#111113] border-[#1F1F24]"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        d.isBonus ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C9943A]/10 text-[#C9943A]"
                      }`}>
                        {d.isBonus ? "🎁" : d.monthNumber || "#"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#F0EBE0] font-medium">
                            {d.cashAmount ? formatCurrency(d.cashAmount) : ""}
                            {d.metalWeightGm ? `${d.metalWeightGm}g ${d.metalType || ""}` : ""}
                          </span>
                          {d.isBonus && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">BONUS</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B6560] truncate">
                          {d.receiptNumber} • {new Date(d.depositedAt).toLocaleDateString("en-IN")}
                          {d.remarks ? ` • ${d.remarks}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Redemption History ──────────────────────────────── */}
            {scheme.redemptions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#F0EBE0] mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                  Redemption History ({scheme.redemptions.length})
                </h3>
                <div className="space-y-2">
                  {scheme.redemptions.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#111113] border border-[#1F1F24]">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <ArrowUpCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-[#F0EBE0] font-medium">{formatCurrency(r.amountUsed)}</span>
                        <p className="text-[10px] text-[#6B6560]">
                          {new Date(r.redeemedAt).toLocaleDateString("en-IN")}
                          {r.invoiceId ? ` • Invoice #${r.invoiceId}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-[#6B6560]">
            Scheme not found
          </div>
        )}

        {/* Deposit modal */}
        {showDepositModal && scheme && (
          <RecordDepositModal
            scheme={scheme}
            onClose={() => setShowDepositModal(false)}
            onDeposited={() => {
              setShowDepositModal(false);
              fetchDetail();
              onUpdated();
            }}
          />
        )}
      </div>
    </div>
  );
}
