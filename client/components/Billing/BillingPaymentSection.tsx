"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, Banknote, RotateCcw, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";

const BillingPaymentSection = ({ billing, customer }: any) => {
  const {
    grandTotal,
    metalRate,
    payments,
    setPayments,
    // Excess gold
    isOldGoldExcess,
    excessGoldMode,
    excessGoldWeight,
    cashToCustomer,
    oldGoldCashedOutValue,
    cashSettlementRate,
    cashOutReductionPercent,
    effectiveExchangeWeight,
    refundMethod,
    setRefundMethod,
    refundDetails,
    setRefundDetails,
    
    // Saving Schemes
    appliedSchemes = [],
    applyScheme,
    removeScheme,
  } = billing;

  const [focusedPaymentIndex, setFocusedPaymentIndex] = useState<number | null>(null);

  /* ---------------- HANDLERS ---------------- */

  const updatePayment = (i: number, key: string, value: string) => {
    const updated = [...payments];
    updated[i] = { ...updated[i], [key]: value };

    // Auto-calc amount for metal payment
    if (updated[i].method?.toUpperCase() === "METAL" && key === "metalWeight") {
      const weight = Number(value) || 0;
      updated[i].amount = (weight * metalRate).toFixed(2);
    }

    setPayments(updated);
  };

  const updateMethod = (i: number, method: string) => {
    const updated = [...payments];
    updated[i] = {
      method,
      amount: "",
      metalWeight: "",
      narration: "",
    };
    setPayments(updated);
  };

  const addNewMethod = () =>
    setPayments([
      ...payments,
      { method: "CASH", amount: "", metalWeight: "", narration: "" },
    ]);

  const removeMethod = (i: number) => {
    if (payments[i].method === "ADVANCE") {
      if (billing.removeAdvance) billing.removeAdvance();
      return;
    }
    const updated = [...payments];
    updated.splice(i, 1);
    setPayments(updated);
  };

  const handleFocus = (index: number) => setFocusedPaymentIndex(index);
  const handleBlur = () => setFocusedPaymentIndex(null);

  /* ---------------- PAYMENT CALCULATIONS ---------------- */

  const displayTotalPaid = useMemo(() => {
    return payments.reduce(
      (acc: number, p: any, i: number) => {
        // Exclude the currently focused input from calculation unless it's a locked scheme payment
        if (i === focusedPaymentIndex && !p.isLocked) {
           return acc;
        }
        return acc + (Number(p.amount) || 0);
      },
      0
    );
  }, [payments, focusedPaymentIndex]);

  /* ---------------- SAVING SCHEME LOGIC ---------------- */
  
  const customerSchemes = customer?.savingSchemes || [];
  
  const availableSchemes = customerSchemes.filter((scheme: any) => {
     // A scheme is available if it hasn't been applied to this bill yet
     // AND it has a balance
     const isApplied = appliedSchemes.some((s: any) => s.id === scheme.id);
     if (isApplied) return false;
     
     const totalDeposited = (scheme.totalCashDeposited || 0) + (scheme.totalBonusAmount || 0);
     const remainingBalance = totalDeposited - (scheme.totalRedeemed || 0);
     return remainingBalance > 0 && scheme.status !== 'REDEEMED';
  });

  const redeemedSchemes = appliedSchemes;

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-onyx-surface border border-[#1e1e1e] rounded-xl overflow-hidden mt-2">
      {/* HEADER BAR */}
      <div className="p-4 border-b border-[#1e1e1e] bg-[#151515]">
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          Payment Details
        </h3>
      </div>

      <div className="p-5">
        
        {/* SAVING SCHEMES */}
        {customerSchemes.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-[#d4a843]/20 bg-[#d4a843]/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#d4a843]" />
              <h4 className="text-[#d4a843] font-semibold">Saving Schemes</h4>
            </div>

            <Tabs defaultValue="available" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="available">Available ({availableSchemes.length})</TabsTrigger>
                <TabsTrigger value="redeemed">Redeemed ({redeemedSchemes.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="space-y-3">
                {availableSchemes.length === 0 ? (
                  <p className="text-sm text-[#888]">No available schemes to redeem.</p>
                ) : (
                  availableSchemes.map((scheme: any) => {
                    const totalDeposited = (scheme.totalCashDeposited || 0) + (scheme.totalBonusAmount || 0);
                    const remainingBalance = totalDeposited - (scheme.totalRedeemed || 0);
                    const isMatured = scheme.maturityDate && new Date(scheme.maturityDate) <= new Date();

                    return (
                      <div key={scheme.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 rounded-lg border border-border bg-onyx-elevated">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{scheme.schemeName}</span>
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-[#aaa]">{scheme.schemeNumber}</span>
                            {isMatured && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 uppercase tracking-wider font-bold">Matured</span>}
                          </div>
                          <div className="text-sm text-[#888] mt-1">
                            Balance: <span className="text-[#d4a843] font-mono">₹{remainingBalance.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                           {scheme.schemeType === 'FIXED_MONTHLY' ? (
                             <>
                               {isMatured ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => applyScheme(scheme, remainingBalance, 0, 'MATURED')}
                                    className="border-green-500/50 text-green-400 hover:bg-green-500/20 w-full sm:w-auto"
                                  >
                                    Redeem (Matured)
                                  </Button>
                               ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => applyScheme(scheme, remainingBalance, 0, 'PRE_MATURE')}
                                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 w-full sm:w-auto"
                                  >
                                    Redeem (Pre-mature)
                                  </Button>
                               )}
                             </>
                           ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => applyScheme(scheme, remainingBalance, 0, 'STANDARD')}
                                className="border-[#d4a843]/50 text-[#d4a843] hover:bg-[#d4a843]/20 w-full sm:w-auto"
                              >
                                Redeem
                              </Button>
                           )}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="redeemed" className="space-y-3">
                {redeemedSchemes.length === 0 ? (
                  <p className="text-sm text-[#888]">No schemes redeemed in this bill.</p>
                ) : (
                  redeemedSchemes.map((scheme: any) => (
                    <div key={scheme.id} className="flex justify-between items-center p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{scheme.schemeName}</span>
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded text-[#aaa]">{scheme.schemeNumber}</span>
                        </div>
                        <div className="text-sm text-green-400 mt-1">
                          Redeemed: <span className="font-mono font-bold">₹{scheme.amountUsed?.toFixed(2)}</span>
                          {scheme.redemptionType === 'PRE_MATURE' && <span className="ml-2 text-yellow-500 text-xs">(Pre-mature)</span>}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeScheme(scheme.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        Undo
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {payments.map((p: any, i: number) => (
            <div
              key={i}
              className="grid grid-cols-[140px_1fr_1fr_40px] gap-3 items-center bg-onyx-elevated p-2.5 rounded-lg border border-onyx-border"
            >
              {/* METHOD */}
              <Select value={p.method} onValueChange={(v) => updateMethod(i, v)} disabled={p.isLocked}>
                <SelectTrigger className={`bg-onyx border-border text-foreground focus-visible:ring-[#d4a843] ${p.isLocked ? 'opacity-70' : ''}`}>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="RTGS">RTGS</SelectItem>
                  <SelectItem value="METAL">Metal</SelectItem>
                  {p.method === "SCHEME" && <SelectItem value="SCHEME">Scheme</SelectItem>}
                </SelectContent>
              </Select>

              {/* METAL WEIGHT OR AMOUNT */}
              {p.method === "METAL" ? (
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="Metal (g)"
                    value={p.metalWeight}
                    onChange={(e) => updatePayment(i, "metalWeight", e.target.value)}
                    className="bg-onyx border-border text-foreground focus-visible:ring-[#d4a843]"
                  />
                  <Input
                    type="number"
                    placeholder="₹ Amount"
                    value={p.amount}
                    readOnly
                    className="bg-onyx border-border text-[#aaa] cursor-not-allowed opacity-70"
                  />
                </div>
              ) : (
                <Input
                  type="number"
                  placeholder="Amount ₹"
                  value={p.amount}
                  onChange={(e) => updatePayment(i, "amount", e.target.value)}
                  onFocus={() => handleFocus(i)}
                  onBlur={handleBlur}
                  readOnly={p.isLocked}
                  className={`bg-onyx border-border text-foreground focus-visible:ring-[#d4a843] ${p.isLocked ? 'text-[#aaa] cursor-not-allowed opacity-70' : ''}`}
                />
              )}

              {/* NARRATION */}
              <Input
                placeholder="Narration / Ref No"
                value={p.narration}
                onChange={(e) => updatePayment(i, "narration", e.target.value)}
                onFocus={() => handleFocus(i)}
                onBlur={handleBlur}
                readOnly={p.isLocked}
                className={`bg-onyx border-border text-foreground focus-visible:ring-[#d4a843] ${p.isLocked ? 'text-[#aaa] cursor-not-allowed opacity-70' : ''}`}
              />

              {/* REMOVE */}
              <button
                onClick={() => removeMethod(i)}
                disabled={payments.length === 1 || p.isLocked}
                className="h-10 w-10 flex items-center justify-center text-[#555] hover:text-[#ff4a4a] hover:bg-[#ff4a4a]/10 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#555] transition-colors"
                title="Remove method"
              >
                 <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={addNewMethod} 
          className="mt-4 text-[#d4a843] hover:text-[#f0c45d] text-sm font-semibold tracking-wide flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Payment Method
        </button>

        {/* 🔥 EXCESS OLD GOLD — CASH OUT INFO IN PAYMENT */}
        {isOldGoldExcess && excessGoldMode === 'CASH_OUT' && oldGoldCashedOutValue > 0 && (
          <div className="mt-4 bg-green-500/5 border border-green-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">OLD Gold Cashed Out</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888]">Excess Gold Weight</span>
                <span className="text-foreground font-mono">{excessGoldWeight.toFixed(3)}g</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888]">
                  <span className="text-[#666] italic text-xs block leading-tight">Cash Settlement Rate Applied</span>
                  <span className="text-[#666] italic text-[10px]">(after refining & handling adjustments)</span>
                </span>
                <span className="text-[#d4a843] font-mono font-semibold">₹{cashSettlementRate.toFixed(2)}/g <span className="text-[#666] text-xs">(-{cashOutReductionPercent}%)</span></span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-green-500/10">
                <span className="text-green-400 font-semibold">Adjusted Amount</span>
                <span className="text-green-400 font-bold font-mono">₹{oldGoldCashedOutValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {cashToCustomer > 0 && (
          <div className="mt-4 bg-[#d4a843]/5 border border-[#d4a843]/20 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#d4a843] font-bold">💰 Refund to Customer</span>
              <span className="text-[#d4a843] font-bold font-mono text-base">₹{cashToCustomer.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#888] font-semibold">Refund Method</label>
              <Select value={refundMethod} onValueChange={setRefundMethod}>
                <SelectTrigger className="bg-onyx border-border text-foreground w-full">
                  <SelectValue placeholder="Select Refund Method" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="CASH">Cash (Direct Handover)</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="ONLINE">Online (UPI / NEFT)</SelectItem>
                  <SelectItem value="WALLET_CASH">Store as Cash (Wallet)</SelectItem>
                  <SelectItem value="WALLET_METAL">Store as Metal (Wallet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(refundMethod === 'CHEQUE' || refundMethod === 'ONLINE') && (
              <div className="space-y-2">
                <label className="text-xs text-[#888] font-semibold">Transaction Details <span className="text-red-500">*</span></label>
                <Input
                  placeholder={refundMethod === 'CHEQUE' ? "Cheque No / Bank" : "UTR No / App"}
                  value={refundDetails}
                  onChange={(e) => setRefundDetails(e.target.value)}
                  className="bg-onyx border-border text-foreground"
                />
              </div>
            )}

            {refundMethod === 'WALLET_METAL' && (
              <div className="bg-onyx-elevated rounded p-2 border border-border flex justify-between items-center text-xs">
                <span className="text-[#aaa]">Metal Equivalent</span>
                <span className="text-gold font-mono font-bold">{(cashToCustomer / cashSettlementRate).toFixed(3)} g</span>
              </div>
            )}
          </div>
        )}

        {/* 🔥 EXCESS OLD GOLD — RETURN GOLD BANNER */}
        {isOldGoldExcess && excessGoldMode === 'RETURN_GOLD' && (
          <div className="mt-4 bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-blue-400">Excess Gold Returned to Customer</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888]">Gold Returned</span>
                <span className="text-blue-400 font-bold font-mono">{excessGoldWeight.toFixed(3)}g</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888]">Gold Retained (for bill)</span>
                <span className="text-foreground font-mono">{effectiveExchangeWeight.toFixed(3)}g</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SUMMARY ---------------- */}
        <div className="mt-6 pt-5 border-t border-[#1e1e1e] flex flex-col gap-3 max-w-sm ml-auto">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#888]">Bill Amount</span>
            <span className="font-semibold text-foreground">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          {Math.abs(Math.round(grandTotal) - grandTotal) > 0.001 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#888]">Round Off</span>
              <span className={`font-mono font-semibold ${Math.round(grandTotal) - grandTotal > 0 ? "text-green-400" : "text-[#e55]"}`}>
                {Math.round(grandTotal) - grandTotal > 0 ? "+" : "-"} ₹{Math.abs(Math.round(grandTotal) - grandTotal).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-[#888]">Total Paid</span>
            <span className="font-semibold text-foreground">
              ₹{displayTotalPaid.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-onyx-border my-1"></div>

          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-[#888]">Status</span>
            <span
              className={`px-3 py-1 rounded bg-onyx-elevated border ${
                displayTotalPaid >= Math.round(grandTotal)
                  ? "text-green-400 border-green-400/20"
                  : "text-[#e55] border-[#e55]/20"
              }`}
            >
              {displayTotalPaid >= Math.round(grandTotal) ? "Sufficient" : "Insufficient"}
            </span>
          </div>

          {displayTotalPaid < Math.round(grandTotal) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#e55]">Due Amount</span>
              <span className="font-bold text-[#e55] bg-[#e55]/10 px-2 py-0.5 rounded">₹{(Math.round(grandTotal) - displayTotalPaid).toFixed(2)}</span>
            </div>
          )}

          {displayTotalPaid > Math.round(grandTotal) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-400">Credit Balance</span>
              <span className="font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">₹{(displayTotalPaid - Math.round(grandTotal)).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPaymentSection;
