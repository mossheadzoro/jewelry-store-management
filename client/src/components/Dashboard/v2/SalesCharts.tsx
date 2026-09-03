"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Layers,
  FolderTree,
  Calendar,
  RotateCcw,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";

const COLORS = [
  "#D4A843",
  "#10B981",
  "#6366F1",
  "#F43F5E",
  "#8B5CF6",
  "#EC4899",
  "#3B82F6",
  "#14B8A6",
  "#F59E0B",
];

export function SalesCharts({ chartData, productIntelligence, branchId }: any) {
  const [viewMode, setViewMode] = useState<"category" | "subcategory">("category");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Revenue Trend Customizable Date Range State
  const [revenueTimeframe, setRevenueTimeframe] = useState<string>("default"); // default (sync), 7d, 14d, 30d, 90d, custom
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [activeChartData, setActiveChartData] = useState<any[]>(chartData || []);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [loadingRevenue, setLoadingRevenue] = useState<boolean>(false);

  // Default custom range: last 30 days
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [customStart, setCustomStart] = useState<string>(thirtyDaysAgoStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Keep in sync with parent chartData when in default mode
  useEffect(() => {
    if (revenueTimeframe === "default" && chartData) {
      setActiveChartData(chartData);
      setSummaryStats(null);
    }
  }, [chartData, revenueTimeframe]);

  // Fetch customizable time series from API
  const fetchRevenueTrend = async (tf: string, sDate?: string, eDate?: string) => {
    if (tf === "default") {
      setRevenueTimeframe("default");
      setActiveChartData(chartData || []);
      setSummaryStats(null);
      setShowCustomPicker(false);
      return;
    }

    try {
      setLoadingRevenue(true);
      const params = new URLSearchParams();
      params.set("timeframe", tf);
      if (branchId !== null && branchId !== undefined && branchId !== "all") {
        params.set("branchId", branchId.toString());
      }
      if (tf === "custom") {
        if (sDate) params.set("startDate", sDate);
        if (eDate) params.set("endDate", eDate);
      }

      const res = await fetch(`/api/dashboard/v2/revenue-trend?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveChartData(json.data.chartData || []);
          setSummaryStats(json.data.summary || null);
          setRevenueTimeframe(tf);
        }
      }
    } catch (err) {
      console.error("Failed to load customized revenue trend:", err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    fetchRevenueTrend("custom", customStart, customEnd);
  };

  // Quick preset within custom modal
  const handleQuickPreset = (days: number) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setCustomStart(start);
    setCustomEnd(end);
    fetchRevenueTrend("custom", start, end);
  };

  if (!chartData || chartData.length === 0) return null;

  const categoryBreakdown = productIntelligence?.categoryBreakdown || [];
  const subCategoryBreakdown = productIntelligence?.subCategoryBreakdown || [];

  // Summary figures
  const totalRevenue =
    summaryStats?.totalRevenue ??
    activeChartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalOrders =
    summaryStats?.totalOrders ??
    activeChartData.reduce((acc, curr) => acc + (curr.orders || 0), 0);
  const dailyAverage =
    summaryStats?.dailyAverage ??
    (activeChartData.length > 0 ? totalRevenue / activeChartData.length : 0);

  // Pie chart dataset based on viewMode
  const chartDataset =
    viewMode === "category"
      ? categoryBreakdown.map((c: any) => ({
          name: c.name,
          value: c.percentage,
          amount: c.value,
          subcategories: c.subcategories,
        }))
      : subCategoryBreakdown.slice(0, 7).map((s: any) => ({
          name: s.subCategoryName || s.name,
          category: s.categoryName,
          value: s.percentage,
          amount: s.value,
        }));

  const activeCategoryData = selectedCat
    ? categoryBreakdown.find((c: any) => c.name === selectedCat)
    : categoryBreakdown[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
      {/* 1. Revenue Trend Area Chart with Customizable Date Range */}
      <div className="lg:col-span-2 min-w-0 bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm flex flex-col justify-between">
        <div>
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-platinum">Revenue Trend</h3>
                  {loadingRevenue && <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />}
                </div>
                <p className="text-[11px] text-zinc-400">Daily sales velocity & order volume</p>
              </div>
            </div>

            {/* Timeframe Presets & Custom Picker Button */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "default", label: "Sync" },
                { id: "7d", label: "7D" },
                { id: "14d", label: "14D" },
                { id: "30d", label: "30D" },
                { id: "90d", label: "90D" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setShowCustomPicker(false);
                    fetchRevenueTrend(pill.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    revenueTimeframe === pill.id && !showCustomPicker
                      ? "bg-gold text-onyx shadow-sm shadow-gold/20 font-bold scale-[1.02]"
                      : "bg-onyx-elevated text-platinum-muted hover:text-platinum border border-onyx-border hover:border-gold/30"
                  }`}
                >
                  {pill.label}
                </button>
              ))}

              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  revenueTimeframe === "custom" || showCustomPicker
                    ? "bg-gold text-onyx shadow-sm shadow-gold/20 font-bold"
                    : "bg-onyx-elevated text-platinum-muted hover:text-platinum border border-onyx-border hover:border-gold/30"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Toolbar Drawer */}
          {showCustomPicker && (
            <div className="mb-3 p-3 rounded-xl bg-onyx-elevated border border-gold/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    From:
                  </span>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || todayStr}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-onyx border border-onyx-border text-platinum text-xs font-medium focus:border-gold outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    To:
                  </span>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    max={todayStr}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-onyx border border-onyx-border text-platinum text-xs font-medium focus:border-gold outline-none"
                  />
                </div>

                <button
                  onClick={handleApplyCustom}
                  disabled={!customStart || !customEnd || loadingRevenue}
                  className="px-3.5 py-1 rounded-lg bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-sm shadow-gold/20 disabled:opacity-50"
                >
                  {loadingRevenue ? "Applying..." : "Apply Range"}
                </button>
              </div>

              {/* Quick Shortcuts */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(7)}
                  className="px-2 py-0.5 rounded bg-onyx border border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/40"
                >
                  Last 7D
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(30)}
                  className="px-2 py-0.5 rounded bg-onyx border border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/40"
                >
                  Last 30D
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(60)}
                  className="px-2 py-0.5 rounded bg-onyx border border-onyx-border text-platinum-muted hover:text-platinum hover:border-gold/40"
                >
                  Last 60D
                </button>
              </div>
            </div>
          )}

          {/* Quick Metric Badges for Selected Range */}
          <div className="flex flex-wrap items-center gap-3 mb-2 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Period Revenue:</span>
              <span className="font-bold text-gold">₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <span className="text-zinc-700">•</span>
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Daily Average:</span>
              <span className="font-semibold text-platinum">₹{dailyAverage.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <span className="text-zinc-700">•</span>
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Orders:</span>
              <span className="font-semibold text-platinum">{totalOrders}</span>
            </div>
            {summaryStats?.peakRevenue > 0 && (
              <>
                <span className="text-zinc-700">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Peak Day:</span>
                  <span className="font-semibold text-emerald-400">
                    ₹{summaryStats.peakRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-zinc-500">({summaryStats.peakDate})</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[240px] w-full mt-1 relative">
          {loadingRevenue && (
            <div className="absolute inset-0 bg-onyx-surface/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-gold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading timeframe data...</span>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  try {
                    const d = new Date(val);
                    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                  } catch {
                    return val;
                  }
                }}
              />
              <YAxis
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121215",
                  borderColor: "#27272a",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#D4A843", fontWeight: 600 }}
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Gross Sales"]}
                labelFormatter={(label) => {
                  try {
                    const d = new Date(label);
                    return d.toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                  } catch {
                    return label;
                  }
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D4A843"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Sales by Category & Subcategory Breakdown */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-platinum">Sales by Category</h3>
              <p className="text-[11px] text-zinc-400">Volume & subcategory share</p>
            </div>
          </div>

          {/* Toggle View */}
          <div className="flex items-center bg-onyx-elevated p-0.5 rounded-lg border border-onyx-border text-[11px]">
            <button
              onClick={() => setViewMode("category")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                viewMode === "category"
                  ? "bg-gold text-onyx font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" /> Cat
            </button>
            <button
              onClick={() => setViewMode("subcategory")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                viewMode === "subcategory"
                  ? "bg-gold text-onyx font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FolderTree className="w-3 h-3" /> Sub
            </button>
          </div>
        </div>

        {chartDataset.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-zinc-500 text-[12px]">
            No sales breakdown available for period
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-[160px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataset}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    onClick={(entry) => {
                      if (viewMode === "category") setSelectedCat(entry.name);
                    }}
                    className="cursor-pointer"
                  >
                    {chartDataset.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121215",
                      borderColor: "#27272a",
                      borderRadius: "10px",
                      fontSize: "11px",
                      padding: "6px 10px",
                    }}
                    formatter={(value: number, name: string, item: any) => [
                      `${value}% (₹${(item.payload?.amount || 0).toLocaleString("en-IN")})`,
                      item.payload?.name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Subcategories Breakdown List under Selected Category */}
            <div className="space-y-1.5 pt-2 border-t border-onyx-border/50 max-h-[90px] overflow-y-auto pr-1">
              {viewMode === "category" ? (
                activeCategoryData?.subcategories && activeCategoryData.subcategories.length > 0 ? (
                  activeCategoryData.subcategories.slice(0, 3).map((sub: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 truncate max-w-[150px]">
                        {activeCategoryData.name} ▸ <strong className="text-zinc-200">{sub.name}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono">₹{sub.value.toLocaleString("en-IN")}</span>
                        <span className="font-bold text-gold">{sub.percentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-zinc-500 text-center py-1">
                    No subcategory distribution for this category
                  </div>
                )
              ) : (
                subCategoryBreakdown.slice(0, 3).map((sub: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 truncate max-w-[150px]">
                      {sub.categoryName} ▸ <strong className="text-zinc-200">{sub.subCategoryName}</strong>
                    </span>
                    <span className="font-bold text-emerald-400">{sub.percentage}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

