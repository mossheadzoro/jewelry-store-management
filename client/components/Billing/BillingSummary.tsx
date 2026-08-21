"use client";

import React from "react";
import { Lock, AlertTriangle } from "lucide-react";

const BillingSummary = ({ billing, customer, onCheckout, isSubmitting, isEditMode }: any) => {
  const {
    netGoldValue,
    totalMaking,
    totalAdditional,
    totalGoldValue,
    exchangeGoldValue,
    goldCgst,
    goldSgst,
    cgst,
    sgst,
    makingCgst,
    makingSgst,
    hallmarkFee,
    grandTotal,
    hallmarkingSGST,
    hallmarkingCGST,
    taxOnTotal,
    hallmarkCharge,
    isExchangeTotalTaxMode,
    taxOnMetal,
    taxOnMaking,
    // Excess gold
    isOldGoldExcess,
    excessGoldMode,
    excessGoldWeight,
    cashSettlementRate,
    cashOutReductionPercent,
    oldGoldCashedOutValue,
    cashToCustomer,
    refundMethod,
    effectiveExchangeValue,
    payments,
  } = billing;

  // Calculate payment status for the guard
  const totalPaid = payments.reduce(
    (acc: number, p: any) => acc + (Number(p.amount) || 0),
    0
  );
  const balance = totalPaid - grandTotal;
  const isDR = balance < 0 && grandTotal > 0;

  // Block checkout if return gold mode and there's still DR
  const isReturnGoldBlocked = isOldGoldExcess && excessGoldMode === 'RETURN_GOLD' && isDR;
  // Block checkout if excess detected but no mode selected
  const isExcessUnresolved = isOldGoldExcess && !excessGoldMode;
  // Block checkout if payment is less than rounded grand total
  const isPaymentInsufficient = totalPaid < Math.round(grandTotal);

  const canCheckout = !isSubmitting && !isReturnGoldBlocked && !isExcessUnresolved && !isPaymentInsufficient;

  const Row = ({ label, value, isNegative = false, isAccent = false, isHighlight = false, className = "" }: any) => (
    <div className={`flex justify-between items-center py-2.5 ${className}`}>
      <span className={`text-sm ${isHighlight ? "font-semibold text-foreground" : "text-[#888]"}`}>
        {label}
      </span>
      <span className={`font-mono text-sm tracking-wide ${
        isNegative ? "text-[#e55]" : isAccent ? "text-[#d4a843]" : "text-foreground"
      }`}>
        {isNegative ? "- " : ""}₹ {parseFloat(value).toFixed(2)}
      </span>
    </div>
  );

  return (
    <div className="bg-[#1c1a17] rounded-2xl p-6 w-full shadow-2xl relative overflow-hidden border border-[#2a241a]">
      {/* Subtle Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#d4a843] opacity-5 blur-[100px] pointer-events-none rounded-full"></div>

      <h2 className="text-xl font-bold text-foreground mb-6">Summary</h2>

      {/* CUSTOMER INFO SUMMARY */}
      <div className="mb-6 pb-6 border-b border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1.5">{customer?.name || "No customer selected"}</p>
            <p className="text-xs text-[#777] mb-0.5">{customer?.mobile || "—"}</p>
            <p className="text-xs text-[#777] truncate max-w-[180px]">{customer?.address || "—"}</p>
          </div>
          {customer && (
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-[#888] uppercase tracking-wider block mb-0.5">Prev Balance</span>
              <span className={`text-sm font-bold font-mono ${
                (customer.currentDue ?? 0) > 0 ? "text-[#e55]" : (customer.currentDue ?? 0) < 0 ? "text-green-400" : "text-[#888]"
              }`}>
                ₹ {Math.abs(customer.currentDue ?? 0).toFixed(2)} {
                  (customer.currentDue ?? 0) > 0 ? "DR" : (customer.currentDue ?? 0) < 0 ? "CR" : ""
                }
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PRICING BREAKDOWN */}
      <div className="flex flex-col mb-4">
        <Row label="Total Gold Value" value={totalGoldValue} />
        
        {/* Old Gold Display — changes based on mode */}
        {billing.metalExchange && exchangeGoldValue > 0 && (
          <>
            {isOldGoldExcess && excessGoldMode ? (
              // When excess is handled, show capped old gold value
              <Row label="Old Gold Adjusted" value={effectiveExchangeValue} isNegative={true} />
            ) : (
              <Row label="Old Gold Value" value={exchangeGoldValue} isNegative={true} />
            )}
          </>
        )}
        
        <Row label="Net Gold Value" value={netGoldValue} isHighlight={true} />
        
        <Row label="Making Charges" value={totalMaking} />
        
        {totalAdditional > 0 && (
          <Row label="Additional Charges" value={totalAdditional} />
        )}
        
        {hallmarkCharge && (
          <Row label="Hallmark Fees" value={hallmarkFee} />
        )}

        <div className="my-2 border-t border-white/5"></div>

        {/* Dynamic Tax Display */}
        {taxOnMetal && (
          <>
            <Row label="Metal CGST (1.5%)" value={goldCgst} />
            <Row label="Metal SGST (1.5%)" value={goldSgst} />
          </>
        )}
        
        {taxOnMaking && (
          <>
            <Row label="Making CGST (2.5%)" value={makingCgst} />
            <Row label="Making SGST (2.5%)" value={makingSgst} />
          </>
        )}

        {hallmarkCharge && (
          <>
            <Row label="Hallmark CGST (9%)" value={hallmarkingCGST} />
            <Row label="Hallmark SGST (9%)" value={hallmarkingSGST} />
          </>
        )}

        {taxOnTotal && (
          <>
            <Row label={`CGST (1.5%)${isExchangeTotalTaxMode ? " [Net+Mk]" : ""}`} value={cgst} />
            <Row label={`SGST (1.5%)${isExchangeTotalTaxMode ? " [Net+Mk]" : ""}`} value={sgst} />
          </>
        )}

        {/* 🔥 EXCESS OLD GOLD — CASH OUT DETAILS */}
        {isOldGoldExcess && excessGoldMode === 'CASH_OUT' && (
          <>
            <div className="my-2 border-t border-white/5"></div>
            
            {/* Cash Settlement Info */}
            <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 my-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">OLD Gold Cashed Out</span>
                <span className="text-sm font-bold text-green-400 font-mono">
                  - ₹ {oldGoldCashedOutValue.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-[#666] italic leading-snug mb-1">
                Cash Settlement Rate Applied
              </div>
              <div className="text-[10px] text-[#777]">
                (after refining & handling adjustments)
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-500/10 text-xs">
                <span className="text-[#888]">Rate: ₹{cashSettlementRate.toFixed(2)}/g (-{cashOutReductionPercent}%)</span>
                <span className="text-[#888]">{excessGoldWeight.toFixed(3)}g</span>
              </div>
            </div>

            {cashToCustomer > 0 && (
              <div className="bg-[#d4a843]/5 border border-[#d4a843]/20 rounded-lg p-3 my-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#d4a843]">
                    {refundMethod === 'CHEQUE' ? '💵 Refund via Cheque' : 
                     refundMethod === 'ONLINE' ? '💵 Refund via Online' : 
                     refundMethod === 'WALLET_CASH' ? '💵 Refund to Wallet (Cash)' : 
                     refundMethod === 'WALLET_METAL' ? '🪙 Refund to Wallet (Metal)' : 
                     '💵 Cash Given to Customer'}
                  </span>
                  <span className="text-sm font-bold text-[#d4a843] font-mono">₹ {cashToCustomer.toFixed(2)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* RETURN GOLD DR WARNING */}
        {isOldGoldExcess && excessGoldMode === 'RETURN_GOLD' && (
          <>
            <div className="my-2 border-t border-white/5"></div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 my-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Excess Gold Returned</span>
                <span className="text-sm font-bold text-blue-400 font-mono">{excessGoldWeight.toFixed(3)}g</span>
              </div>
              <p className="text-[10px] text-[#666] mt-1.5">
                Excess gold physically returned to customer. Only {billing.effectiveExchangeWeight.toFixed(3)}g retained for this bill.
              </p>
            </div>
          </>
        )}

        {/* OLD GOLD AS CASH (Metal Exchange OFF) */}
        {!billing.metalExchange && exchangeGoldValue > 0 && (
          <>
            <div className="my-2 border-t border-white/5"></div>
            <Row label="Old Gold Value (Cash Equivalent)" value={exchangeGoldValue} isNegative={true} isAccent={true} />
            {cashToCustomer > 0 && (
              <div className="bg-[#d4a843]/5 border border-[#d4a843]/20 rounded-lg p-3 my-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#d4a843]">
                    {refundMethod === 'CHEQUE' ? '💵 Refund via Cheque' : 
                     refundMethod === 'ONLINE' ? '💵 Refund via Online' : 
                     refundMethod === 'WALLET_CASH' ? '💵 Refund to Wallet (Cash)' : 
                     refundMethod === 'WALLET_METAL' ? '🪙 Refund to Wallet (Metal)' : 
                     '💵 Cash Given to Customer'}
                  </span>
                  <span className="text-sm font-bold text-[#d4a843] font-mono">₹ {cashToCustomer.toFixed(2)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ROUND OFF */}
        {Math.abs(Math.round(grandTotal) - grandTotal) > 0.001 && (
          <>
            <div className="my-2 border-t border-white/5"></div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-[#888]">Round Off</span>
              <span className={`font-mono text-sm tracking-wide ${Math.round(grandTotal) - grandTotal > 0 ? "text-green-400" : "text-[#e55]"}`}>
                {Math.round(grandTotal) - grandTotal > 0 ? "+" : "-"} ₹ {Math.abs(Math.round(grandTotal) - grandTotal).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* GRAND TOTAL */}
      <div className="pt-6 border-t border-white/10 flex justify-between items-end mb-6">
        <div className="flex flex-col">
          <span className="text-[#d4a843] text-xs font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-md">
            GRAND TOTAL
          </span>
          <span className="text-[10px] text-[#666]">
            Inclusive of all taxes
          </span>
        </div>
        <div className="text-right">
          <span className="text-[#d4a843] font-bold text-4xl leading-none drop-shadow-md">
            ₹{grandTotal.toFixed(0)}
          </span>
        </div>
      </div>

      {/* PAYMENT BREAKDOWN */}
      <div className="mb-6 bg-[#1a1814] rounded-xl p-5 border border-[#332b1a] shadow-inner">
        <h3 className="text-xs font-bold text-[#a48843] uppercase tracking-widest mb-3 border-b border-[#332b1a] pb-2">Payment & Refund Breakdown</h3>
        <div className="space-y-2">
          {payments.length > 0 ? payments.map((p: any, i: number) => {
            if (!p.amount || Number(p.amount) <= 0) return null;
            return (
              <div key={i} className="flex justify-between items-start text-sm">
                <span className="text-[#ddd] flex flex-col">
                  <span>{p.method}</span>
                  {p.narration && <span className="text-[10px] text-[#888]">{p.narration}</span>}
                </span>
                <span className="font-bold font-mono text-foreground">₹ {Number(p.amount).toFixed(2)}</span>
              </div>
            );
          }) : (
            <div className="text-[#888] text-xs italic">No payments added yet.</div>
          )}

          <div className="my-2 border-t border-[#332b1a]"></div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-foreground">Total Paid</span>
            <span className="text-sm font-bold font-mono text-[#d4a843]">₹ {totalPaid.toFixed(2)}</span>
          </div>

          {(cashToCustomer > 0 || (isOldGoldExcess && excessGoldMode === 'RETURN_GOLD')) && (
            <div className="my-2 border-t border-[#332b1a]"></div>
          )}

          {isOldGoldExcess && excessGoldMode === 'CASH_OUT' && oldGoldCashedOutValue > 0 && (
             <div className="flex justify-between items-center mt-2 text-green-400">
               <span className="text-xs">Excess Old Gold Cashed Out</span>
               <span className="text-xs font-bold font-mono">- ₹ {oldGoldCashedOutValue.toFixed(2)}</span>
             </div>
          )}
          
          {cashToCustomer > 0 && (
             <div className="flex justify-between items-center mt-1 text-[#d4a843]">
               <span className="text-xs">
                 Refund to Customer ({refundMethod === 'WALLET_CASH' ? 'Wallet Cash' : refundMethod === 'WALLET_METAL' ? 'Wallet Metal' : refundMethod})
               </span>
               <span className="text-xs font-bold font-mono">- ₹ {cashToCustomer.toFixed(2)}</span>
             </div>
          )}

          {isOldGoldExcess && excessGoldMode === 'RETURN_GOLD' && (
             <div className="flex justify-between items-center mt-1 text-blue-400">
               <span className="text-xs">Excess Gold Returned</span>
               <span className="text-xs font-bold font-mono">{excessGoldWeight.toFixed(3)}g</span>
             </div>
          )}

          <div className="my-2 border-t border-[#332b1a]"></div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#888]">{balance > 0 ? "Net Overpaid / Credit" : "Net Due (DR)"}</span>
            <span className={`text-sm font-bold font-mono ${balance > 0 ? "text-green-400" : balance < 0 ? "text-[#e55]" : "text-foreground"}`}>
              ₹ {Math.abs(balance).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* EXCESS UNRESOLVED WARNING */}
      {isExcessUnresolved && (
        <div className="mb-4 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#f59e0b] flex-shrink-0" />
          <p className="text-xs text-[#f59e0b]">
            Old gold excess must be settled before completing payment.
          </p>
        </div>
      )}

      {/* RETURN GOLD DR WARNING */}
      {isReturnGoldBlocked && (
        <div className="mb-4 bg-[#e55]/5 border border-[#e55]/20 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#e55] flex-shrink-0" />
          <p className="text-xs text-[#e55]">
            Clear all dues (DR) before completing payment with excess gold return.
          </p>
        </div>
      )}

      {/* PAYMENT INSUFFICIENT WARNING */}
      {isPaymentInsufficient && !isReturnGoldBlocked && (
        <div className="mb-4 bg-[#e55]/5 border border-[#e55]/20 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#e55] flex-shrink-0" />
          <p className="text-xs text-[#e55]">
            Insufficient payment. Please add payments to cover the grand total.
          </p>
        </div>
      )}

      {/* ACTION BUTTON */}
      <button 
        onClick={onCheckout}
        disabled={!canCheckout}
        className="w-full bg-secondary hover:bg-[#444] text-[#eee] disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Processing...
          </span>
        ) : (
          <>
            <Lock className="w-4 h-4 opacity-70 mb-0.5" />
            {isEditMode ? "Update Invoice" : "Complete Payment"}
          </>
        )}
      </button>
    </div>
  );
};

export default BillingSummary;
