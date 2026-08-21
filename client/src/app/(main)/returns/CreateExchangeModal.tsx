"use client";

import React, { useState } from "react";
import { IconX, IconLoader2 } from "@tabler/icons-react";

interface CreateExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateExchangeModal({ isOpen, onClose, onSuccess }: CreateExchangeModalProps) {
  const [actionType, setActionType] = useState<"replacement" | "exchange">("exchange");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [oldHuidNumber, setOldHuidNumber] = useState("");
  const [newHuidNumber, setNewHuidNumber] = useState("");
  const [reason, setReason] = useState("");
  const [branchId, setBranchId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = actionType === "exchange" ? "/api/exchanges/create" : "/api/replacements/create";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          oldHuidNumber,
          newHuidNumber,
          reason,
          branchId: parseInt(branchId, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to create ${actionType} request`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-onyx-surface border border-onyx-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-onyx-border">
          <h2 className="text-lg font-semibold text-foreground">Create Exchange / Replacement</h2>
          <button 
            onClick={onClose}
            className="text-platinum-muted hover:text-foreground transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[13px]">
              {error}
            </div>
          )}

          <div className="flex gap-4 pb-2 border-b border-onyx-border/50">
            <label className="flex items-center gap-2 text-foreground text-sm cursor-pointer">
              <input 
                type="radio" 
                name="actionType" 
                value="exchange"
                checked={actionType === "exchange"}
                onChange={() => setActionType("exchange")}
                className="accent-gold"
              />
              Exchange (Value Up/Down)
            </label>
            <label className="flex items-center gap-2 text-foreground text-sm cursor-pointer">
              <input 
                type="radio" 
                name="actionType" 
                value="replacement"
                checked={actionType === "replacement"}
                onChange={() => setActionType("replacement")}
                className="accent-gold"
              />
              Replacement (Same Item)
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-platinum-muted">Original Invoice Number</label>
            <input 
              required
              type="text"
              placeholder="e.g. INV-1001"
              className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-platinum-muted">Old HUID</label>
              <input 
                required
                type="text"
                placeholder="Returning item"
                className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                value={oldHuidNumber}
                onChange={(e) => setOldHuidNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-platinum-muted">New HUID</label>
              <input 
                required
                type="text"
                placeholder="New item given"
                className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                value={newHuidNumber}
                onChange={(e) => setNewHuidNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-platinum-muted">Branch ID</label>
            <input 
              required
              type="number"
              className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-platinum-muted">Reason</label>
            <textarea 
              required
              rows={2}
              placeholder={`Reason for ${actionType}...`}
              className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-platinum-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gold text-onyx font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <IconLoader2 size={16} className="animate-spin" /> : null}
              Submit {actionType === "exchange" ? "Exchange" : "Replacement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
