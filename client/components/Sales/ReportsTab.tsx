"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import ReportSummaryCards from "./ReportSummaryCards";
import SalesByCategorySection from "./SalesByCategorySection";
import RoznamaSection from "./RoznamaSection";
import { FileText, FileSpreadsheet, CalendarDays, Calendar } from "lucide-react";
import { formatINR } from "@/lib/sales-formatters";
import { downloadFile } from "@/lib/invoice-export";
import { toast } from "sonner";

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
    totalSalesPrevPeriod: number;
    gstCollected: number;
    cgstCollected: number;
    sgstCollected: number;
    netRevenue: number;
    pendingDues: number;
    pendingInvoiceCount: number;
    changes: {
      totalSales: number;
      gstCollected: number;
      netRevenue: number;
      pendingDues: number;
    };
  };
  salesByCategory: {
    category: string;
    itemsSold: number;
    netWt: number;
    revenue: number;
    percentage: number;
  }[];
  topProducts: {
    rank: number;
    productName: string;
    sku: string;
    qtySold: number;
    revenue: number;
  }[];
  paymentBreakdown: {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
}

interface ReportsTabProps {
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function ReportsTab({ onDateRangeChange }: ReportsTabProps) {
  const { selectedBranch } = useBranchStore();
  const [activePreset, setActivePreset] = useState<ReportDatePreset>("this_week");
  const [dateRange, setDateRange] = useState(() => getReportDateRange("this_week"));
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
    setShowCustomPicker(preset === "custom");
    if (preset !== "custom") {
      const range = getReportDateRange(preset);
      setDateRange(range);
      onDateRangeChange(range);
    }
  };

  const handleCustomDateChange = (type: "from" | "to", val: string) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return;
    
    setDateRange((prev) => {
      const next = { ...prev, [type]: d };
      onDateRangeChange(next);
      return next;
    });
  };

  const handleExportGstPdf = async () => {
    if (!selectedBranch) return;
    setIsExporting(true);
    const toastId = toast.loading("Generating GST PDF Report...");
    try {
      const res = await fetch("/api/billing/reports/export-gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch.id.toString(),
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
        }),
      });

      if (!res.ok) throw new Error("GST PDF generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GST_Report_${dateRange.from.toISOString().split("T")[0]}_to_${dateRange.to.toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("GST PDF Download Ready ✅", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download GST PDF", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedBranch) return;
    const url = `/api/billing/reports/export-excel?branchId=${selectedBranch.id}&dateFrom=${dateRange.from.toISOString()}&dateTo=${dateRange.to.toISOString()}`;
    await downloadFile(url, `Reports_Spreadsheet_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Reports Header with Date Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-serif">Financial Reports</h2>
          <p className="text-xs text-[#6B6560] mt-0.5">
            Sales, Tax, and Revenue Analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {datePresets.map((preset) => {
            const isActive = activePreset === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`
                  px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                  border cursor-pointer
                  ${
                    isActive
                      ? "border-[#C9943A] text-[#C9943A] bg-[#C9943A]/10"
                      : "border-[#1F1F24] text-[#6B6560] bg-transparent hover:border-[#222228] hover:text-[#F0EBE0]"
                  }
                `}
              >
                {preset.label}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePresetChange("custom")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
              activePreset === "custom"
                ? "border-[#C9943A] text-[#C9943A] bg-[#C9943A]/10"
                : "border-[#1F1F24] text-[#6B6560] hover:border-[#222228] hover:text-[#F0EBE0]"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Custom Range
          </button>

          {showCustomPicker && (
            <div className="flex items-center gap-2 bg-[#111113] border border-[#1F1F24] rounded-lg px-3 py-1 animate-in fade-in duration-200">
              <Calendar className="w-3.5 h-3.5 text-[#C9943A]" />
              <input
                type="date"
                value={dateRange.from.toISOString().split("T")[0]}
                onChange={(e) => handleCustomDateChange("from", e.target.value)}
                className="bg-transparent border-0 text-xs text-[#F0EBE0] focus:outline-none [color-scheme:dark]"
              />
              <span className="text-[#6B6560] text-xs">—</span>
              <input
                type="date"
                value={dateRange.to.toISOString().split("T")[0]}
                onChange={(e) => handleCustomDateChange("to", e.target.value)}
                className="bg-transparent border-0 text-xs text-[#F0EBE0] focus:outline-none [color-scheme:dark]"
              />
            </div>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Category (Spans 2 columns) */}
        <div className="lg:col-span-2">
          <SalesByCategorySection
            categories={(data?.salesByCategory || []).map((cat, index) => ({
              categoryId: index,
              categoryName: cat.category,
              totalAmount: cat.revenue,
              percentage: cat.percentage
            }))}
            isLoading={isLoading}
          />
        </div>

        {/* Payment Breakdown (Spans 1 column) */}
        <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F0EBE0] font-serif mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 bg-[#1A1A1E] rounded animate-pulse" />
                    <div className="h-6 w-full bg-[#1A1A1E] rounded animate-pulse" />
                  </div>
                ))
              ) : !data || data.paymentBreakdown.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#6B6560]">No transaction history</div>
              ) : (
                data.paymentBreakdown.map((pm) => (
                  <div key={pm.method} className="space-y-1.5 relative">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#F0EBE0]">{pm.method}</span>
                      <span className="font-mono text-[#6B6560]">{formatINR(pm.amount)} ({pm.percentage}%)</span>
                    </div>
                    {/* Visual Progress Bar inside Table/Column */}
                    <div className="h-2 w-full bg-[#1A1A1E] border border-[#1F1F24] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3A2E18] rounded-full"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-[#6B6560] mt-4 border-t border-[#1F1F24] pt-3">
            Shows collections breakdown per receipt method
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      {data && data.topProducts && data.topProducts.length > 0 && (
        <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6">
          <h3 className="text-base font-bold text-[#F0EBE0] font-serif mb-4">
            Top Selling Products
          </h3>
          <div className="overflow-hidden rounded-lg border border-[#1F1F24] bg-[#0A0A0B]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111113] border-b border-[#1F1F24] text-[#6B6560]">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    SKU Code
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                    Qty Sold
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24] text-[#F0EBE0]">
                {data.topProducts.map((product) => (
                  <tr
                    key={product.sku}
                    className="hover:bg-[#1A1A1E] transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-[#6B6560] font-mono">
                      {product.rank}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {product.productName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B6560]">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-semibold">
                      {product.qtySold} pcs
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-mono font-semibold text-[#C9943A]">
                      {formatINR(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily closing Roznama section widget */}
      <RoznamaSection />

      {/* Export Buttons */}
      <div className="flex items-center justify-center gap-4 pt-4 pb-2">
        <button
          onClick={handleExportGstPdf}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1F1F24] bg-[#111113] text-xs font-bold text-[#F0EBE0] hover:border-[#C9943A] hover:text-[#C9943A] transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-[#C9943A]" />
          Export GST PDF Report
        </button>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1F1F24] bg-[#111113] text-xs font-bold text-[#F0EBE0] hover:border-[#C9943A] hover:text-[#C9943A] transition-all duration-200 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-500" />
          Export to Excel
        </button>
      </div>
    </div>
  );
}
