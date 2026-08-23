"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Link, CreditCard, MessageSquare, Send, Mail, FileCheck, Landmark, 
  ShoppingBag, Store, TrendingUp, Cloud, Printer, Monitor, Key, 
  Webhook, Bell, Sparkles, Calendar, Database, ShieldCheck, Globe, 
  Save, Loader2, Search, CheckCircle2, ChevronRight
} from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

// Import modular integration tabs
import PaymentGatewayTab from "./integration-settings/PaymentGatewayTab";
import WhatsAppIntegrationTab from "./integration-settings/WhatsAppIntegrationTab";
import SmsIntegrationTab from "./integration-settings/SmsIntegrationTab";
import EmailIntegrationTab from "./integration-settings/EmailIntegrationTab";
import GstComplianceTab from "./integration-settings/GstComplianceTab";
import AccountingIntegrationTab from "./integration-settings/AccountingIntegrationTab";
import EcommerceIntegrationTab from "./integration-settings/EcommerceIntegrationTab";
import MarketplaceIntegrationTab from "./integration-settings/MarketplaceIntegrationTab";
import GoldRateIntegrationTab from "./integration-settings/GoldRateIntegrationTab";
import CloudStorageTab from "./integration-settings/CloudStorageTab";
import PrinterHardwareTab from "./integration-settings/PrinterHardwareTab";
import PosDeviceTab from "./integration-settings/PosDeviceTab";
import AiIntegrationTab from "./integration-settings/AiIntegrationTab";
import CalendarIntegrationTab from "./integration-settings/CalendarIntegrationTab";
import SecurityIntegrationTab from "./integration-settings/SecurityIntegrationTab";
import ThirdPartyServicesTab from "./integration-settings/ThirdPartyServicesTab";

// Categorized Core Integration Items
const CATEGORIZED_INTEGRATIONS = [
  {
    category: "Payment Gateway",
    items: [
      { id: "payment", num: 1, label: "Payment Gateway Integration", icon: CreditCard, desc: "Razorpay, Stripe, Cashfree, PhonePe, Paytm, BharatPe, Test/Live Mode, Webhooks" },
      { id: "gst", num: 2, label: "GST & Compliance", icon: FileCheck, desc: "GST API, E-Invoice IRN, E-Way Bill, HSN/SAC Sync, GST Validation" },
      { id: "accounting", num: 3, label: "Accounting Software", icon: Landmark, desc: "Tally Prime, Zoho Books, Busy, QuickBooks, Xero Sync" },
    ]
  },
  {
    category: "Messaging Gateway",
    items: [
      { id: "whatsapp", num: 4, label: "WhatsApp Business API", icon: MessageSquare, desc: "Meta Business API, Template Management, Auto Invoice, Reminders" },
      { id: "sms", num: 5, label: "SMS Gateway (DLT)", icon: Send, desc: "MSG91, Twilio, Fast2SMS, DLT Header, OTP Settings, Templates" },
      { id: "email", num: 6, label: "Email & SMTP Server", icon: Mail, desc: "SMTP Host/Port, Sender Email & Name, Email Templates, Auto Dispatch" },
    ]
  },
  {
    category: "Cloud & Storage",
    items: [
      { id: "cloud", num: 7, label: "Cloud Storage Vault", icon: Cloud, desc: "Cloudflare R2 Object Storage Vault, Local OS Disk Directory, Dual Persistence" },
    ]
  },
  {
    category: "AI Settings",
    items: [
      { id: "ai", num: 8, label: "AI & Machine Vision", icon: Sparkles, desc: "OpenAI GPT-4o, Google Gemini, Claude, Tag OCR, Image AI & Voice Assistant" },
      { id: "security", num: 9, label: "Security & 2FA", icon: ShieldCheck, desc: "Google/Microsoft 2FA Authenticator, DLT OTP Route, reCAPTCHA v3, IP Whitelist" },
    ]
  }
];

