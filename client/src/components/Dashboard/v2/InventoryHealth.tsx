"use client";

import React from "react";
import { Box, ArrowRightLeft, ShieldAlert, BadgeCheck } from "lucide-react";
import Link from "next/link";

export function InventoryHealth({ data }: any) {
  if (!data) return null;

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
          <Box className="w-4 h-4 text-gold" /> Inventory Health
        </h3>
        <span className="text-[12px] text-platinum-muted bg-onyx-elevated px-2 py-1 rounded border border-onyx-border">
          Est. Value: <strong className="text-gold">₹{data.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/inventory" className="block">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/30 transition-colors">
            <span className="text-[11px] text-platinum-muted uppercase font-medium tracking-wider mb-1 block">Available Items</span>
            <span className="text-lg font-bold text-foreground flex items-center gap-2">
              {data.availableItems} <BadgeCheck className="w-4 h-4 text-emerald-400" />
            </span>
          </div>
        </Link>
        <Link href="/book-products" className="block">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/30 transition-colors">
            <span className="text-[11px] text-platinum-muted uppercase font-medium tracking-wider mb-1 block">Reserved</span>
            <span className="text-lg font-bold text-foreground">{data.reserved}</span>
          </div>
        </Link>
        <Link href="/inventory" className="block">
          <div className="p-3 bg-onyx-elevated border border-orange-500/20 rounded-xl hover:border-orange-500/40 transition-colors">
            <span className="text-[11px] text-orange-300/80 uppercase font-medium tracking-wider mb-1 block">Low Stock</span>
            <span className="text-lg font-bold text-orange-400">{data.lowStock}</span>
          </div>
        </Link>
        <Link href="/inventory" className="block">
          <div className="p-3 bg-onyx-elevated border border-rose-500/20 rounded-xl hover:border-rose-500/40 transition-colors">
            <span className="text-[11px] text-rose-300/80 uppercase font-medium tracking-wider mb-1 block">Out of Stock</span>
            <span className="text-lg font-bold text-rose-400 flex items-center gap-2">
              {data.outOfStock} {data.outOfStock > 0 && <ShieldAlert className="w-4 h-4 text-rose-400" />}
            </span>
          </div>
        </Link>
        <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl">
          <span className="text-[11px] text-platinum-muted uppercase font-medium tracking-wider mb-1 block">Dead Stock</span>
          <span className="text-lg font-bold text-yellow-400">{data.deadStock}</span>
        </div>
        <Link href="/inventory/transfers" className="block">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/30 transition-colors">
            <span className="text-[11px] text-platinum-muted uppercase font-medium tracking-wider mb-1 block">Transfers Pending</span>
            <span className="text-lg font-bold text-foreground flex items-center gap-2">
              {data.transfersPending} {data.transfersPending > 0 && <ArrowRightLeft className="w-4 h-4 text-gold" />}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
