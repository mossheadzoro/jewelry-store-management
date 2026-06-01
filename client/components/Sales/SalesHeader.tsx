"use client";

import React, { useEffect } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { CalendarDays, Building } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface SalesHeaderProps {
  dateRange: { from: Date; to: Date };
}

export default function SalesHeader({ dateRange }: SalesHeaderProps) {
  const { selectedBranch, branches, fetchAllBranches, selectBranch } = useBranchStore();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchAllBranches();
    }
  }, [user, fetchAllBranches]);

  const formatDate = (date: Date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleBranchChange = (value: string) => {
    const branchId = Number(value);
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      selectBranch(branch);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-serif text-[#F0EBE0] tracking-wide">
          Sales Management
        </h1>
        <p className="text-sm text-[#6B6560] mt-1">
          Monitor revenue, compliance, and transactions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Branch Selector Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#3A2E18] bg-[#111113] text-sm text-[#F0EBE0]">
          <Building className="w-4 h-4 text-[#C9943A]" />
          <span className="text-xs text-[#6B6560] uppercase font-semibold">Branch:</span>
          {user?.role === "ADMIN" && branches.length > 0 ? (
            <Select
              onValueChange={handleBranchChange}
              value={selectedBranch?.id?.toString() || ""}
            >
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm text-[#F0EBE0] focus:ring-0 focus:ring-offset-0 font-medium cursor-pointer shadow-none">
                <SelectValue placeholder="Choose Branch" />
              </SelectTrigger>
              <SelectContent className="bg-[#111113] border border-[#1F1F24] text-[#F0EBE0]">
                {branches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id.toString()}
                    className="focus:bg-[#222228] focus:text-[#E8B84B] cursor-pointer"
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium">{selectedBranch?.name || "Main Atelier"}</span>
          )}
        </div>

        {/* Date Range Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#3A2E18] bg-[#111113] text-sm text-[#F0EBE0]">
          <CalendarDays className="w-4 h-4 text-[#C9943A]" />
          <span className="text-xs text-[#6B6560] uppercase font-semibold">Period:</span>
          <span className="font-medium">
            {formatDate(dateRange.from)} – {formatDate(dateRange.to)}
          </span>
        </div>
      </div>
    </div>
  );
}
