"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Banknote, 
  RotateCcw, 
  X, 
  ArrowRight,
  TrendingDown,
  Scale
} from "lucide-react";

interface ExcessGoldModalProps {
  billing: any;
  open: boolean;
  onClose: () => void;
}

const ExcessGoldModal = ({ billing, open, onClose }: ExcessGoldModalProps) => {
  const {
    totalGoldValue,
    exchangeGoldValue,
    excessGoldValue,
    excessGoldWeight,
    metalRate,
    cashOutReductionPercent,
    setCashOutReductionPercent,
    cashSettlementRate,
    cashOutAmount,
    setExcessGoldMode,
  } = billing;

  const [selectedMode, setSelectedMode] = useState<'CASH_OUT' | 'RETURN_GOLD' | null>(null);
  const [localReductionPct, setLocalReductionPct] = useState(cashOutReductionPercent);

  useEffect(() => {
    setLocalReductionPct(cashOutReductionPercent);
  }, [cashOutReductionPercent]);

  if (!open) return null;

  const localSettlementRate = metalRate * (1 - localReductionPct / 100);
  const localCashOut = excessGoldWeight * localSettlementRate;

  const handleConfirm = () => {
    if (!selectedMode) return;
    setCashOutReductionPercent(localReductionPct);
    setExcessGoldMode(selectedMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-[640px] mx-4 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Amber Warning Strip */}
        <div className="bg-gradient-to-r from-[#d4a843]/20 via-[#f59e0b]/10 to-transparent p-0.5" />
        
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Old Gold Exceeds Purchase</h2>
                <p className="text-sm text-[#888] mt-0.5">Settlement option required for excess value</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-[#555] hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Bar */}
          <div className="mt-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#777] uppercase tracking-wider mb-1">Purchase Value</span>
              <span className="text-sm font-semibold text-white">₹{totalGoldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#777] uppercase tracking-wider mb-1">Old Gold Value</span>
              <span className="text-sm font-semibold text-[#e55]">₹{exchangeGoldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider mb-1">Excess Amount</span>
              <span className="text-lg font-bold text-[#f59e0b]">₹{excessGoldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 pb-2 flex flex-col gap-3">
          
          {/* Option 1: Cash Out */}
          <button
            onClick={() => setSelectedMode('CASH_OUT')}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
              selectedMode === 'CASH_OUT' 
                ? 'border-[#d4a843] bg-[#d4a843]/5 shadow-lg shadow-[#d4a843]/5' 
                : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selectedMode === 'CASH_OUT' ? 'bg-[#d4a843]/20 text-[#d4a843]' : 'bg-[#2a2a2a] text-[#888]'
              }`}>
                <Banknote className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white text-[15px]">Cash Out Excess Gold</h3>
                  {selectedMode === 'CASH_OUT' && (
                    <span className="px-2 py-0.5 bg-[#d4a843]/20 text-[#d4a843] text-[10px] font-bold rounded-full uppercase tracking-wider">Selected</span>
                  )}
                </div>
                <p className="text-xs text-[#777] leading-relaxed">
                  Convert excess old gold to cash at a reduced settlement rate. The cash amount will be adjusted against the bill total (making charges + tax). Any remaining excess will be returned as cash to the customer.
                </p>
              </div>
            </div>

            {/* Cash Out Details (shown when selected) */}
            {selectedMode === 'CASH_OUT' && (
              <div className="mt-4 pt-4 border-t border-[#2a2a2a]" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Rate Reduction %
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={localReductionPct}
                      onChange={(e) => setLocalReductionPct(Math.max(0, Math.min(50, Number(e.target.value))))}
                      className="bg-[#0a0a0a] border-[#333] text-white font-medium h-10 focus-visible:ring-1 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843] text-center text-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      Excess Weight
                    </label>
                    <div className="bg-[#0a0a0a] border border-[#333] rounded-md h-10 flex items-center justify-center text-white font-semibold">
                      {excessGoldWeight.toFixed(3)}g
                    </div>
                  </div>
                </div>

                {/* Settlement Preview */}
                <div className="bg-[#0d0d0d] border border-[#222] rounded-lg p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#888]">Current Gold Rate</span>
                    <span className="text-[#aaa] font-mono line-through">₹{metalRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#d4a843] font-medium">Settlement Rate (-{localReductionPct}%)</span>
                    <span className="text-[#d4a843] font-bold font-mono">₹{localSettlementRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g</span>
                  </div>
                  <div className="text-[10px] text-[#666] italic leading-snug">
                    Cash Settlement Rate Applied<br />
                    (after refining & handling adjustments)
                  </div>
                  <div className="pt-2 border-t border-[#222] flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Cash Out Value</span>
                    <span className="text-lg font-bold text-green-400 font-mono">₹{localCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </button>

          {/* Option 2: Return Excess Gold */}
          <button
            onClick={() => setSelectedMode('RETURN_GOLD')}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
              selectedMode === 'RETURN_GOLD' 
                ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5' 
                : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selectedMode === 'RETURN_GOLD' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#2a2a2a] text-[#888]'
              }`}>
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white text-[15px]">Return Excess Gold</h3>
                  {selectedMode === 'RETURN_GOLD' && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Selected</span>
                  )}
                </div>
                <p className="text-xs text-[#777] leading-relaxed">
                  Adjust old gold to match the purchase value and physically return the excess gold weight to the customer. Only the required gold weight will be retained for the bill.
                </p>

                {/* Return Details (shown when selected) */}
                {selectedMode === 'RETURN_GOLD' && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <div className="bg-[#0d0d0d] border border-[#222] rounded-lg p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#888]">Total Old Gold Given</span>
                        <span className="text-[#aaa] font-mono">{billing.exchangeGoldWeight.toFixed(3)}g</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#888]">Gold Retained (for bill)</span>
                        <span className="text-white font-mono font-semibold">{billing.totalGoldWeight.toFixed(3)}g</span>
                      </div>
                      <div className="pt-2 border-t border-[#222] flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-400">Gold Returned to Customer</span>
                        <span className="text-lg font-bold text-blue-400 font-mono">{excessGoldWeight.toFixed(3)}g</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#666] italic mt-2">
                      ⚠️ Bill can only be completed after all dues (DR) are cleared.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#aaa] hover:text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#d4a843] hover:bg-[#b8912e] text-[#0a0a0a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            Confirm Settlement
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcessGoldModal;
