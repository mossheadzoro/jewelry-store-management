// client/components/RFID/RFIDSidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconRadio,
  IconTags,
  IconCpu,
  IconMapPin,
  IconRadar2,
  IconChecklist,
  IconAlertTriangle,
  IconTimeline,
  IconAdjustmentsAlt,
  IconChevronLeft,
  IconChevronRight,
  IconArrowLeft,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface RFIDNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "gold" | "emerald" | "rose" | "outline";
}

export interface RFIDNavSection {
  title: string;
  items: RFIDNavItem[];
}

export const rfidNavigationSections: RFIDNavSection[] = [
  {
    title: "Operations",
    items: [
      {
        title: "RFID Dashboard",
        url: "/rfid/dashboard",
        icon: IconRadio,
      },
      {
        title: "Live Scan Studio",
        url: "/rfid/scans",
        icon: IconRadar2,
        badge: "Live",
        badgeVariant: "emerald",
      },
      {
        title: "Inventory Audit",
        url: "/rfid/audit",
        icon: IconChecklist,
      },
      {
        title: "Movement Monitor",
        url: "/rfid/movements",
        icon: IconTimeline,
      },
    ],
  },
  {
    title: "Hardware & Inventory",
    items: [
      {
        title: "Tags Management",
        url: "/rfid/tags",
        icon: IconTags,
      },
      {
        title: "Readers & Antennas",
        url: "/rfid/readers",
        icon: IconCpu,
      },
      {
        title: "Physical Zones",
        url: "/rfid/zones",
        icon: IconMapPin,
      },
    ],
  },
  {
    title: "System & Security",
    items: [
      {
        title: "Exceptions & Alerts",
        url: "/rfid/exceptions",
        icon: IconAlertTriangle,
      },
      {
        title: "RFID Settings",
        url: "/rfid/settings",
        icon: IconAdjustmentsAlt,
      },
    ],
  },
];

export function RFIDSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isItemActive = (url: string) => {
    if (url === "/rfid/dashboard") {
      return pathname === "/rfid" || pathname === "/rfid/dashboard";
    }
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const renderBadge = (item: RFIDNavItem) => {
    if (!item.badge) return null;
    if (item.badgeVariant === "emerald") {
      return (
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {item.badge}
        </span>
      );
    }
    if (item.badgeVariant === "rose") {
      return (
        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
          {item.badge}
        </span>
      );
    }
    return (
      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
        {item.badge}
      </span>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "hidden md:flex flex-col flex-shrink-0 border-r border-onyx-border bg-onyx-elevated/70 backdrop-blur-md transition-all duration-300 ease-in-out relative z-10",
          isCollapsed ? "w-[68px]" : "w-64 lg:w-72"
        )}
      >
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-onyx-border flex items-center justify-between gap-2 min-h-[64px]">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-sm shrink-0">
                <IconRadio className="w-5 h-5 text-gold animate-pulse" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                    RFID HUB
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[11px] text-platinum-muted truncate">
                  Hardware & Intelligence
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto p-2 rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-sm">
              <IconRadio className="w-5 h-5 text-gold animate-pulse" />
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-platinum-muted hover:text-gold hover:bg-onyx-surface transition-colors border border-transparent hover:border-onyx-border"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <IconChevronRight className="w-4 h-4" />
            ) : (
              <IconChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Back to App Link */}
        <div className="px-3 pt-3 pb-1">
          {!isCollapsed ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-platinum-muted hover:text-gold hover:bg-onyx-surface transition-colors"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Main Dashboard</span>
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center p-2 rounded-lg text-platinum-muted hover:text-gold hover:bg-onyx-surface transition-colors"
                >
                  <IconArrowLeft className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Back to Main Dashboard</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-onyx-border">
          {rfidNavigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-platinum-faint">
                  {section.title}
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = isItemActive(item.url);
                  const Icon = item.icon;

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.url}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.url}
                            onMouseEnter={() => router.prefetch(item.url)}
                            className={cn(
                              "flex items-center justify-center w-full p-2.5 rounded-xl transition-all duration-200",
                              isActive
                                ? "bg-gold/20 text-gold shadow-sm border border-gold/40"
                                : "text-platinum-muted hover:text-gold hover:bg-onyx-surface"
                            )}
                          >
                            <Icon className={cn("w-5 h-5", isActive ? "text-gold" : "")} />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="outline" className="text-[10px] text-gold border-gold/40">
                              {item.badge}
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.url}
                      href={item.url}
                      onMouseEnter={() => router.prefetch(item.url)}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border-l-[3px]",
                        isActive
                          ? "bg-gold/15 text-gold border-gold font-semibold shadow-sm"
                          : "border-transparent text-platinum-muted hover:text-platinum hover:bg-onyx-surface/80 hover:border-onyx-border"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-gold" : "text-platinum-muted group-hover:text-gold"
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                      {renderBadge(item)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Hardware Status Card */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-onyx-border bg-onyx-surface/40">
            <div className="p-3 rounded-xl border border-onyx-border bg-onyx-surface/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-foreground">
                    Hardware Active
                  </span>
                </div>
                <span className="text-[10px] text-platinum-muted font-mono">TCP/LLRP</span>
              </div>
              <p className="text-[10px] text-platinum-muted leading-tight">
                Live observation layer connected.
              </p>
              <div className="pt-1 flex items-center gap-1.5">
                <Link href="/rfid/scans" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 text-[11px] font-medium transition-colors">
                    <IconRadar2 className="w-3 h-3" /> Live Scan
                  </button>
                </Link>
                <Link href="/rfid/audit" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-onyx hover:bg-onyx-elevated text-platinum-muted hover:text-foreground border border-onyx-border text-[11px] font-medium transition-colors">
                    <IconChecklist className="w-3 h-3" /> Audit
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-onyx-border flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 block rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">RFID Hardware Engine: Active</TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

/**
 * Mobile Navigation Header Bar with Horizontal Scrolling Tabs & Drawer for RFID Module
 */
export function RFIDMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const allItems = rfidNavigationSections.flatMap((s) => s.items);

  const isItemActive = (url: string) => {
    if (url === "/rfid/dashboard") {
      return pathname === "/rfid" || pathname === "/rfid/dashboard";
    }
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <div className="md:hidden border-b border-onyx-border bg-onyx-elevated/90 backdrop-blur-md sticky top-0 z-20">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-onyx-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30">
            <IconRadio className="w-4 h-4 text-gold animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">RFID OPERATIONS</div>
            <div className="text-[10px] text-platinum-muted">Hardware & Zone Intelligence</div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-[11px] text-platinum-muted hover:text-gold flex items-center gap-1"
        >
          <IconArrowLeft className="w-3 h-3" /> App Home
        </Link>
      </div>

      {/* Horizontal Scrolling Navigation Tabs */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
        {allItems.map((item) => {
          const isActive = isItemActive(item.url);
          const Icon = item.icon;

          return (
            <Link
              key={item.url}
              href={item.url}
              onMouseEnter={() => router.prefetch(item.url)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-200 shrink-0",
                isActive
                  ? "bg-gold text-black font-semibold shadow-sm"
                  : "bg-onyx-surface/80 text-platinum-muted hover:text-platinum border border-onyx-border"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-black" : "text-gold")} />
              <span>{item.title}</span>
              {item.badge && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
