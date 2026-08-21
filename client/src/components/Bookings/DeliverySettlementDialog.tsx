"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/booking-utils";
import type { Booking, PaymentMode } from "@/lib/types/booking";
import {
  X,
  Lock,
  TrendingUp,
  Wallet,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  Coins,
  Printer,
  CheckCircle2,
} from "lucide-react";

interface DeliverySettlementDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (data: { walletUsed: number; paymentMode?: PaymentMode; paymentRef?: string }) => void;
}

export function DeliverySettlementDialog({ booking, isOpen, onClose, onConfirm }: DeliverySettlementDialogProps) {
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [showReceipt, setShowReceipt] = useState(false);

  const currentRate = booking.currentRate || 6850;
  const lockedValue = booking.lockedValue || 0;
  const totalWeight = booking.items?.reduce((sum: number, item: any) => sum + (item.product?.ntWeight || 0), 0) || 0;
  const lockedRate = booking.lockedRate || booking.bookingRate || currentRate || 1;
  const lockedWeight = lockedRate > 0 ? lockedValue / lockedRate : 0;
  const remainingWeight = Math.max(0, totalWeight - lockedWeight);
  const deliveryValue = Math.round(remainingWeight * currentRate);
  const totalPayable = lockedValue + deliveryValue;
  const walletUsed = useWallet ? Math.min(parseFloat(walletAmount) || 0, booking.customer.walletBalance) : 0;
  const outstanding = Math.max(0, totalPayable - booking.advanceTotal - walletUsed);

  if (!isOpen) return null;

  if (showReceipt) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-onyx-surface border border-onyx-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-[22px] font-heading font-semibold text-platinum mb-2">Settlement Complete</h2>
            <p className="text-[13px] text-platinum-muted mb-6">Booking {booking.bookingNumber} has been delivered.</p>
            <div className="bg-onyx-elevated rounded-xl gold-border p-4 space-y-2 mb-6 text-left">
              <div className="flex justify-between text-[12px]">
                <span className="text-platinum-muted">Total Paid</span>
                <span className="text-gold font-medium tabular-nums">{formatINR(totalPayable)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-platinum-muted">Advance Used</span>
                <span className="text-platinum tabular-nums">{formatINR(booking.advanceTotal)}</span>
              </div>
              {walletUsed > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-platinum-muted">Wallet Used</span>
                  <span className="text-platinum tabular-nums">{formatINR(walletUsed)}</span>
                </div>
              )}
              <div className="flex justify-between text-[12px] border-t border-onyx-border pt-2">
                <span className="text-platinum font-medium">Final Collection</span>
                <span className="text-gold font-semibold tabular-nums">{formatINR(outstanding)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-onyx-border text-[12px] text-platinum-muted hover:text-platinum transition-colors"
              >
                Close
              </button>
              <button className="flex-1 py-2.5 rounded-lg bg-gold text-onyx font-semibold text-[12px] hover:bg-gold-light transition-colors flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-onyx-border flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-heading font-semibold text-platinum">Complete Delivery</h2>
              <p className="text-[11px] text-gold font-mono mt-0.5">{booking.bookingNumber}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-onyx-elevated text-platinum-muted hover:text-platinum transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* 4-section layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section A — Locked Portion */}
              {lockedValue > 0 && (
                <div className="p-4 rounded-xl bg-onyx-elevated border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">Locked Portion</p>
                  </div>
                  <p className="text-[22px] font-heading font-semibold text-blue-400 tabular-nums">{formatINR(lockedValue)}</p>
                  <p className="text-[11px] text-platinum-muted mt-1">@ {formatINR(booking.lockedRate)}/g (locked rate)</p>
                </div>
              )}

              {/* Section B — Delivery Rate */}
              <div className="p-4 rounded-xl bg-onyx-elevated border border-gold/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  <p className="text-[10px] text-gold uppercase tracking-wider font-semibold">Delivery Portion</p>
                </div>
                <p className="text-[22px] font-heading font-semibold text-gold tabular-nums">{formatINR(deliveryValue)}</p>
                <p className="text-[11px] text-platinum-muted mt-1">@ {formatINR(currentRate)}/g (current rate)</p>
              </div>

              {/* Section C — Wallet */}
              <div className="p-4 rounded-xl bg-onyx-elevated border border-onyx-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-platinum-muted" />
                    <p className="text-[10px] text-platinum-muted uppercase tracking-wider font-semibold">Wallet Usage</p>
                  </div>
                  <button
                    onClick={() => setUseWallet(!useWallet)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative",
                      useWallet ? "bg-gold" : "bg-onyx-border"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                      useWallet ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                <p className="text-[11px] text-platinum-muted mb-2">Available: {formatINR(booking.customer.walletBalance)}</p>
                {useWallet && (
                  <input
                    type="number"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder={`Max: ${formatINR(booking.customer.walletBalance)}`}
                    className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum tabular-nums focus:outline-none focus:border-gold/40"
                  />
                )}
              </div>

              {/* Section D — Outstanding */}
              <div className="p-4 rounded-xl bg-onyx-elevated gold-border-strong gold-glow">
                <p className="text-[10px] text-gold uppercase tracking-wider font-semibold mb-3">Outstanding</p>
                <div className="space-y-1.5 text-[12px] mb-3">
                  <div className="flex justify-between"><span className="text-platinum-muted">Total Payable</span><span className="text-platinum tabular-nums">{formatINR(totalPayable)}</span></div>
                  <div className="flex justify-between"><span className="text-platinum-muted">Advance Paid</span><span className="text-emerald-400 tabular-nums">-{formatINR(booking.advanceTotal)}</span></div>
                  {walletUsed > 0 && <div className="flex justify-between"><span className="text-platinum-muted">Wallet Used</span><span className="text-emerald-400 tabular-nums">-{formatINR(walletUsed)}</span></div>}
                </div>
                <p className="text-[28px] font-heading font-semibold text-gold leading-none tabular-nums">{formatINR(outstanding)}</p>
              </div>
            </div>

            {/* Payment for outstanding */}
            {outstanding > 0 && (
              <div className="p-4 rounded-xl bg-onyx-elevated border border-onyx-border">
                <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-3 font-medium">Pay Outstanding</p>
                <div className="flex flex-wrap gap-2">
                  {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-[11px] font-medium transition-all",
                        paymentMode === mode ? "bg-gold/10 border-gold/40 text-gold" : "border-onyx-border text-platinum-muted hover:border-gold/20"
                      )}
                    >
                      {mode.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-onyx-border flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-onyx-border text-[12px] text-platinum-muted hover:text-platinum transition-colors">
              Cancel
            </button>
            <button
              onClick={() => setShowReceipt(true)}
              className="px-6 py-2.5 rounded-lg bg-gold text-onyx font-semibold text-[13px] hover:bg-gold-light transition-colors"
            >
              Generate Final Settlement
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
