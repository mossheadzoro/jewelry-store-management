"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Building2, Users, Package, DollarSign, PiggyBank, 
  TrendingUp, UserSquare2, Boxes, ShoppingCart, Ticket, 
  Bell, Printer, Link, Shield, Database, Palette, 
  FileText, History, Code, Info, Radio 
} from "lucide-react";

export const settingsCategories = [
  { id: "business", title: "Business Settings", icon: Building2 },
  { id: "users", title: "User & Roles", icon: Users },
  { id: "products", title: "Product Settings", icon: Package },
  { id: "financial", title: "Financial Settings", icon: DollarSign },
  { id: "rfid", title: "RFID Hardware & Engine", icon: Radio },
  { id: "schemes", title: "Saving Scheme", icon: PiggyBank },
  { id: "gold-rate", title: "Gold Rate Settings", icon: TrendingUp },
  { id: "customers", title: "Customer Settings", icon: UserSquare2 },
  { id: "inventory", title: "Inventory Settings", icon: Boxes },
  { id: "order-book", title: "Order Book Settings", icon: ShoppingCart },
  { id: "offers", title: "Coupon & Offer Settings", icon: Ticket },
  { id: "notifications", title: "Notification Settings", icon: Bell },
  { id: "printing", title: "Printing Settings", icon: Printer },
  { id: "integrations", title: "Integration Settings", icon: Link },
  { id: "security", title: "Security Settings", icon: Shield },
  { id: "backup", title: "Backup & Restore", icon: Database },
  { id: "appearance", title: "Appearance", icon: Palette },
  { id: "reports", title: "Reports Settings", icon: FileText },
  { id: "audit", title: "Audit Logs", icon: History },
  { id: "about", title: "About", icon: Info },
];

export function SettingsSidebar({ 
  activeCategoryId, 
  onSelect 
}: { 
  activeCategoryId: string; 
  onSelect: (id: string) => void;
}) {
  return (
    <div className="py-4">
      <nav className="space-y-1 px-3">
        {settingsCategories.map((category) => {
          const isActive = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 text-left",
                isActive 
                  ? "bg-gold/10 text-gold shadow-sm" 
                  : "text-platinum-muted hover:bg-onyx-surface hover:text-platinum"
              )}
            >
              <category.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-gold" : "text-platinum-muted")} />
              <span className="truncate">{category.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
