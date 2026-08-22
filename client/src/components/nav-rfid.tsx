// client/src/components/nav-rfid.tsx
"use client";

import * as React from "react";
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
} from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const rfidMenuItems = [
  { title: "RFID Dashboard", url: "/rfid/dashboard", icon: IconRadio },
  { title: "Tags Management", url: "/rfid/tags", icon: IconTags },
  { title: "Readers & Antennas", url: "/rfid/readers", icon: IconCpu },
  { title: "Physical Zones", url: "/rfid/zones", icon: IconMapPin },
  { title: "Live Scan Studio", url: "/rfid/scans", icon: IconRadar2 },
  { title: "Inventory Audit", url: "/rfid/audit", icon: IconChecklist },
  { title: "Discrepancy & Exceptions", url: "/rfid/exceptions", icon: IconAlertTriangle },
  { title: "Movement Monitor", url: "/rfid/movements", icon: IconTimeline },
  { title: "RFID Settings", url: "/rfid/settings", icon: IconAdjustmentsAlt },
];

export function NavRfid() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-gold/90 font-semibold tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        RFID MODULE
      </SidebarGroupLabel>
      <SidebarMenu>
        {rfidMenuItems.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
          const IconComponent = item.icon;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "bg-gold/15 text-gold font-semibold shadow-sm border-l-2 border-gold"
                    : "text-sidebar-foreground hover:text-gold hover:bg-onyx-surface"
                )}
                onMouseEnter={() => router.prefetch(item.url)}
              >
                <Link href={item.url}>
                  <IconComponent className={cn("w-4 h-4", isActive ? "text-gold" : "")} />
                  <span className="text-xs">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
