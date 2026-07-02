"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/types/booking";
import { X, ArrowRight, MapPin, CheckCircle2, Truck, Building2 } from "lucide-react";

const TRANSFER_REASONS = [
  { value: "CUSTOMER_REQUEST", label: "Customer Request" },
  { value: "INVENTORY_REBALANCING", label: "Inventory Rebalancing" },
  { value: "MANAGER_DECISION", label: "Manager Decision" },
  { value: "OTHER", label: "Other" },
];

const BRANCHES = [
  { id: 1, name: "Main Branch" },
  { id: 2, name: "Mall Branch" },
  { id: 3, name: "Highway Branch" },
  { id: 4, name: "Airport Branch" },
];

interface BranchTransferDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (data: { destinationBranchId: number; reason: string; notes?: string }) => void;
}

export function BranchTransferDialog({ booking, isOpen, onClose, onConfirm }: BranchTransferDialogProps) {
  const [destinationBranch, setDestinationBranch] = useState<number | null>(null);
  const [reason, setReason] = useState("CUSTOMER_REQUEST");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const destBranch = BRANCHES.find((b) => b.id === destinationBranch);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-onyx-surface border border-onyx-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-onyx-border flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-heading font-semibold text-platinum">Branch Transfer</h2>
              <p className="text-[11px] text-gold font-mono mt-0.5">{booking.bookingNumber}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-onyx-elevated text-platinum-muted hover:text-platinum transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Source Branch */}
            <div>
              <label className="block text-[10px] text-platinum-muted uppercase tracking-wider mb-2 font-medium">Source Branch</label>
              <div className="h-10 px-4 rounded-lg bg-onyx-elevated border border-onyx-border flex items-center gap-2 text-[13px] text-platinum-muted">
                <Building2 className="w-4 h-4" />
                {booking.branchName}
                <span className="text-[10px] text-platinum-muted ml-auto">(current)</span>
              </div>
            </div>

            {/* Destination Branch */}
            <div>
              <label className="block text-[10px] text-platinum-muted uppercase tracking-wider mb-2 font-medium">Destination Branch</label>
              <select
                value={destinationBranch ?? ""}
                onChange={(e) => setDestinationBranch(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-onyx-elevated border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold/40"
              >
                <option value="">Select destination branch...</option>
                {BRANCHES.filter((b) => b.id !== booking.branchId).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Transfer Timeline Preview */}
            {destBranch && (
              <div className="p-4 rounded-xl bg-onyx-elevated border border-onyx-border">
                <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-4 font-medium">Transfer Timeline</p>
                <div className="flex items-center justify-between">
                  {[
                    { icon: MapPin, label: booking.branchName, sublabel: "Initiated", color: "bg-gold/20 text-gold" },
                    { icon: Truck, label: "In Transit", sublabel: "Processing", color: "bg-blue-500/20 text-blue-400" },
                    { icon: CheckCircle2, label: destBranch.name, sublabel: "Received", color: "bg-emerald-500/20 text-emerald-400" },
                  ].map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", step.color)}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] text-platinum text-center">{step.label}</p>
                        <p className="text-[9px] text-platinum-muted uppercase tracking-wider">{step.sublabel}</p>
                      </div>
                      {i < 2 && (
                        <ArrowRight className="w-5 h-5 text-onyx-border shrink-0 -mt-6" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[10px] text-platinum-muted uppercase tracking-wider mb-2 font-medium">Transfer Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-onyx-elevated border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold/40"
              >
                {TRANSFER_REASONS.map((r) => (
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

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-onyx-border bg-onyx-elevated accent-gold"
              />
              <span className="text-[12px] text-platinum-muted leading-relaxed">
                I confirm this booking will be transferred. Customer will be notified.
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-onyx-border flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-onyx-border text-[12px] text-platinum-muted hover:text-platinum transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (destinationBranch) {
                  onConfirm?.({ destinationBranchId: destinationBranch, reason, notes: notes || undefined });
                  onClose();
                }
              }}
              disabled={!destinationBranch || !confirmed}
              className="px-6 py-2.5 rounded-lg bg-gold text-onyx font-semibold text-[13px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Initiate Transfer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
