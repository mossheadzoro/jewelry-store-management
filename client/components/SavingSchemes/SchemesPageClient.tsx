"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import {
  PiggyBank,
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  Coins,
  ChevronRight,
  Filter,
  RefreshCw,
  Gift,
} from "lucide-react";
import CreateSchemeModal from "./CreateSchemeModal";
import SchemeDetailPanel from "./SchemeDetailPanel";

type SchemeType = "FIXED_MONTHLY" | "ANONYMOUS_DEPOSIT" | "GOLD_DEPOSIT";
type SchemeStatus = "ACTIVE" | "MATURED" | "REDEEMED" | "PARTIALLY_REDEEMED" | "CANCELLED" | "EXPIRED";

interface SchemeRow {
  id: string;
  schemeNumber: string;
  type: SchemeType;
  status: SchemeStatus;
  fixedMonthlyAmount: number | null;
  maxDurationMonths: number;
  startDate: string;
  maturityDate: string | null;
  totalCashDeposited: number;
  totalGoldDepositedGm: number;
  totalBonusAmount: number;
  depositCount: number;
  totalRedeemed: number;
  physicalCardNumber: string | null;
  createdAt: string;
  customer: { id: number; name: string; mobile: string };
  _count: { deposits: number };
}

interface Stats {
  totalSchemes: number;
  activeSchemes: number;
  maturedSchemes: number;
  totalCashDeposited: number;
  totalGoldDeposited: number;
  depositsThisMonth: number;
  depositAmountThisMonth: number;
  totalActiveValue: number;
  activeMetalHolding: number;
  totalBonusGiven: number;
}

const TYPE_CONFIG: Record<SchemeType, { label: string; color: string; bg: string }> = {
  FIXED_MONTHLY: { label: "Fixed Monthly", color: "text-[#C9943A]", bg: "bg-[#C9943A]/10" },
  ANONYMOUS_DEPOSIT: { label: "Anonymous", color: "text-blue-400", bg: "bg-blue-400/10" },
  GOLD_DEPOSIT: { label: "Gold Deposit", color: "text-amber-400", bg: "bg-amber-400/10" },
};

const STATUS_CONFIG: Record<SchemeStatus, { label: string; dot: string; color: string }> = {
  ACTIVE: { label: "Active", dot: "bg-emerald-400", color: "text-emerald-400" },
  MATURED: { label: "Matured", dot: "bg-[#C9943A]", color: "text-[#C9943A]" },
  REDEEMED: { label: "Redeemed", dot: "bg-blue-400", color: "text-blue-400" },
  PARTIALLY_REDEEMED: { label: "Partial", dot: "bg-purple-400", color: "text-purple-400" },
  CANCELLED: { label: "Cancelled", dot: "bg-red-400", color: "text-red-400" },
  EXPIRED: { label: "Expired", dot: "bg-gray-500", color: "text-gray-500" },
};

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "FIXED_MONTHLY", label: "Fixed Monthly" },
  { id: "ANONYMOUS_DEPOSIT", label: "Anonymous" },
  { id: "GOLD_DEPOSIT", label: "Gold Deposit" },
  { id: "MATURED", label: "Matured" },
  { id: "REDEEMED", label: "Redeemed" },
];

