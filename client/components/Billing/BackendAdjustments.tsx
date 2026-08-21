"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  Wallet, 
  Ticket, 
  PiggyBank, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Search 
} from "lucide-react";

interface AdjustmentCardProps {
  title: string;
  subtitle: string;
  placeholder: string;
  icon: React.ReactNode;
  onApply: (refNo: string) => Promise<number | null>; // Returns the amount applied, or null if failed
  onClear: () => void;
}

const AdjustmentCard = ({
  title,
  subtitle,
  placeholder,
  icon,
  onApply,
  onClear,
}: AdjustmentCardProps) => {
  const [open, setOpen] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [applied, setApplied] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!refNo) return;
    setLoading(true);
    const appliedAmount = await onApply(refNo);
    setLoading(false);
    if (appliedAmount !== null) {
      setAmount(appliedAmount);
      setApplied(true);
    }
  };

  const handleClear = () => {
    setRefNo("");
    setAmount(null);
    setApplied(false);
    onClear();
  };

  return (
    <div className="bg-[#151515] hover:bg-onyx-elevated transition-colors rounded-xl border border-onyx-border overflow-hidden">
      {/* CARD HEADER (Toggle) */}
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-[#aaaaaa]">
            {icon}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[15px] font-semibold text-foreground leading-tight mb-0.5">{title}</span>
            <span className="text-[11px] text-[#777]">{subtitle}</span>
          </div>
        </div>
        <div className="text-[#555] pr-2">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* EXPANDABLE CONTENT */}
      {open && (
        <div className="p-4 pt-0 border-t border-[#222] mt-2">
          {!applied ? (
            <div className="flex gap-2 mt-4">
              <Input
                placeholder={placeholder}
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="bg-onyx border-border text-sm text-foreground focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843] h-10"
              />
              <button 
                onClick={handleApply} 
                disabled={!refNo || loading}
                className="bg-[#2a2a2a] hover:bg-secondary disabled:opacity-50 disabled:hover:bg-[#2a2a2a] text-[#eee] px-4 rounded-lg text-sm font-medium transition-colors flex flex-shrink-0 items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "..." : "Apply"}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-green-400 bg-onyx border border-[#1e1e1e] px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Applied Amount</span>
                </div>
                <span className="font-bold">₹{amount?.toFixed(2)}</span>
              </div>
              <button
                className="text-xs text-[#e55] hover:text-red-400 font-medium self-end"
                onClick={handleClear}
              >
                Remove {title}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BillingAdjustments = ({ billing }: { billing: any }) => {
  const handleAdvanceApply = async (refNo: string) => {
    try {
      const res = await fetch(`/api/billing/advance?receiptNo=${refNo}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to find advance");
        return null;
      }
      
      const adv = data.advance;
      const success = billing.applyAdvance(adv);
      
      if (!success) return null;
      
      // Calculate total applied value (money + estimated metal value) for display
      const totalDisplayValue = adv.moneyAmount + (adv.metalWeight * billing.metalRate);
      return totalDisplayValue;
    } catch (err) {
      console.error(err);
      alert("Error finding advance");
      return null;
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <AdjustmentCard
        title="Apply Advance"
        subtitle="Deduct from previous deposits"
        placeholder="Enter Advance Receipt No"
        onApply={handleAdvanceApply}
        onClear={() => billing.removeAdvance()}
        icon={<Wallet className="w-4 h-4" />}
      />

    </div>
  );
};

export default BillingAdjustments;
