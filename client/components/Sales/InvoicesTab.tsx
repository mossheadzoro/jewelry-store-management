"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import DateFilterChips, { DatePreset } from "./DateFilterChips";
import SalesSearch from "./SalesSearch";
import InvoiceTable from "./InvoiceTable";
import InvoicePagination from "./InvoicePagination";
import InvoiceFilterSheet from "./InvoiceFilterSheet";
import InvoiceDetailSheet from "./InvoiceDetailSheet";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { useSalesFilters } from "@/hooks/useSalesFilters";
import { downloadFile } from "@/lib/invoice-export";

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
  invoices: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function fetchInvoiceList(
  branchId: number,
  page: number,
  limit: number,
  dateFrom: Date,
  dateTo: Date,
  search: string,
  status?: string,
  paymentMethod?: string,
  salespersonId?: string,
  huidStatus?: string,
  amountMin?: string,
  amountMax?: string
): Promise<InvoicesResponse> {
  const params = new URLSearchParams({
    branchId: branchId.toString(),
    page: page.toString(),
    limit: limit.toString(),
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  });
  
  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  if (paymentMethod) params.set("paymentMethod", paymentMethod);
  if (salespersonId) params.set("salespersonId", salespersonId);
  if (huidStatus) params.set("huidStatus", huidStatus);
  if (amountMin) params.set("amountMin", amountMin);
  if (amountMax) params.set("amountMax", amountMax);

  const res = await fetch(`/api/billing/list?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export default function InvoicesTab({
  dateRange,
  onDateRangeChange,
}: InvoicesTabProps) {
  const { selectedBranch } = useBranchStore();
  const { filters, setFilter, setFilters, resetFilters } = useSalesFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const page = parseInt(filters.page) || 1;
  const limit = 10;

  // Sync date preset on filters load
  useEffect(() => {
    if (filters.search !== searchInput) {
      setSearchInput(filters.search);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "invoices",
      selectedBranch?.id,
      page,
      limit,
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
      filters.search,
      filters.status,
      filters.paymentMethod,
      filters.salespersonId,
      filters.huidStatus,
      filters.amountMin,
      filters.amountMax,
    ],
    queryFn: () =>
      fetchInvoiceList(
        selectedBranch!.id,
        page,
        limit,
        dateRange.from,
        dateRange.to,
        filters.search,
        filters.status,
        filters.paymentMethod,
        filters.salespersonId,
        filters.huidStatus,
        filters.amountMin,
        filters.amountMax
      ),
    enabled: !!selectedBranch,
    placeholderData: (prev) => prev,
  });

  const invoices = data?.invoices ?? [];
  const totalItems = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilter("search", searchInput);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, setFilter]);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = getDateRange(preset);
    onDateRangeChange(range);
  };

  const activeFiltersCount = [
    filters.status,
    filters.paymentMethod,
    filters.salespersonId,
    filters.huidStatus,
    filters.amountMin,
    filters.amountMax,
  ].filter(Boolean).length;

  const getExportUrl = (format: "excel" | "pdf") => {
    const params = new URLSearchParams({
      branchId: selectedBranch?.id?.toString() || "1",
      format,
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString(),
    });
    
    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
    if (filters.salespersonId) params.set("salespersonId", filters.salespersonId);
    if (filters.huidStatus) params.set("huidStatus", filters.huidStatus);
    if (filters.amountMin) params.set("amountMin", filters.amountMin);
    if (filters.amountMax) params.set("amountMax", filters.amountMax);

    return `/api/billing/export?${params.toString()}`;
  };

  const handleExportExcel = async () => {
    setShowExportMenu(false);
    await downloadFile(getExportUrl("excel"), `Invoices_Export_${Date.now()}.xlsx`);
  };

  const handleExportPdf = async () => {
    setShowExportMenu(false);
    await downloadFile(getExportUrl("pdf"), `Invoices_Export_${Date.now()}.pdf`);
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
          
          {/* Filter Trigger button */}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer text-sm ${
              activeFiltersCount > 0
                ? "border-[#C9943A] text-[#C9943A] bg-[#C9943A]/5"
                : "border-[#1F1F24] text-[#6B6560] hover:text-[#F0EBE0] hover:border-[#222228] bg-[#111113]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#C9943A] text-black text-[10px] font-bold flex items-center justify-center font-mono">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1F1F24] text-sm text-[#6B6560] hover:text-[#F0EBE0] hover:border-[#222228] bg-[#111113] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[#111113] border border-[#1F1F24] rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-[#1F1F24]">
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#F0EBE0] hover:bg-[#222228] hover:text-[#E8B84B] transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Export as Excel
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#F0EBE0] hover:bg-[#222228] hover:text-[#E8B84B] transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#C9943A]" />
                    Export as PDF Summary
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <InvoiceTable
        invoices={invoices}
        isLoading={isLoading}
        onRowClick={(id) => setSelectedInvoiceId(id)}
      />

      {/* Pagination */}
      <InvoicePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={(p) => setFilter("page", p.toString())}
      />

      {/* Filters sliding Sheet */}
      <InvoiceFilterSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={resetFilters}
      />

      {/* Detail side Sheet */}
      <InvoiceDetailSheet
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  );
}
