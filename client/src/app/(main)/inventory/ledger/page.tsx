"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import InventoryLedgerClient from "@/components/Inventory/InventoryLedgerClient";

export default function LedgerPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <InventoryLedgerClient />
    </SidebarProvider>
  );
}
