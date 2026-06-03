"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trophy, Crown, TrendingUp, Package, Filter, Clock, Medal, User, MessageSquare, Tag, ChevronLeft, ChevronRight } from "lucide-react";

interface VipStats {
  elite: { count: number; active: number; quarterlyRev: string; avgSpend: string };
  vip: { count: number; active: number; quarterlyRev: string; avgSpend: string };
  highValue: { count: number; active: number; quarterlyRev: string; avgSpend: string };
  wholesale: { count: number; active: number; quarterlyRev: string; avgVol: string };
}

interface VipCustomer {
  id: number;
  name: string;
  joinDate: string;
  rfmScore: number;
  lifetimeValue: number;
  preferredMetal: string;
  lastInteraction: string;
  outstanding: number;
  loyaltyTier: string;
}

export default function VipPage() {
  const [activeTier, setActiveTier] = useState<"ALL" | "ELITE" | "VIP" | "HIGH_VALUE" | "WHOLESALE">("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["vip-customers", activeTier, page],
    queryFn: async () => {
      const res = await fetch(`/api/customer/vip?tier=${activeTier}&page=${page}&limit=12`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const stats: VipStats = data?.stats || {
    elite: { count: 0, active: 0, quarterlyRev: "₹ 0", avgSpend: "₹ 0" },
    vip: { count: 0, active: 0, quarterlyRev: "₹ 0", avgSpend: "₹ 0" },
    highValue: { count: 0, active: 0, quarterlyRev: "₹ 0", avgSpend: "₹ 0" },
    wholesale: { count: 0, active: 0, quarterlyRev: "₹ 0", avgVol: "0" },
  };

  const customers: VipCustomer[] = data?.customers || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          {(["ALL", "ELITE", "VIP", "HIGH_VALUE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTier(t); setPage(1); }}
              className={`px-5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                activeTier === t 
                  ? "bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/30" 
                  : "bg-[#111] text-[#666] border border-[#222] hover:text-white"
              }`}
            >
              {t === "ALL" ? "All Tiers" : t.replace("_", " ")}
            </button>
          ))}
        </div>
        
        <button className="h-10 px-6 rounded-xl bg-[#D4A843] text-black font-semibold text-[13px] flex items-center gap-2 hover:bg-[#e6bc5a] transition-colors">
          <Trophy className="w-4 h-4" />
          Promote to VIP
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {/* ELITE */}
        <div className="bg-[#141414] border border-[#D4A843]/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843]/50 to-[#D4A843]/0" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#D4A843]/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#D4A843]" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-[#D4A843] uppercase">Elite</span>
          </div>
          <h3 className="text-[36px] font-serif text-white leading-none mb-1">{stats.elite.active}</h3>
          <p className="text-[13px] text-[#666]">Active Relationships</p>
          <div className="mt-5 pt-4 border-t border-[#222] flex justify-between">
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Quarterly Rev</p>
              <p className="text-[14px] text-[#D4A843] font-medium">{stats.elite.quarterlyRev}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Avg Spend</p>
              <p className="text-[14px] text-[#aaa] font-medium">{stats.elite.avgSpend}</p>
            </div>
          </div>
        </div>

        {/* VIP */}
        <div className="bg-[#141414] border border-[#222] rounded-xl p-6 hover:border-[#D4A843]/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#D4A843]" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-[#888] uppercase">VIP</span>
          </div>
          <h3 className="text-[36px] font-serif text-white leading-none mb-1">{stats.vip.active}</h3>
          <p className="text-[13px] text-[#666]">Priority Portfolio</p>
          <div className="mt-5 pt-4 border-t border-[#222] flex justify-between">
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Quarterly Rev</p>
              <p className="text-[14px] text-[#D4A843] font-medium">{stats.vip.quarterlyRev}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Avg Spend</p>
              <p className="text-[14px] text-[#aaa] font-medium">{stats.vip.avgSpend}</p>
            </div>
          </div>
        </div>

        {/* HIGH VALUE */}
        <div className="bg-[#141414] border border-[#222] rounded-xl p-6 hover:border-[#D4A843]/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-[#888] uppercase">High Value</span>
          </div>
          <h3 className="text-[36px] font-serif text-white leading-none mb-1">{stats.highValue.active}</h3>
          <p className="text-[13px] text-[#666]">Growth Segment</p>
          <div className="mt-5 pt-4 border-t border-[#222] flex justify-between">
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Quarterly Rev</p>
              <p className="text-[14px] text-[#D4A843] font-medium">{stats.highValue.quarterlyRev}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Avg Spend</p>
              <p className="text-[14px] text-[#aaa] font-medium">{stats.highValue.avgSpend}</p>
            </div>
          </div>
        </div>

        {/* WHOLESALE */}
        <div className="bg-[#141414] border border-[#222] rounded-xl p-6 hover:border-[#D4A843]/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-[#888] uppercase">Wholesale</span>
          </div>
          <h3 className="text-[36px] font-serif text-white leading-none mb-1">{stats.wholesale.active}</h3>
          <p className="text-[13px] text-[#666]">Institutional Partners</p>
          <div className="mt-5 pt-4 border-t border-[#222] flex justify-between">
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Quarterly Rev</p>
              <p className="text-[14px] text-[#D4A843] font-medium">{stats.wholesale.quarterlyRev}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Avg Vol</p>
              <p className="text-[14px] text-[#aaa] font-medium">{stats.wholesale.avgVol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[28px] font-serif text-white">Client Roster</h2>
        <div className="flex items-center gap-3">
          {isFetching && <div className="w-4 h-4 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />}
          <button className="px-4 py-2 bg-[#141414] border border-[#222] rounded-lg flex items-center gap-2 text-[13px] text-[#aaa] hover:text-white transition-colors">
            <Filter className="w-4 h-4" /> Filter by Spend
          </button>
          <button className="px-4 py-2 bg-[#141414] border border-[#222] rounded-lg flex items-center gap-2 text-[13px] text-[#aaa] hover:text-white transition-colors">
            <Clock className="w-4 h-4" /> Last Active
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-[#141414] border border-[#222] rounded-xl h-[320px] animate-pulse" />
          ))
        ) : customers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-[#666]">No clients found for this tier.</div>
        ) : (
          customers.map(c => (
            <div key={c.id} className="bg-[#141414] border border-[#222] rounded-xl p-6 relative flex flex-col hover:border-[#333] transition-colors">
              {c.loyaltyTier === "ELITE" && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-4 -right-4 w-24 bg-[#D4A843] text-black text-[10px] font-bold text-center py-1 rotate-45 transform origin-center shadow-lg">
                    ELITE
                  </div>
                </div>
              )}
              {c.loyaltyTier === "VIP" && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-4 -right-4 w-24 bg-purple-500 text-white text-[10px] font-bold text-center py-1 rotate-45 transform origin-center shadow-lg">
                    VIP
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#333] overflow-hidden flex items-center justify-center">
                  <img src={`https://ui-avatars.com/api/?name=${c.name}&background=1a1a1a&color=D4A843`} alt={c.name} />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h4 className="text-[18px] font-serif text-white truncate">{c.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-[#666] font-medium">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {new Date(c.joinDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</span>
                    <span className="flex items-center gap-1 text-[#D4A843]"><Medal className="w-3 h-3" /> {c.rfmScore}/15 RFM</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#555] uppercase tracking-wider">Lifetime Value</span>
                  <span className="text-[15px] font-medium text-white">₹{c.lifetimeValue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#555] uppercase tracking-wider">Preferred Metal</span>
                  <span className="text-[13px] text-[#D4A843] font-medium">{c.preferredMetal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#555] uppercase tracking-wider">Outstanding</span>
                  <span className="text-[13px] text-red-400 font-medium">₹{c.outstanding.toLocaleString("en-IN")} {c.outstanding > 0 && "(DUE)"}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#222]">
                <button className="flex flex-col items-center justify-center gap-1.5 h-14 bg-[#1a1a1a] rounded-lg border border-[#333] hover:bg-[#222] transition-colors group">
                  <User className="w-4 h-4 text-[#888] group-hover:text-white" />
                  <span className="text-[10px] text-[#888] uppercase tracking-wide group-hover:text-white">Profile</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1.5 h-14 bg-[#1a1a1a] rounded-lg border border-[#333] hover:bg-[#222] transition-colors group">
                  <MessageSquare className="w-4 h-4 text-[#888] group-hover:text-white" />
                  <span className="text-[10px] text-[#888] uppercase tracking-wide group-hover:text-white">Message</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1.5 h-14 bg-[#1a1a1a] rounded-lg border border-[#D4A843]/30 hover:bg-[#D4A843]/10 transition-colors group">
                  <Tag className="w-4 h-4 text-[#D4A843]" />
                  <span className="text-[10px] text-[#D4A843] uppercase tracking-wide">Offer</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pb-10">
          <p className="text-[13px] text-[#555]">
            Showing {(pagination.page - 1) * 12 + 1} to {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} Clients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-lg border border-[#222] bg-[#141414] flex items-center justify-center text-[#888] hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg border ${
                    page === i + 1 
                      ? "border-[#D4A843] text-[#D4A843] bg-[#D4A843]/10" 
                      : "border-[#222] bg-[#141414] text-[#888] hover:text-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="w-9 h-9 rounded-lg border border-[#222] bg-[#141414] flex items-center justify-center text-[#888] hover:text-white disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
