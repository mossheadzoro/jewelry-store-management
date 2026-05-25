"use client";

import React from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { CalendarDays } from "lucide-react";

interface SalesHeaderProps {
  dateRange: { from: Date; to: Date };
}

export default function SalesHeader({ dateRange }: SalesHeaderProps) {
  const { selectedBranch } = useBranchStore();

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  return (
    <div className="flex items-start justify-between mb-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Sales Management
        </h1>
        <p className="text-sm text-[#888] mt-1">
          Manage and track your private viewing room invoices.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Branch Display */}
        {selectedBranch && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a] text-sm text-[#ccc]">
            <span>{selectedBranch.name}</span>
          </div>
        )}
        {/* Date Range Display */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a] text-sm text-[#ccc]">
          <CalendarDays className="w-4 h-4 text-[#D4A843]" />
          <span>
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </span>
        </div>
      </div>
    </div>
  );
}
