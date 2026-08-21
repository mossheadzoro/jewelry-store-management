"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "../../src/lib/format";

interface AgingBreakdown {
  current: number;
  thirty: number;
  sixty: number;
  ninety: number;
}

interface LatestPurchase {
  date: string;
  amount: number;
  weight: number;
  items: string;
}

interface CustomerTagData {
  id: string;
  name: string;
  label: string;
  color: string;
  type: "SYSTEM" | "MANUAL";
}

interface OutstandingCustomer {
  id: number;
  name: string;
  mobile: string;
  totalOutstanding: number;
  maxOverdueDays: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | "MINIMAL";
  aging: AgingBreakdown;
  latestPurchase: LatestPurchase | null;
  tags?: CustomerTagData[];
}

interface OutstandingResponse {
  customers: OutstandingCustomer[];
}

async function fetchOutstandingCustomers(search: string): Promise<OutstandingResponse> {
  const params = new URLSearchParams();
  if (search.trim().length >= 2) params.set("search", search.trim());
  const res = await fetch(`/api/customer/outstanding?${params}`);
  if (!res.ok) throw new Error("Failed to fetch outstanding receivables");
  return res.json();
}

export default function ReceivablesPageClient() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["outstandingCustomers", search],
    queryFn: () => fetchOutstandingCustomers(search),
  });

  const customers = data?.customers ?? [];

  // Helper formatting functions
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRiskColor = (level: "HIGH" | "MEDIUM" | "LOW" | "MINIMAL") => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "MEDIUM":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "LOW":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "MINIMAL":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <main className="flex-1 min-h-screen bg-onyx overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        
        {/* Back link */}
        <button
          onClick={() => router.push("/customer")}
          className="flex items-center gap-2 text-[13px] font-semibold text-[#D4A843] uppercase tracking-widest mb-2 hover:text-[#e6bc5a] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Relations
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-8 mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-foreground tracking-tight leading-tight">
              Outstanding Receivables & Aging Report
            </h1>
            <p className="text-[14px] text-[#555] mt-1.5 max-w-lg leading-relaxed">
              Dossier of client outstanding balances, categorized by payment risk and aged overdue timelines.
            </p>
          </div>

          {/* Search */}
          <div className="relative pt-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search debtor name or mobile..."
              className="w-[320px] h-10 pl-10 pr-4 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/40 transition-colors"
            />
          </div>
        </div>

        {/* Query State Loading */}
        {isLoading && (
          <div className="rounded-2xl bg-onyx-surface border border-[#1f1f1f] py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin mb-4" />
            <p className="text-sm text-[#666]">Generating aging analysis...</p>
          </div>
        )}

        {/* Query State Error */}
        {error && (
          <div className="rounded-2xl bg-red-500/5 border border-red-500/10 py-16 flex flex-col items-center justify-center text-center px-4">
            <AlertCircle className="w-10 h-10 text-red-500/80 mb-3" />
            <h3 className="text-[16px] font-semibold text-foreground mb-1">Failed to fetch report</h3>
            <p className="text-sm text-[#666] max-w-sm">
              An error occurred while compiling the outstanding ledger details. Please try again.
            </p>
          </div>
        )}

        {/* Query State Empty */}
        {!isLoading && !error && customers.length === 0 && (
          <div className="rounded-2xl bg-onyx-surface border border-[#1f1f1f] py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-onyx-elevated border border-[#222] flex items-center justify-center mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-[16px] font-semibold text-foreground mb-1">No outstanding dues</h3>
            <p className="text-sm text-[#555] max-w-xs leading-relaxed">
              All active client invoice ledger accounts have been fully settled.
            </p>
          </div>
        )}

        {/* Report Table */}
        {!isLoading && !error && customers.length > 0 && (
          <div className="rounded-2xl bg-onyx-surface border border-[#1f1f1f] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#1f1f1f] bg-[#111] text-[11px] font-semibold text-[#555] uppercase tracking-wider">
                    <th className="px-6 py-4">Customer & Risk</th>
                    <th className="px-6 py-4">Latest Purchase</th>
                    <th className="px-6 py-4 text-center" colSpan={4}>Aging Overdue (Days)</th>
                    <th className="px-6 py-4 text-right">Total Outstanding</th>
                  </tr>
                  <tr className="border-b border-[#1f1f1f]/50 bg-[#111]/50 text-[10px] text-[#444] font-medium tracking-wide">
                    <th className="px-6 py-1.5"></th>
                    <th className="px-6 py-1.5"></th>
                    <th className="px-4 py-1.5 text-right w-[110px]">0–30 days</th>
                    <th className="px-4 py-1.5 text-right w-[110px]">31–60 days</th>
                    <th className="px-4 py-1.5 text-right w-[110px]">61–90 days</th>
                    <th className="px-4 py-1.5 text-right w-[110px]">90+ days</th>
                    <th className="px-6 py-1.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {customers.map((c) => (
                    <tr key={c.id} className="group hover:bg-onyx-elevated/40 transition-colors duration-150">
                      
                      {/* Customer Info & Risk */}
                      <td className="px-6 py-4 min-w-[240px]">
                        <div className="font-semibold text-foreground text-[14px]">{c.name}</div>
                        <div className="text-[12px] text-[#555] mt-0.5">+91 {c.mobile}</div>
                        {c.tags && c.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {c.tags.map((tag) => {
                              const colorMap: Record<string, string> = {
                                gold: "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30",
                                red: "bg-red-500/10 text-red-400 border-red-500/25",
                                blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
                                gray: "bg-gray-500/10 text-muted-foreground border-gray-500/25",
                                green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                                orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
                                purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
                              };
                              const colorClass = colorMap[tag.color.toLowerCase()] || "bg-gray-500/10 text-muted-foreground border-gray-500/25";
                              return (
                                <span
                                  key={tag.id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}
                                  title={tag.type === "SYSTEM" ? "System Tag: " + tag.label : "Manual Tag: " + tag.label}
                                >
                                  {tag.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(c.riskLevel)}`}>
                            {c.riskLevel} RISK
                          </span>
                          {c.maxOverdueDays > 0 && (
                            <span className="text-[11px] text-[#444]">
                              Max: {c.maxOverdueDays}d overdue
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Latest Purchase */}
                      <td className="px-6 py-4 max-w-[300px]">
                        {c.latestPurchase ? (
                          <div className="space-y-1 text-[13px]">
                            <div className="text-[#999] flex items-center gap-1.5">
                              <span className="font-medium text-foreground">₹{formatCurrency(c.latestPurchase.amount)}</span>
                              <span className="text-[11px] text-[#555]">on {formatDate(c.latestPurchase.date)}</span>
                            </div>
                            <div className="text-[#555] text-[11px] truncate" title={c.latestPurchase.items}>
                              {c.latestPurchase.items}
                            </div>
                            {c.latestPurchase.weight > 0 && (
                              <div className="text-[11px] text-[#444]">
                                Weight: {c.latestPurchase.weight.toFixed(3)}g
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#444] text-[12px]">—</span>
                        )}
                      </td>

                      {/* Aging Breakdown: 0-30 */}
                      <td className="px-4 py-4 text-right text-[13px] font-medium">
                        {c.aging.current > 0 ? (
                          <span className="text-foreground">₹{formatCurrency(c.aging.current)}</span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>

                      {/* Aging Breakdown: 31-60 */}
                      <td className="px-4 py-4 text-right text-[13px] font-medium">
                        {c.aging.thirty > 0 ? (
                          <span className="text-yellow-500/80">₹{formatCurrency(c.aging.thirty)}</span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>

                      {/* Aging Breakdown: 61-90 */}
                      <td className="px-4 py-4 text-right text-[13px] font-medium">
                        {c.aging.sixty > 0 ? (
                          <span className="text-orange-500/80">₹{formatCurrency(c.aging.sixty)}</span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>

                      {/* Aging Breakdown: 90+ */}
                      <td className="px-4 py-4 text-right text-[13px] font-medium">
                        {c.aging.ninety > 0 ? (
                          <span className="text-red-400 font-semibold">₹{formatCurrency(c.aging.ninety)}</span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>

                      {/* Total Outstanding */}
                      <td className="px-6 py-4 text-right min-w-[140px]">
                        <span className="text-[15px] font-bold text-red-400">
                          ₹{formatCurrency(c.totalOutstanding)}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
