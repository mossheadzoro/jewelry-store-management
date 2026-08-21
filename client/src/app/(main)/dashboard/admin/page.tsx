"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export default function AdminDashboard() {
  const [branchId, setBranchId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState("today");

  // Branches — rarely change, high staleTime
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await fetch("/api/branch/fetch");
      if (!res.ok) throw new Error("Failed to fetch branches");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const branches = branchesData?.data || [];

  // Auto-select first branch when branches load
  const effectiveBranchId = branchId ?? (branches.length > 0 ? branches[0].id : null);

  // Dashboard data — cached, instant on revisit
  const { data, isLoading: loading } = useQuery({
    queryKey: ["adminDashboard", effectiveBranchId, dateRange],
    queryFn: async () => {
      const url = new URL("/api/dashboard/v2", window.location.origin);
      if (effectiveBranchId) url.searchParams.set("branchId", effectiveBranchId.toString());
      if (dateRange) url.searchParams.set("dateRange", dateRange);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    placeholderData: (prev: any) => prev,
  });

  return (
    <div className="min-h-screen flex-1 w-full bg-onyx p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Executive Dashboard</h1>
        <p className="text-[13px] text-platinum-muted">Comprehensive business intelligence and performance overview.</p>
      </div>

      <DashboardFilters 
        isAdmin={true} 
        branchId={effectiveBranchId} 
        setBranchId={setBranchId} 
        dateRange={dateRange} 
        setDateRange={setDateRange} 
        branches={branches} 
      />

      {loading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PerformanceOverview data={data?.performance} dateRange={dateRange} />
          
          <AlertsAndInsights alerts={[]} insights={data?.insights} />
          
          <SalesCharts chartData={data?.chartData} productIntelligence={data?.productIntelligence} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProductIntelligence data={data?.productIntelligence} />
              
              {/* Branch Comparison Table (Only if "All Branches" is selected) */}
              {!branchId && data?.branchComparison && (
                <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
                  <h3 className="text-[14px] font-semibold text-platinum mb-4">Branch Performance Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-onyx-border/50 text-[11px] uppercase tracking-wider text-platinum-muted font-semibold">
                          <th className="pb-3 pl-2">Branch</th>
                          <th className="pb-3 text-right">Sales</th>
                          <th className="pb-3 text-right">Profit</th>
                          <th className="pb-3 text-right">Growth</th>
                          <th className="pb-3 pr-2 text-center">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        {data.branchComparison.map((b: any) => (
                          <tr key={b.id} className="border-b border-onyx-border/50 hover:bg-onyx-elevated/50 transition-colors">
                            <td className="py-3 pl-2 font-medium text-foreground">{b.name}</td>
                            <td className="py-3 text-right text-platinum">₹{b.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="py-3 text-right text-emerald-400 font-medium">₹{b.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className={`py-3 text-right font-medium ${b.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {b.growth >= 0 ? '↑' : '↓'} {Math.abs(b.growth).toFixed(1)}%
                            </td>
                            <td className="py-3 pr-2 text-center text-platinum-muted">{b.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WorkshopOrders data={data?.workshopOrders} />
                <FinanceOverview data={data?.finance} />
              </div>
            </div>
            
            <div className="space-y-6">
              <InventoryHealth data={data?.inventoryHealth} />
              <CustomerInsights data={data?.customerInsights} />
            </div>
          </div>
          
          <QuickActions />
        </div>
      )}
    </div>
  );
}
