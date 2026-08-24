// client/src/components/app-sidebar.tsx
"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  IconChartBar,
  IconDatabase,
  IconListDetails,
  IconFolder,
  IconPigMoney,
  IconBook,
  IconReport,
  IconFileWord,
  IconHammer,
  IconGridGoldenratio,
  IconUsers,
  IconUserCheck,
  IconSettings,
  IconSearch,
  IconDashboard,
  IconRadio,
  IconHelp,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import BranchSelector from "../../components/BranchSelector";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = (session?.user?.role || "SALESMAN").toUpperCase();

  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";

  // Sector 1: Core Operations & Jewellery Management (Visible to all staff)
  const operations = [
    {
      title: "Inventory",
      url: "/inventory",
      icon: IconChartBar,
    },
    {
      title: "Stock Ledger",
      url: "/inventory/ledger",
      icon: IconDatabase,
    },
    {
      title: "Billing",
      url: "/billing",
      icon: IconListDetails,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: IconFolder,
    },
    {
      title: "Saving Schemes",
      url: "/saving-schemes",
      icon: IconPigMoney,
    },
    {
      title: "Book Products",
      url: "/book-products",
      icon: IconBook,
    },
    {
      title: "Order Book",
      url: "/orderBook",
      icon: IconReport,
    },
    {
      title: "Metal Exchange and Reports",
      url: "/metalExchange",
      icon: IconFileWord,
    },
    {
      title: "Karigar Panel",
      url: "/karigar",
      icon: IconHammer,
    },
    {
      title: "Wholesaler Panel",
      url: "/wholesaler",
      icon: IconGridGoldenratio,
    },
  ];

  // Sector 2: People & Relationships (Staffs restricted to Manager/Admin)
  const people = [
    {
      title: "Customers",
      url: "/customer",
      icon: IconUsers,
    },
    ...(isManagerOrAdmin
      ? [
          {
            title: "Staffs",
            url: "/staff",
            icon: IconUserCheck,
          },
        ]
      : []),
  ];

  // Sector 3: System & Tools (Settings restricted to Manager/Admin)
  const system = [
    ...(isManagerOrAdmin
      ? [
          {
            title: "Settings",
            url: "/settings",
            icon: IconSettings,
          },
        ]
      : []),
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
    {
      title: "Home Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "RFID Hub",
      url: "/rfid/dashboard",
      icon: IconRadio,
    },
    ...(isManagerOrAdmin
      ? [
          {
            title: "Get Help",
            url: "/settings?tab=about",
            icon: IconHelp,
          },
        ]
      : []),
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <BranchSelector />
      </SidebarHeader>

      <SidebarContent className="space-y-1 py-1 overflow-x-hidden">
        {/* Sector 1: Core Operations */}
        <NavMain items={operations} />

        {/* Sector Divider & Gap */}
        <SidebarSeparator className="my-1.5 opacity-60" />

        {/* Sector 2: Customers & Staffs */}
        <NavMain items={people} />

        {/* Sector Divider & Gap */}
        <SidebarSeparator className="my-1.5 opacity-60" />

        {/* Sector 3: System, Dashboard & Help */}
        <NavMain items={system} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
