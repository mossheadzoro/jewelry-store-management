"use client";

import React, { useState, useEffect } from "react";
import { PackageOpen, Save, Loader2, Database, ShieldAlert, BarChart3, Fingerprint } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

import ProductMasterTab from "./inventory-settings/ProductMasterTab";
import CoreOperationsTab from "./inventory-settings/CoreOperationsTab";
import StockManagementTab from "./inventory-settings/StockManagementTab";
import FinancialRulesTab from "./inventory-settings/FinancialRulesTab";
import AnalyticsAlertsTab from "./inventory-settings/AnalyticsAlertsTab";

const tabs = [
  { id: "product-master", label: "Product Master", icon: PackageOpen },
  { id: "core-ops", label: "Core Operations", icon: Database },
  { id: "stock-mgmt", label: "Stock Mgmt", icon: Fingerprint },
  { id: "financial-rules", label: "Financial & Rules", icon: ShieldAlert },
  { id: "analytics", label: "Alerts & Analytics", icon: BarChart3 },
];

export default function InventorySettingsPanel() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.inventoryConfig) {
      setConfig((prev: any) => ({
        ...prev,
        ...globalSettings.inventoryConfig
      }));
    }
  }, [globalSettings]);

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value
      }
    }));
  };

  const updateRootConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (applyToAllBranches: boolean) => {
    if (applyToAllBranches) setSavingAll(true);
    else setSaving(true);
    
    try {
      await fetch("/api/settings/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          inventoryConfig: config,
          applyToAllBranches
        })
      });
      if (selectedBranch?.id) {
        await fetchGlobalSettings(selectedBranch.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setSavingAll(false);
    }
  };

  if (loading && !globalSettings) {
    return <div className="p-8 text-center text-platinum-muted animate-pulse">Loading inventory settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-[#C9943A]" />
            Advanced Inventory Settings
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Configure deep inventory policies, validations, stock reservations, and branch operations.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleSave(true)} 
              disabled={saving || savingAll} 
              className="bg-onyx-surface border border-onyx-border text-platinum px-4 py-2 rounded-lg text-[13px] font-medium hover:text-[#C9943A] transition-colors flex items-center gap-2"
            >
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingAll ? "Saving..." : "Save for All Branches"}
            </button>
            <button 
              onClick={() => handleSave(false)} 
              disabled={saving || savingAll} 
              className="bg-[#C9943A] text-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#E8B84B] transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save for this branch"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Tabs Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all ${
                  isActive 
                    ? "bg-[#C9943A]/10 text-[#C9943A] border border-[#C9943A]/20" 
                    : "text-platinum-muted hover:bg-[#111113] hover:text-platinum border border-transparent"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? "text-[#C9943A]" : "text-platinum-muted"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-onyx-surface border border-onyx-border rounded-xl p-6 min-h-[500px]">
          {activeTab === "product-master" && <ProductMasterTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />}
          {activeTab === "core-ops" && <CoreOperationsTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />}
          {activeTab === "stock-mgmt" && <StockManagementTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />}
          {activeTab === "financial-rules" && <FinancialRulesTab config={config} updateConfig={updateConfig} updateRootConfig={updateRootConfig} isAdmin={isAdmin} />}
          {activeTab === "analytics" && <AnalyticsAlertsTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />}
        </div>
      </div>
    </div>
  );
}
