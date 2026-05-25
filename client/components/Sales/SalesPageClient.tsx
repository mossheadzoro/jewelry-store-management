"use client";

import React, { useState } from "react";
import SalesHeader from "./SalesHeader";
import InvoicesTab from "./InvoicesTab";
import ReportsTab from "./ReportsTab";
import BulkOperationsTab from "./BulkOperationsTab";
import {
  FileText,
  BarChart3,
  Layers,
  Database,
  TrendingUp,
} from "lucide-react";

type SalesTab = "invoices" | "reports" | "bulk_print" | "backup" | "analytics";

interface TabConfig {
  id: SalesTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: "invoices", label: "Invoices", icon: <FileText className="w-4 h-4" /> },
  { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
  {
    id: "bulk_print",
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
  const [activeTab, setActiveTab] = useState<SalesTab>("invoices");
  const [dateRange, setDateRange] = useState(getInitialDateRange);

  return (
    <main className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Header */}
        <SalesHeader dateRange={dateRange} />

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-[#222]">
          <nav className="flex gap-1" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                    transition-colors duration-200 cursor-pointer
                    ${
                      isActive
                        ? "text-[#D4A843]"
                        : "text-[#666] hover:text-[#aaa]"
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {/* Active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4A843] rounded-full" />
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
              onDateRangeChange={setDateRange}
            />
          )}
          {activeTab === "reports" && (
            <ReportsTab
              onDateRangeChange={setDateRange}
            />
          )}
          {activeTab === "bulk_print" && (
            <BulkOperationsTab />
          )}
          {activeTab === "backup" && (
            <PlaceholderTab
              title="Backup"
              description="Export and backup your sales data."
            />
          )}
          {activeTab === "analytics" && (
            <PlaceholderTab
              title="Analytics"
              description="View detailed sales analytics and trends."
            />
          )}
        </div>
      </div>
    </main>
  );
}

// Placeholder for future tabs
function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#D4A843]/10 flex items-center justify-center">
          <span className="text-[#D4A843] text-lg">🚀</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-[#666] max-w-[300px]">{description}</p>
      <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20">
        Coming Soon
      </span>
    </div>
  );
}
