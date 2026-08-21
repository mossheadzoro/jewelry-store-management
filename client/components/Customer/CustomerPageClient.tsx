"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SummaryCards from "./SummaryCards";
import CustomerTable, { CustomerRow } from "./CustomerTable";
import AddCustomerModal from "./AddCustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import DirectCommunicationModal from "./DirectCommunicationModal";

interface Stats {
  totalClientele: number;
  vipCount: number;
  totalOutstanding: number;
  growthPercent: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomerListResponse {
  customers: CustomerRow[];
  stats: Stats;
  pagination: Pagination;
}

interface TagDefinition {
  id: string;
  name: string;
  label: string;
  color: string;
  type: "SYSTEM" | "MANUAL";
}

async function fetchCustomerList(page: number, search: string, tagId: string): Promise<CustomerListResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: "20" });
  if (search.trim().length >= 2) params.set("search", search.trim());
  if (tagId) params.set("tagId", tagId);
  const res = await fetch(`/api/customer/list?${params}`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export default function CustomerPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [messageCustomer, setMessageCustomer] = useState<CustomerRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CustomerRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch tag definitions
  const { data: tagsData } = useQuery<{ definitions: TagDefinition[] }>({
    queryKey: ["tagDefinitions"],
    queryFn: async () => {
      const res = await fetch("/api/customer/tags/definitions");
      if (!res.ok) throw new Error("Failed to fetch tag definitions");
      return res.json();
    },
  });
  const tagDefinitions = tagsData?.definitions ?? [];

  // React Query — cached, deduplicated, automatic background refresh
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["customers", page, search, selectedTagId],
    queryFn: () => fetchCustomerList(page, search, selectedTagId),
    placeholderData: (prev) => prev, // keep showing previous data while loading next page
  });

  const customers = data?.customers ?? [];
  const stats = data?.stats ?? { totalClientele: 0, vipCount: 0, totalOutstanding: 0, growthPercent: 0 };
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  // Debounce search — only update after 300ms pause
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["tagDefinitions"] });
  };

  const handlePageChange = (p: number) => setPage(p);

  const handleDelete = async (customer: CustomerRow) => {
    setDeleteConfirm(customer);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/customer/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete customer.");
        return;
      }
      invalidate();
    } catch {
      alert("Network error.");
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleView = (customer: CustomerRow) => {
    router.push(`/customer/${customer.id}`);
  };

  const handleEdit = (customer: CustomerRow) => {
    setEditCustomerId(customer.id);
  };

  return (
    <main className="flex-1 min-h-screen bg-onyx overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Top Label */}
        <p className="text-[13px] font-semibold text-[#D4A843] uppercase tracking-widest mb-2">
          Customer Relations
        </p>

        {/* Header */}
        <div className="flex items-start justify-between gap-8 mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-foreground tracking-tight leading-tight">
              Customer Management
            </h1>
            <p className="text-[14px] text-[#555] mt-1.5 max-w-lg leading-relaxed">
              Curate and manage the atelier&apos;s esteemed client portfolio.
              Review transaction histories and cultivate lasting relationships.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {/* Search */}
            <div className="relative">
              {isFetching ? (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              )}
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, mobile, or ID..."
                className="w-[280px] h-10 pl-10 pr-4 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/40 transition-colors"
              />
            </div>
            {/* Tag Filter */}
            <div className="relative">
              <select
                value={selectedTagId}
                onChange={(e) => {
                  setSelectedTagId(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-4 pr-8 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="">All Tags</option>
                {tagDefinitions.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-[10px] flex items-center justify-center">
                {isFetching ? (
                  <div className="w-3 h-3 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
                ) : (
                  "▼"
                )}
              </div>
            </div>
            {/* Add Customer Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="h-10 px-5 rounded-xl bg-[#D4A843] text-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Add New Customer
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards stats={stats} loading={isLoading && customers.length === 0} />

        {/* Customer Table */}
        <CustomerTable
          customers={customers}
          pagination={pagination}
          loading={isLoading && customers.length === 0}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onMessage={(customer) => setMessageCustomer(customer)}
        />
      </div>

      {/* Add Modal */}
      <AddCustomerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => invalidate()}
      />

      {/* Edit Modal */}
      <EditCustomerModal
        open={!!editCustomerId}
        customerId={editCustomerId}
        onClose={() => setEditCustomerId(null)}
        onSuccess={() => invalidate()}
      />

      {/* Message Modal */}
      <DirectCommunicationModal
        open={!!messageCustomer}
        customer={messageCustomer}
        onClose={() => setMessageCustomer(null)}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Delete Customer?</h3>
            <p className="text-[13px] text-[#666] mb-5">
              Are you sure you want to delete <span className="text-foreground font-medium">{deleteConfirm.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="h-9 px-4 rounded-lg text-[13px] text-[#999] bg-onyx-elevated border border-[#252525] hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-red-500 text-foreground hover:bg-red-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
