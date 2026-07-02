"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/booking-utils";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { AdvanceProgressBar } from "./AdvanceProgressBar";
import type { BookingListItem } from "@/lib/types/booking";
import { Calendar, Gem } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import Link from "next/link";

interface BookingCardProps {
  booking: BookingListItem;
  className?: string;
  actions?: React.ReactNode;
}

export function BookingCard({ booking, className, actions }: BookingCardProps) {
  const dueDate = new Date(booking.deliveryDueDate);
  const isOverdue = isPast(dueDate) && booking.status !== "DELIVERED" && booking.status !== "CANCELLED";
  const daysLeft = differenceInDays(dueDate, new Date());
  const isUrgent = daysLeft >= 0 && daysLeft <= 3;

  return (
    <div
      className={cn(
        "bg-onyx-elevated rounded-xl gold-border p-5 relative group",
        "hover:gold-border-strong hover:gold-glow transition-all duration-300",
        className
      )}
    >
      {/* Top: Booking Number + Status */}
      <div className="flex items-start justify-between mb-4">
        <Link
          href={`/book-products/${booking.id}`}
          className="font-mono text-[13px] text-gold hover:text-gold-light transition-colors"
        >
          {booking.bookingNumber}
        </Link>
        <BookingStatusBadge status={booking.status} size="sm" />
      </div>

      {/* Product */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-onyx-surface border border-onyx-border flex items-center justify-center overflow-hidden shrink-0">
          <Gem className="w-5 h-5 text-gold/50" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-platinum truncate">{booking.productName}</p>
          <p className="text-[11px] font-mono text-platinum-muted">{booking.productCode}</p>
        </div>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-[11px] font-semibold text-gold shrink-0">
          {booking.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] text-platinum truncate">{booking.customerName}</p>
          <span className="text-[10px] uppercase tracking-wider text-gold/70 font-medium">
            {booking.customerTier}
          </span>
        </div>
      </div>

      {/* Booking Value + Advance */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-platinum-muted uppercase tracking-wider">Booking Value</span>
          <span className="text-[14px] font-medium text-platinum tabular-nums">
            {formatINR(booking.bookingValue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-platinum-muted uppercase tracking-wider">Advance</span>
          <span className="text-[14px] font-medium text-gold tabular-nums">
            {formatINR(booking.advanceReceived)}
          </span>
        </div>
        <AdvanceProgressBar percentage={booking.advancePercent} size="sm" />
      </div>

      {/* Due Date + Locked Value */}
      <div className="flex items-center justify-between pt-3 border-t border-onyx-border">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-platinum-muted" />
          <span
            className={cn(
              "text-[11px] tabular-nums",
              isOverdue ? "text-red-400 font-medium" : isUrgent ? "text-amber-400" : "text-platinum-muted"
            )}
          >
            {isOverdue
              ? `Overdue by ${Math.abs(daysLeft)}d`
              : `Due ${format(dueDate, "dd MMM yyyy")}`}
          </span>
        </div>
        {booking.lockedValue > 0 && (
          <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
            Locked {formatINR(booking.lockedValue)}
          </span>
        )}
      </div>

      {/* Actions slot */}
      {actions && (
        <div className="mt-3 pt-3 border-t border-onyx-border">
          {actions}
        </div>
      )}
    </div>
  );
}
