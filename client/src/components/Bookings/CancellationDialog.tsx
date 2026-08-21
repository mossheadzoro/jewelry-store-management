"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/booking-utils";
import type { Booking, CancellationReason, RefundOption } from "@/lib/types/booking";
import { X, AlertTriangle, Wallet, Banknote } from "lucide-react";

const CANCELLATION_REASONS: { value: CancellationReason; label: string }[] = [
  { value: "CUSTOMER_REQUEST", label: "Customer Request" },
  { value: "RATE_DISSATISFACTION", label: "Rate Dissatisfaction" },
  { value: "PRODUCT_NOT_AVAILABLE", label: "Product Not Available" },
  { value: "BRANCH_TRANSFER", label: "Branch Transfer" },
  { value: "OTHER", label: "Other" },
];

interface CancellationDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (data: { reason: CancellationReason; refundOption: RefundOption; notes?: string }) => void;
}

export function CancellationDialog({ booking, isOpen, onClose, onConfirm }: CancellationDialogProps) {
  const [reason, setReason] = useState<CancellationReason>("CUSTOMER_REQUEST");
  const [refundOption, setRefundOption] = useState<RefundOption>("WALLET");
  const [notes, setNotes] = useState("");

  const cancellationCharge = Math.round(booking.advanceTotal * 0.02);
  const netRefund = booking.advanceTotal - cancellationCharge;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-onyx-surface border border-onyx-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-onyx-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-[16px] font-heading font-semibold text-platinum">Cancel Booking</h2>
                <p className="text-[11px] text-gold font-mono">{booking.bookingNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-onyx-elevated text-platinum-muted hover:text-platinum transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Booking Summary */}
            <div className="p-4 rounded-xl bg-onyx-elevated border border-onyx-border space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-platinum-muted">Customer</span>
                <span className="text-platinum">{booking.customer.name}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-platinum-muted">Product</span>
                <span className="text-platinum">{booking.items?.[0]?.product?.name || "Items"}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-platinum-muted">Advance Collected</span>
                <span className="text-gold font-medium tabular-nums">{formatINR(booking.advanceTotal)}</span>
              </div>
            </div>

            {/* Refund Options */}
            <div>
              <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-3 font-medium">Refund Option</p>
              <div className="space-y-2">
                {/* Option A: Wallet */}
                <button
                  onClick={() => setRefundOption("WALLET")}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    refundOption === "WALLET"
                      ? "bg-gold/5 gold-border-strong"
                      : "bg-onyx-elevated border-onyx-border hover:border-gold/20"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-4 h-4 text-gold" />
                    <span className="text-[13px] font-medium text-platinum">Move to Wallet</span>
                  </div>
                  <p className="text-[11px] text-platinum-muted ml-7">Full advance → customer wallet. Available for future purchases.</p>
                  <p className="text-[13px] text-gold font-medium ml-7 mt-2 tabular-nums">New Wallet Balance: {formatINR(booking.customer.walletBalance + booking.advanceTotal)}</p>
                </button>

                {/* Option B: Refund with deduction */}
                <button
                  onClick={() => setRefundOption("REFUND_WITH_DEDUCTION")}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    refundOption === "REFUND_WITH_DEDUCTION"
                      ? "bg-gold/5 gold-border-strong"
                      : "bg-onyx-elevated border-onyx-border hover:border-gold/20"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Banknote className="w-4 h-4 text-gold" />
                    <span className="text-[13px] font-medium text-platinum">Refund with Deduction</span>
                  </div>
                  <p className="text-[11px] text-platinum-muted ml-7">2% cancellation charge deducted from advance.</p>
                  <div className="ml-7 mt-2 space-y-1 text-[12px] tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-platinum-muted">Advance</span>
                      <span className="text-platinum">{formatINR(booking.advanceTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">2% Charge</span>
                      <span className="text-red-400">-{formatINR(cancellationCharge)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-onyx-border pt-1">
                      <span className="text-platinum">Net Refund</span>
                      <span className="text-gold">{formatINR(netRefund)}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[10px] text-platinum-muted uppercase tracking-wider mb-2 font-medium">Cancellation Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as CancellationReason)}
                className="w-full h-10 px-3 rounded-lg bg-onyx-elevated border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold/40"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] text-platinum-muted uppercase tracking-wider mb-2 font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-3 py-2.5 rounded-lg bg-onyx-elevated border border-onyx-border text-[13px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-onyx-border flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-onyx-border text-[12px] text-platinum-muted hover:text-platinum transition-colors"
            >
              Keep Booking
            </button>
            <button
              onClick={() => {
                onConfirm?.({ reason, refundOption, notes: notes || undefined });
                onClose();
              }}
              className="px-5 py-2.5 rounded-lg bg-red-500 text-foreground font-semibold text-[12px] hover:bg-red-600 transition-colors"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
