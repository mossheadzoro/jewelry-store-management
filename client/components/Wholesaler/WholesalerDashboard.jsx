"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SummaryCard from "./SummaryCard";
import WholesalerTable from "./WholesalerTable";
import CreateWholesalerModal from "./CreateWholesalerModel";
import { useBranchStore } from "@/lib/store/useBranchStore";

const WholesalerDashboard = () => {
  const { selectedBranch } = useBranchStore();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: queryData } = useQuery({
    queryKey: ["wholesalers", selectedBranch?.id, search, activeFilter],
    queryFn: async () => {
      if (!selectedBranch?.id) return { table: [], summary: null };
      const q = new URLSearchParams();
      q.append("branchId", String(selectedBranch.id));
      if (search) q.append("search", search);
      if (activeFilter !== "ALL") q.append("filter", activeFilter);
      const res = await fetch(`/api/wholesalers?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedBranch?.id,
    placeholderData: (prev) => prev,
  });

  const wholesalers = queryData?.table || [];
  const summary = queryData?.summary || null;

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto px-8 py-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Wholesaler Network</h1>
          <p className="text-[13px] text-[#666] mt-1">Manage wholesale partners, balances, and metal accounts.</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-[#D4A843] hover:bg-[#C29B3C] text-black px-5 py-2.5 rounded-xl shadow-lg transition-colors font-semibold text-[14px]" 
          onClick={() => setOpen(true)}
        >
          <Plus size={18} />
          Add Wholesaler
        </button>
      </div>
      <CreateWholesalerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: ["wholesalers"] });
        }}
      />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
  <SummaryCard
    title="Total Wholesalers"
    value={summary?.totalWholesalers ?? 0}
  />

  <SummaryCard
    title="Gold Due (g)"
    value={`${summary?.goldDue?.toFixed(3) ?? "0.000"} g`}
    accent="gold"
  />

  <SummaryCard
    title="Silver Due (g)"
    value={`${summary?.silverDue?.toFixed(3) ?? "0.000"} g`}
    accent="silver"
  />

  <SummaryCard
    title="Money Due (₹)"
    value={`₹${summary?.moneyDue?.toLocaleString("en-IN") ?? "0"}`}
    accent="money"
  />

  <SummaryCard
    title="Money Deposited (₹)"
    value={`₹${summary?.moneyDeposit?.toLocaleString("en-IN") ?? "0"}`}
    accent="deposit"
  />
</div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-[320px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#141414] border border-[#222] text-[13px] text-white placeholder:text-[#555] outline-none focus:border-[#D4A843]/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <Filter size={16} className="text-[#555] mr-1" />
          {[
            { label: "All", value: "ALL" },
            { label: "Has Balance Due", value: "HAS_DUE" },
            { label: "Has Advance/Deposit", value: "HAS_DEPOSIT" },
            { label: "Active Orders", value: "ACTIVE_ORDERS" },
          ].map((f) => (
            <button
              key={f.value}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                activeFilter === f.value
                  ? "bg-[#D4A843] text-black"
                  : "bg-[#141414] text-[#888] hover:text-white border border-[#222]"
              }`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <WholesalerTable wholesalers={wholesalers} />

      {/* Pagination */}
      <div className="flex justify-end mt-6 gap-2">
        <button className="px-4 py-2 bg-[#111827] rounded-lg">1</button>
        <button className="px-4 py-2 bg-[#111827] rounded-lg">2</button>
        <button className="px-4 py-2 bg-[#111827] rounded-lg">3</button>
      </div>
    </div>
  );
}

export default WholesalerDashboard;
