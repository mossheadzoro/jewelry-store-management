"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

/**
 * Shared layout for all /book-products pages.
 * Sidebar mounts once here and persists across sub-page navigations.
 */
export default function BookProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full min-h-screen overflow-y-auto bg-onyx">
        {children}
      </main>
    </SidebarProvider>
  );
}
