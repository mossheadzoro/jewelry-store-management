"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, IndianRupee, FileText, ShoppingCart, Weight, Landmark } from "lucide-react";
import Link from "next/link";

export function PerformanceOverview({ data, dateRange }: any) {
  if (!data) return null;

  const kpis = [
    {
      title: `${dateRange === 'today' ? "Today's" : "Total"} Sales`,
      value: `₹${data.sales.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      prevValue: data.sales.previous,
      currentValue: data.sales.current,
      icon: IndianRupee,
      link: "/sales"
    },
    {
      title: `${dateRange === 'today' ? "Today's" : "Total"} Orders`,
      value: data.orders.current,
      prevValue: data.orders.previous,
      currentValue: data.orders.current,
      icon: ShoppingCart,
      link: "/orderBook"
    },
    {
      title: "Invoices Generated",
      value: data.invoices.current,
      prevValue: 0,
      currentValue: 0,
      icon: FileText,
      link: "/sales",
      hideTrend: true
    },
    {
      title: "Average Bill",
      value: `₹${data.averageBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      prevValue: 0,
      currentValue: 0,
      icon: TrendingUp,
      link: "/sales",
      hideTrend: true
    },
    {
      title: "Gold Sold (Gross)",
      value: `${data.goldSold.current.toLocaleString('en-IN', { maximumFractionDigits: 2 })} gm`,
      prevValue: 0,
      currentValue: 0,
      icon: Weight,
      link: "/inventory",
      hideTrend: true
    },
    {
      title: "Est. Profit",
      value: `₹${data.profit.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      prevValue: data.profit.previous,
      currentValue: data.profit.current,
      icon: Landmark,
      link: "/settings/panels/financial-settings"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => {
        let trend = 0;
        if (kpi.prevValue > 0) trend = ((kpi.currentValue - kpi.prevValue) / kpi.prevValue) * 100;
        else if (kpi.currentValue > 0) trend = 100;

        return (
          <Link key={index} href={kpi.link} className="block group">
            <div className="bg-onyx-surface p-4 rounded-2xl border border-onyx-border hover:border-gold/50 transition-all duration-300 h-full flex flex-col justify-between hover:shadow-[0_0_15px_rgba(212,168,67,0.1)]">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[12px] font-medium text-platinum-muted whitespace-nowrap overflow-hidden text-ellipsis">{kpi.title}</span>
                <div className="w-6 h-6 rounded-md bg-onyx-elevated flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <kpi.icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-xl font-bold text-platinum tracking-tight">{kpi.value}</span>
              </div>
              {!kpi.hideTrend && (
                <div className="mt-2 flex items-center gap-1">
                  {trend >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className={`text-[11px] font-semibold ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-platinum-muted/60 ml-1">vs {dateRange === 'today' ? 'Yesterday' : 'Previous'}</span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
