"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/booking-utils";
import type { BookingStatus } from "@/lib/types/booking";
import {
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
} from "lucide-react";

const statusIcons: Record<BookingStatus, React.ElementType> = {
  ACTIVE: CheckCircle2,
  RATE_LOCKED: Lock,
  PARTIAL_LOCK: Unlock,
  DELIVERY_PENDING: Package,
  EXPIRED: AlertTriangle,
  CANCELLED: XCircle,
  DELIVERED: CheckCircle2,
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BookingStatusBadge({
  status,
  size = "md",
  className,
}: BookingStatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = statusIcons[status];

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-[11px] px-3 py-1 gap-1.5",
    lg: "text-[13px] px-4 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium uppercase tracking-wider rounded-full border",
        config.color,
        config.bg,
        config.border,
        sizes[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}
