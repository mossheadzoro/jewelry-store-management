"use client";

import React from "react";
import { Users, UserPlus, Gift, Heart, UserCheck, ArrowRight, Cake } from "lucide-react";

interface CustomerInsightsProps {
  data: any;
  onOpenModal?: (type: string) => void;
}

export function CustomerInsights({ data, onOpenModal }: CustomerInsightsProps) {
  if (!data) return null;

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm">
      <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-gold" /> Customer Insights
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* New Customers Card */}
        <div
          onClick={() => onOpenModal && onOpenModal("newCustomers")}
          className="p-3 bg-onyx-elevated hover:bg-[#1c1c22] border border-onyx-border hover:border-gold/40 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">New</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-gold transition-colors" />
          </div>
          <span className="text-lg font-bold text-foreground">{data.newCustomersCount || 0}</span>
          <p className="text-[10px] text-zinc-500 mt-0.5">Click to view list</p>
        </div>

        {/* VIP Customers Card */}
        <div
          onClick={() => onOpenModal && onOpenModal("vipCustomers")}
          className="p-3 bg-gradient-to-br from-gold/10 to-onyx-elevated hover:from-gold/20 border border-gold/30 hover:border-gold/50 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] text-gold uppercase font-bold tracking-wider">VIP Tier</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gold/60 group-hover:text-gold transition-colors" />
          </div>
          <span className="text-lg font-bold text-gold">{data.vipCustomersCount || 0}</span>
          <p className="text-[10px] text-gold/70 mt-0.5">VIP customer registry</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-onyx-elevated border border-onyx-border/60">
          <span className="text-[12px] text-zinc-400">Retention Rate</span>
          <span className="text-[13px] font-bold text-foreground">{data.returningRate || 74}%</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-onyx-elevated border border-onyx-border/60">
          <span className="text-[12px] text-zinc-400">Avg Ticket Value</span>
          <span className="text-[13px] font-bold text-emerald-400">
            ₹{(data.averagePurchase || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Today's Birthdays */}
        <div
          onClick={() => onOpenModal && onOpenModal("celebrations")}
          className="flex items-center justify-between p-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/25 hover:border-pink-500/40 cursor-pointer transition-all group"
        >
          <span className="text-[12px] text-pink-300 flex items-center gap-2 font-medium">
            <Cake className="w-3.5 h-3.5 text-pink-400" /> Today's Birthdays
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-pink-400">{data.todayBirthdaysCount || 0}</span>
            <ArrowRight className="w-3 h-3 text-pink-400/60 group-hover:text-pink-400 transition-colors" />
          </div>
        </div>

        {/* Today's Anniversaries */}
        <div
          onClick={() => onOpenModal && onOpenModal("celebrations")}
          className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 hover:border-rose-500/40 cursor-pointer transition-all group"
        >
          <span className="text-[12px] text-rose-300 flex items-center gap-2 font-medium">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Today's Anniversaries
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-rose-400">{data.todayAnniversariesCount || 0}</span>
            <ArrowRight className="w-3 h-3 text-rose-400/60 group-hover:text-rose-400 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

