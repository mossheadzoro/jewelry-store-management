"use client";

import React from "react";
import { Sparkles, TrendingUp, PackageMinus } from "lucide-react";

export function ProductIntelligence({ data }: any) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Trending Designs */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
        <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-gold" /> Trending Designs
        </h3>
        <div className="space-y-3">
          {data.trending.map((item: string, index: number) => (
            <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-onyx-elevated border border-onyx-border/50">
              <span className="text-[13px] text-platinum-muted">{item}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium tracking-wide">HOT</span>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Ordered */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
        <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-gold" /> Frequently Ordered
        </h3>
        <div className="space-y-3">
          {data.frequentlyOrdered.map((item: string, index: number) => (
            <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-onyx-elevated border border-onyx-border/50">
              <span className="text-[13px] text-platinum-muted">{item}</span>
              <span className="text-[11px] text-gold font-medium">Top {index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slow Moving Inventory */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
        <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
          <PackageMinus className="w-4 h-4 text-gold" /> Slow Moving Inventory
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <span className="text-[13px] text-rose-300/80">Not Sold For 120 Days</span>
            <span className="text-[12px] font-bold text-rose-400">24 items</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <span className="text-[13px] text-orange-300/80">Not Sold For 80 Days</span>
            <span className="text-[12px] font-bold text-orange-400">56 items</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <span className="text-[13px] text-yellow-300/80">Not Sold For 50 Days</span>
            <span className="text-[12px] font-bold text-yellow-400">89 items</span>
          </div>
          <p className="text-[10px] text-platinum-muted/50 mt-2 italic text-center">Liquidation recommended for 120+ days</p>
        </div>
      </div>
    </div>
  );
}
