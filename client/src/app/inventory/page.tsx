// /app/dashboard/admin/page.tsx
"use client"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";

import { useBranchStore } from "@/lib/store/useBranchStore";
import { InventoryHeader } from "../../../components/Inventory/InventoryHeader";


export default function Inventory() {
  
  const {branches}=useBranchStore();


return(
 <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
          
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <InventoryHeader/>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
             
             
             
             
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
)
}
