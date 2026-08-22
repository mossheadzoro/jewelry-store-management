"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, ArrowUpRight, ArrowDownLeft, Hash, Gem, CircleDollarSign, Diamond, Radio } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AddCategoryForm from "./Category/AddCategoryForm";


interface CategoryStat {
  id: number;
  name: string;
  totalWeight: number;
  itemCount: number;
  subCategoryCount: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  gold: <Hash size={22} className="text-yellow-400" />,
  diamond: <Diamond size={22} className="text-blue-300" />,
  silver: <CircleDollarSign size={22} className="text-foreground/80" />,
  platinum: <Gem size={22} className="text-purple-300" />,
};

const CATEGORY_BORDERS: Record<string, string> = {
  gold: "border-yellow-700/40",
  diamond: "border-blue-700/40",
  silver: "border-gray-600/40",
  platinum: "border-purple-700/40",
};

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_ICONS)) {
    if (lower.includes(key)) return CATEGORY_ICONS[key];
  }
  return <Gem size={22} className="text-amber-400" />;
}

function getCategoryBorder(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_BORDERS)) {
    if (lower.includes(key)) return CATEGORY_BORDERS[key];
  }
  return "border-amber-700/40";
}

async function fetchInventoryOverview(branchId: number) {
  const res = await fetch(`/api/inventory/overview?branchId=${branchId}`);
  if (!res.ok) throw new Error("Failed to fetch inventory overview");
  return res.json();
}

async function fetchRecentActivity(branchId: number) {
  const res = await fetch(`/api/inventory/recent-activity?branchId=${branchId}`);
  if (!res.ok) throw new Error("Failed to fetch recent activity");
  return res.json();
}

export default function InventoryClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedBranch, branches } = useBranchStore();
  const [search, setSearch] = useState("");

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const branchId = selectedBranch?.id;

  // React Query — cached, deduplicated, background refresh
  const { data, isLoading: overviewLoading } = useQuery({
    queryKey: ["inventoryOverview", branchId],
    queryFn: () => fetchInventoryOverview(branchId!),
    enabled: !!branchId,
    placeholderData: (prev: any) => prev,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["inventoryRecentActivity", branchId],
    queryFn: () => fetchRecentActivity(branchId!),
    enabled: !!branchId,
    placeholderData: (prev: any) => prev,
  });

  const loading = overviewLoading && !data;

  const handleGlobalSearch = async () => {
    if (!search.trim() || !selectedBranch?.id) return;
    router.push(`/inventory/search?q=${encodeURIComponent(search)}&branchId=${selectedBranch.id}`);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["inventoryOverview"] });
    queryClient.invalidateQueries({ queryKey: ["inventoryRecentActivity"] });
  };

  const totalPages = Math.ceil((recentActivity?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivity = (recentActivity || []).slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-onyx text-foreground p-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Inventory Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time valuation and categorization</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-yellow-500 uppercase tracking-widest mb-1">Total Vault Weight</p>
          <p className="text-3xl font-bold">{data ? `${data.totalVaultWeight.toLocaleString("en-IN")}g` : "—"}</p>
        </div>
      </div>

      {/* Search Bar + Add Product */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 flex items-center bg-onyx-surface border border-border rounded-2xl px-5 py-3 gap-3">
          <Search size={20} className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
            placeholder="Search by Barcode, Product Code, or HUID..."
            className="bg-transparent outline-none text-foreground w-full text-sm placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/rfid/dashboard")}
            className="flex items-center gap-2 bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold font-semibold px-5 py-3 rounded-2xl text-sm transition-colors cursor-pointer shadow-sm"
          >
            <Radio size={18} className="animate-pulse" /> RFID HUB
          </button>
          <button
            onClick={() => setAddCategoryOpen(true)}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary border border-[#444] text-foreground font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
          >
            <Plus size={18} /> ADD NEW CATEGORY
          </button>
        </div>
      </div>

      {/* Category Cards Grid */}
      {loading ? (
        <div className="text-muted-foreground text-center py-20">Loading inventory data...</div>
      ) : !data || data.categories.length === 0 ? (
        <div className="text-muted-foreground text-center py-20">No categories found. Create some categories first.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {data.categories.map((cat: CategoryStat) => (
            <div
              key={cat.id}
              onClick={() => router.push(`/inventory/category/${cat.id}`)}
              className={`bg-onyx-surface border ${getCategoryBorder(cat.name)} rounded-2xl p-6 cursor-pointer hover:bg-onyx-elevated transition-all group`}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <span className="text-xl font-semibold">{cat.name}</span>
                </div>
                <ArrowUpRight size={20} className="text-gray-600 group-hover:text-yellow-500 transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-5">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Weight</p>
                  <p className="text-lg font-bold">{cat.totalWeight.toLocaleString("en-IN")}g</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Item Count</p>
                  <p className="text-lg font-bold">{cat.itemCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Subcategories</p>
                  <p className="text-lg font-bold">{cat.subCategoryCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Vault Activity</h2>
        </div>
        <div className="space-y-3">
          {(recentActivity || []).length === 0 ? (
            <div className="text-muted-foreground text-sm py-4">No recent activity found.</div>
          ) : (
            <>
              {paginatedActivity.map((activity: any, idx: number) => {
                const isOut = activity.qtyOut > 0 || activity.netWeightOut > 0 || (activity.txnType && activity.txnType.endsWith('_OUT'));
                const isIn = activity.qtyIn > 0 || activity.netWeightIn > 0 || (activity.txnType && activity.txnType.endsWith('_IN'));
                
                const iconBg = isOut ? "bg-rose-900/40" : "bg-emerald-900/40";
                const iconColor = isOut ? "text-rose-400" : "text-emerald-400";
                const IconComponent = isOut ? ArrowUpRight : ArrowDownLeft;
                const actionText = isOut ? "- Removed from Vault" : "+ Added to Vault";
                const textColor = isOut ? "text-rose-500" : "text-emerald-500";
                
                const txnLabel = activity.txnType ? activity.txnType.replace(/_/g, ' ') : "TRANSACTION";
                const weight = isOut ? activity.netWeightOut : activity.netWeightIn;

                return (
                <div key={idx} className="flex items-center gap-4 bg-onyx-surface border border-border/50 rounded-xl p-4 hover:bg-onyx-elevated transition-colors">
                  <div className={`w-9 h-9 ${iconBg} rounded-full flex items-center justify-center shrink-0`}>
                    <IconComponent size={16} className={iconColor} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span className="text-foreground">{activity.product?.name || 'Unknown Product'}</span>
                      <span className="text-xs bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground">{activity.product?.barcode || 'N/A'}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-white/5 text-muted-foreground">
                        {txnLabel}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.product?.purity ? `${activity.product.purity}% Purity • ` : ''} 
                      {weight}g Net Weight
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${textColor}`}>{actionText}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-onyx-surface border border-border/50 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground bg-secondary border border-border rounded-lg transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                          currentPage === page
                            ? "bg-[#d4a843] text-foreground"
                            : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground bg-secondary border border-border rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>




      {addCategoryOpen && (
        <AddCategoryForm open={addCategoryOpen} setOpen={setAddCategoryOpen} onSuccess={invalidateAll} />
      )}
    </div>
  );
}
