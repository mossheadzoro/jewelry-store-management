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
import { Trash2, Plus, Banknote, RotateCcw } from "lucide-react";
import React, { useMemo, useState } from "react";

const BillingPaymentSection = ({ billing }: any) => {
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
  } = billing;

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
    const updated = [...payments];
    updated.splice(i, 1);
    setPayments(updated);
  };

  /* ---------------- PAYMENT CALCULATIONS ---------------- */

  const totalPaid = useMemo(() => {
    return payments.reduce(
      (acc: number, p: any) => acc + (Number(p.amount) || 0),
      0
    );
  }, [payments]);

  const balance = totalPaid - grandTotal;

  const status =
    balance === 0
      ? "SETTLED"
      : balance > 0
      ? "CR"
      : "DR";

  const creditAmount = balance > 0 ? balance : 0;
  const dueAmount = balance < 0 ? Math.abs(balance) : 0;

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden mt-2">
      {/* HEADER BAR */}
      <div className="p-4 border-b border-[#1e1e1e] bg-[#151515]">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Payment Details
        </h3>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-3">
          {payments.map((p: any, i: number) => (
            <div
              key={i}
              className="grid grid-cols-[140px_1fr_1fr_40px] gap-3 items-center bg-[#1a1a1a] p-2.5 rounded-lg border border-[#2a2a2a]"
            >
              {/* METHOD */}
              <Select value={p.method} onValueChange={(v) => updateMethod(i, v)}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#333] text-white focus-visible:ring-[#d4a843]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e1e] border-[#333] text-white">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="RTGS">RTGS</SelectItem>
                  <SelectItem value="METAL">Metal</SelectItem>
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
                    className="bg-[#0a0a0a] border-[#333] text-white focus-visible:ring-[#d4a843]"
                  />
                  <Input
                    type="number"
                    placeholder="₹ Amount"
                    value={p.amount}
                    readOnly
                    className="bg-[#0a0a0a] border-[#333] text-[#aaa] cursor-not-allowed opacity-70"
                  />
                </div>
              ) : (
                <Input
                  type="number"
                  placeholder="Amount ₹"
                  value={p.amount}
                  onChange={(e) => updatePayment(i, "amount", e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-white focus-visible:ring-[#d4a843]"
                />
              )}

              {/* NARRATION */}
              <Input
                placeholder="Narration / Ref No"
                value={p.narration}
                onChange={(e) => updatePayment(i, "narration", e.target.value)}
                className="bg-[#0a0a0a] border-[#333] text-white focus-visible:ring-[#d4a843]"
              />

              {/* REMOVE */}
              <button
                onClick={() => removeMethod(i)}
                disabled={payments.length === 1}
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
                <span className="text-white font-mono">{excessGoldWeight.toFixed(3)}g</span>
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
              {cashToCustomer > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-[#d4a843]/20 mt-1">
                  <span className="text-[#d4a843] font-bold">💰 Cash Given to Customer</span>
                  <span className="text-[#d4a843] font-bold font-mono text-base">₹{cashToCustomer.toFixed(2)}</span>
                </div>
              )}
            </div>
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
                <span className="text-white font-mono">{effectiveExchangeWeight.toFixed(3)}g</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SUMMARY ---------------- */}
        <div className="mt-6 pt-5 border-t border-[#1e1e1e] flex flex-col gap-3 max-w-sm ml-auto">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#888]">Bill Amount</span>
            <span className="font-semibold text-white">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-[#888]">Total Paid</span>
            <span className="font-semibold text-white">
              ₹{totalPaid.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-[#2a2a2a] my-1"></div>

          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-[#888]">Status</span>
            <span
              className={`px-3 py-1 rounded bg-[#1a1a1a] border ${
                status === "CR"
                  ? "text-green-400 border-green-400/20"
                  : status === "DR"
                  ? "text-[#e55] border-[#e55]/20"
                  : "text-blue-400 border-blue-400/20"
              }`}
            >
              {status}
            </span>
          </div>

          {status === "CR" && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-400">Credit Balance</span>
              <span className="font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">₹{creditAmount.toFixed(2)}</span>
            </div>
          )}

          {status === "DR" && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#e55]">Due Amount</span>
              <span className="font-bold text-[#e55] bg-[#e55]/10 px-2 py-0.5 rounded">₹{dueAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPaymentSection;
