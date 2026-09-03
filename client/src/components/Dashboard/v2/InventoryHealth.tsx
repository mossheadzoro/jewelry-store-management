"use client";

import React from "react";
import { Box, ArrowRightLeft, ShieldAlert, BadgeCheck, AlertTriangle, Layers } from "lucide-react";
import Link from "next/link";

interface InventoryHealthProps {
  data: any;
  onOpenModal?: (type: string) => void;
}

export function InventoryHealth({ data, onOpenModal }: InventoryHealthProps) {
  if (!data) return null;

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
          <Box className="w-4 h-4 text-gold" /> Inventory Health
        </h3>
        <span className="text-[11px] text-zinc-400 bg-onyx-elevated px-2.5 py-1 rounded-lg border border-onyx-border">
          Est. Value: <strong className="text-gold">₹{(data.totalValue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Available Items */}
        <Link href="/inventory" className="block group">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/40 transition-all">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider mb-1 block">
              Available Items
            </span>
            <span className="text-lg font-bold text-foreground flex items-center gap-1.5">
              {data.availableItems || 0} <BadgeCheck className="w-4 h-4 text-emerald-400" />
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Active in stock</p>
          </div>
        </Link>

        {/* Reserved Items */}
        <Link href="/book-products" className="block group">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/40 transition-all">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider mb-1 block">
              Reserved
            </span>
            <span className="text-lg font-bold text-platinum">{data.reserved || 0}</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Locked in bookings</p>
          </div>
        </Link>

        {/* Low Stock Subcategories (Clickable to open modal) */}
        <div
          onClick={() => onOpenModal && onOpenModal("lowStock")}
          className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/15 hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider mb-1 block">
              Low Stock Subcats
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-lg font-bold text-amber-400">
            {data.lowStockSubcategoriesCount || 0}{" "}
            <span className="text-[11px] font-normal text-amber-300/80">
              ({data.lowStockUnitsCount || 0} units)
            </span>
          </span>
          <p className="text-[10px] text-amber-400/80 mt-0.5 font-medium">Click to view list ▸</p>
        </div>

        {/* Out of Stock Subcategories (Clickable to open modal) */}
        <div
          onClick={() => onOpenModal && onOpenModal("outOfStock")}
          className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl hover:bg-rose-500/15 hover:border-rose-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider mb-1 block">
              Out of Stock
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-lg font-bold text-rose-400">
            {data.outOfStockSubcategoriesCount || 0}{" "}
            <span className="text-[11px] font-normal text-rose-300/80">subcats</span>
          </span>
          <p className="text-[10px] text-rose-400/80 mt-0.5 font-medium">Click to view list ▸</p>
        </div>

        {/* Transfer Stock Pending */}
        <Link href="/inventory/transfers" className="block col-span-2 group">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/40 transition-all flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider block">
                Transfers in Transit
              </span>
              <span className="text-base font-bold text-foreground">
                {data.transfersPending || 0} Batches Pending
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center border border-gold/20">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

