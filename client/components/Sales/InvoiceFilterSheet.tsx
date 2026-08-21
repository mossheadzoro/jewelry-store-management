"use client";

import React, { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { SalesFilters } from "@/hooks/useSalesFilters";

interface InvoiceFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: SalesFilters;
  onApply: (newFilters: Partial<SalesFilters>) => void;
  onReset: () => void;
}

interface StaffUser {
  id: number;
  name: string;
  role: string;
}

export default function InvoiceFilterSheet({
  open,
  onClose,
  filters,
  onApply,
  onReset,
}: InvoiceFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<Partial<SalesFilters>>({});
  const [staff, setStaff] = useState<StaffUser[]>([]);

  useEffect(() => {
    if (open) {
      setLocalFilters({
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        salespersonId: filters.salespersonId,
        huidStatus: filters.huidStatus,
        amountMin: filters.amountMin,
        amountMax: filters.amountMax,
      });
    }
  }, [open, filters]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStaff(data);
        }
      })
      .catch((err) => console.error("Error loading staff:", err));
  }, []);

  if (!open) return null;

  const handleFieldChange = (key: keyof SalesFilters, val: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex justify-end">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="w-full max-w-[400px] bg-[#111113] border-l border-[#1F1F24] h-full flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#1F1F24]">
            <div>
              <h3 className="text-lg font-bold text-[#F0EBE0] font-serif">Filter Invoices</h3>
              <p className="text-xs text-[#6B6560]">Refine sales transactions list</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#6B6560] hover:text-[#F0EBE0] transition-colors p-2 hover:bg-[#1A1A1E] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
            {/* Status Select */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
                Invoice Status
              </label>
              <select
                value={localFilters.status || ""}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIAL">Partial Paid</option>
                <option value="PENDING">Pending / Unpaid</option>
                <option value="OUTSTANDING">Has Balance Due (Outstanding)</option>
              </select>
            </div>

            {/* Payment Method Select */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <select
                value={localFilters.paymentMethod || ""}
                onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 transition-colors"
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR Scan</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="METAL">Metal Exchange</option>
                <option value="ADVANCE">Advance Settlement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Salesperson Select */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
                Salesperson
              </label>
              <select
                value={localFilters.salespersonId || ""}
                onChange={(e) => handleFieldChange("salespersonId", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 transition-colors"
              >
                <option value="">All Salespeople</option>
                {staff.map((u: any) => {
                  const roleName = typeof u.role === "object" && u.role ? u.role.name : (typeof u.role === "string" ? u.role : u.systemRole || "");
                  return (
                    <option key={u.id} value={u.id.toString()}>
                      {u.name} {roleName ? `(${roleName})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* HUID Status Select */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
                BIS HUID Compliance
              </label>
              <select
                value={localFilters.huidStatus || ""}
                onChange={(e) => handleFieldChange("huidStatus", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 transition-colors"
              >
                <option value="">All Items</option>
                <option value="WITH_HUID">With HUID (Compliant)</option>
                <option value="MISSING_HUID">Missing HUID</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-2">
                Amount Range (INR)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={localFilters.amountMin || ""}
                  onChange={(e) => handleFieldChange("amountMin", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 placeholder-[#6B6560]"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={localFilters.amountMax || ""}
                  onChange={(e) => handleFieldChange("amountMax", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A1E] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 placeholder-[#6B6560]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#1F1F24] bg-[#111113] flex gap-3">
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-[#1F1F24] text-[#6B6560] hover:text-[#F0EBE0] text-sm font-semibold hover:bg-[#1A1A1E] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-lg bg-[#C9943A] hover:bg-[#E8B84B] text-foreground text-sm font-bold transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
