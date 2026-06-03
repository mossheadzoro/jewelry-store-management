"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Users, Crown, IndianRupee, TrendingUp, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../src/lib/format";

interface Stats {
  totalClientele: number;
  vipCount: number;
  totalOutstanding: number;
  growthPercent: number;
}

interface SummaryCardsProps {
  stats: Stats;
  loading?: boolean;
}

export default function SummaryCards({ stats, loading }: SummaryCardsProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#1f1f1f] p-6 animate-pulse"
          >
            <div className="h-10 w-10 rounded-xl bg-[#1f1f1f] mb-4" />
            <div className="h-3 w-24 rounded bg-[#1f1f1f] mb-3" />
            <div className="h-8 w-20 rounded bg-[#1f1f1f]" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: <Users className="w-5 h-5 text-[#D4A843]" />,
      label: "Total Clientele",
      value: stats.totalClientele.toLocaleString("en-IN"),
      badge: stats.growthPercent !== 0
        ? `${stats.growthPercent > 0 ? "+" : ""}${stats.growthPercent}% this month`
        : null,
      badgePositive: stats.growthPercent >= 0,
    },
    {
      icon: <Crown className="w-5 h-5 text-[#D4A843]" />,
      label: "VIP & Inner Circle",
      value: stats.vipCount.toString(),
      badge: null,
      badgePositive: true,
      onClick: () => router.push("/vip"),
    },
    {
      icon: <IndianRupee className="w-5 h-5 text-[#D4A843]" />,
      label: "Outstanding Receivables",
      value: `₹ ${formatOutstanding(stats.totalOutstanding)}`,
      badge: null,
      badgePositive: true,
      link: "View Aging Report →",
      onClick: () => router.push("/customer/receivables"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          onClick={card.onClick}
          className={`group relative overflow-hidden rounded-2xl bg-[#141414] border border-[#1f1f1f] p-6 hover:border-[#2a2a2a] transition-all duration-300 ${
            card.onClick ? "cursor-pointer hover:bg-[#1a1a1a] active:scale-[0.99]" : ""
          }`}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4A843]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10">
            {/* Icon + Badge row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#252525] flex items-center justify-center">
                {card.icon}
              </div>
              {card.badge && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    card.badgePositive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <p className="text-[13px] text-[#666] font-medium mb-1">{card.label}</p>

            {/* Value */}
            <div className="flex items-end justify-between">
              <p className="text-[28px] font-bold text-white tracking-tight leading-none">
                {card.value}
              </p>
              {card.link && (
                <button className="flex items-center gap-1 text-[12px] text-[#D4A843] hover:text-[#e6bc5a] transition-colors font-medium cursor-pointer">
                  {card.link}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatOutstanding(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(1)} Cr`;
  }
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)} L`;
  }
  return value.toLocaleString("en-IN");
}
