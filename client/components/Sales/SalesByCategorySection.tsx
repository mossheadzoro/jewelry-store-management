"use client";

import React from "react";
import { ArrowRight, Gem, CircleDot, Sparkles } from "lucide-react";

interface CategoryData {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

interface SalesByCategorySectionProps {
  categories: CategoryData[];
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

// Assign accent colors per category for visual distinction
const categoryAccents = [
  { color: "#D4A843", bg: "#D4A843" },
  { color: "#6366f1", bg: "#6366f1" },
  { color: "#94a3b8", bg: "#94a3b8" },
  { color: "#ec4899", bg: "#ec4899" },
  { color: "#14b8a6", bg: "#14b8a6" },
  { color: "#f97316", bg: "#f97316" },
];

const categoryIcons = [
  <Gem key="gem" className="w-4 h-4" />,
  <Sparkles key="sparkles" className="w-4 h-4" />,
  <CircleDot key="circle" className="w-4 h-4" />,
];

function SkeletonCategoryCard() {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-4">
      <div className="h-9 w-9 bg-[#222] rounded-full animate-pulse" />
      <div className="h-4 w-24 bg-[#222] rounded animate-pulse" />
      <div className="h-6 w-32 bg-[#222] rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-2 w-full bg-[#222] rounded-full animate-pulse" />
        <div className="h-3 w-28 bg-[#222] rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function SalesByCategorySection({
  categories,
  isLoading,
}: SalesByCategorySectionProps) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Sales by Category</h3>
        <button className="flex items-center gap-1.5 text-sm text-[#D4A843] hover:text-[#e6be5a] transition-colors cursor-pointer group">
          View Detailed Ledger
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCategoryCard key={i} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-[#555] text-sm">
          No sales data for this period
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.slice(0, 6).map((cat, index) => {
            const accent = categoryAccents[index % categoryAccents.length];
            const icon = categoryIcons[index % categoryIcons.length];

            return (
              <div
                key={cat.categoryId}
                className="
                  rounded-xl border border-[#1e1e1e] bg-[#111] p-5
                  hover:border-[#2a2a2a] transition-all duration-300
                  group cursor-default
                "
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${accent.bg}15`,
                    color: accent.color,
                  }}
                >
                  {icon}
                </div>

                {/* Category Name */}
                <p className="text-sm text-[#888] mb-1">{cat.categoryName}</p>

                {/* Amount */}
                <p className="text-xl font-bold text-white tabular-nums mb-4">
                  {formatCurrency(cat.totalAmount)}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: accent.bg,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#666] text-right">
                    {cat.percentage}% of total sales
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
