"use client";

import React from "react";
import { Hammer, Clock, Truck, ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react";

interface WorkshopOrdersProps {
  data: any;
  onOpenModal?: (type: string) => void;
}

export function WorkshopOrders({ data, onOpenModal }: WorkshopOrdersProps) {
  if (!data) return null;

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <Hammer className="w-4 h-4 text-gold" /> Workshop & Orders
          </h3>
          <button
            onClick={() => onOpenModal && onOpenModal("workshop")}
            className="text-[11px] text-gold hover:underline flex items-center gap-1 font-medium"
          >
            <span>View All Jobs</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Pending Orders */}
          <div
            onClick={() => onOpenModal && onOpenModal("workshop")}
            className="p-3 bg-onyx-elevated hover:bg-[#1f1f26] border border-onyx-border hover:border-gold/40 rounded-xl cursor-pointer transition-all group"
          >
            <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider mb-1 block">
              In Production
            </span>
            <span className="text-lg font-bold text-foreground flex items-center gap-1.5">
              {data.pendingOrders || 0} <Clock className="w-3.5 h-3.5 text-gold" />
            </span>
          </div>

          {/* Urgent Orders */}
          <div
            onClick={() => onOpenModal && onOpenModal("workshop")}
            className="p-3 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/25 hover:border-orange-500/40 rounded-xl cursor-pointer transition-all group"
          >
            <span className="text-[10px] text-orange-300 uppercase font-bold tracking-wider mb-1 block">
              Urgent Priority
            </span>
            <span className="text-lg font-bold text-orange-400 flex items-center gap-1.5">
              {data.urgentOrders || 0} <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Overdue Orders */}
          <div
            onClick={() => onOpenModal && onOpenModal("workshop")}
            className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 hover:border-rose-500/40 cursor-pointer transition-all"
          >
            <span className="text-[12px] text-rose-300 flex items-center gap-2 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Overdue Orders
            </span>
            <span className="text-[13px] font-bold text-rose-400">{data.overdueOrders || 0}</span>
          </div>

          {/* Today's Deliveries */}
          <div
            onClick={() => onOpenModal && onOpenModal("workshop")}
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/35 cursor-pointer transition-all"
          >
            <span className="text-[12px] text-emerald-300 flex items-center gap-2 font-medium">
              <Truck className="w-3.5 h-3.5 text-emerald-400" /> Today's Deliveries
            </span>
            <span className="text-[13px] font-bold text-emerald-400">{data.todayDeliveries || 0}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-onyx-border/50">
        <div className="flex items-center justify-between p-1">
          <span className="text-[12px] text-zinc-400">Karigar Capacity</span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-zinc-300">
              <strong className="text-rose-400">{data.karigarBusy || 0}</strong> Active
            </span>
            <span className="text-[11px] font-medium text-zinc-300">
              <strong className="text-emerald-400">{data.karigarAvailable || 2}</strong> Free
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

