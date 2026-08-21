"use client";

import React from "react";
import {
  Landmark,
  Building2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface SummaryCardData {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  highlight?: boolean; // for net revenue gold color
}

interface ReportSummaryCardsProps {
  totalSales: number;
  gstCollected: number;
  netRevenue: number;
  pendingDues: number;
  changes: {
    totalSales: number;
    gstCollected: number;
    netRevenue: number;
    pendingDues: number;
  };
  isLoading: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
        <div className="h-8 w-8 bg-secondary rounded-lg animate-pulse" />
      </div>
      <div className="h-7 w-36 bg-secondary rounded animate-pulse" />
      <div className="h-3 w-28 bg-secondary rounded animate-pulse" />
    </div>
  );
}

export default function ReportSummaryCards({
  totalSales,
  gstCollected,
  netRevenue,
  pendingDues,
  changes,
  isLoading,
}: ReportSummaryCardsProps) {
  const cards: SummaryCardData[] = [
    {
      title: "TOTAL SALES",
      value: totalSales,
      change: changes.totalSales,
      icon: <Landmark className="w-4 h-4" />,
    },
    {
      title: "GST COLLECTED",
      value: gstCollected,
      change: changes.gstCollected,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      title: "NET REVENUE",
      value: netRevenue,
      change: changes.netRevenue,
      icon: <TrendingUp className="w-4 h-4" />,
      highlight: true,
    },
    {
      title: "PENDING DUES",
      value: pendingDues,
      change: changes.pendingDues,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isPositive = card.change >= 0;
        const isNegativeGood =
          card.title === "PENDING DUES" && card.change < 0;

        return (
          <div
            key={card.title}
            className="
              relative rounded-xl border border-[#222] bg-[#111] p-5
              hover:border-border transition-all duration-300
              group overflow-hidden
            "
          >
            {/* Gradient glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#D4A843]/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[#777] tracking-wider">
                  {card.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-onyx-elevated border border-[#222] flex items-center justify-center text-[#D4A843]">
                  {card.icon}
                </div>
              </div>

              {/* Value */}
              <p
                className={`text-2xl font-bold tabular-nums mb-3 ${
                  card.highlight ? "text-[#D4A843]" : "text-foreground"
                }`}
              >
                {formatCurrency(card.value)}
              </p>

              {/* Change indicator */}
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`flex items-center gap-0.5 ${
                    isPositive
                      ? isNegativeGood
                        ? "text-red-400"
                        : "text-emerald-400"
                      : isNegativeGood || card.title === "PENDING DUES"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  <svg
                    className={`w-3 h-3 ${!isPositive ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M6 2L10 7H2L6 2Z"
                      fill="currentColor"
                    />
                  </svg>
                  {Math.abs(card.change)}%
                </span>
                <span className="text-[#555]">vs last period</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
