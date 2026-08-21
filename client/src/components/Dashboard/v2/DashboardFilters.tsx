"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Building2 } from "lucide-react";

export function DashboardFilters({ 
  isAdmin, 
  branchId, 
  setBranchId, 
  dateRange, 
  setDateRange,
  branches
}: any) {
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-onyx-surface p-4 rounded-2xl border border-onyx-border">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
        {["today", "week", "month", "quarter", "year"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium capitalize transition-all whitespace-nowrap ${
              dateRange === range
                ? "bg-gold text-foreground shadow-md shadow-gold/20"
                : "bg-onyx-elevated text-platinum-muted hover:text-platinum border border-onyx-border hover:border-gold/30"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
            <select
              value={branchId || ""}
              onChange={(e) => setBranchId(Number(e.target.value))}
              className="pl-9 pr-4 py-1.5 bg-onyx-elevated border border-onyx-border rounded-full text-[13px] font-medium text-platinum appearance-none focus:outline-none focus:border-gold/50 cursor-pointer"
            >
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
