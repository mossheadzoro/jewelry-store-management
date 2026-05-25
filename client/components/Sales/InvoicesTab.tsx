"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import DateFilterChips, { DatePreset } from "./DateFilterChips";
import SalesSearch from "./SalesSearch";
import InvoiceTable from "./InvoiceTable";
import InvoicePagination from "./InvoicePagination";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Download } from "lucide-react";
import { type InvoiceData } from "./InvoiceTableRow";

function getDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "today":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        to: now,
      };
    case "this_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
    case "last_quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        from: new Date(now.getFullYear(), qMonth - 3, 1),
        to: new Date(now.getFullYear(), qMonth, 0),
      };
    }
  }
}

interface InvoicesTabProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

interface InvoicesResponse {
  invoices: InvoiceData[];
  total: number;
  totalPages: number;
}

async function fetchInvoiceList(
  branchId: number,
  page: number,
  limit: number,
  dateFrom: Date,
  dateTo: Date,
  search: string
): Promise<InvoicesResponse> {
  const params = new URLSearchParams({
    branchId: branchId.toString(),
    page: page.toString(),
    limit: limit.toString(),
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  });
  if (search.trim()) params.set("search", search.trim());

  const res = await fetch(`/api/billing/list?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export default function InvoicesTab({
  dateRange,
  onDateRangeChange,
}: InvoicesTabProps) {
  const { selectedBranch } = useBranchStore();
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", selectedBranch?.id, page, limit, dateRange.from.toISOString(), dateRange.to.toISOString(), search],
    queryFn: () =>
      fetchInvoiceList(
        selectedBranch!.id,
        page,
        limit,
        dateRange.from,
        dateRange.to,
        search
      ),
    enabled: !!selectedBranch,
    placeholderData: (prev) => prev,
  });

  const invoices = data?.invoices ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = getDateRange(preset);
    onDateRangeChange(range);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar: date filters + filter/export */}
      <div className="flex items-center justify-between">
        <DateFilterChips
          active={datePreset}
          onChange={handleDatePresetChange}
        />

        <div className="flex items-center gap-3">
          <SalesSearch value={searchInput} onChange={setSearchInput} />
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] text-sm text-[#999] hover:text-white hover:border-[#555] transition-colors cursor-pointer">
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] text-sm text-[#999] hover:text-white hover:border-[#555] transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <InvoiceTable invoices={invoices} isLoading={isLoading} />

      {/* Pagination */}
      <InvoicePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
}
