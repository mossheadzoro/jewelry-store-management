"use client";

import React, { useEffect, useState } from "react";
import { Order } from "../../types/order";
import { useBranchStore } from "@/lib/store/useBranchStore";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  Users,
  TrendingUp,
  Loader2,
  Eye,
  FileText,
  Printer,
} from "lucide-react";

interface AllOrdersViewProps {
  orders: Order[];
  loading: boolean;
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  activeTab: string;
  onPageChange: (page: number) => void;
  onViewSlip: (order: Order) => void;
  onCreateOrder: () => void;
  onRefresh: () => void;
}

interface OrderStats {
  totalOrders: number;
  totalValue: number;
  activeKarigars: number;
  totalKarigars: number;
  metalInProcess: number;
  pendingDeliveries: number;
  urgentRequests: number;
}

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  CREATED: { bg: "bg-[#888]/10", text: "text-[#ccc]", border: "border-[#888]/20" },
  ASSIGNED: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  IN_PROGRESS: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  DELIVERED: { bg: "bg-[#D4A843]/10", text: "text-[#D4A843]", border: "border-[#D4A843]/20" },
  CANCELLED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

export default function AllOrdersView({
  orders,
  loading,
  totalOrders,
  currentPage,
  totalPages,
  activeTab,
  onPageChange,
  onViewSlip,
  onCreateOrder,
  onRefresh,
}: AllOrdersViewProps) {
  const { selectedBranch } = useBranchStore();
  const [stats, setStats] = useState<OrderStats | null>(null);

  useEffect(() => {
    if (!selectedBranch?.id) return;
    axios
      .get(`/api/order/stats?branchId=${selectedBranch.id}`)
      .then((res) => setStats(res.data))
      .catch(console.error);
  }, [selectedBranch]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const getTitle = () => {
    if (activeTab === "pending") return "Pending Orders";
    if (activeTab === "completed") return "Completed Orders";
    return "Order Management";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-[14px] text-[#666] mt-1">
            Showing {totalOrders.toLocaleString()} orders across the atelier
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateOrder}
            className="h-10 px-5 rounded-full bg-[#D4A843] text-black text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === "all" && stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Total Value */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2">
              Total Value
            </p>
            <p className="text-[28px] font-bold text-white leading-tight">
              {formatCurrency(stats.totalValue)}
            </p>
            <div className="w-16 h-1 bg-[#D4A843] rounded-full mt-3" />
          </div>

          {/* Active Karigars */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2">
              Active Karigars
            </p>
            <p className="text-[28px] font-bold text-white leading-tight">
              {stats.activeKarigars}
              <span className="text-[16px] text-[#666] font-normal ml-1">
                assigned
              </span>
            </p>
            <div className="flex items-center gap-1 mt-3">
              <Users className="w-3.5 h-3.5 text-[#555]" />
              <span className="text-[11px] text-[#555]">Workshop artisans</span>
            </div>
          </div>

          {/* Metal in Process */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2">
              Metal in Process
            </p>
            <p className="text-[28px] font-bold text-white leading-tight">
              {stats.metalInProcess.toFixed(1)}g
              <span className="text-[16px] text-[#666] font-normal ml-1">Gold</span>
            </p>
            <p className="text-[11px] text-[#D4A843] mt-3 font-semibold">
              Active deposits
            </p>
          </div>

          {/* Pending Deliveries */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2">
              Pending Deliveries
            </p>
            <p className="text-[28px] font-bold text-white leading-tight">
              {stats.pendingDeliveries}
            </p>
            {stats.urgentRequests > 0 && (
              <p className="text-[11px] text-red-400 mt-3 font-semibold">
                {stats.urgentRequests} URGENT REQUEST{stats.urgentRequests > 1 ? "S" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <h2 className="text-[18px] font-bold text-white">
            Ledger Transactions
          </h2>
          <p className="text-[12px] text-[#666]">
            Sort: <span className="text-white font-medium">Latest first</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-10 h-10 text-[#333] mb-3" />
            <p className="text-[#666] text-[14px]">No orders found</p>
            <button
              onClick={onCreateOrder}
              className="mt-4 text-[#D4A843] text-[13px] font-semibold hover:underline"
            >
              Create your first order →
            </button>
          </div>
        ) : (
          <>
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_1fr_1.2fr_1fr_1fr_0.8fr_0.8fr_0.6fr] px-6 py-3 border-b border-[#1a1a1a]">
              {[
                "ORDER NO",
                "SLIP NO",
                "CUSTOMER",
                "KARIGAR",
                "ADVANCE",
                "DELIVERY",
                "STATUS",
                "",
              ].map((h) => (
                <p
                  key={h}
                  className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em]"
                >
                  {h}
                </p>
              ))}
            </div>

            {/* Rows */}
            {orders.map((order) => {
              const sc = statusConfig[order.status] || statusConfig.CREATED;
              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_1fr_1.2fr_1fr_1fr_0.8fr_0.8fr_0.6fr] px-6 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors items-center group"
                >
                  {/* Order No */}
                  <div>
                    <p className="text-[14px] font-bold text-[#D4A843]">
                      #{order.orderNumber}
                    </p>
                  </div>

                  {/* Slip No */}
                  <div>
                    {order.advance?.advanceReceiptNumber ? (
                      <span className="inline-block px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] font-mono text-white">
                        {order.advance.advanceReceiptNumber}
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#555]">—</span>
                    )}
                  </div>

                  {/* Customer */}
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      {order.customerName}
                    </p>
                    <p className="text-[11px] text-[#666]">
                      {order.customerMobile}
                    </p>
                  </div>

                  {/* Karigar */}
                  <div>
                    {order.karigar ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-[#D4A843]">
                          {order.karigar.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13px] text-white">
                          {order.karigar.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20">
                        NOT ASSIGNED
                      </span>
                    )}
                  </div>

                  {/* Advance */}
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      ₹{Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")}
                    </p>
                    {Number(order.advance?.metalWeight || 0) > 0 && (
                      <p className="text-[11px] text-[#D4A843]">
                        + {Number(order.advance?.metalWeight || 0)}g{" "}
                        {order.advance?.metalPurity || "22K"}
                      </p>
                    )}
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-[12px] text-[#ccc]">
                      {new Date(order.deliveryDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${sc.bg} ${sc.text} ${sc.border}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onViewSlip(order)}
                      className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#ccc] hover:text-[#D4A843] hover:bg-[#333] transition-colors"
                      title="View Slip"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        window.open(`/orderBook/print/${order.id}`, "_blank")
                      }
                      className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#ccc] hover:text-[#D4A843] hover:bg-[#333] transition-colors"
                      title="Print Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-[12px] text-[#666]">
              Showing {(currentPage - 1) * 20 + 1} to{" "}
              {Math.min(currentPage * 20, totalOrders)} of{" "}
              {totalOrders.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-[#888] hover:text-white hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 rounded-full text-[12px] font-semibold transition-colors ${
                      page === currentPage
                        ? "bg-[#D4A843] text-black"
                        : "text-[#888] hover:text-white border border-[#333] hover:border-[#555]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-[#888] hover:text-white hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
