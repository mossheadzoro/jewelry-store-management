"use client";

import { Input } from "@/components/ui/input";
import { RefreshCw, Plus, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MetalExchangeSection = ({ billing, onOpenExcessModal }: any) => {
  const {
    metalRate,
    exchangeGoldWeight,
    setExchangeGoldWeight,
    exchangeGoldValue,
    totalGoldWeight,
    isOldGoldExcess,
    excessGoldValue,
    excessGoldMode,
    effectiveExchangeWeight,
    effectiveExchangeValue,
    excessGoldWeight,
    appliedAdvance,
    removeAdvance,
  } = billing;

  const handleRemoveAdvance = () => {
    if (!appliedAdvance) return;
    removeAdvance();
    toast.success(
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground text-sm">Advance Removed</span>
        <span className="text-xs text-[#ccc]">
          Advance <strong>{appliedAdvance.advanceReceiptNumber}</strong> has been removed from the bill. No changes were made to the order or wallet.
        </span>
      </div>,
      { duration: 4000 }
    );
  };

  return (
    <div className="bg-onyx-surface border border-[#1e1e1e] rounded-xl overflow-hidden mt-2">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between p-4 border-b border-[#1e1e1e] bg-[#151515]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#d4a843]" />
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Old Gold Exchange
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Remove Wallet Balance Button */}
          {(billing.appliedWalletMetal22K > 0 || billing.appliedWalletMetal24K > 0) && (
            <button
              onClick={billing.removeWalletBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e55]/10 border border-[#e55]/20 text-[#e55] hover:bg-[#e55]/20 hover:border-[#e55]/40 text-xs font-semibold tracking-wide transition-all"
              title="Remove Wallet Balance"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Wallet
            </button>
          )}

          {/* Remove Advance Button — only visible when advance is applied */}
          {appliedAdvance && (
            <button
              onClick={handleRemoveAdvance}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e55]/10 border border-[#e55]/20 text-[#e55] hover:bg-[#e55]/20 hover:border-[#e55]/40 text-xs font-semibold tracking-wide transition-all"
              title={`Remove advance ${appliedAdvance.advanceReceiptNumber}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Advance
            </button>
          )}
          <button className="text-[#d4a843] hover:text-[#f0c45d] text-sm font-semibold tracking-wide flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="p-5 grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Total Jewellery Weight */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
            Jewellery Wt (g)
          </label>
          <Input
            disabled
            value={totalGoldWeight.toFixed(3)}
            className="bg-onyx-elevated border-onyx-border text-[#aaa] font-medium h-10 disabled:opacity-70"
          />
        </div>

        {/* Old Gold Given */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#d4a843] uppercase tracking-wider flex items-center justify-between">
            Old Gold (g)
            <span className="text-[#e55]">*</span>
          </label>
          <Input
            type="number"
            step="0.001"
            value={exchangeGoldWeight || ""}
            onChange={(e) =>
              setExchangeGoldWeight(Math.max(0, Number(e.target.value)))
            }
            placeholder="0.000"
            className="bg-onyx-elevated border-onyx-border text-foreground font-medium h-10 focus-visible:ring-1 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843]"
          />
        </div>

        {/* Purity */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
            Purity
          </label>
          <select
            value={billing.exchangeGoldPurity}
            onChange={(e) => billing.setExchangeGoldPurity(e.target.value)}
            className="bg-onyx-elevated border-onyx-border border text-foreground font-medium h-10 focus-visible:ring-1 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843] rounded-md px-3 text-sm outline-none"
          >
            <option value="24k">24K</option>
            <option value="22k">22K</option>
            <option value="18k">18K</option>
            <option value="14k">14K</option>
          </select>
        </div>

        {/* Deduction % */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
            Deduction %
          </label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={billing.exchangeGoldDeductionPercent}
              onChange={(e) => billing.setExchangeGoldDeductionPercent(Number(e.target.value))}
              className="bg-onyx-elevated border-onyx-border text-foreground font-medium h-10 pr-7 focus-visible:ring-1 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]">%</div>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
            Exchange Rate (₹)
          </label>
          <div className="relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]">₹</div>
             <Input
               disabled
               value={billing.exchangeMetalRate.toFixed(2)}
               className="bg-onyx-elevated border-onyx-border text-[#aaa] font-medium h-10 disabled:opacity-70 pl-7"
             />
          </div>
        </div>

        {/* Exchange Value */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
            Exchange Value
          </label>
           <div className="relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]">₹</div>
             <Input
               disabled
               value={exchangeGoldValue.toFixed(2)}
               className="bg-onyx-elevated border-onyx-border text-green-400 font-bold h-10 disabled:opacity-100 disabled:cursor-default pl-7"
             />
           </div>
        </div>
        
      </div>

      {/* EXCESS GOLD WARNING BANNER */}
      {isOldGoldExcess && !excessGoldMode && (
        <div className="mx-5 mb-4 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#f59e0b] mb-1">Old Gold Value Exceeds Purchase</h4>
              <p className="text-xs text-[#999] leading-relaxed mb-3">
                Old gold value (₹{exchangeGoldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) exceeds 
                the purchase value (₹{billing.totalGoldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}). 
                Excess of <span className="text-[#f59e0b] font-semibold">₹{excessGoldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> needs 
                to be settled.
              </p>
              <button 
                onClick={() => onOpenExcessModal?.()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border border-[#f59e0b]/30 text-[#f59e0b] text-xs font-bold rounded-lg transition-colors"
              >
                Choose Settlement Option
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTLEMENT APPLIED BANNER */}
      {isOldGoldExcess && excessGoldMode === 'CASH_OUT' && (
        <div className="mx-5 mb-4 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-green-400">Cash Out Applied</span>
                <span className="text-xs text-[#777] ml-2">
                  Excess {excessGoldWeight.toFixed(3)}g settled at ₹{billing.cashSettlementRate.toFixed(2)}/g
                </span>
              </div>
            </div>
            <button 
              onClick={() => { billing.resetExcessGoldHandling(); }}
              className="text-xs text-[#777] hover:text-[#e55] transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {isOldGoldExcess && excessGoldMode === 'RETURN_GOLD' && (
        <div className="mx-5 mb-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-blue-400">Excess Gold Returned</span>
                <span className="text-xs text-[#777] ml-2">
                  {excessGoldWeight.toFixed(3)}g returned to customer · Retained {effectiveExchangeWeight.toFixed(3)}g
                </span>
              </div>
            </div>
            <button 
              onClick={() => { billing.resetExcessGoldHandling(); }}
              className="text-xs text-[#777] hover:text-[#e55] transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 w-full flex">
         <p className="text-xs text-[#555] italic">
           {billing.metalExchange
             ? "* GST on gold will be applied only on net gold purchased."
             : "* Metal Exchange is OFF. Old gold value will be deducted from the Grand Total as a cash equivalent."}
         </p>
      </div>
    </div>
  );
};

export default MetalExchangeSection;
