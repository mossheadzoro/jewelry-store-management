"use client";

import React from "react";
import { useExpiredBookings } from "@/hooks/useBookings";
import { BookingCard } from "@/components/Bookings/BookingCard";
import { AlertTriangle, Clock, Calendar, RefreshCw, Wallet, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExpiredBookingsPage() {
  const { data, isLoading } = useExpiredBookings();

  if (isLoading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="h-20 bg-onyx-surface rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-onyx-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? { today: 0, thisWeek: 0, thisMonth: 0 };
  const today = data?.today ?? [];
  const thisWeek = data?.thisWeek ?? [];
  const thisMonth = data?.thisMonth ?? [];

  const sections = [
    { title: "Expired Today", items: today, accentColor: "text-red-400", borderColor: "border-red-500/30", bgAccent: "bg-red-500/10", icon: AlertTriangle, count: stats.today },
    { title: "Expired This Week", items: thisWeek, accentColor: "text-amber-400", borderColor: "border-amber-400/30", bgAccent: "bg-amber-400/10", icon: Clock, count: stats.thisWeek },
    { title: "Expired This Month", items: thisMonth, accentColor: "text-platinum-muted", borderColor: "border-onyx-border", bgAccent: "bg-onyx-elevated", icon: Calendar, count: stats.thisMonth },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-heading font-semibold text-platinum">Expired Bookings</h1>
          <p className="text-[12px] text-platinum-muted mt-0.5">Manage and resolve expired product bookings</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Today", value: stats.today, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
          { label: "This Week", value: stats.thisWeek, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
          { label: "This Month", value: stats.thisMonth, color: "text-platinum-muted", bg: "bg-onyx-elevated", border: "border-onyx-border" },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded-xl p-5 border", stat.bg, stat.border)}>
            <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={cn("text-[36px] font-heading font-semibold leading-none tabular-nums", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <section.icon className={cn("w-5 h-5", section.accentColor)} />
            <h2 className={cn("text-[18px] font-heading font-semibold", section.accentColor)}>{section.title}</h2>
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums", section.bgAccent, section.accentColor)}>
              {section.count}
            </span>
          </div>

          {section.items.length === 0 ? (
            <div className="py-12 text-center text-platinum-muted text-[13px] bg-onyx-surface rounded-xl border border-onyx-border">
              No expired bookings in this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <BookingCard
                  key={item.id + item.bookingNumber}
                  booking={item}
                  actions={
                    <div className="flex items-center gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-onyx-border text-[10px] text-platinum-muted hover:text-platinum hover:border-gold/30 uppercase tracking-wider transition-colors">
                        <RefreshCw className="w-3 h-3" /> Extend
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-onyx-border text-[10px] text-platinum-muted hover:text-gold hover:border-gold/30 uppercase tracking-wider transition-colors">
                        <Wallet className="w-3 h-3" /> To Wallet
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/20 text-[10px] text-red-400/70 hover:text-red-400 hover:border-red-500/40 uppercase tracking-wider transition-colors">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
