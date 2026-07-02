"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  animate?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CurrencyDisplay({
  amount,
  animate = false,
  size = "md",
  className,
}: CurrencyDisplayProps) {
  const [displayAmount, setDisplayAmount] = useState(animate ? 0 : amount);

  useEffect(() => {
    if (!animate) {
      setDisplayAmount(amount);
      return;
    }
    const duration = 800;
    const steps = 30;
    const increment = amount / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= amount) {
        setDisplayAmount(amount);
        clearInterval(timer);
      } else {
        setDisplayAmount(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [amount, animate]);

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(displayAmount);

  const isLargeValue = amount >= 100000;

  const sizes = {
    sm: "text-[13px]",
    md: "text-[16px]",
    lg: "text-[24px]",
    xl: "text-[36px] font-heading font-semibold",
  };

  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        isLargeValue ? "text-gold" : "text-platinum",
        sizes[size],
        animate && "animate-fade-up",
        className
      )}
    >
      {formatted}
    </span>
  );
}
