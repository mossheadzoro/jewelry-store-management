"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { UserSquare2, Save, Loader2, ShieldCheck, Gift, FileText, Send, Building2 } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

import IdentitySecurityTab from "./customer-settings/IdentitySecurityTab";
import RewardsEngagementTab from "./customer-settings/RewardsEngagementTab";
import BillingPoliciesTab from "./customer-settings/BillingPoliciesTab";
import CommunicationPortalTab from "./customer-settings/CommunicationPortalTab";
import MultiBranchTab from "./customer-settings/MultiBranchTab";

const tabs = [
  { id: "identity", label: "Identity & Security", icon: ShieldCheck },
  { id: "rewards", label: "Rewards & Engagement", icon: Gift },
  { id: "billing", label: "Billing & Policies", icon: FileText },
  { id: "communication", label: "Communication", icon: Send },
  { id: "multibranch", label: "Multi-Branch", icon: Building2 },
];

const DEFAULT_CONFIG = {
  registration: {
    customerRegistrationRequired: true,
    walkInCustomerAllowed: true,
    guestBillingAllowed: false,
    autoCustomerIdGeneration: true,
    manualCustomerIdAllowed: false,
    customerCodePrefix: "CUST",
  },
  informationFields: {
    mobile: "mandatory",
    email: "optional",
    dob: "optional",
    anniversary: "optional",
    gender: "optional",
    address: "optional",
    city: "optional",
    state: "optional",
    pinCode: "optional",
    occupation: "hidden",
    referenceSource: "optional",
    customerPhoto: "hidden",
  },
  kyc: {
    panMandatoryAbove: 200000,
    aadhaarCollection: "optional",
    panVerification: true,
    gstinCollection: "optional",
    uploadKycDocs: false,
    customerSignatureCapture: false,
  },
  privacy: {
    marketingConsent: true,
    whatsappConsent: true,
    smsConsent: true,
    emailConsent: true,
    dataSharingConsent: false,
    dataRetentionPeriod: "5_years",
  },
  security: {
    otpVerification: true,
    mobileVerification: true,
    emailVerification: false,
    twoFactorAuthentication: false,
    accountLockAfterFailedAttempts: 5,
  },
  loyalty: {
    enableLoyalty: true,
    pointsPerRupeeSpent: 0.1,
    minimumRedemption: 100,
    maximumRedemption: 10000,
    pointExpiryDays: 365,
    birthdayBonusPoints: 500,
  },
  wallet: {
    enableWallet: true,
    cashWallet: true,
    goldWallet: false,
    storeCredit: true,
    walletExpiryDays: 0, // 0 means no expiry
    minimumWalletBalance: 0,
  },
  groups: [
    { id: "1", name: "Regular", defaultDiscount: 0, loyaltyMultiplier: 1, creditLimit: 0, exclusiveOffers: false },
    { id: "2", name: "VIP", defaultDiscount: 2, loyaltyMultiplier: 2, creditLimit: 50000, exclusiveOffers: true },
  ],
  referral: {
    enableReferral: true,
    referralReward: 500,
    referrerReward: 500,
    minimumPurchaseForReward: 5000,
  },
  credit: {
    allowCreditSales: false,
    defaultCreditLimit: 0,
    maximumDueDays: 30,
    interestOnOverdue: 0,
    approvalRequiredAboveLimit: true,
  },
  discount: {
    defaultCustomerDiscount: 0,
    maximumDiscount: 10,
    managerApprovalRequired: true,
    specialPricingForVIPs: true,
  },
  schemes: {
    allowEnrollment: true,
    maximumActiveSchemes: 5,
    autoDebitReminder: true,
    gracePeriodDays: 5,
    autoRenewal: false,
    earlyClosureRules: "allowed_with_penalty",
  },
  purchase: {
    minimumPurchaseAmount: 1,
    maximumPurchaseAmount: 0, // 0 means no limit
    ageVerificationRequired: false,
  },
  returns: {
    returnWindowDays: 15,
    exchangeWindowDays: 30,
    refundMethod: "store_credit",
    buybackEligibility: true,
  },
  notifications: {
    sms: true,
    whatsapp: true,
    email: true,
    push: false,
    events: {
      purchaseConfirmation: true,
      paymentReceipt: true,
      schemeDueReminder: true,
      birthdayWishes: true,
      anniversaryWishes: true,
      goldRateAlerts: false,
      offerNotifications: true,
      orderReadyForPickup: true,
    }
  },
  marketing: {
    receivePromotions: true,
    goldRateUpdates: false,
    festivalOffers: true,
    newCollectionAlerts: true,
  },
  portal: {
    customerLoginEnabled: true,
    orderHistory: true,
    downloadInvoices: true,
    viewSavingSchemes: true,
    viewWalletBalance: true,
    trackRepairs: true,
    updateProfile: true,
  },
  analytics: {
    trackLTV: true,
    trackAOV: true,
    trackVisits: true,
    trackFavoriteCategories: true,
  },
  multiBranch: {
    shareCustomerAcrossBranches: true,
    centralizedLoyaltyPoints: true,
    crossBranchPurchaseHistory: true,
  }
};

export default function CustomerSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();
  
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState("identity");
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.customerConfig) {
      // Merge with default config to ensure all nested keys exist
      setConfig({
        ...DEFAULT_CONFIG,
        ...globalSettings.customerConfig
      });
    }
  }, [globalSettings]);

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
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
          customerConfig: config,
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

  const renderTab = () => {
    switch (activeTab) {
      case "identity": 
        return <IdentitySecurityTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "rewards": 
        return <RewardsEngagementTab config={config} updateConfig={updateConfig} updateRootConfig={updateRootConfig} isAdmin={isAdmin} />;
      case "billing": 
        return <BillingPoliciesTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "communication": 
        return <CommunicationPortalTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />;
      case "multibranch": 
        return <MultiBranchTab config={config} updateConfig={updateConfig} isAdmin={isAdmin} />;
      default: return null;
    }
  };

  if (loading && !globalSettings) {
    return <div className="p-8 text-center text-platinum-muted animate-pulse">Loading configurations...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Panel Header */}
      <div className="flex justify-between items-center border-b border-[#1F1F24] pb-4 mb-4 shrink-0">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-[#C9943A]" />
            Customer Settings
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Manage registration, loyalty, billing policies, and privacy settings for customers.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleSave(true)} 
              disabled={saving || savingAll} 
              className="bg-[#111113] border border-[#1F1F24] text-platinum px-4 py-2 rounded-lg text-[13px] font-medium hover:text-[#C9943A] transition-colors flex items-center gap-2"
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

      <div className="flex flex-1 overflow-hidden gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-56 shrink-0 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left",
                    isActive 
                      ? "bg-[#C9943A]/10 text-[#C9943A]" 
                      : "text-platinum hover:bg-[#111113] hover:text-[#C9943A]"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-[#C9943A]" : "text-platinum-muted")} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0B] rounded-xl border border-[#1F1F24] p-6">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
