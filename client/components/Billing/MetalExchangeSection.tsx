"use client";

import { Input } from "@/components/ui/input";
import { RefreshCw, Plus, AlertTriangle, ArrowRight } from "lucide-react";

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
  } = billing;

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden mt-2">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between p-4 border-b border-[#1e1e1e] bg-[#151515]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#d4a843]" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Old Gold Exchange
          </h3>
        </div>
        <button className="text-[#d4a843] hover:text-[#f0c45d] text-sm font-semibold tracking-wide flex items-center gap-1 transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* CONTENT GRID */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Jewellery Weight */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
            Total Jewellery Wt (g)
          </label>
          <Input
            disabled
            value={totalGoldWeight.toFixed(3)}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#aaa] font-medium h-10 disabled:opacity-70"
          />
        </div>

        {/* Old Gold Given */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[#d4a843] uppercase tracking-wider flex items-center justify-between">
            Old Gold Given (g)
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
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white font-medium h-10 focus-visible:ring-1 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843]"
          />
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
               value={metalRate.toFixed(2)}
               className="bg-[#1a1a1a] border-[#2a2a2a] text-[#aaa] font-medium h-10 disabled:opacity-70 pl-7"
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
               className="bg-[#1a1a1a] border-[#2a2a2a] text-green-400 font-bold h-10 disabled:opacity-100 disabled:cursor-default pl-7"
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
           * GST on gold will be applied only on net gold purchased.
         </p>
      </div>
    </div>
  );
};

export default MetalExchangeSection;
