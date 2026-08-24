"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { Building2, MapPin, Lock, ChevronDown, Store } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function BranchSelector() {
  const { data: session } = useSession();
  const user = useUserStore((state) => state.user);
  const {
    branches,
    selectedBranch,
    fetchAllBranches,
    fetchBranchById,
    selectBranch,
  } = useBranchStore();

  const userRole = (
    session?.user?.role ||
    user?.systemRole ||
    user?.role ||
    "SALESMAN"
  ).toUpperCase();

  const isAdmin =
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";

  // Fetch branches if admin
  useEffect(() => {
    if (isAdmin) {
      fetchAllBranches();
    } else {
      // If not admin, lock selection to assigned branch
      const branchId = session?.user?.branchId || user?.branchId;
      if (branchId) {
        fetchBranchById(Number(branchId));
      }
    }
  }, [isAdmin, session?.user?.branchId, user?.branchId, fetchAllBranches, fetchBranchById]);

  // Non-Admin: Show read-only branch badge
  if (!isAdmin) {
    return (
      <div className="w-full px-3 py-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#121215] border border-[#27272a] text-[12px] text-platinum shadow-inner">
          <div className="w-6 h-6 rounded-lg bg-[#d4a843]/10 border border-[#d4a843]/20 flex items-center justify-center shrink-0">
            <Store className="w-3.5 h-3.5 text-[#d4a843]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span>Store Location</span>
              <Lock className="w-2.5 h-2.5 text-zinc-500" />
            </div>
            <p className="font-medium text-platinum text-[12px] truncate leading-tight mt-0.5">
              {selectedBranch?.name || "Assigned Branch"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin: Render interactive branch switcher dropdown
  const handleChange = async (value: string) => {
    const branchId = Number(value);
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      selectBranch(branch);
      await fetchBranchById(branchId);
    }
  };

  return (
    <div className="w-full px-3 py-2 space-y-1.5">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[11px] font-semibold text-[#d4a843] uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Store Network</span>
        </label>
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#d4a843]/15 text-[#d4a843] border border-[#d4a843]/30">
          ADMIN
        </span>
      </div>

      <Select
        onValueChange={handleChange}
        value={selectedBranch?.id?.toString() || ""}
      >
        <SelectTrigger className="w-full h-9 bg-[#121215] border border-[#27272a] hover:border-[#d4a843]/50 focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/30 rounded-xl text-[12px] text-platinum px-3 transition-all">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#d4a843] shrink-0" />
            <SelectValue placeholder="Select active branch..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-[#121215] border border-[#27272a] text-platinum rounded-xl shadow-2xl max-h-60">
          {branches.map((branch) => (
            <SelectItem
              key={branch.id}
              value={branch.id.toString()}
              className="text-[12px] focus:bg-[#1a1a1f] focus:text-[#d4a843] rounded-lg cursor-pointer py-2"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span className="font-medium truncate">{branch.name}</span>
                {branch.city && (
                  <span className="text-[10px] text-zinc-500">
                    {branch.city}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
