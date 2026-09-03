"use client";

import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  IndianRupee,
  FileText,
  ShoppingCart,
  Weight,
  Hammer,
  Receipt,
  Percent,
} from "lucide-react";
import Link from "next/link";

interface PerformanceOverviewProps {
  data: any;
  dateRange: string;
}

export function PerformanceOverview({ data, dateRange }: PerformanceOverviewProps) {
  if (!data) return null;

  const kpis = [
    {
      title: `${dateRange === "today" ? "Today's" : "Total"} Sales`,
      value: `₹${(data.sales?.current || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      subtitle: "Gross Jewellery Value",
      prevValue: data.sales?.previous || 0,
      currentValue: data.sales?.current || 0,
      icon: IndianRupee,
      link: "/sales",
      badgeColor: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: `${dateRange === "today" ? "Today's" : "Period"} Orders`,
      value: (data.orders?.current || 0).toString(),
      subtitle: "Custom & Book Orders",
      prevValue: data.orders?.previous || 0,
      currentValue: data.orders?.current || 0,
      icon: ShoppingCart,
      link: "/orderBook",
    },
    {
      title: "Invoices Generated",
      value: (data.invoices?.current || 0).toString(),
      subtitle: "Bills Issued",
      prevValue: data.invoices?.previous || 0,
      currentValue: data.invoices?.current || 0,
      icon: FileText,
      link: "/sales",
    },
    {
      title: "Average Bill Value",
      value: `₹${(data.averageBill || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      subtitle: "Per Invoice Ticket",
      icon: TrendingUp,
      link: "/sales",
      hideTrend: true,
    },
    {
      title: "Gold Sold (Gross)",
      value: `${(data.goldSold?.current || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} g`,
      subtitle: "Gross Metal Weight",
      prevValue: data.goldSold?.previous || 0,
      currentValue: data.goldSold?.current || 0,
      icon: Weight,
      link: "/inventory",
    },
    {
      title: "Total Making Charges",
      value: `₹${(data.makingCharges?.current || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      subtitle: "Craftsmanship Value",
      prevValue: data.makingCharges?.previous || 0,
      currentValue: data.makingCharges?.current || 0,
      icon: Hammer,
      link: "/sales",
    },
    {
      title: "Total Sales GST",
      value: `₹${(data.salesGst?.current || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      subtitle: "CGST + SGST (Metal)",
      prevValue: data.salesGst?.previous || 0,
      currentValue: data.salesGst?.current || 0,
      icon: Receipt,
      link: "/sales",
    },
    {
      title: "Total Purchase GST",
      value: `₹${(data.purchaseGst?.current || 0).toLocaleString("en-IN", { minimumFractionDigits: (data.purchaseGst?.current || 0) % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`,
      subtitle: "Input Tax Credit (ITC)",
      prevValue: data.purchaseGst?.previous || 0,
      currentValue: data.purchaseGst?.current || 0,
      icon: Percent,
      link: "/purchase",
      badgeColor: "text-blue-400 bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3.5 min-w-0">
      {kpis.map((kpi, index) => {
        let trend = 0;
        if (kpi.prevValue && kpi.prevValue > 0) {
          trend = ((kpi.currentValue - kpi.prevValue) / kpi.prevValue) * 100;
        } else if (kpi.currentValue && kpi.currentValue > 0) {
          trend = 100;
        }

        return (
          <Link key={index} href={kpi.link} className="block group min-w-0">
            <div className="bg-onyx-surface p-3.5 rounded-2xl border border-onyx-border hover:border-gold/50 transition-all duration-300 h-full flex flex-col justify-between hover:shadow-[0_0_20px_rgba(212,168,67,0.12)] hover:-translate-y-0.5 min-w-0 overflow-hidden">
              <div className="min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[11px] font-semibold text-platinum-muted truncate block max-w-[80%]">
                    {kpi.title}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-onyx-elevated flex items-center justify-center text-gold group-hover:scale-110 group-hover:bg-gold/20 transition-all shrink-0">
                    <kpi.icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="mt-1 min-w-0">
                  <span className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight block truncate" title={kpi.value}>
                    {kpi.value}
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{kpi.subtitle}</p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-onyx-border/40 flex items-center justify-between">
                {kpi.customBadge ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {kpi.customBadge}
                  </span>
                ) : !kpi.hideTrend ? (
                  <div className="flex items-center gap-1">
                    {trend >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-400" />
                    )}
                    <span
                      className={`text-[10px] font-bold ${
                        trend >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {Math.abs(trend).toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-zinc-500 ml-0.5">
                      {dateRange === "today" ? "vs y'day" : "prev"}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-zinc-500">Active Metric</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

