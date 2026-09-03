"use client";

import React from "react";
import { Building2, ChevronDown, Store, Calendar } from "lucide-react";

interface DashboardFiltersProps {
  isAdmin?: boolean;
  branchId: number | null;
  setBranchId: (id: number | null) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  branches: Array<{ id: number; name: string; city?: string }>;
}

export function DashboardFilters({
  isAdmin = true,
  branchId,
  setBranchId,
  dateRange,
  setDateRange,
  branches = [],
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-onyx-surface p-3.5 md:p-4 rounded-2xl border border-onyx-border shadow-sm">
      {/* Date Range Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-0.5 no-scrollbar hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mr-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-gold" />
          <span>Period:</span>
        </div>
        {["today", "week", "month", "quarter", "year"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium capitalize transition-all whitespace-nowrap ${
              dateRange === range
                ? "bg-gold text-onyx font-bold shadow-md shadow-gold/20 ring-1 ring-gold/50"
                : "bg-onyx-elevated text-platinum-muted hover:text-platinum border border-onyx-border hover:border-gold/30"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Dedicated Dashboard Branch Selector (Top Right) */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none flex items-center gap-1.5 text-gold">
                <Store className="w-3.5 h-3.5" />
              </div>
              <select
                value={branchId === null ? "all" : branchId.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setBranchId(val === "all" ? null : Number(val));
                }}
                className="pl-9 pr-9 py-2 bg-onyx-elevated hover:bg-[#1f1f26] border border-onyx-border hover:border-gold/40 rounded-xl text-[12px] font-semibold text-platinum appearance-none focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 cursor-pointer transition-all shadow-inner"
              >
                <option value="all" className="bg-[#121215] text-gold font-bold">
                  🏢 All Branches (Global Network)
                </option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id.toString()} className="bg-[#121215] text-platinum">
                    📍 {b.name} {b.city ? `(${b.city})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 pointer-events-none w-3.5 h-3.5 text-zinc-400" />
            </div>

            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-gold/10 text-gold border border-gold/25 uppercase tracking-wider hidden sm:inline-block">
              {branchId === null ? "All Locations" : "Filtered Branch"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-onyx-elevated border border-onyx-border text-[12px] text-platinum">
            <Store className="w-3.5 h-3.5 text-gold" />
            <span>Assigned Branch</span>
          </div>
        )}
      </div>
    </div>
  );
}