export default function SchemesPageClient() {
  const { selectedBranch } = useBranchStore();
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  const fetchSchemes = useCallback(async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        page: page.toString(),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());

      // Determine if filter is a status or type
      if (activeFilter !== "all") {
        if (["ACTIVE", "MATURED", "REDEEMED", "PARTIALLY_REDEEMED", "CANCELLED", "EXPIRED"].includes(activeFilter)) {
          params.set("status", activeFilter);
        } else {
          params.set("type", activeFilter);
        }
      }

      const res = await fetch(`/api/schemes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSchemes(data.schemes);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (e) {
      console.error("Failed to fetch schemes", e);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch?.id, page, search, activeFilter]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <main className="flex-1 min-h-screen bg-[#0A0A0B] overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* ─── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#F0EBE0] tracking-wide flex items-center gap-3">
              <PiggyBank className="w-8 h-8 text-[#C9943A]" />
              Saving Schemes
            </h1>
            <p className="text-sm text-[#6B6560] mt-1">
              Manage customer deposit schemes, track payments & redemptions.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-black text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-[#C9943A]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Scheme
          </button>
        </div>

        {/* ─── Stats Row ────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Coins className="w-5 h-5" />}
              label="Deposits This Month"
              value={formatCurrency(stats.depositAmountThisMonth)}
              sub={`${stats.depositsThisMonth} transactions`}
              accent="text-[#C9943A]"
            />
            <StatCard
              icon={<Gift className="w-5 h-5" />}
              label="Total Bonuses"
              value={formatCurrency(stats.totalBonusGiven)}
              sub="All time credited"
              accent="text-emerald-400"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Total Active Value"
              value={formatCurrency(stats.totalActiveValue)}
              sub="Includes matured (pending)"
              accent="text-blue-400"
            />
            <StatCard
              icon={<PiggyBank className="w-5 h-5" />}
              label="Active Metal Holding"
              value={`${stats.activeMetalHolding.toFixed(2)}g`}
              sub="Gold in active schemes"
              accent="text-amber-400"
            />
          </div>
        )}

        {/* ─── Filter Tabs + Search ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveFilter(tab.id); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-[#C9943A]/15 text-[#C9943A] border border-[#C9943A]/30"
                    : "text-[#6B6560] hover:text-[#F0EBE0] hover:bg-[#1A1A1D] border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
              <input
                type="text"
                placeholder="Search scheme, customer…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#C9943A]/50 transition-colors"
              />
            </div>
            <button
              onClick={fetchSchemes}
              className="p-2 rounded-lg border border-[#1F1F24] text-[#6B6560] hover:text-[#F0EBE0] hover:border-[#222228] bg-[#111113] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Schemes Table ────────────────────────────────────────────── */}
        <div className="bg-[#111113] border border-[#1F1F24] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1F1F24]">
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Scheme</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Deposits</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Total Value</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Maturity</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 bg-[#1A1A1D] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-[#6B6560]">
                    <PiggyBank className="w-12 h-12 mx-auto mb-3 text-[#333]" />
                    <p className="text-sm">No schemes found</p>
                    <p className="text-xs mt-1">Create your first saving scheme to get started</p>
                  </td>
                </tr>
              ) : (
                schemes.map((s) => {
                  const typeConf = TYPE_CONFIG[s.type];
                  const statusConf = STATUS_CONFIG[s.status];
                  const totalValue = s.totalCashDeposited + s.totalBonusAmount;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSchemeId(s.id)}
                      className="hover:bg-[#1A1A1D]/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-mono font-medium text-[#C9943A]">{s.schemeNumber}</span>
                          {s.physicalCardNumber && (
                            <span className="text-[10px] text-[#6B6560] mt-0.5">Card: {s.physicalCardNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-[#F0EBE0] font-medium">{s.customer.name}</span>
                          <span className="text-[10px] text-[#6B6560]">{s.customer.mobile}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${typeConf.color} ${typeConf.bg}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          <span className={`text-xs font-medium ${statusConf.color}`}>{statusConf.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[#F0EBE0]">{s._count.deposits}</span>
                        {s.type === "FIXED_MONTHLY" && (
                          <span className="text-[10px] text-[#6B6560] ml-1">/ {s.maxDurationMonths}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[#F0EBE0] font-medium">{formatCurrency(totalValue)}</span>
                        {s.totalGoldDepositedGm > 0 && (
                          <span className="text-[10px] text-amber-400 ml-1">+ {s.totalGoldDepositedGm.toFixed(2)}g</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-[#6B6560]">
                          {s.maturityDate ? new Date(s.maturityDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#C9943A] transition-colors" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ───────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  p === page
                    ? "bg-[#C9943A] text-black"
                    : "bg-[#111113] text-[#6B6560] hover:text-[#F0EBE0] border border-[#1F1F24]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateSchemeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchSchemes();
          }}
        />
      )}

      {selectedSchemeId && (
        <SchemeDetailPanel
          schemeId={selectedSchemeId}
          onClose={() => setSelectedSchemeId(null)}
          onUpdated={fetchSchemes}
        />
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-[#111113] border border-[#1F1F24] rounded-xl p-5 hover:border-[#C9943A]/20 transition-colors">
      <div className={`flex items-center gap-2 mb-3 ${accent}`}>
        {icon}
        <span className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-[#F0EBE0] font-mono">{value}</p>
      <p className="text-xs text-[#6B6560] mt-1">{sub}</p>
    </div>
  );
}
