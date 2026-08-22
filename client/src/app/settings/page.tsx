"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SettingsSidebar, settingsCategories } from "./SettingsSidebar";

// Placeholder imports for panels
import BusinessSettingsPanel from "./panels/BusinessSettingsPanel";
import FinancialSettingsPanel from "./panels/FinancialSettingsPanel";
import GoldRateSettingsPanel from "./panels/GoldRateSettingsPanel";
import UserAndRolesSettingsPanel from "./panels/UserAndRolesSettingsPanel";
import ProductSettingsPanel from "./panels/ProductSettingsPanel";
import SavingSchemeSettingsPanel from "./panels/SavingSchemeSettingsPanel";
import CustomerSettingsPanel from "./panels/CustomerSettingsPanel";
import InventorySettingsPanel from "./panels/InventorySettingsPanel";
import OrderBookSettingsPanel from "./panels/OrderBookSettingsPanel";
import PrintingSettingsPanel from "./panels/PrintingSettingsPanel";

import IntegrationSettingsPanel from "./panels/IntegrationSettingsPanel";
import AppearanceSettingsPanel from "./panels/AppearanceSettingsPanel";
import RFIDSettingsClient from "@/components/RFID/RFIDSettingsClient";

export default function SettingsPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(settingsCategories[0].id);

  // Render the selected content
  const renderPanel = () => {
    switch (activeCategoryId) {
      case "business":
        return <BusinessSettingsPanel />;
      case "users":
        return <UserAndRolesSettingsPanel />;
      case "products":
        return <ProductSettingsPanel />;
      case "financial":
        return <FinancialSettingsPanel />;
      case "rfid":
        return <RFIDSettingsClient />;
      case "schemes":
        return <SavingSchemeSettingsPanel />;
      case "gold-rate":
        return <GoldRateSettingsPanel />;
      case "customers":
        return <CustomerSettingsPanel />;
      case "inventory":
        return <InventorySettingsPanel />;
      case "order-book":
        return <OrderBookSettingsPanel />;
      case "printing":
        return <PrintingSettingsPanel />;
      case "integrations":
        return <IntegrationSettingsPanel />;
      case "appearance":
        return <AppearanceSettingsPanel />;
      default:
        // Generic Placeholder
        const category = settingsCategories.find(c => c.id === activeCategoryId);
        return (
          <div className="bg-onyx-surface rounded-xl gold-border p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
              {category && <category.icon className="w-8 h-8 text-gold" />}
            </div>
            <h2 className="text-[20px] font-heading font-semibold text-platinum mb-2">
              {category?.title}
            </h2>
            <p className="text-[13px] text-platinum-muted max-w-sm mx-auto">
              This settings panel is currently a structural placeholder. Configuration options will be added here.
            </p>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-hidden bg-onyx flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 lg:px-8 py-6 border-b border-onyx-border bg-onyx-elevated/50">
          <h1 className="text-[36px] font-normal text-platinum">System Settings</h1>
          <p className="text-[12px] text-platinum-muted mt-0.5">Manage your preferences, rules, and application configurations.</p>
        </div>

        {/* 2-Column Settings Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
          {/* Settings Nav */}
          <div className="w-full md:w-64 flex-shrink-0 border-r border-onyx-border bg-onyx-elevated overflow-y-auto hidden md:block">
            <SettingsSidebar activeCategoryId={activeCategoryId} onSelect={setActiveCategoryId} />
          </div>

          {/* Main Settings Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col">
            {renderPanel()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

