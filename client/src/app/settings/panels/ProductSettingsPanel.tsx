"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Layers, Gem, Barcode, Scale, Tags, Box, ArrowRightLeft, FileCheck, Image as ImageIcon, Ruler, Receipt, ShieldCheck } from "lucide-react";
import CategoriesTab from "./product-settings/CategoriesTab";
import MetalsAndPurityTab from "./product-settings/MetalsAndPurityTab";
import CodingAndBarcodeTab from "./product-settings/CodingAndBarcodeTab";
import WeightAndChargesTab from "./product-settings/WeightAndChargesTab";
import OtherSettingsTab from "./product-settings/OtherSettingsTab";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";

const tabs = [
  { id: "categories", label: "Categories", icon: Layers },
  { id: "metals", label: "Metals & Purity", icon: Gem },
  { id: "coding", label: "SKU & Barcode", icon: Barcode },
  { id: "weight", label: "Weight & Charges", icon: Scale },
  { id: "other", label: "Other Defaults", icon: ShieldCheck },
];

export default function ProductSettingsPanel() {
  const [activeTab, setActiveTab] = useState("categories");
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedBranch } = useBranchStore();
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id]);

  const fetchGlobalSettings = async (branchId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/product?branchId=${branchId}`);
      if (res.ok) {
        setGlobalSettings(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateGlobalSettings = async (field: string, data: any, applyToAllBranches: boolean = false) => {
    try {
      const res = await fetch("/api/settings/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          [field]: data,
          applyToAllBranches
        })
      });
      if (res.ok) {
        setGlobalSettings(await res.json());
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const renderTab = () => {
    if (loading) return <div className="p-8 text-center text-platinum-muted animate-pulse">Loading configurations...</div>;
    
    switch (activeTab) {
      case "categories": return <CategoriesTab branchId={selectedBranch?.id} />;
      case "metals": return <MetalsAndPurityTab config={globalSettings?.metalConfig || {}} onSave={(d, applyToAll) => updateGlobalSettings('metalConfig', d, applyToAll)} isAdmin={isAdmin} />;
      case "coding": return <CodingAndBarcodeTab config={globalSettings?.codeConfig || {}} onSave={(d) => updateGlobalSettings('codeConfig', d)} />;
      case "weight": return <WeightAndChargesTab weightConfig={globalSettings?.weightConfig || {}} pricingConfig={globalSettings?.pricingConfig || {}} onSaveWeight={(d) => updateGlobalSettings('weightConfig', d)} onSavePricing={(d) => updateGlobalSettings('pricingConfig', d)} />;
      case "other": return <OtherSettingsTab settings={globalSettings} onSaveAll={async (fullData) => {
        // save multiple configs (stone, hallmark, media, inventory, print, customFields, validations)
        const res = await fetch("/api/settings/product", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branchId: selectedBranch?.id, ...fullData })
        });
        if (res.ok) {
          setGlobalSettings(await res.json());
          return true;
        }
        return false;
      }} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex-shrink-0 border-b border-onyx-border pb-4 mb-4">
        <h2 className="text-[20px] font-heading font-semibold text-platinum">Product & Inventory Rules</h2>
        <p className="text-[13px] text-platinum-muted mt-1">
          Global defaults for categories, naming conventions, pricing formulas, barcodes, and print settings.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6 flex-col md:flex-row">
        {/* Sub-navigation sidebar */}
        <div className="w-full md:w-56 flex-shrink-0 overflow-y-auto">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left",
                  activeTab === tab.id
                    ? "bg-gold/10 text-gold shadow-sm"
                    : "text-platinum-muted hover:bg-onyx hover:text-platinum"
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-2 pb-12">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
