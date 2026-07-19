"use client";

import React, { useState, useEffect } from "react";
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
import { useSession } from "next-auth/react";

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");

  // Lock to manager's branch
  const branchId = session?.user?.branchId;

  useEffect(() => {
    if (!branchId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = new URL("/api/dashboard/v2", window.location.origin);
        url.searchParams.set("branchId", branchId.toString());
        if (dateRange) url.searchParams.set("dateRange", dateRange);
        
        const res = await fetch(url.toString());
        const d = await res.json();
        setData(d);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId, dateRange]);

  return (
    <div className="min-h-screen bg-onyx p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Branch Dashboard</h1>
        <p className="text-[13px] text-platinum-muted">Daily operations and performance metrics for your branch.</p>
      </div>

      <DashboardFilters 
        isAdmin={false} 
        branchId={branchId} 
        setBranchId={() => {}} // Disabled for manager
        dateRange={dateRange} 
        setDateRange={setDateRange} 
        branches={[]} 
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
