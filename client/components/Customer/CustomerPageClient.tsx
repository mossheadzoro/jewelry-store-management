"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Shield, UserCheck, Filter } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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

async function fetchCustomerList(
  page: number,
  search: string,
  tagId: string,
  kycStatus: string
): Promise<CustomerListResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: "20" });
  if (search.trim().length >= 2) params.set("search", search.trim());
  if (tagId) params.set("tagId", tagId);
  if (kycStatus) params.set("kycStatus", kycStatus);
  const res = await fetch(`/api/customer/list?${params}`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export default function CustomerPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const userRole = session?.user?.role || "SALESMAN";
  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [selectedKycStatus, setSelectedKycStatus] = useState<string>("");
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
    queryKey: ["customers", page, search, selectedTagId, selectedKycStatus],
    queryFn: () => fetchCustomerList(page, search, selectedTagId, selectedKycStatus),
    placeholderData: (prev) => prev,
  });

  const customers = data?.customers ?? [];
  const stats = data?.stats ?? {
    totalClientele: 0,
    vipCount: 0,
    totalOutstanding: 0,
    growthPercent: 0,
  };
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

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
    if (!isManagerOrAdmin) {
      alert("Permission Denied: Customer deletion requires Manager or Admin authority.");
      return;
    }
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
        
        {/* Role & Permissions Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-onyx-surface border border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isManagerOrAdmin
                  ? "bg-[#D4A843]/10 border-[#D4A843]/30 text-[#D4A843]"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}
            >
              {isManagerOrAdmin ? (
                <Shield className="w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-foreground">
                  Active Session: {session?.user?.name || "Staff"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isManagerOrAdmin
                      ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                      : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {userRole} Mode
                </span>
              </div>
              <p className="text-[12px] text-[#777] mt-0.5">
                {isManagerOrAdmin
                  ? "Full Governance: Comprehensive profile editing, KYC document verification & approval authority, client deletion, and complete profile audit ledger."
                  : "Salesman Access: Register clients, update contact details & preferences, upload KYC documents & generate customer upload links."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#888]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Audit Ledger Active
          </div>
        </div>

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
            <p className="text-[14px] text-[#666] mt-1.5 max-w-lg leading-relaxed">
              Curate and manage the atelier&apos;s esteemed client portfolio.
              Review KYC compliance status, transaction histories, and change ledgers.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2 flex-wrap justify-end">
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
                placeholder="Search name, phone, ID..."
                className="w-[240px] h-10 pl-10 pr-4 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/40 transition-colors"
              />
            </div>

            {/* KYC Filter */}
            <div className="relative">
              <select
                value={selectedKycStatus}
                onChange={(e) => {
                  setSelectedKycStatus(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-3 pr-8 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="">All KYC Status</option>
                <option value="VERIFIED">Verified KYC</option>
                <option value="PENDING">Pending Review</option>
                <option value="MISSING">No KYC Docs</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-[10px]">
                ▼
              </div>
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <select
                value={selectedTagId}
                onChange={(e) => {
                  setSelectedTagId(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-3 pr-8 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer min-w-[130px]"
              >
                <option value="">All Tags</option>
                {tagDefinitions.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-[10px]">
                ▼
              </div>
            </div>

            {/* Add Customer Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="h-10 px-5 rounded-xl bg-[#D4A843] text-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Add Customer
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
          userRole={userRole}
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
        userRole={userRole}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => invalidate()}
      />

      {/* Edit Modal */}
      <EditCustomerModal
        open={!!editCustomerId}
        customerId={editCustomerId}
        userRole={userRole}
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
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Delete Customer?</h3>
            <p className="text-[13px] text-[#666] mb-5">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-medium">{deleteConfirm.name}</span>?
              This action cannot be undone and will be permanently recorded in the system audit log.
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
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