export default function IntegrationSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();

  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [activeIntegrationId, setActiveIntegrationId] = useState("payment");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [integrationConfig, setIntegrationConfig] = useState<any>({});

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.integrationsConfig) {
      setIntegrationConfig(globalSettings.integrationsConfig);
    }
  }, [globalSettings]);

  const updateConfig = (section: string, key: string, value: any) => {
    setIntegrationConfig((prev: any) => ({
      ...prev,
      [section]: typeof value === "object" && !Array.isArray(value) && value !== null
        ? { ...(prev[section] || {}), ...value }
        : typeof key === "string" && key.length > 0
          ? { ...(prev[section] || {}), [key]: value }
          : value
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
          integrationsConfig: integrationConfig,
          applyToAllBranches
        })
      });
      if (selectedBranch?.id) {
        await fetchGlobalSettings(selectedBranch.id);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error("Failed to save integration settings", e);
    } finally {
      setSaving(false);
      setSavingAll(false);
    }
  };

  // Render the selected 1 of 20 tabs
  const renderActiveTab = () => {
    switch (activeIntegrationId) {
      case "payment": return <PaymentGatewayTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "whatsapp": return <WhatsAppIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "sms": return <SmsIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "email": return <EmailIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "gst": return <GstComplianceTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "accounting": return <AccountingIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "ecommerce": return <EcommerceIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "marketplace": return <MarketplaceIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "goldrate": return <GoldRateIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "cloud": return <CloudStorageTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "hardware": return <PrinterHardwareTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "pos": return <PosDeviceTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "ai": return <AiIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "calendar": return <CalendarIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "security": return <SecurityIntegrationTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "thirdparty": return <ThirdPartyServicesTab config={integrationConfig} updateConfig={updateConfig} isAdmin={isAdmin} />;
      default: return null;
    }
  };

  // Filter items by search query
  const filteredCategories = CATEGORIZED_INTEGRATIONS.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  if (loading && !globalSettings) {
    return <div className="p-8 text-center text-platinum-muted animate-pulse">Loading Integration Configurations...</div>;
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-[600px]">
      {/* Toast alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-foreground px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-[13px] flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-4 h-4" /> Integration Settings Saved Successfully!
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-[#1F1F24] pb-4 mb-4 shrink-0">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <Link className="w-5 h-5 text-gold" />
            System Integrations (9 Suites)
          </h2>
          <p className="text-[13px] text-platinum-muted mt-0.5">
            Configure payment gateways, communications, GST compliance, accounting, AI, and cloud storage.
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(true)}
              disabled={saving || savingAll}
              className="bg-[#111113] border border-[#1F1F24] text-platinum px-3.5 py-2 rounded-lg text-[12px] font-medium hover:text-gold transition-colors flex items-center gap-2"
            >
              {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {savingAll ? "Saving..." : "Save for All Branches"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || savingAll}
              className="bg-gold text-foreground px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-gold-light transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="flex flex-1 overflow-hidden gap-6 flex-col lg:flex-row min-h-0">
        {/* Left Sub-category Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col bg-[#0A0A0B] rounded-xl border border-[#1F1F24] p-3 overflow-hidden">
          {/* Search Box */}
          <div className="relative mb-3 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-platinum-muted" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111113] border border-[#1F1F24] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-platinum placeholder:text-platinum-muted focus:border-gold outline-none"
            />
          </div>

          {/* Subdivided Categories List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
            {filteredCategories.map((group) => (
              <div key={group.category} className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gold/70 px-2 py-1">
                  {group.category}
                </h3>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeIntegrationId === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveIntegrationId(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left group",
                        isActive
                          ? "bg-gold/15 text-gold border border-gold/30 shadow-sm"
                          : "text-platinum-muted hover:bg-[#111113] hover:text-platinum"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={cn(
                          "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0",
                          isActive ? "bg-gold text-foreground" : "bg-[#1F1F24] text-platinum-muted group-hover:text-platinum"
                        )}>
                          {item.num}
                        </span>
                        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-gold" : "text-platinum-muted")} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-gold shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Panel Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0B] rounded-xl border border-[#1F1F24] p-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
