"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import axios from "axios";
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

type TabType = "all" | "create" | "pending" | "completed";

const OrderPage = () => {
  const { selectedBranch } = useBranchStore();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(
    async (page = 1, status?: string, search?: string) => {
      if (!selectedBranch?.id) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          branchId: String(selectedBranch.id),
          page: String(page),
          limit: "20",
        });
        if (status && status !== "all") params.set("status", status);
        if (search) params.set("search", search);

        const res = await axios.get(`/api/order/fetch?${params.toString()}`);
        setOrders(res.data.orders);
        setTotalOrders(res.data.total);
        setCurrentPage(res.data.page);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedBranch]
  );

  useEffect(() => {
    if (activeTab === "all") {
      fetchOrders(1, undefined, searchQuery);
    } else if (activeTab === "pending") {
      fetchOrders(1, "CREATED", searchQuery);
    } else if (activeTab === "completed") {
      fetchOrders(1, "COMPLETED", searchQuery);
    }
  }, [selectedBranch, activeTab]);

  const handleSearch = () => {
    if (activeTab === "all") fetchOrders(1, undefined, searchQuery);
    else if (activeTab === "pending") fetchOrders(1, "CREATED", searchQuery);
    else if (activeTab === "completed") fetchOrders(1, "COMPLETED", searchQuery);
  };

  const handleOrderCreated = (order: Order) => {
    setPreviewOrder(order);
    setActiveTab("all");
    fetchOrders(1);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All Orders" },
    { id: "create", label: "Create Order" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <main className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto">
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
                  : "text-[#888] hover:text-white border-b-2 border-transparent"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-[240px] h-9 pl-10 pr-4 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#D4A843]/50 transition-colors"
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
              const status =
                activeTab === "pending"
                  ? "CREATED"
                  : activeTab === "completed"
                  ? "COMPLETED"
                  : undefined;
              fetchOrders(page, status, searchQuery);
            }}
            onViewSlip={(order) => setPreviewOrder(order)}
            onCreateOrder={() => setActiveTab("create")}
            onRefresh={() => fetchOrders(currentPage)}
          />
        )}
      </div>
    </main>
  );
};

export default OrderPage;
