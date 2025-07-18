// /app/dashboard/admin/page.tsx
"use client"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "../../../../libs/prisma";
import AddUserForm from "../../../../components/AddUserForm";
import AddBranchForm from "../../../../components/AddBranchForm";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";

import data from "./data.json"
import { useUserStore } from "@/lib/store/useUserStore";

export default function AdminDashboard() {
  


  

  const branch=  useUserStore((state)=>state.branch)
console.log("Branch",branch);
  

  // return <div className="p-4">
  //   <h1>Welcome Admin</h1>
  //    <div className="max-w-xl mx-auto py-10">
  //     <h1 className="text-2xl font-bold mb-6">👤 Add Manager or Salesman</h1>
  //     <AddUserForm branches={branches} />
  //     <h1 className="text-2xl font-bold">👤 Add Manager or Salesman</h1>
  //     <AddBranchForm />
  //   </div>
  // </div>;
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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
)
}
