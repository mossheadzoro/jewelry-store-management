"use client";

import React from "react";
import { Users, Briefcase, UserCheck, ShieldCheck, Clock } from "lucide-react";

interface StaffSummaryStats {
  totalStaff: number;
  managersCount: number;
  salesCount: number;
  verifiedKycCount: number;
  pendingKycCount: number;
}

interface StaffSummaryCardsProps {
  stats: StaffSummaryStats;
  loading?: boolean;
}

export default function StaffSummaryCards({ stats, loading }: StaffSummaryCardsProps) {
  const cards = [
    {
      title: "Total Staff",
      value: stats.totalStaff,
      subtext: "Active personnel roster",
      icon: Users,
      color: "text-foreground",
      iconColor: "text-foreground",
      bgColor: "bg-secondary",
      borderColor: "border-border",
    },
    {
      title: "Store Managers",
      value: stats.managersCount,
      subtext: "Supervisory & audit authority",
      icon: Briefcase,
      color: "text-[#D4A843]",
      iconColor: "text-[#D4A843]",
      bgColor: "bg-[#D4A843]/10",
      borderColor: "border-[#D4A843]/25",
    },
    {
      title: "Sales Staff",
      value: stats.salesCount,
      subtext: "POS & client relations",
      icon: UserCheck,
      color: "text-blue-400",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/25",
    },
    {
      title: "KYC Verified",
      value: stats.verifiedKycCount,
      subtext: "Authenticated identity proofs",
      icon: ShieldCheck,
      color: "text-emerald-400",
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/25",
    },
    {
      title: "Pending Review",
      value: stats.pendingKycCount,
      subtext: "Awaiting manager approval",
      icon: Clock,
      color: "text-amber-400",
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/25",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl bg-onyx-surface border border-onyx-border p-4 transition-all duration-200 hover:border-[#333] hover:shadow-lg hover:shadow-black/30 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.bgColor} ${card.borderColor}`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              {loading ? (
                <div className="h-7 w-16 rounded bg-secondary animate-pulse mb-1" />
              ) : (
                <p className={`text-[24px] font-bold ${card.color} tracking-tight leading-none`}>
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-[#555] mt-1.5">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
