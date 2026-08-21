"use client";

import React from "react";
import { Hammer, Clock, Truck, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function WorkshopOrders({ data }: any) {
  if (!data) return null;

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
      <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
        <Hammer className="w-4 h-4 text-gold" /> Workshop & Orders
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link href="/orderBook?status=PENDING" className="block">
          <div className="p-3 bg-onyx-elevated border border-onyx-border rounded-xl hover:border-gold/30 transition-colors">
            <span className="text-[11px] text-platinum-muted uppercase font-medium tracking-wider mb-1 block">Pending Orders</span>
            <span className="text-lg font-bold text-foreground flex items-center gap-2">
              {data.pendingOrders} <Clock className="w-4 h-4 text-gold" />
            </span>
          </div>
        </Link>
        <Link href="/orderBook?priority=URGENT" className="block">
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors">
            <span className="text-[11px] text-orange-300/80 uppercase font-medium tracking-wider mb-1 block">Urgent</span>
            <span className="text-lg font-bold text-orange-400">{data.urgentOrders}</span>
          </div>
        </Link>
      </div>

      <div className="space-y-3">
        <Link href="/orderBook" className="block">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors">
            <span className="text-[12px] text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Overdue Orders
            </span>
            <span className="text-[13px] font-bold text-rose-400">{data.overdueOrders}</span>
          </div>
        </Link>
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[12px] text-emerald-300 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" /> Today's Deliveries
          </span>
          <span className="text-[13px] font-bold text-emerald-400">{data.todayDeliveries}</span>
        </div>
        
        <div className="pt-2 mt-2 border-t border-onyx-border/50">
          <div className="flex items-center justify-between p-2">
            <span className="text-[12px] text-platinum-muted">Karigar Status</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium"><span className="text-rose-400">{data.karigarBusy}</span> Busy</span>
              <span className="text-[11px] font-medium"><span className="text-emerald-400">{data.karigarAvailable}</span> Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
