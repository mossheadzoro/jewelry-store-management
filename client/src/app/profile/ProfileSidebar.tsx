"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  UserCircle,
  CreditCard,
  Bell
} from "lucide-react";

export const profileCategories = [
  { id: "account", title: "Account Settings", icon: UserCircle },
  { id: "billing", title: "Billing & Subscription", icon: CreditCard },
  { id: "notifications", title: "Notification Preferences", icon: Bell },
];

export function ProfileSidebar({ 
  activeCategoryId, 
  onSelect 
}: { 
  activeCategoryId: string; 
  onSelect: (id: string) => void;
}) {
  return (
    <div className="py-4">
      <nav className="space-y-1 px-3">
        {profileCategories.map((category) => {
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
