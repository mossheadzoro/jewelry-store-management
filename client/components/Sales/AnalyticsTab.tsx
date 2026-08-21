"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranchStore } from "@/lib/store/useBranchStore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Loader2, TrendingUp, Calendar, ShieldCheck, Users, ShieldAlert } from "lucide-react";
import { formatINR, formatWeight } from "@/lib/sales-formatters";
import { toast } from "sonner";

// Chart Config
const chartConfig = {
  background: "transparent",
  gridColor: "#1F1F24",
  textColor: "#6B6560",
  tooltipBg: "#1A1A1E",
  tooltipBorder: "#3A2E18",
};

const metalColors: Record<string, string> = {
  "Gold": "#C9943A",
  "Gold (22K)": "#D4A843",
  "Gold (18K)": "#E8B84B",
  "Diamond": "#93C5FD",
  "Platinum": "#E2E8F0",
  "Silver": "#94A3B8",
};

const daysOfWeekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsTab() {
  const { selectedBranch } = useBranchStore();
  
  const [preset, setPreset] = useState<"week" | "month" | "quarter" | "year">("month");
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
    };
  });

  const { data, isLoading } = useQuery({
    queryKey: ["salesAnalytics", selectedBranch?.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!selectedBranch) return null;
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
      });
      const res = await fetch(`/api/billing/analytics?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load analytics");
      }
      return res.json();
    },
    enabled: !!selectedBranch,
    placeholderData: (prev: any) => prev,
  });

  const handlePresetChange = (p: "week" | "month" | "quarter" | "year") => {
    setPreset(p);
    const now = new Date();
    let from = new Date(now.getFullYear(), now.getMonth(), 1);
    if (p === "week") {
      from = new Date();
      from.setDate(now.getDate() - 7);
    } else if (p === "quarter") {
      from = new Date();
      from.setMonth(now.getMonth() - 3);
    } else if (p === "year") {
      from = new Date(now.getFullYear(), 0, 1);
    }
    setDateRange({ from, to: now });
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-[#111113] border-[#1F1F24]";
    if (count <= 2) return "bg-[#2A1F08] border-[#3A2E18]/40";
    if (count <= 5) return "bg-[#5A3A10] border-[#3A2E18]/60";
    if (count <= 10) return "bg-[#9A6020] border-[#C9943A]/30";
    return "bg-[#C9943A] text-foreground font-bold border-[#E8B84B]";
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Date Filters Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground font-serif">Sales Analytics Hub</h2>
          <p className="text-xs text-[#6B6560]">High-fidelity showroom performance insights.</p>
        </div>

        <div className="flex items-center gap-2">
          {(["week", "month", "quarter", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer capitalize ${
                preset === p
                  ? "border-[#C9943A] text-[#C9943A] bg-[#C9943A]/10"
                  : "border-[#1F1F24] text-[#6B6560] hover:border-[#222228] hover:text-[#F0EBE0]"
              }`}
            >
              This {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-[#C9943A] animate-spin mb-4" />
          <p className="text-sm text-[#6B6560]">Assembling showroom charts...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Top customer cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-5">
              <div className="flex items-center justify-between mb-3 text-xs text-[#6B6560]">
                <span>NEW CUSTOMERS</span>
                <Users className="w-4 h-4 text-[#C9943A]" />
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">{data.customerInsights.newCustomers}</p>
              <span className="text-[10px] text-green-500 font-semibold">▲ 12% vs last month</span>
            </div>

            <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-5">
              <div className="flex items-center justify-between mb-3 text-xs text-[#6B6560]">
                <span>RETURNING</span>
                <Users className="w-4 h-4 text-[#C9943A]" />
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">{data.customerInsights.returningCustomers}</p>
              <span className="text-[10px] text-green-500 font-semibold">▲ 8% vs last month</span>
            </div>

            <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-5">
              <div className="flex items-center justify-between mb-3 text-xs text-[#6B6560]">
                <span>LIFETIME VAL (AVG)</span>
                <span className="text-lg">₹</span>
              </div>
              <p className="text-2xl font-bold text-[#C9943A] font-mono">{formatINR(data.customerInsights.avgLifetimeValue)}</p>
              <span className="text-[10px] text-[#6B6560]">Average value per buyer</span>
            </div>

            <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-5">
              <div className="flex items-center justify-between mb-3 text-xs text-[#6B6560]">
                <span>REPEAT PURCHASE RATE</span>
                <span className="text-lg">%</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">{data.customerInsights.repeatRate}%</p>
              <span className="text-[10px] text-[#6B6560]">Percentage of repeat clients</span>
            </div>
          </div>

          {/* Chart 1: Revenue Trend (Full Width) */}
          <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6">
            <h3 className="text-base font-bold text-[#F0EBE0] font-serif mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C9943A]" />
              Revenue Trend
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9943A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C9943A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} vertical={false} />
                  <XAxis dataKey="date" stroke={chartConfig.textColor} fontSize={10} tickLine={false} />
                  <YAxis stroke={chartConfig.textColor} fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: chartConfig.tooltipBg, borderColor: chartConfig.tooltipBorder }}
                    labelStyle={{ color: "#F0EBE0", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#C9943A" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="avgInvoiceValue" name="Avg Invoice Value" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Metal Shares Pie */}
            <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6">
              <h3 className="text-base font-bold text-[#F0EBE0] font-serif mb-4">By Metal Type</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.salesByMetal}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="revenue"
                      nameKey="metalType"
                    >
                      {data.salesByMetal.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={metalColors[entry.metalType] || "#C9943A"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: chartConfig.tooltipBg, borderColor: chartConfig.tooltipBorder }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Sales by Category Bar */}
            <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6">
              <h3 className="text-base font-bold text-[#F0EBE0] font-serif mb-4">Sales by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesByCategory} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} horizontal={false} />
                    <XAxis type="number" stroke={chartConfig.textColor} fontSize={10} tickLine={false} />
                    <YAxis type="category" dataKey="category" stroke={chartConfig.textColor} fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: chartConfig.tooltipBg, borderColor: chartConfig.tooltipBorder }} />
                    <Bar dataKey="revenue" name="Revenue (INR)" fill="#C9943A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 4: Peak Hours Heatmap Grid */}
          <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6">
            <h3 className="text-base font-bold text-[#F0EBE0] font-serif mb-3">Peak Showroom Hours</h3>
            <p className="text-xs text-[#6B6560] mb-5">Traffic density mapping across the week</p>
            
            <div className="overflow-x-auto">
              <div className="min-w-[600px] space-y-1.5">
                {/* Hours column headings */}
                <div className="grid grid-cols-[80px_repeat(12,_1fr)] gap-1 text-[10px] text-center text-[#6B6560] font-semibold">
                  <span />
                  {Array.from({ length: 12 }, (_, i) => i + 9).map((h) => (
                    <span key={h}>{h > 12 ? `${h - 12} PM` : `${h} AM`}</span>
                  ))}
                </div>

                {/* Grid rows */}
                {[1, 5, 0].map((dayIndex) => {
                  const dayName = daysOfWeekLabels[dayIndex];
                  return (
                    <div key={dayIndex} className="grid grid-cols-[80px_repeat(12,_1fr)] gap-1 items-center">
                      <span className="text-xs font-semibold text-[#6B6560]">{dayName}</span>
                      {Array.from({ length: 12 }, (_, i) => i + 9).map((hour) => {
                        const cell = data.peakHours.find((p: any) => p.dayOfWeek === dayIndex && p.hour === hour);
                        const count = cell ? cell.txnCount : 0;
                        return (
                          <div
                            key={hour}
                            className={`h-7 rounded border ${getHeatmapColor(count)} flex items-center justify-center text-[10px] transition-colors`}
                            title={`${dayName} at ${hour}:00 - ${count} Invoices`}
                          >
                            {count > 0 && count}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Heatmap Legend */}
            <div className="flex items-center justify-end gap-3 mt-4 text-[10px] text-[#6B6560] font-semibold uppercase tracking-wider">
              <span>Intensity:</span>
              <div className="flex gap-1">
                <span className="w-3.5 h-3.5 bg-[#111113] border border-[#1F1F24] rounded" />
                <span className="w-3.5 h-3.5 bg-[#2A1F08] border border-[#3A2E18]/40 rounded" />
                <span className="w-3.5 h-3.5 bg-[#5A3A10] border border-[#3A2E18]/60 rounded" />
                <span className="w-3.5 h-3.5 bg-[#9A6020] border border-[#C9943A]/30 rounded" />
                <span className="w-3.5 h-3.5 bg-[#C9943A] border border-[#E8B84B] rounded" />
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#F0EBE0] font-serif">Salesperson Performance Matrix</h3>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#1F1F24] bg-[#0A0A0B]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#111113] border-b border-[#1F1F24] text-[#6B6560]">
                    <th className="px-4 py-3">Executive</th>
                    <th className="px-4 py-3 text-right">Invoices raised</th>
                    <th className="px-4 py-3 text-right">Revenue (INR)</th>
                    <th className="px-4 py-3 text-right">Avg Ticket Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24] text-[#F0EBE0]">
                  {data.salespersonPerformance.map((item: any) => (
                    <tr key={item.name} className="hover:bg-[#1A1A1E] transition-colors">
                      <td className="px-4 py-3 font-semibold">{item.name}</td>
                      <td className="px-4 py-3 text-right font-semibold">{item.invoiceCount}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#C9943A]">{formatINR(item.revenue)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{formatINR(item.avgTicket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* compliance progress */}
          <div className="rounded-xl border border-[#1F1F24] bg-[#111113] p-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9943A]" />
                <span className="font-semibold text-[#F0EBE0] font-serif">BIS HUID Compliance Rate</span>
              </div>
              <span className={`font-bold font-mono ${data.huidCompliance.compliancePercent >= 95 ? "text-green-400" : "text-amber-400"}`}>
                {data.huidCompliance.compliancePercent}%
              </span>
            </div>

            <div className="h-3 w-full bg-[#1A1A1E] border border-[#1F1F24] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.huidCompliance.compliancePercent >= 95 ? "bg-green-500" : "bg-[#C9943A]"
                }`}
                style={{ width: `${data.huidCompliance.compliancePercent}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-[#6B6560]">
              <span>{data.huidCompliance.withHuid} of {data.huidCompliance.totalItemsSold} items sold have HUID</span>
              {data.huidCompliance.compliancePercent < 95 && (
                <span className="text-amber-500 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Below BIS compliance threshold
                </span>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-[#111113] border border-[#1F1F24] rounded-xl text-[#6B6560] text-sm">
          No analytics data resolved for this statement period.
        </div>
      )}
    </div>
  );
}
