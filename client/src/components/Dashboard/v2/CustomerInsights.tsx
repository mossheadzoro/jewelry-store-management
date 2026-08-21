"use client";

import React from "react";
import { Users, UserPlus, Gift, Heart, UserCheck } from "lucide-react";
import Link from "next/link";

export function CustomerInsights({ data }: any) {
  if (!data) return null;

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
      <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-gold" /> Customer Insights
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] text-platinum-muted uppercase font-medium tracking-wider">New</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.newCustomers}</span>
        </div>
        <Link href="/vip" className="block">
          <div className="p-3 bg-gradient-to-br from-gold/10 to-onyx-elevated border border-gold/30 rounded-xl hover:border-gold/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              <span className="text-[11px] text-gold uppercase font-medium tracking-wider">VIP</span>
            </div>
            <span className="text-lg font-bold text-gold">{data.vipCustomers}</span>
          </div>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-onyx-elevated border border-onyx-border/50">
          <span className="text-[12px] text-platinum-muted">Returning Rate</span>
          <span className="text-[13px] font-bold text-foreground">{data.returningRate}%</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-onyx-elevated border border-onyx-border/50">
          <span className="text-[12px] text-platinum-muted">Avg Purchase</span>
          <span className="text-[13px] font-bold text-emerald-400">₹{data.averagePurchase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
          <span className="text-[12px] text-rose-300 flex items-center gap-2">
            <Gift className="w-3 h-3" /> Today's Birthdays
          </span>
          <span className="text-[13px] font-bold text-rose-400">{data.todayBirthdays}</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-pink-500/5 border border-pink-500/20">
          <span className="text-[12px] text-pink-300 flex items-center gap-2">
            <Heart className="w-3 h-3" /> Today's Anniversaries
          </span>
          <span className="text-[13px] font-bold text-pink-400">{data.todayAnniversaries}</span>
        </div>
      </div>
    </div>
  );
}
