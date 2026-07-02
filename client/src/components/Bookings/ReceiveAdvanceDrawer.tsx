"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR, formatWeight, getAdvanceColor, getPaymentModeLabel, calcAdvancePercent } from "@/lib/booking-utils";
import { AdvanceProgressBar } from "./AdvanceProgressBar";
import { useAddAdvance } from "@/hooks/useBookings";
import type { Booking, PaymentMode } from "@/lib/types/booking";
import {
  X,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  Wallet,
  Coins,
  ShieldCheck,
  Unlock,
  AlertTriangle,
} from "lucide-react";

const PAYMENT_MODES: { mode: PaymentMode; icon: React.ElementType; label: string }[] = [
  { mode: "CASH", icon: Banknote, label: "Cash" },
  { mode: "UPI", icon: Smartphone, label: "UPI" },
  { mode: "CARD", icon: CreditCard, label: "Card" },
  { mode: "BANK_TRANSFER", icon: Landmark, label: "Bank Transfer" },
  { mode: "WALLET", icon: Wallet, label: "Wallet" },
  { mode: "GOLD_22K", icon: Coins, label: "22K Gold" },
  { mode: "GOLD_24K", icon: Coins, label: "24K Gold" },
];

interface ReceiveAdvanceDrawerProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (data: { type: PaymentMode; amount: number; paymentRef?: string; metalWeight?: number }) => void;
}

export function ReceiveAdvanceDrawer({ booking, isOpen, onClose, onConfirm }: ReceiveAdvanceDrawerProps) {
  const [selectedMode, setSelectedMode] = useState<PaymentMode>("CASH");
  const [amount, setAmount] = useState("");
  const [metalWeight, setMetalWeight] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const isMetalMode = selectedMode === "GOLD_22K" || selectedMode === "GOLD_24K";
  const metalRate22K = booking.currentRate || booking.bookingRate || 0;
  const metalRate24K = metalRate22K > 0 ? Math.round(metalRate22K * (24 / 22)) : 0;
  const metalRate = selectedMode === "GOLD_22K" ? metalRate22K : metalRate24K;
  
  const calculatedAmount = isMetalMode && metalWeight && metalRate > 0
    ? Math.round(parseFloat(metalWeight) * metalRate)
    : parseFloat(amount) || 0;

  const newTotal = booking.advanceTotal + calculatedAmount;
  const newPercent = calcAdvancePercent(newTotal, booking.grandTotal);
  const colors = getAdvanceColor(newPercent);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-onyx-surface border-l border-onyx-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-onyx-surface border-b border-onyx-border p-5 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-heading font-semibold text-platinum">Add Advance</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-onyx-elevated text-platinum-muted hover:text-platinum transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[12px] text-gold font-mono">{booking.bookingNumber}</p>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-platinum-muted">
            <span>{booking.customer.name}</span>
            <span>·</span>
            <span>{booking.items?.[0]?.product?.productCode || "Items"}</span>
            <span>·</span>
            <span>Advance: {booking.advancePercent}%</span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Payment Mode Selector */}
          <div>
            <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-3 font-medium">Payment Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_MODES.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => { setSelectedMode(mode); setAmount(""); setMetalWeight(""); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-medium transition-all",
                    selectedMode === mode
                      ? "bg-gold/10 border-gold/40 text-gold"
                      : "bg-onyx-elevated border-onyx-border text-platinum-muted hover:border-gold/20"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-onyx-elevated rounded-xl gold-border p-5 space-y-4">
            {isMetalMode ? (
              <>
                <div>
                  <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">
                    Weight ({selectedMode === "GOLD_22K" ? "22K" : "24K"})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={metalWeight}
                    onChange={(e) => setMetalWeight(e.target.value)}
                    placeholder="Enter weight in grams"
                    className="w-full h-12 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[16px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 tabular-nums"
                  />
                </div>
                {metalWeight && metalRate && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-onyx-surface">
                    <span className="text-[11px] text-platinum-muted">{metalWeight}g × {formatINR(metalRate)}/g</span>
                    <span className="text-[16px] font-medium text-gold tabular-nums">= {formatINR(calculatedAmount)}</span>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-12 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[16px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 tabular-nums"
                />
              </div>
            )}

            {(selectedMode === "UPI" || selectedMode === "CARD" || selectedMode === "BANK_TRANSFER") && (
              <div>
                <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">
                  {selectedMode === "UPI" ? "UPI Ref" : selectedMode === "CARD" ? "Last 4 Digits" : "UTR Number"}
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40"
                />
              </div>
            )}
          </div>

          {/* Live Summary */}
          <div className="bg-onyx-elevated rounded-xl gold-border p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Previous Total</span>
              <span className="text-[13px] text-platinum tabular-nums">{formatINR(booking.advanceTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-platinum-muted uppercase tracking-wider">This Advance</span>
              <span className="text-[13px] text-gold tabular-nums">{formatINR(calculatedAmount)}</span>
            </div>
            <div className="border-t border-onyx-border pt-3 flex justify-between">
              <span className="text-[11px] text-platinum font-medium uppercase tracking-wider">New Total</span>
              <span className="text-[14px] text-gold font-semibold tabular-nums">{formatINR(newTotal)}</span>
            </div>
            <AdvanceProgressBar percentage={newPercent} size="md" />

            {/* Lock Eligibility */}
            <div className={cn("p-3 rounded-lg border text-[11px] font-medium flex items-center gap-2", colors.bg, colors.border, colors.text)}>
              {booking.deliveryRatePlan === "OPTION_C_METAL_WALLET" ? (
                <>
                  {isMetalMode ? (
                    <><ShieldCheck className="w-4 h-4" /> Metal advance will be stored in customer's wallet as 24K Gold.</>
                  ) : calculatedAmount >= 10000 ? (
                    <><Coins className="w-4 h-4" /> Cash advance will be converted to ~{(calculatedAmount / ((booking.currentRate || booking.bookingRate || 7000) * (24/22))).toFixed(3)}g of 24K Metal in wallet.</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4" /> Advance below ₹10,000 threshold for Metal Wallet conversion.</>
                  )}
                </>
              ) : newPercent >= 80 ? (
                <><ShieldCheck className="w-4 h-4" /> RATE LOCK ELIGIBLE</>
              ) : newPercent >= 30 ? (
                <><Unlock className="w-4 h-4" /> Partial Lock — add more to lock rate</>
              ) : (
                <><AlertTriangle className="w-4 h-4" /> Below minimum advance</>
              )}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={() => {
              onConfirm?.({ type: selectedMode, amount: calculatedAmount, paymentRef: paymentRef || undefined, metalWeight: isMetalMode ? parseFloat(metalWeight) : undefined });
              onClose();
            }}
            disabled={calculatedAmount <= 0}
            className="w-full h-12 rounded-xl bg-gold text-onyx font-semibold text-[14px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Advance — {formatINR(calculatedAmount)}
          </button>
        </div>
      </div>
    </>
  );
}
