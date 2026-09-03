"use client";

import React from "react";
import { Sparkles, TrendingUp, PackageMinus, ArrowRight, Clock, Image as ImageIcon } from "lucide-react";

interface ProductIntelligenceProps {
  data: any;
  trendTimeframe?: string;
  setTrendTimeframe?: (tf: string) => void;
  onOpenModal?: (type: string) => void;
}

export function ProductIntelligence({
  data,
  trendTimeframe = "90d",
  setTrendTimeframe,
  onOpenModal,
}: ProductIntelligenceProps) {
  if (!data) return null;

  const trendingDesigns = data.trendingDesigns || [];
  const frequentlyOrdered = data.frequentlyOrdered || [];
  const slowMovingItems = data.slowMovingItems || [];
  const totalSlowItemsCount = data.allSlowMovingItems?.length || slowMovingItems.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Trending Designs */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" /> Trending Designs
            </h3>

            {/* Timeframe Filter */}
            {setTrendTimeframe && (
              <select
                value={trendTimeframe}
                onChange={(e) => setTrendTimeframe(e.target.value)}
                className="px-2 py-1 bg-onyx-elevated border border-onyx-border rounded-lg text-[11px] font-semibold text-gold focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="180d">Last 180 Days</option>
                <option value="all">All Time</option>
              </select>
            )}
          </div>

          <div className="space-y-2.5 mt-2">
            {trendingDesigns.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-[12px]">No sales recorded in period</div>
            ) : (
              trendingDesigns.slice(0, 5).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-onyx-elevated border border-onyx-border/60 hover:border-gold/30 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[12px] font-medium text-platinum truncate block">{item.name}</span>
                    <span className="text-[10px] text-zinc-500">{item.category}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-platinum">{item.soldCount} sold</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      HOT
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] text-zinc-500 mt-3 pt-2 border-t border-onyx-border/40 text-center">
          Auto-analyzed from {trendTimeframe === "all" ? "all sales history" : `last ${trendTimeframe.replace("d", "")} days invoice logs`}
        </p>
      </div>

      {/* 2. Frequently Ordered */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" /> Frequently Ordered
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium">Custom Orders</span>
          </div>

          <div className="space-y-2.5 mt-2">
            {frequentlyOrdered.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-[12px]">No custom orders recorded</div>
            ) : (
              frequentlyOrdered.slice(0, 5).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-onyx-elevated border border-onyx-border/60 hover:border-gold/30 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[12px] font-medium text-platinum truncate block">{item.name}</span>
                    <span className="text-[10px] text-zinc-500">{item.category}</span>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-gold/10 text-gold font-bold border border-gold/25">
                    #{index + 1} ({item.orderCount})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] text-zinc-500 mt-3 pt-2 border-t border-onyx-border/40 text-center">
          Derived from client custom orders & workshop demand
        </p>
      </div>

      {/* 3. Slow Moving Inventory */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <PackageMinus className="w-4 h-4 text-gold" /> Slow Moving Inventory
            </h3>
            <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {totalSlowItemsCount} Items
            </span>
          </div>

          {/* Top 5 Items Preview with image thumbnails */}
          <div className="space-y-2 mt-2 max-h-[220px] overflow-y-auto pr-1">
            {slowMovingItems.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-[12px]">All inventory active</div>
            ) : (
              slowMovingItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-onyx-elevated border border-onyx-border/60 hover:border-gold/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#222228] border border-[#33333d] overflow-hidden flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-platinum truncate block">{item.name}</span>
                    <span className="text-[10px] text-zinc-400">{item.subCategoryName} • {item.gsWeight}g</span>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      item.daysUnsold >= 120
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {item.daysUnsold}d
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal trigger */}
        <div className="pt-2 border-t border-onyx-border/40 mt-3">
          <button
            onClick={() => onOpenModal && onOpenModal("slowMoving")}
            className="w-full py-2 rounded-xl bg-onyx-elevated hover:bg-gold hover:text-onyx border border-onyx-border hover:border-gold text-[12px] font-semibold text-platinum transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>View All Slow-Moving Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

