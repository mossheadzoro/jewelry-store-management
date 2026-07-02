"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatWeight, formatPurity } from "@/lib/booking-utils";

interface MetalWeightDisplayProps {
  weight: number;
  purity: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MetalWeightDisplay({
  weight,
  purity,
  size = "md",
  className,
}: MetalWeightDisplayProps) {
  const sizes = {
    sm: { weight: "text-[13px]", purity: "text-[10px]", dot: "text-[10px]" },
    md: { weight: "text-[16px]", purity: "text-[12px]", dot: "text-[12px]" },
    lg: { weight: "text-[24px] font-heading font-semibold", purity: "text-[14px]", dot: "text-[14px]" },
  };

  const s = sizes[size];

  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tabular-nums", className)}>
      <span className={cn("text-gold font-medium", s.weight)}>
        {formatWeight(weight)}
      </span>
      <span className={cn("text-platinum-muted", s.dot)}>·</span>
      <span className={cn("text-platinum-muted font-medium", s.purity)}>
        {formatPurity(purity)}
      </span>
    </span>
  );
}
