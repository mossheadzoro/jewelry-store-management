"use client";

import React from "react";
import Link from "next/link";
import { Plus, ShoppingCart, UserPlus, Box, ArrowRightLeft, BookOpen } from "lucide-react";

export function QuickActions() {
  const actions = [
    { label: "Create Invoice", icon: Plus, link: "/billing" },
    { label: "New Order", icon: ShoppingCart, link: "/orderBook/new" },
    { label: "Add Customer", icon: UserPlus, link: "/customer" },
    { label: "Create Booking", icon: BookOpen, link: "/book-products" },
    { label: "Receive Stock", icon: Box, link: "/inventory/purchases" },
    { label: "Transfer Stock", icon: ArrowRightLeft, link: "/inventory/transfers" }
  ];

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
      <h3 className="text-[14px] font-semibold text-platinum mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.link} className="block group">
            <div className="bg-onyx-elevated border border-onyx-border hover:border-gold/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:bg-gold/5">
              <div className="w-10 h-10 rounded-full bg-onyx-surface flex items-center justify-center text-platinum-muted group-hover:text-gold group-hover:scale-110 transition-transform">
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-platinum-muted group-hover:text-platinum whitespace-nowrap">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
