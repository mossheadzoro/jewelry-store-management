"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { DashboardFilters } from "@/components/Dashboard/v2/DashboardFilters";
import { PerformanceOverview } from "@/components/Dashboard/v2/PerformanceOverview";
import { SalesCharts } from "@/components/Dashboard/v2/SalesCharts";
import { ProductIntelligence } from "@/components/Dashboard/v2/ProductIntelligence";
import { InventoryHealth } from "@/components/Dashboard/v2/InventoryHealth";
import { CustomerInsights } from "@/components/Dashboard/v2/CustomerInsights";
import { WorkshopOrders } from "@/components/Dashboard/v2/WorkshopOrders";
import { FinanceOverview } from "@/components/Dashboard/v2/FinanceOverview";
import { AlertsAndInsights } from "@/components/Dashboard/v2/AlertsAndInsights";
import { QuickActions } from "@/components/Dashboard/v2/QuickActions";
import { DashboardModals, ModalType } from "@/components/Dashboard/v2/DashboardModals";
import { Building2, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

export default function AdminDashboard() {
  // Global branch store from app-sidebar
  const selectedGlobalBranch = useBranchStore((state) => state.selectedBranch);

  // Dedicated Dashboard Branch state (null = All Branches)
  const [dashboardBranchId, setDashboardBranchId] = useState<number | null>(
    selectedGlobalBranch?.id || null
  );

  const [dateRange, setDateRange] = useState("today");
  const [trendTimeframe, setTrendTimeframe] = useState("90d");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // 1. Dual-Sync: If app-sidebar branch selector changes, automatically update dashboard selector
  useEffect(() => {
    if (selectedGlobalBranch?.id) {
      setDashboardBranchId(selectedGlobalBranch.id);
    }
  }, [selectedGlobalBranch?.id]);

  // Branches list for selector
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await fetch("/api/branch/fetch");
      if (!res.ok) throw new Error("Failed to fetch branches");
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Dashboard dataset query (re-fetches when dashboardBranchId, dateRange, or trendTimeframe changes)
  const { data, isLoading: loading } = useQuery({
    queryKey: ["adminDashboard", dashboardBranchId, dateRange, trendTimeframe],
    queryFn: async () => {
      const url = new URL("/api/dashboard/v2", window.location.origin);
      if (dashboardBranchId !== null) {
        url.searchParams.set("branchId", dashboardBranchId.toString());
      } else {
        url.searchParams.set("branchId", "all");
      }
      if (dateRange) url.searchParams.set("dateRange", dateRange);
      if (trendTimeframe) url.searchParams.set("trendTimeframe", trendTimeframe);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    placeholderData: (prev: any) => prev,
  });

  return (
    <div className="min-h-screen flex-1 w-full bg-onyx p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-[13px] text-platinum-muted">
            Store intelligence, real-time sales metrics, inventory health, and branch operations.
          </p>
        </div>

        {dashboardBranchId && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-onyx-surface px-3 py-1.5 rounded-xl border border-onyx-border text-[12px] text-zinc-300 shadow-sm">
            <Building2 className="w-4 h-4 text-gold" />
            <span>
              Active Store View:{" "}
              <strong className="text-gold">
                {branches.find((b: any) => b.id === dashboardBranchId)?.name || "Assigned Branch"}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Filters with Dedicated Dashboard Branch Selector on Top Right */}
      <DashboardFilters
        isAdmin={true}
        branchId={dashboardBranchId}
        setBranchId={setDashboardBranchId}
        dateRange={dateRange}
        setDateRange={setDateRange}
        branches={branches}
      />

      {loading && !data ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 1. Core KPIs Overview */}
          <PerformanceOverview data={data?.performance} dateRange={dateRange} />

          {/* 2. Smart Insights */}
          <AlertsAndInsights alerts={[]} insights={data?.insights} />

          {/* 3. Revenue Trend Area Chart + Category/Subcategory Breakdown */}
          <SalesCharts
            chartData={data?.chartData}
            productIntelligence={data?.productIntelligence}
            branchId={dashboardBranchId}
          />

          {/* 4. Product Intelligence, Inventory Health, Customers, Finance & Workshop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Product Intelligence: Trending Designs & Slow Inventory */}
              <ProductIntelligence
                data={data?.productIntelligence}
                trendTimeframe={trendTimeframe}
                setTrendTimeframe={setTrendTimeframe}
                onOpenModal={setActiveModal}
              />

              {/* Branch Comparison Table (Displayed when All Branches is selected or available) */}
              {dashboardBranchId === null && data?.branchComparison && data.branchComparison.length > 0 && (
                <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gold" /> Branch Performance Comparison
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {data.branchComparison.length} Locations Active
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-onyx-border/60 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                          <th className="pb-3 pl-2">Branch Location</th>
                          <th className="pb-3 text-right">Gross Sales</th>
                          <th className="pb-3 text-right">Invoices</th>
                          <th className="pb-3 text-right">Making Charges</th>
                          <th className="pb-3 text-right">Growth</th>
                          <th className="pb-3 pr-2 text-center">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px] divide-y divide-onyx-border/40">
                        {data.branchComparison.map((b: any) => (
                          <tr
                            key={b.id}
                            className="hover:bg-onyx-elevated/60 transition-colors"
                          >
                            <td className="py-3 pl-2 font-medium text-foreground">
                              {b.name} {b.city ? <span className="text-[11px] text-zinc-500">({b.city})</span> : ""}
                            </td>
                            <td className="py-3 text-right text-platinum font-semibold">
                              ₹{(b.sales || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </td>
                            <td className="py-3 text-right text-zinc-300">{b.invoices || 0}</td>
                            <td className="py-3 text-right text-gold font-mono">
                              ₹{(b.makingCharges || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </td>
                            <td
                              className={`py-3 text-right font-semibold ${
                                b.growth >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              <span className="inline-flex items-center gap-0.5 justify-end">
                                {b.growth >= 0 ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                                {Math.abs(b.growth).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-center text-zinc-400">{b.orders || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Workshop & Finance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WorkshopOrders data={data?.workshopOrders} onOpenModal={setActiveModal} />
                <FinanceOverview data={data?.finance} onOpenModal={setActiveModal} />
              </div>
            </div>

            {/* Sidebar Column: Inventory Health & Customer Insights */}
            <div className="space-y-6">
              <InventoryHealth data={data?.inventoryHealth} onOpenModal={setActiveModal} />
              <CustomerInsights data={data?.customerInsights} onOpenModal={setActiveModal} />
            </div>
          </div>

          <QuickActions />
        </div>
      )}

      {/* Unified Interactive Drilldown Modal System */}
      <DashboardModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        data={data}
      />
    </div>
  );
}

