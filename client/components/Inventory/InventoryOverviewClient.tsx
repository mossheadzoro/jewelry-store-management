"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ArrowUpRight, Hash, Gem, CircleDollarSign, Diamond } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";

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
  silver: <CircleDollarSign size={22} className="text-gray-300" />,
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

export default function InventoryClient() {
  const router = useRouter();
  const { selectedBranch, branches } = useBranchStore();
  const [data, setData] = useState<{ categories: CategoryStat[]; totalVaultWeight: number; totalItems: number } | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const [overviewRes, recentRes] = await Promise.all([
        fetch(`/api/inventory/overview?branchId=${selectedBranch.id}`),
        fetch(`/api/inventory/recent-activity?branchId=${selectedBranch.id}`)
      ]);
      if (overviewRes.ok) setData(await overviewRes.json());
      if (recentRes.ok) {
        const activityData = await recentRes.json();
        setRecentActivity(activityData);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  const handleGlobalSearch = async () => {
    if (!search.trim() || !selectedBranch?.id) return;
    router.push(`/inventory/search?q=${encodeURIComponent(search)}&branchId=${selectedBranch.id}`);
  };

  const totalPages = Math.ceil(recentActivity.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivity = recentActivity.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Inventory Overview</h1>
          <p className="text-gray-500 text-sm">Real-time valuation and categorization</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-yellow-500 uppercase tracking-widest mb-1">Total Vault Weight</p>
          <p className="text-3xl font-bold">{data ? `${data.totalVaultWeight.toLocaleString("en-IN")}g` : "—"}</p>
        </div>
      </div>

      {/* Search Bar + Add Product */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 flex items-center bg-[#141414] border border-gray-800 rounded-2xl px-5 py-3 gap-3">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
            placeholder="Search by Barcode, Product Code, or HUID..."
            className="bg-transparent outline-none text-white w-full text-sm placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAddCategoryOpen(true)}
            className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
          >
            <Plus size={18} /> ADD NEW CATEGORY
          </button>

        </div>
      </div>

      {/* Category Cards Grid */}
      {loading ? (
        <div className="text-gray-500 text-center py-20">Loading inventory data...</div>
      ) : !data || data.categories.length === 0 ? (
        <div className="text-gray-500 text-center py-20">No categories found. Create some categories first.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {data.categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => router.push(`/inventory/category/${cat.id}`)}
              className={`bg-[#141414] border ${getCategoryBorder(cat.name)} rounded-2xl p-6 cursor-pointer hover:bg-[#1a1a1a] transition-all group`}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1e1e1e] rounded-xl flex items-center justify-center">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <span className="text-xl font-semibold">{cat.name}</span>
                </div>
                <ArrowUpRight size={20} className="text-gray-600 group-hover:text-yellow-500 transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-800/50 pt-5">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Total Weight</p>
                  <p className="text-lg font-bold">{cat.totalWeight.toLocaleString("en-IN")}g</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Item Count</p>
                  <p className="text-lg font-bold">{cat.itemCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Subcategories</p>
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
          {recentActivity.length === 0 ? (
            <div className="text-gray-500 text-sm py-4">No recent activity found.</div>
          ) : (
            <>
              {paginatedActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-[#141414] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1a1a] transition-colors">
                  <div className="w-9 h-9 bg-emerald-900/40 rounded-full flex items-center justify-center shrink-0">
                    <Plus size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span className="text-white">{activity.name}</span>
                      <span className="text-xs bg-[#222] border border-[#333] px-2 py-0.5 rounded text-gray-400">{activity.barcode}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.purity}% Purity • {activity.ntWeight}g Net Weight
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-500">+ Added to Vault</p>
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(activity.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-[#141414] border border-gray-800/50 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 bg-[#222] border border-[#333] rounded-lg transition-colors"
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
                            ? "bg-[#d4a843] text-black"
                            : "bg-[#222] border border-[#333] text-gray-400 hover:text-white"
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
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 bg-[#222] border border-[#333] rounded-lg transition-colors"
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
        <AddCategoryForm open={addCategoryOpen} setOpen={setAddCategoryOpen} onSuccess={fetchData} />
      )}
    </div>
  );
}
