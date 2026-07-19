"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBookingDashboard } from "@/hooks/useBookings";
import { CurrencyDisplay } from "@/components/Bookings/CurrencyDisplay";
import {
  TrendingUp,
  TrendingDown,
  Lock,
  Truck,
  AlertTriangle,
  DollarSign,
  Wallet,
  Scale,
  Plus,
  Banknote,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { BookingKPI } from "@/lib/types/booking";

// ===== KPI Card =====

function KPICard({ kpi, icon: Icon, accentColor = "text-gold" }: { kpi: BookingKPI; icon: React.ElementType; accentColor?: string }) {
  const TrendIcon = kpi.trendDirection === "up" ? TrendingUp : kpi.trendDirection === "down" ? TrendingDown : null;
  const trendColor = kpi.trendDirection === "up" ? "text-emerald-400" : "text-red-400";

  return (
    <div className="bg-onyx-surface rounded-xl gold-border p-5 hover:gold-glow transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-gold-muted flex items-center justify-center">
          <Icon className={`w-4.5 h-4.5 ${accentColor}`} />
        </div>
        {TrendIcon && typeof kpi.trend === "number" && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="text-[12px] font-medium tabular-nums">{Math.abs(kpi.trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-[28px] font-heading font-semibold text-platinum leading-none mb-1 animate-fade-up tabular-nums">
        {typeof kpi.value === "number" ? kpi.value.toLocaleString("en-IN") : kpi.value}
      </p>
      <p className="text-[11px] text-platinum-muted uppercase tracking-wider font-medium">{kpi.label}</p>
      {kpi.subLabel && (
        <p className="text-[10px] text-platinum-muted/70 mt-1">{kpi.subLabel}</p>
      )}
    </div>
  );
}

// ===== Quick Action Button =====

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-xl bg-onyx-surface gold-border hover:gold-glow hover:gold-border-strong transition-all duration-300 group cursor-pointer"
    >
      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <span className="text-[14px] font-medium text-platinum-muted group-hover:text-platinum transition-colors">
        {label}
      </span>
    </button>
  );
}

// ===== Custom Tooltip =====

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-onyx-elevated border border-onyx-border rounded-lg p-3 shadow-lg">
      <p className="text-[10px] text-platinum-muted mb-1.5">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-platinum-muted capitalize">{item.name}:</span>
          <span className="text-platinum font-medium tabular-nums">{item.value.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}

// ===== Main Dashboard =====

export default function BookingsDashboard() {
  const router = useRouter();
  const { data, isLoading } = useBookingDashboard();

  const stats = data?.stats;
  const charts = data?.charts;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Sticky Top Bar with Gold Rate */}
      <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 bg-onyx/80 backdrop-blur-xl border-b border-onyx-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-heading font-semibold text-platinum">Product Bookings</h1>
            <p className="text-[12px] text-platinum-muted mt-0.5">Dashboard Overview</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-[16px] font-heading font-semibold text-platinum mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickAction icon={Plus} label="New Booking" onClick={() => router.push("/book-products/new")} />
          <QuickAction icon={Eye} label="View Bookings" onClick={() => router.push("/book-products/list")} />
        </div>
      </div>

      {/* KPI Grid — 4+4 layout */}
      {isLoading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-onyx-surface rounded-xl gold-border p-5 h-[140px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard kpi={stats.totalActive} icon={DollarSign} />
          <KPICard kpi={stats.rateLocked} icon={Lock} accentColor="text-blue-400" />
          <KPICard kpi={stats.deliveryDueThisWeek} icon={Truck} accentColor="text-amber-400" />
          <KPICard kpi={stats.expiredBookings} icon={AlertTriangle} accentColor="text-red-400" />
          <KPICard kpi={stats.bookingRevenue} icon={DollarSign} />
          <KPICard kpi={stats.advanceCollected} icon={Banknote} />
          <KPICard kpi={stats.goldAdvanceWeight} icon={Scale} />
          <KPICard kpi={stats.walletLiability} icon={Wallet} accentColor="text-amber-400" />
        </div>
      )}

      {/* Charts Grid — 2x2 */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Booking Trend — AreaChart */}
          <div className="bg-onyx-surface rounded-xl gold-border p-5">
            <h3 className="text-[14px] font-medium text-platinum mb-1">Booking Trend</h3>
            <p className="text-[11px] text-platinum-muted mb-4">Last 30 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.bookingTrend}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" tick={{ fill: "#A0A0A0", fontSize: 10 }} tickFormatter={(v) => v.split("-").slice(1).join("/")} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="bookings" stroke="#C9A84C" fill="url(#goldGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Advances — BarChart */}
          <div className="bg-onyx-surface rounded-xl gold-border p-5">
            <h3 className="text-[14px] font-medium text-platinum mb-1">Daily Advances</h3>
            <p className="text-[11px] text-platinum-muted mb-4">Stacked by payment type</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.dailyAdvances.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" tick={{ fill: "#A0A0A0", fontSize: 10 }} tickFormatter={(v) => v.split("-")[2]} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cash" stackId="a" fill="#C9A84C" radius={[0, 0, 0, 0]} />
                <Bar dataKey="upi" stackId="a" fill="#E8C96A" />
                <Bar dataKey="card" stackId="a" fill="#9C7A2E" />
                <Bar dataKey="gold" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Delivery Pipeline — Horizontal Bar */}
          <div className="bg-onyx-surface rounded-xl gold-border p-5">
            <h3 className="text-[14px] font-medium text-platinum mb-1">Delivery Pipeline</h3>
            <p className="text-[11px] text-platinum-muted mb-4">Upcoming deliveries by week</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.deliveryPipeline} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="period" tick={{ fill: "#A0A0A0", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                  {charts.deliveryPipeline.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#C9A84C" : i === 1 ? "#E8C96A" : "#9C7A2E"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cancellation Trend — LineChart */}
          <div className="bg-onyx-surface rounded-xl gold-border p-5">
            <h3 className="text-[14px] font-medium text-platinum mb-1">Cancellation Trend</h3>
            <p className="text-[11px] text-platinum-muted mb-4">Last 30 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={charts.cancellationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" tick={{ fill: "#A0A0A0", fontSize: 10 }} tickFormatter={(v) => v.split("-").slice(1).join("/")} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="cancellations" stroke="#f87171" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
