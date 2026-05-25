"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import ReportSummaryCards from "./ReportSummaryCards";
import SalesByCategorySection from "./SalesByCategorySection";
import { FileText, FileSpreadsheet, CalendarDays } from "lucide-react";

export type ReportDatePreset = "today" | "this_week" | "this_month" | "custom";

const datePresets: { label: string; value: ReportDatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
];

function getReportDateRange(preset: ReportDatePreset): {
  from: Date;
  to: Date;
} {
  const now = new Date();
  switch (preset) {
    case "today":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        to: now,
      };
    case "this_week": {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      monday.setHours(0, 0, 0, 0);
      return { from: monday, to: now };
    }
    case "this_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
    case "custom":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
  }
}

interface ReportData {
  summary: {
    totalSales: number;
    gstCollected: number;
    netRevenue: number;
    pendingDues: number;
    invoiceCount: number;
    changes: {
      totalSales: number;
      gstCollected: number;
      netRevenue: number;
      pendingDues: number;
    };
  };
  salesByCategory: {
    categoryId: number;
    categoryName: string;
    totalAmount: number;
    percentage: number;
  }[];
  topSellingProducts: {
    productId: number;
    name: string;
    productCode: string;
    totalAmount: number;
    quantitySold: number;
  }[];
  paymentBreakdown: {
    method: string;
    totalAmount: number;
    count: number;
  }[];
}

interface ReportsTabProps {
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function ReportsTab({ onDateRangeChange }: ReportsTabProps) {
  const { selectedBranch } = useBranchStore();
  const [activePreset, setActivePreset] =
    useState<ReportDatePreset>("this_week");
  const [dateRange, setDateRange] = useState(() =>
    getReportDateRange("this_week")
  );
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!selectedBranch) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
      });

      const res = await fetch(`/api/billing/reports?${params.toString()}`);
      const json = await res.json();

      if (res.ok) {
        setData(json);
      } else {
        console.error("Reports API error:", json.error);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePresetChange = (preset: ReportDatePreset) => {
    setActivePreset(preset);
    const range = getReportDateRange(preset);
    setDateRange(range);
    onDateRangeChange(range);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Reports Header with Date Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Financial Reports</h2>
          <p className="text-sm text-[#666] mt-0.5">
            Sales, Tax, and Revenue Analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {datePresets.map((preset) => {
            const isActive = activePreset === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  border cursor-pointer
                  ${
                    isActive
                      ? "border-[#D4A843] text-[#D4A843] bg-[#D4A843]/10"
                      : "border-[#333] text-[#999] bg-transparent hover:border-[#555] hover:text-[#ccc]"
                  }
                `}
              >
                {preset.label}
              </button>
            );
          })}
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-[#333] text-[#999] hover:border-[#555] hover:text-[#ccc] transition-all duration-200 cursor-pointer">
            <CalendarDays className="w-3.5 h-3.5" />
            Custom Range
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <ReportSummaryCards
        totalSales={data?.summary.totalSales || 0}
        gstCollected={data?.summary.gstCollected || 0}
        netRevenue={data?.summary.netRevenue || 0}
        pendingDues={data?.summary.pendingDues || 0}
        changes={
          data?.summary.changes || {
            totalSales: 0,
            gstCollected: 0,
            netRevenue: 0,
            pendingDues: 0,
          }
        }
        isLoading={isLoading}
      />

      {/* Sales by Category */}
      <SalesByCategorySection
        categories={data?.salesByCategory || []}
        isLoading={isLoading}
      />

      {/* Top Products Table */}
      {data && data.topSellingProducts.length > 0 && (
        <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Selling Products
          </h3>
          <div className="overflow-hidden rounded-lg border border-[#1e1e1e]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111] border-b border-[#222]">
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider text-right">
                    Qty Sold
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider text-right">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topSellingProducts.map((product, idx) => (
                  <tr
                    key={product.productId}
                    className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[#555] tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {product.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#888] bg-[#1a1a1a] px-2 py-0.5 rounded">
                        {product.productCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#888] tabular-nums text-right">
                      {product.quantitySold}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#D4A843] tabular-nums text-right">
                      {formatCurrency(product.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Breakdown */}
      {data && data.paymentBreakdown.length > 0 && (
        <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Payment Methods
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.paymentBreakdown.map((pm) => (
              <div
                key={pm.method}
                className="rounded-lg border border-[#1e1e1e] bg-[#111] p-4 hover:border-[#2a2a2a] transition-colors"
              >
                <p className="text-xs text-[#888] font-medium uppercase tracking-wide mb-1">
                  {pm.method}
                </p>
                <p className="text-lg font-bold text-white tabular-nums">
                  {formatCurrency(pm.totalAmount)}
                </p>
                <p className="text-xs text-[#555] mt-1">
                  {pm.count} transaction{pm.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex items-center justify-center gap-4 pt-4 pb-2">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#333] bg-[#111] text-sm font-medium text-[#ccc] hover:border-[#D4A843]/40 hover:text-[#D4A843] transition-all duration-200 cursor-pointer group">
          <FileText className="w-4 h-4 text-[#D4A843] group-hover:scale-110 transition-transform" />
          Export GST PDF
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#333] bg-[#111] text-sm font-medium text-[#ccc] hover:border-[#D4A843]/40 hover:text-[#D4A843] transition-all duration-200 cursor-pointer group">
          <FileSpreadsheet className="w-4 h-4 text-[#D4A843] group-hover:scale-110 transition-transform" />
          Export to Excel
        </button>
      </div>
    </div>
  );
}
