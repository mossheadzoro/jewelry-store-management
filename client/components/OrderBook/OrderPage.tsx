"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Order } from "../../types/order";
import AllOrdersView from "./AllOrdersView";
import CreateOrderView from "./CreateOrderView";
import OrderSlipPreview from "./OrderSlipPreview";
import {
  Search,
  Bell,
  Settings,
  Plus,
} from "lucide-react";

type TabType = "all" | "create" | "pending" | "completed" | "delivered";

const OrderPage = () => {
  const { selectedBranch } = useBranchStore();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const statusForTab = useMemo(() => {
    if (activeTab === "pending") return "CREATED";
    if (activeTab === "completed") return "COMPLETED";
    if (activeTab === "delivered") return "DELIVERED";
    return undefined;
  }, [activeTab]);

  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ["orders", selectedBranch?.id, activeTab, currentPage, debouncedSearch],
    queryFn: async () => {
      if (!selectedBranch?.id) return { orders: [], total: 0, page: 1, totalPages: 1 };
      const params = new URLSearchParams({
        branchId: String(selectedBranch.id),
        page: String(currentPage),
        limit: "20",
      });
      if (statusForTab) params.set("status", statusForTab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/order/fetch?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!selectedBranch?.id && activeTab !== "create",
    placeholderData: (prev: any) => prev,
  });

  const orders = queryData?.orders ?? [];
  const totalOrders = queryData?.total ?? 0;
  const totalPages = queryData?.totalPages ?? 1;

  const handleSearch = () => {
    setDebouncedSearch(searchInput);
  };

  const handleOrderCreated = (order: Order) => {
    setPreviewOrder(order);
    setActiveTab("all");
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All Orders" },
    { id: "create", label: "Create Order" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <main className="flex-1 min-h-screen bg-onyx overflow-auto">
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-8 py-3 border-b border-[#1a1a1a]"
        style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)" }}
      >
        <nav className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPreviewOrder(null);
              }}
              className={`text-[13px] font-semibold tracking-wide pb-1 transition-all ${
                activeTab === tab.id
                  ? "text-[#D4A843] border-b-2 border-[#D4A843]"
                  : "text-[#888] hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-[240px] h-9 pl-10 pr-4 rounded-full bg-onyx-elevated border border-onyx-border text-[13px] text-foreground placeholder:text-[#555] focus:outline-none focus:border-[#D4A843]/50 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-8 py-6">
        {previewOrder ? (
          <OrderSlipPreview
            order={previewOrder}
            onClose={() => setPreviewOrder(null)}
          />
        ) : activeTab === "create" ? (
          <CreateOrderView onOrderCreated={handleOrderCreated} />
        ) : (
          <AllOrdersView
            orders={orders}
            loading={loading}
            totalOrders={totalOrders}
            currentPage={currentPage}
            totalPages={totalPages}
            activeTab={activeTab}
            onPageChange={(page) => {
              setCurrentPage(page);
            }}
            onViewSlip={(order) => setPreviewOrder(order)}
            onCreateOrder={() => setActiveTab("create")}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}
          />
        )}
      </div>
    </main>
  );
};

export default OrderPage;
