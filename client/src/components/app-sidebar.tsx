"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconGridGoldenratio,
  IconHammer,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPigMoney,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import BranchSelector from "../../components/BranchSelector"
import { useRouter } from "next/navigation"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
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
      title: "Customers",
      url: "/customer",
      icon: IconUsers,
    },
    {
      title: "Saving Schemes",
      url: "/saving-schemes",
      icon: IconPigMoney,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Book Products",
      url: "/book-products",
      icon: IconDatabase,
    },
    {
      name: "Order Book",
      url: "/orderBook",
      icon: IconReport,
    },
    {
      name: "Metal Exchange Reports",
      url: "/metalExchange",
      icon: IconFileWord,
    },
    {
      name: "Karigar Panel",
      url: "/karigar",
      icon: IconHammer,
    },
    {
      name: "Whole-Saler Panel",
      url: "/wholesaler",
      icon: IconGridGoldenratio,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const router = useRouter()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <BranchSelector />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
