"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  MessageSquare,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface CustomerTagData {
  id: string;
  name: string;
  label: string;
  color: string;
  type: "SYSTEM" | "MANUAL";
}

export interface CustomerRow {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  city: string;
  state: string;
  address: string;
  gender: string;
  customerCode: string;
  tier: "VIP" | "GOLD" | "REGULAR";
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
  lastPurchaseItem: string | null;
  outstanding: number;
  dueDays: number | null;
  createdAt: string;
  tags?: CustomerTagData[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomerTableProps {
  customers: CustomerRow[];
  pagination: Pagination;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (customer: CustomerRow) => void;
  onDelete: (customer: CustomerRow) => void;
  onView: (customer: CustomerRow) => void;
  onMessage: (customer: CustomerRow) => void;
}

export default function CustomerTable({
  customers,
  pagination,
  loading,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onMessage,
}: CustomerTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl bg-[#141414] border border-[#1f1f1f] overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-[#1a1a1a] animate-pulse">
              <div className="w-11 h-11 rounded-full bg-[#1f1f1f]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-[#1f1f1f]" />
                <div className="h-3 w-20 rounded bg-[#1f1f1f]" />
              </div>
              <div className="h-4 w-24 rounded bg-[#1f1f1f]" />
              <div className="h-4 w-28 rounded bg-[#1f1f1f]" />
              <div className="h-4 w-20 rounded bg-[#1f1f1f]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-[#141414] border border-[#1f1f1f] py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center mb-4">
          <span className="text-2xl">👤</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No customers found</h3>
        <p className="text-sm text-[#666]">Add your first customer to get started.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Table */}
      <div className="rounded-2xl bg-[#141414] border border-[#1f1f1f] overflow-visible">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.6fr] gap-4 px-6 py-3.5 border-b border-[#1f1f1f] bg-[#111]">
          <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Client Detail</span>
          <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Location & Contact</span>
          <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Engagement</span>
          <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider text-right">Outstanding</span>
          <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider text-center">Actions</span>
        </div>

        {/* Rows */}
        {customers.map((customer, idx) => {
          const initials = getInitials(customer.name);
          const avatarColor = getAvatarColor(customer.name);
          const isMenuOpen = openMenuId === customer.id;

          return (
            <div
              key={customer.id}
              className={`group grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.6fr] gap-4 px-6 py-4 items-center transition-colors duration-200 hover:bg-[#1a1a1a] ${
                idx < customers.length - 1 ? "border-b border-[#1a1a1a]" : ""
              }`}
            >
              {/* Client Detail */}
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: avatarColor + "22", color: avatarColor }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onView(customer)}
                      className="text-[14px] font-semibold text-white truncate hover:text-[#D4A843] transition-colors cursor-pointer text-left"
                    >
                      {customer.name}
                    </button>
                    {customer.tier !== "REGULAR" && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          customer.tier === "VIP"
                            ? "bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/25"
                            : "bg-amber-600/15 text-amber-500 border border-amber-600/25"
                        }`}
                      >
                        {customer.tier}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#555] mt-0.5">ID: {customer.customerCode}</p>
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {customer.tags.map((tag) => {
                        const colorMap: Record<string, string> = {
                          gold: "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30",
                          red: "bg-red-500/10 text-red-400 border-red-500/25",
                          blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
                          gray: "bg-gray-500/10 text-gray-400 border-gray-500/25",
                          green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                          orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
                          purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
                        };
                        const colorClass = colorMap[tag.color.toLowerCase()] || "bg-gray-500/10 text-gray-400 border-gray-500/25";
                        return (
                          <span
                            key={tag.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}
                            title={tag.type === "SYSTEM" ? "System Tag: " + tag.label : "Manual Tag: " + tag.label}
                          >
                            {tag.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Contact */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4A843]" />
                  <span className="text-[13px] text-[#999] truncate">{customer.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#555]" />
                  <span className="text-[13px] text-[#999]">+91 {formatPhone(customer.mobile)}</span>
                </div>
              </div>

              {/* Engagement */}
              <div className="space-y-1">
                <p className="text-[13px] text-[#ccc]">
                  Total: <span className="font-semibold text-white">{customer.totalPurchases} Purchase{customer.totalPurchases !== 1 ? "s" : ""}</span>
                </p>
                {customer.lastPurchaseDate ? (
                  <p className="text-[11px] text-[#555]">
                    Last: {formatDate(customer.lastPurchaseDate)}
                    {customer.lastPurchaseItem && ` (${customer.lastPurchaseItem})`}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#444]">No purchases yet</p>
                )}
              </div>

              {/* Outstanding */}
              <div className="text-right">
                {customer.outstanding > 0 ? (
                  <>
                    <p className="text-[14px] font-bold text-red-400">
                      ₹ {customer.outstanding.toLocaleString("en-IN")}
                    </p>
                    {customer.dueDays !== null && (
                      <p className="text-[11px] text-[#555] mt-0.5">
                        Due in {customer.dueDays} days
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[14px] font-semibold text-white">₹ 0</p>
                    <p className="text-[11px] text-emerald-500 mt-0.5">Settled</p>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => onMessage(customer)}
                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] flex items-center justify-center text-[#666] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all cursor-pointer"
                  title="Message"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(isMenuOpen ? null : customer.id)}
                    className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] flex items-center justify-center text-[#666] hover:text-white hover:border-[#333] transition-all cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {isMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      {/* Menu - opens upward for last 2 rows to prevent overflow */}
                      <div className={`absolute right-0 w-36 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 z-50 py-1 overflow-hidden ${idx >= customers.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                        <button
                          onClick={() => { onView(customer); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#ccc] hover:bg-[#222] hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => { onEdit(customer); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#ccc] hover:bg-[#222] hover:text-white transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => { onDelete(customer); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 px-1">
          <p className="text-[13px] text-[#555]">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="w-8 h-8 rounded-lg bg-[#141414] border border-[#1f1f1f] flex items-center justify-center text-[#666] hover:text-white hover:border-[#333] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                    pageNum === pagination.page
                      ? "bg-[#D4A843] text-black"
                      : "bg-[#141414] border border-[#1f1f1f] text-[#666] hover:text-white hover:border-[#333]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="w-8 h-8 rounded-lg bg-[#141414] border border-[#1f1f1f] flex items-center justify-center text-[#666] hover:text-white hover:border-[#333] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "#D4A843", "#6366f1", "#0ea5e9", "#f43f5e",
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
