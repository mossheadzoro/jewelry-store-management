"use client";

import React from "react";
import {
  Landmark,
  IndianRupee,
  CreditCard,
  Smartphone,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#8B5CF6"];

interface FinanceOverviewProps {
  data: any;
  onOpenModal?: (type: string) => void;
}

export function FinanceOverview({ data, onOpenModal }: FinanceOverviewProps) {
  if (!data) return null;

  const collectionData = [
    { name: "Cash", value: data.todayCollection?.cash || 0 },
    { name: "UPI", value: data.todayCollection?.upi || 0 },
    { name: "Card", value: data.todayCollection?.card || 0 },
    { name: "Wallet", value: data.todayCollection?.wallet || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <Landmark className="w-4 h-4 text-gold" /> Finance & Collections
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            Total: <strong className="text-emerald-400">₹{(data.totalCollection || 0).toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2.5 flex-1 pr-4 border-r border-onyx-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-400 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Cash
              </span>
              <span className="text-[12px] font-medium text-foreground">
                ₹{(data.todayCollection?.cash || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> UPI
              </span>
              <span className="text-[12px] font-medium text-foreground">
                ₹{(data.todayCollection?.upi || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Card
              </span>
              <span className="text-[12px] font-medium text-foreground">
                ₹{(data.todayCollection?.card || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-purple-400" /> Wallet
              </span>
              <span className="text-[12px] font-medium text-foreground">
                ₹{(data.todayCollection?.wallet || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="w-[100px] h-[100px] shrink-0 ml-4 flex items-center justify-center">
            {collectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collectionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {collectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121215",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      fontSize: "11px",
                      padding: "4px 8px",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[10px] text-zinc-600 text-center">No receipts</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Outstanding & Advances Cards */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {/* Outstanding Receivables */}
        <div
          onClick={() => onOpenModal && onOpenModal("outstanding")}
          className="p-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 hover:border-rose-500/40 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider flex items-center gap-1">
              <ArrowDownCircle className="w-3 h-3 text-rose-400" /> Outstanding
            </span>
            <ArrowRight className="w-3 h-3 text-rose-400/60 group-hover:text-rose-400 transition-colors" />
          </div>
          <span className="text-base font-bold text-rose-400 block">
            ₹{(data.outstandingPayments || 0).toLocaleString("en-IN")}
          </span>
          <p className="text-[10px] text-rose-400/70 mt-0.5 font-medium">Click to view bills ▸</p>
        </div>

        {/* Advances Collected */}
        <div
          onClick={() => onOpenModal && onOpenModal("advances")}
          className="p-3 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3 text-emerald-400" /> Advances
            </span>
            <ArrowRight className="w-3 h-3 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
          </div>
          <span className="text-base font-bold text-emerald-400 block">
            ₹{(data.advanceCollected || 0).toLocaleString("en-IN")}
          </span>
          <p className="text-[10px] text-emerald-400/70 mt-0.5 font-medium">Order book & bookings ▸</p>
        </div>
      </div>
    </div>
  );
}

