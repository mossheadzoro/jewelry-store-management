"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getAdvanceColor } from "@/lib/booking-utils";

interface AdvanceProgressBarProps {
  percentage: number;
  variant?: "linear" | "circular";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function AdvanceProgressBar({
  percentage,
  variant = "linear",
  size = "md",
  showLabel = true,
  className,
}: AdvanceProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const displayPercent = parseFloat(Number(clamped).toFixed(2));
  const colors = getAdvanceColor(clamped);

  if (variant === "circular") {
    const dimensions = { sm: 48, md: 72, lg: 96 };
    const strokes = { sm: 4, md: 5, lg: 6 };
    const dim = dimensions[size];
    const stroke = strokes[size];
    const radius = (dim - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    const strokeColor =
      clamped >= 80
        ? "#10b981"
        : clamped >= 30
        ? "#fbbf24"
        : "#f87171";

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#2A2A2A"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          {/* Shimmer overlay at 80%+ */}
          {clamped >= 80 && (
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              fill="none"
              stroke="rgba(201, 168, 76, 0.3)"
              strokeWidth={stroke + 2}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}
        </svg>
        {showLabel && (
          <span
            className={cn(
              "absolute font-semibold tabular-nums",
              colors.text,
              size === "sm" ? "text-[10px]" : size === "md" ? "text-[14px]" : "text-[18px]"
            )}
          >
            {displayPercent}%
          </span>
        )}
      </div>
    );
  }

  // Linear variant
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full rounded-full bg-onyx-border overflow-hidden", heights[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out relative",
            clamped >= 80 ? "bg-emerald-500" : clamped >= 30 ? "bg-amber-400" : "bg-red-400"
          )}
          style={{ width: `${clamped}%` }}
        >
          {clamped >= 80 && (
            <div className="absolute inset-0 gold-shimmer rounded-full" />
          )}
        </div>
      </div>
      {showLabel && (
        <div className="flex items-center justify-between mt-1.5">
          <span className={cn("text-[11px] font-medium", colors.text)}>
            {displayPercent}%
          </span>
          <span className={cn("text-[10px] uppercase tracking-wider font-medium", colors.text)}>
            {colors.label}
          </span>
        </div>
      )}
    </div>
  );
}
