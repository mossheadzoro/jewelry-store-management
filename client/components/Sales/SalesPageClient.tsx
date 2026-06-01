"use client";

import React, { useEffect, useState } from "react";
import SalesHeader from "./SalesHeader";
import InvoicesTab from "./InvoicesTab";
import ReportsTab from "./ReportsTab";
import BulkOperationsTab from "./BulkOperationsTab";
import BackupTab from "./BackupTab";
import AnalyticsTab from "./AnalyticsTab";
import { useSalesFilters, SalesFilters } from "@/hooks/useSalesFilters";
import {
  FileText,
  BarChart3,
  Layers,
  Database,
  TrendingUp,
} from "lucide-react";

type SalesTab = "invoices" | "reports" | "bulk" | "backup" | "analytics";

interface TabConfig {
  id: SalesTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: "invoices", label: "Invoices", icon: <FileText className="w-4 h-4" /> },
  { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
  {
    id: "bulk",
    label: "Bulk Print",
    icon: <Layers className="w-4 h-4" />,
  },
  { id: "backup", label: "Backup", icon: <Database className="w-4 h-4" /> },
  {
    id: "analytics",
    label: "Analytics",
    icon: <TrendingUp className="w-4 h-4" />,
  },
];

function getInitialDateRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  };
}

export default function SalesPageClient() {
  const { filters, setFilter } = useSalesFilters();
  const [dateRange, setDateRange] = useState(getInitialDateRange);

  // Sync dateRange state with search parameters when they change
  useEffect(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const to = filters.dateTo ? new Date(filters.dateTo) : undefined;
    
    if (from && to) {
      setDateRange({ from, to });
    }
  }, [filters.dateFrom, filters.dateTo]);

  const activeTab = (filters.tab as SalesTab) || "invoices";

  return (
    <main className="flex-1 min-h-screen bg-[#0A0A0B] overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Header */}
        <SalesHeader dateRange={dateRange} />

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-[#1F1F24]">
          <nav className="flex gap-1" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id || (tab.id === "bulk" && filters.tab === "bulk_print");
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter("tab", tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                    transition-colors duration-200 cursor-pointer
                    ${
                      isActive
                        ? "text-[#C9943A]"
                        : "text-[#6B6560] hover:text-[#F0EBE0]"
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {/* Active gold underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9943A] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "invoices" && (
            <InvoicesTab
              dateRange={dateRange}
              onDateRangeChange={(range) => {
                setDateRange(range);
                // Also update filters URL
                setFilter("dateFrom", range.from.toISOString().split("T")[0]);
                setFilter("dateTo", range.to.toISOString().split("T")[0]);
              }}
            />
          )}
          {activeTab === "reports" && (
            <ReportsTab
              onDateRangeChange={(range) => {
                setDateRange(range);
                setFilter("dateFrom", range.from.toISOString().split("T")[0]);
                setFilter("dateTo", range.to.toISOString().split("T")[0]);
              }}
            />
          )}
          {(activeTab === "bulk" || filters.tab === "bulk_print") && (
            <BulkOperationsTab />
          )}
          {activeTab === "backup" && (
            <BackupTab />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab />
          )}
        </div>
      </div>
    </main>
  );
}
