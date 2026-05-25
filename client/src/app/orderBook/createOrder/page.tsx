"use client";

import { AppSidebar } from "@/components/app-sidebar";
import CreateOrderView from "../../../../components/OrderBook/CreateOrderView";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Order } from "../../../types/order";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateOrderPage() {
  const router = useRouter();

  const handleOrderCreated = (order: Order) => {
    // Optionally redirect to print page or back to orderBook
    router.push(`/orderBook?created=${order.id}`);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto px-8 py-8">
        <Link href="/orderBook" className="inline-flex items-center gap-2 text-[13px] text-[#888] hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Order Book
        </Link>
        <CreateOrderView onOrderCreated={handleOrderCreated} />
      </main>
    </SidebarProvider>
  );
}
