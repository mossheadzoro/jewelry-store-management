// client/src/app/settings/panels/NotificationSettingsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Check,
  Building2,
  Layers,
  Sparkles,
  ExternalLink,
  Sliders,
  FileText,
  Clock,
  SendHorizontal,
  ChevronRight,
  Filter,
  Search,
  CheckCheck,
  X,
  Radio,
  Settings2,
  HelpCircle,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { toast } from "sonner";

export default function NotificationSettingsPanel() {
  const queryClient = useQueryClient();
  const { selectedBranch, branches, branchSettings } = useBranchStore();
  const { user } = useUserStore();

  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  // Channel Tabs: "email" | "sms" | "whatsapp" | "inapp"
  const [activeChannel, setActiveChannel] = useState<"email" | "sms" | "whatsapp" | "inapp">("email");

  // Email Sub-Tabs: "rules" | "branding" | "routing" | "logs"
  const [emailSubTab, setEmailSubTab] = useState<"rules" | "branding" | "routing" | "logs">("rules");

  // State for Branch Inheritance
  const [isInherited, setIsInherited] = useState(true);

  // Email Notification Rules (Dispatch Preferences)
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    // Sales & Invoicing
    sendInvoicePdf: true,
    sendPaymentReceipt: true,
    sendOrderConfirmation: true,
    sendBookingConfirmation: true,
    sendDeliveryNotification: true,
    // Returns, Exchanges & Notes
    sendReturnConfirmation: true,
    sendExchangeConfirmation: true,
    sendCreditNote: true,
    sendDebitNote: false,
    // Accounts & Scheme Alerts
    sendPaymentReminder: true,
    sendMonthlyStatement: false,
    sendOutstandingBalance: false,
    // Security & Auth
    sendPasswordReset: true,
    sendLoginAlert: false,
    sendTwoFactorOtp: true,
    sendSecurityAlert: true,
    // System & Disaster Recovery
    sendBackupSuccess: true,
    sendBackupFailed: true,
    sendIntegrationFailure: true,
  });

  // Branding & Sender Profile
  const [senderName, setSenderName] = useState("Jewellery ERP");
  const [senderEmail, setSenderEmail] = useState("dasankandura@gmail.com");
  const [replyTo, setReplyTo] = useState("dasankandura@gmail.com");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("https://yourdomain.com/logo.png");
  const [emailSignature, setEmailSignature] = useState("Thank you for choosing Royal Jewels. All jewellery is 100% BIS Hallmarked.");
  const [businessAddress, setBusinessAddress] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [website, setWebsite] = useState("");
  const [gstin, setGstin] = useState("27AAACR1234F1Z5");

  // Admin Notification Routing
  const [adminAlertEmails, setAdminAlertEmails] = useState("");
  const [highValueSalesBcc, setHighValueSalesBcc] = useState("");
  const [highValueThreshold, setHighValueThreshold] = useState("100000");

  // Quick Test Dispatch Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState("INVOICE_PDF");
  const [testRecipient, setTestRecipient] = useState(user?.email || "admin@jewelleryerp.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Logs Search & Pagination
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStatusFilter, setLogsStatusFilter] = useState("ALL");
  const [logsPage, setLogsPage] = useState(1);

  // Save All Confirmation Modal
  const [saveAllModalOpen, setSaveAllModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // 1. Fetch Email Settings from API
  const { data: emailSettingsData, isLoading: loadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["emailSettings", selectedBranch?.id],
    queryFn: async () => {
      const branchParam = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
      const res = await axios.get(`/api/settings/email${branchParam}`);
      return res.data?.data;
    },
  });

  // 2. Fetch Dispatch Logs
  const { data: logsData, isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["emailLogs", selectedBranch?.id, logsSearch, logsStatusFilter, logsPage],
    queryFn: async () => {
      const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
      const res = await axios.get(
        `/api/settings/email/logs?page=${logsPage}&limit=10&status=${logsStatusFilter}&search=${encodeURIComponent(logsSearch)}${branchParam}`
      );
      return res.data?.data;
    },
    enabled: emailSubTab === "logs",
  });

  // Populate state when data loads or branch/shop name changes
  useEffect(() => {
    const effectiveShopName =
      branchSettings?.shopName ||
      selectedBranch?.name ||
      emailSettingsData?.senderName ||
      "Jewellery ERP";

    if (emailSettingsData) {
      setIsInherited(Boolean(emailSettingsData.isInherited));
      setSenderName(emailSettingsData.senderName || effectiveShopName);
      setSenderEmail(emailSettingsData.senderEmail || "dasankandura@gmail.com");
      setReplyTo(emailSettingsData.replyTo || "dasankandura@gmail.com");
      setCompanyLogoUrl(emailSettingsData.companyLogoUrl || branchSettings?.logoUrl || "");
      setEmailSignature(emailSettingsData.emailSignature || "");
      setBusinessAddress(emailSettingsData.businessAddress || branchSettings?.address || selectedBranch?.address || "");
      setPhone(emailSettingsData.phone || branchSettings?.phoneNumbers || "");
      setWebsite(emailSettingsData.website || branchSettings?.website || "");
      setGstin(emailSettingsData.gstin || branchSettings?.gstNumber || "");

      if (emailSettingsData.dispatchPreferences && typeof emailSettingsData.dispatchPreferences === "object") {
        setPreferences((prev) => ({ ...prev, ...emailSettingsData.dispatchPreferences }));
      }
    } else {
      setSenderName(effectiveShopName);
    }
  }, [emailSettingsData, selectedBranch?.name, selectedBranch?.address, branchSettings]);

  const handleTogglePreference = (key: string) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllCategory = (keys: string[], targetState: boolean) => {
    setPreferences((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = targetState;
      });
      return next;
    });
  };

  const handleSave = async (applyToAllBranches = false) => {
    if (applyToAllBranches) setSavingAll(true);
    else setSaving(true);

    try {
      const payload: any = {
        branchId: selectedBranch?.id,
        applyToAllBranches,
        isInherited: applyToAllBranches ? false : isInherited,
        senderName,
        senderEmail,
        replyTo,
        companyLogoUrl,
        emailSignature,
        businessAddress,
        phone,
        website,
        gstin,
        dispatchPreferences: preferences,
      };

      const res = await axios.put("/api/settings/email", payload);
      if (res.data?.success) {
        toast.success(
          applyToAllBranches
            ? "Notification preferences applied to all shared branches successfully!"
            : "Notification settings saved successfully!"
        );
        setSaveAllModalOpen(false);
        refetchSettings();
        queryClient.invalidateQueries({ queryKey: ["emailSettings"] });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save notification settings");
    } finally {
      setSaving(false);
      setSavingAll(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!testRecipient || !testRecipient.includes("@")) {
      setTestResult({ success: false, message: "Please enter a valid recipient email address." });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await axios.post("/api/settings/email/send-test", {
        recipient: testRecipient,
        branchId: selectedBranch?.id,
        senderName,
        senderEmail,
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          message: `Live notification email delivered successfully! Message ID: ${res.data.data?.messageId || "Sent"}`,
        });
        toast.success("Test notification dispatched successfully!");
      } else {
        setTestResult({
          success: false,
          message: res.data?.error || res.data?.data?.error || "Failed to deliver email.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || err.message || "Failed to reach server.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // CATEGORY RULES DEFINITIONS
  const RULE_GROUPS = [
    {
      id: "sales",
      title: "Sales & Invoicing Triggers",
      badge: "Customer Bills",
      color: "text-amber-400",
      bgBadge: "bg-amber-500/10 border-amber-500/20 text-amber-300",
      items: [
        { key: "sendInvoicePdf", label: "Auto Send Tax Invoice PDF", desc: "Attach finalized PDF Tax Invoice automatically upon checkout" },
        { key: "sendPaymentReceipt", label: "Payment Receipt Email", desc: "Confirmation receipt for full and partial payments" },
        { key: "sendOrderConfirmation", label: "Custom Order Confirmation", desc: "Dispatch booking slip & estimated delivery schedule" },
        { key: "sendBookingConfirmation", label: "Gold Rate Lock & Booking Receipt", desc: "Advance gold rate lock confirmation voucher" },
        { key: "sendDeliveryNotification", label: "Order Ready for Delivery / Pickup", desc: "Alert customer when custom jewelry is ready in showroom" },
      ],
    },
    {
      id: "returns",
      title: "Returns, Exchanges & Credit Notes",
      badge: "Vouchers",
      color: "text-indigo-400",
      bgBadge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      items: [
        { key: "sendReturnConfirmation", label: "Return Confirmation Voucher", desc: "Item return voucher & refund breakdown receipt" },
        { key: "sendExchangeConfirmation", label: "Old Gold Exchange Valuation Notice", desc: "Melt/tonch valuation report & net trade-in value" },
        { key: "sendCreditNote", label: "Credit Note PDF Notice", desc: "Store credit balance voucher for future purchases" },
        { key: "sendDebitNote", label: "Debit Note PDF Notice", desc: "Karigar / wholesaler metal ledger debit voucher" },
      ],
    },
    {
      id: "accounts",
      title: "Saving Schemes & Accounts",
      badge: "Ledger",
      color: "text-cyan-400",
      bgBadge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
      items: [
        { key: "sendPaymentReminder", label: "Scheme Monthly Installment Alert", desc: "Monthly reminder for gold saving scheme installment" },
        { key: "sendMonthlyStatement", label: "Monthly Customer Account Statement", desc: "Comprehensive statement of loyalty points and purchase history" },
        { key: "sendOutstandingBalance", label: "Outstanding Balance & Due Date Alert", desc: "Payment reminder for credit sales approaching due date" },
      ],
    },
    {
      id: "security",
      title: "Security, Auth & Disaster Recovery",
      badge: "System Critical",
      color: "text-rose-400",
      bgBadge: "bg-rose-500/10 border-rose-500/20 text-rose-300",
      items: [
        { key: "sendTwoFactorOtp", label: "2FA / Security Verification OTP", desc: "Two-factor authorization codes for staff logins" },
        { key: "sendPasswordReset", label: "Password Reset Email", desc: "Secure password reset links for staff accounts" },
        { key: "sendSecurityAlert", label: "Critical Security & New Device Alert", desc: "Instant alert on login from unknown IP or unusual time" },
        { key: "sendBackupSuccess", label: "Database Backup Completed", desc: "Snapshot notification for automated cloud backup vault" },
        { key: "sendBackupFailed", label: "Database Backup Failed (Urgent)", desc: "High-priority notification if backup fails to upload to storage" },
        { key: "sendIntegrationFailure", label: "Third-Party Integration Failure", desc: "Alert when payment gateway, GST, or RFID sync encounters errors" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center shadow-lg shadow-gold/5">
            <Bell className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-[18px] font-semibold text-platinum">Notification Management & Rules</h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                Live Dispatch Engine
              </span>
            </div>
            <p className="text-[12px] text-platinum-muted mt-0.5">
              Control auto-dispatch triggers, customer notification rules, branding identities, and delivery audit logs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTestModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[12px] font-medium text-platinum hover:bg-[#25252B] transition-all flex items-center gap-2"
          >
            <SendHorizontal className="w-4 h-4 text-indigo-400" />
            Send Test Notification
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || savingAll}
              className="px-5 py-2 rounded-xl bg-gold text-black font-semibold text-[12px] hover:bg-gold-light disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-gold/10"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-black" />
                  Save Preferences
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Branch Inheritance Indicator */}
      {selectedBranch && (
        <div className="p-4 rounded-xl bg-[#111113] border border-[#1F1F24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gold flex-shrink-0" />
            <div>
              <span className="text-[13px] font-medium text-platinum">
                Notification Scope: <strong className="text-gold">{selectedBranch.name}</strong>
              </span>
              <p className="text-[11px] text-platinum-muted">
                {isInherited
                  ? "This branch inherits the organization-wide notification dispatch rules."
                  : "This branch uses explicit custom notification overrides."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsInherited(!isInherited)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              isInherited
                ? "bg-[#1A1A1E] text-platinum-muted hover:text-platinum border border-[#2F2F36]"
                : "bg-gold/10 text-gold border border-gold/30"
            }`}
          >
            {isInherited ? "Override for this Branch" : "Inherit Global Rules"}
          </button>
        </div>
      )}

      {/* CHANNEL TABS SELECTOR (Email, SMS, WhatsApp, In-App) */}
      <div className="flex border-b border-[#1F1F24] space-x-1">
        {[
          { id: "email", label: "Email Notifications", icon: Mail, active: true, count: "18 Rules" },
          { id: "sms", label: "SMS Gateway (DLT)", icon: Smartphone, active: false, count: "DLT Rules" },
          { id: "whatsapp", label: "WhatsApp Business", icon: MessageSquare, active: false, count: "Meta API" },
          { id: "inapp", label: "In-App & Push Alerts", icon: Bell, active: false, count: "Web & Sound" },
        ].map((ch) => {
          const Icon = ch.icon;
          const isCurrent = activeChannel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id as any)}
              className={`flex items-center gap-2.5 px-4 py-3 border-b-2 font-medium text-[13px] transition-all ${
                isCurrent
                  ? "border-gold text-gold bg-gold/5 rounded-t-xl"
                  : "border-transparent text-platinum-muted hover:text-platinum hover:bg-[#111113]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{ch.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isCurrent ? "bg-gold/20 text-gold font-semibold" : "bg-[#1F1F24] text-platinum-muted"
                }`}
              >
                {ch.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* CHANNEL 1: EMAIL NOTIFICATIONS */}
      {activeChannel === "email" && (
        <div className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A0A0B] p-1.5 rounded-xl border border-[#1F1F24]">
            <div className="flex gap-1.5">
              {[
                { id: "rules", label: "Auto Dispatch Rules", icon: Sliders },
                { id: "branding", label: "Sender Profile & Identity", icon: Building2 },
                { id: "routing", label: "Admin Alerts & CC Routing", icon: ShieldCheck },
                { id: "logs", label: "Live Delivery Audit Logs", icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = emailSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setEmailSubTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all flex items-center gap-2 ${
                      isCurrent
                        ? "bg-[#1A1A1E] text-gold border border-gold/30 shadow-sm"
                        : "text-platinum-muted hover:text-platinum hover:bg-[#111113]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Gateway Status Indicator with Link to Integration Settings */}
            <div className="flex items-center gap-2 pr-2 text-[11px] text-platinum-muted">
              <span>Delivery Gateway:</span>
              <a
                href="/settings?tab=integrations"
                className="text-gold hover:underline flex items-center gap-1 font-mono font-medium"
              >
                Configured in Integrations &rarr;
              </a>
            </div>
          </div>

          {/* SUBTAB 1: AUTO DISPATCH RULES */}
          {emailSubTab === "rules" && (
            <div className="space-y-6">
              {RULE_GROUPS.map((group) => {
                const groupKeys = group.items.map((i) => i.key);
                const allSelected = groupKeys.every((k) => Boolean(preferences[k]));
                const someSelected = groupKeys.some((k) => Boolean(preferences[k]));

                return (
                  <div key={group.id} className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F1F24] pb-3">
                      <div className="flex items-center gap-2.5">
                        <h4 className={`text-[14px] font-semibold ${group.color}`}>{group.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${group.bgBadge}`}>
                          {group.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAllCategory(groupKeys, true)}
                          className="text-[11px] text-platinum-muted hover:text-gold transition-colors px-2 py-1 rounded bg-[#16161A]"
                        >
                          Enable All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAllCategory(groupKeys, false)}
                          className="text-[11px] text-platinum-muted hover:text-rose-400 transition-colors px-2 py-1 rounded bg-[#16161A]"
                        >
                          Disable All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.items.map((item) => {
                        const isChecked = Boolean(preferences[item.key]);
                        return (
                          <div
                            key={item.key}
                            onClick={() => handleTogglePreference(item.key)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isChecked
                                ? "bg-[#16161A] border-gold/40 shadow-sm"
                                : "bg-[#0A0A0B] border-[#1F1F24] hover:border-[#2F2F36]"
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="text-[13px] font-medium text-platinum flex items-center gap-1.5">
                                {isChecked && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                                {item.label}
                              </p>
                              <p className="text-[11px] text-platinum-muted leading-relaxed">{item.desc}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-gold focus:ring-gold bg-[#111113] border-[#1F1F24] mt-0.5 shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUBTAB 2: SENDER PROFILE & IDENTITY */}
          {emailSubTab === "branding" && (
            <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
              <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
                <div>
                  <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gold" />
                    Sender Identity & Dynamic Email Header/Footer
                  </h4>
                  <p className="text-[11px] text-platinum-muted mt-0.5">
                    This branding is injected dynamically across all customer bills, receipts, and transactional statements.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-platinum block mb-1">Sender Brand Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Royal Heritage Fine Jewellery"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-platinum block mb-1">Sender Outbound Email</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="billing@yourjewelstore.com"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-platinum block mb-1">Customer Reply-To Address</label>
                  <input
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="support@yourjewelstore.com"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-platinum block mb-1">Company Logo URL (Optional)</label>
                  <input
                    type="text"
                    value={companyLogoUrl}
                    onChange={(e) => setCompanyLogoUrl(e.target.value)}
                    placeholder="https://yourstore.com/logo.png"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-platinum block mb-1">Support Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-platinum block mb-1">Business GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="27AAACR1234F1Z5"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[12px] font-medium text-platinum block mb-1">Showroom Address</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Showroom #42, Zaveri Bazaar, Kalbadevi, Mumbai 400002"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum focus:border-gold outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[12px] font-medium text-platinum block mb-1">Email Signature & Hallmarking Disclaimer</label>
                  <textarea
                    rows={3}
                    value={emailSignature}
                    onChange={(e) => setEmailSignature(e.target.value)}
                    placeholder="Thank you for your valued patronage. All gold and diamond jewelry is 100% BIS Hallmarked and certified."
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl p-3.5 text-[12px] text-platinum focus:border-gold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: ADMIN ALERTS & ROUTING */}
          {emailSubTab === "routing" && (
            <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
              <div className="border-b border-[#1F1F24] pb-4">
                <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  Management CC / BCC Routing & Escalation Triggers
                </h4>
                <p className="text-[11px] text-platinum-muted mt-0.5">
                  Automatically forward copies of high-value invoices, daily audit reconciliations, and critical alerts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] space-y-3">
                  <label className="text-[12px] font-medium text-platinum block">
                    High-Value Transaction BCC Forwarding
                  </label>
                  <p className="text-[11px] text-platinum-muted">
                    BCC owners on any sale invoice where Grand Total exceeds this amount:
                  </p>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 rounded-xl bg-[#16161A] border border-[#2F2F36] text-[12px] text-platinum font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={highValueThreshold}
                      onChange={(e) => setHighValueThreshold(e.target.value)}
                      placeholder="100000"
                      className="flex-1 bg-[#111113] border border-[#1F1F24] rounded-xl px-3 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={highValueSalesBcc}
                    onChange={(e) => setHighValueSalesBcc(e.target.value)}
                    placeholder="owner@yourjewelstore.com, accounts@yourjewelstore.com"
                    className="w-full bg-[#111113] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] space-y-3">
                  <label className="text-[12px] font-medium text-platinum block">
                    System Failure & Security Escalation Email
                  </label>
                  <p className="text-[11px] text-platinum-muted">
                    Send urgent alerts for failed backups, unauthorized login attempts, or hardware exceptions:
                  </p>
                  <input
                    type="text"
                    value={adminAlertEmails}
                    onChange={(e) => setAdminAlertEmails(e.target.value)}
                    placeholder="it-admin@yourjewelstore.com, manager@yourjewelstore.com"
                    className="w-full bg-[#111113] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none mt-2"
                  />
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Real-time webhook and SMTP instant escalation enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: LIVE DISPATCH AUDIT LOGS */}
          {emailSubTab === "logs" && (
            <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
                <div>
                  <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    Live Email Dispatch History & Logs
                  </h4>
                  <p className="text-[11px] text-platinum-muted mt-0.5">
                    Chronological audit record of every customer invoice, receipt, OTP, and alert dispatched.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-platinum-muted" />
                    <input
                      type="text"
                      placeholder="Search recipient or subject..."
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                      className="bg-[#0A0A0B] border border-[#1F1F24] rounded-xl pl-8 pr-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none w-48 sm:w-64"
                    />
                  </div>

                  <select
                    value={logsStatusFilter}
                    onChange={(e) => setLogsStatusFilter(e.target.value)}
                    className="bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SENT">Delivered / Sent</option>
                    <option value="QUEUED">Queued</option>
                    <option value="FAILED">Failed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => refetchLogs()}
                    className="p-2 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-platinum-muted hover:text-platinum"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              {loadingLogs ? (
                <div className="p-8 text-center text-platinum-muted animate-pulse text-[13px]">
                  Loading dispatch history...
                </div>
              ) : logsData?.logs && logsData.logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b border-[#1F1F24] text-platinum-muted font-medium bg-[#0A0A0B]">
                      <tr>
                        <th className="p-3">Status</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Subject / Template</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Dispatched At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F24]">
                      {logsData.logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-[#16161A] transition-colors">
                          <td className="p-3">
                            {log.status === "SENT" || log.status === "DELIVERED" ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Delivered
                              </span>
                            ) : log.status === "QUEUED" || log.status === "SENDING" ? (
                              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-medium flex items-center gap-1 w-fit">
                                <RefreshCw className="w-3 h-3 animate-spin" /> In-Flight
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium flex items-center gap-1 w-fit" title={log.errorMessage || "Failed"}>
                                <AlertCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-platinum">{log.recipient}</td>
                          <td className="p-3 text-platinum">
                            <div>{log.subject}</div>
                            {log.templateId && (
                              <span className="text-[10px] text-platinum-muted font-mono">{log.templateId}</span>
                            )}
                          </td>
                          <td className="p-3 text-platinum-muted font-mono">{log.provider || "ERP_MANAGED"}</td>
                          <td className="p-3 text-platinum-muted">
                            {new Date(log.createdAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-platinum-muted space-y-2">
                  <Inbox className="w-8 h-8 text-platinum-muted mx-auto opacity-40" />
                  <p className="text-[13px]">No notification dispatch logs recorded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CHANNEL 2: SMS (DLT) */}
      {activeChannel === "sms" && (
        <div className="bg-[#111113] p-8 rounded-2xl border border-[#1F1F24] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Smartphone className="w-7 h-7" />
          </div>
          <h4 className="text-[16px] font-semibold text-platinum">SMS & DLT Gateway Notifications</h4>
          <p className="text-[12px] text-platinum-muted max-w-md mx-auto">
            Configure DLT entity templates, OTP authentication routes, and promotional SMS broadcasts through MSG91, Twilio, or Fast2SMS.
          </p>
          <div className="pt-2">
            <a
              href="/settings?tab=integrations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[12px] text-gold hover:bg-[#25252B] transition-all font-medium"
            >
              Configure SMS Gateway in Integrations &rarr;
            </a>
          </div>
        </div>
      )}

      {/* CHANNEL 3: WHATSAPP */}
      {activeChannel === "whatsapp" && (
        <div className="bg-[#111113] p-8 rounded-2xl border border-[#1F1F24] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h4 className="text-[16px] font-semibold text-platinum">WhatsApp Business API Notifications</h4>
          <p className="text-[12px] text-platinum-muted max-w-md mx-auto">
            Dispatch green-badge verified WhatsApp messages with attached PDF Tax Invoices, gold rate locks, and payment links.
          </p>
          <div className="pt-2">
            <a
              href="/settings?tab=integrations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[12px] text-gold hover:bg-[#25252B] transition-all font-medium"
            >
              Configure WhatsApp in Integrations &rarr;
            </a>
          </div>
        </div>
      )}

      {/* CHANNEL 4: IN-APP & SOUND ALERTS */}
      {activeChannel === "inapp" && (
        <div className="bg-[#111113] p-8 rounded-2xl border border-[#1F1F24] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Bell className="w-7 h-7" />
          </div>
          <h4 className="text-[16px] font-semibold text-platinum">In-App, Desktop & Audio Alerts</h4>
          <p className="text-[12px] text-platinum-muted max-w-md mx-auto">
            Configure sound effects, counter bell chimes for high-value sales, and desktop push alerts for store associates.
          </p>
        </div>
      )}

      {/* ACTION FOOTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1F1F24]">
        <div className="flex items-center gap-2 text-[12px] text-platinum-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>All customer notification dispatches are logged for compliance.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSaveAllModalOpen(true)}
              disabled={saving || savingAll}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#16161A] border border-[#2F2F36] text-[13px] font-medium text-platinum hover:text-gold transition-colors"
            >
              Apply to All Branches
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || savingAll}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold text-black font-semibold text-[13px] hover:bg-gold-light disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-black" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODAL 1: Send Test Notification */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111113] border border-[#1F1F24] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
                <SendHorizontal className="w-4 h-4 text-gold" /> Test Notification Dispatch
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-platinum-muted hover:text-platinum">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[12px] text-platinum-muted">
              Sends an immediate live sample notification using your active branding and configured gateway.
            </p>

            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1.5">Recipient Email Address</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum font-mono focus:border-gold outline-none"
              />
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-[12px] flex items-center gap-2 border ${
                  testResult.success
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[12px] font-medium text-platinum-muted hover:text-platinum"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={sendingTest}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold text-[12px] hover:bg-gold-light disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-black" />
                    Dispatch Sample Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Save All Branches Confirmation */}
      {saveAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111113] border border-[#1F1F24] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 border-b border-[#1F1F24] pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-platinum">Apply Rules to All Branches?</h3>
                <p className="text-[11px] text-platinum-muted">Global organization notification policy</p>
              </div>
            </div>

            <p className="text-[12px] text-platinum-muted leading-relaxed">
              This will update the notification preferences across all shared branches inheriting default rules. Branches with explicit overrides will be preserved.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSaveAllModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[12px] font-medium text-platinum-muted hover:text-platinum"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={savingAll}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold text-[12px] hover:bg-gold-light disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {savingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    Applying...
                  </>
                ) : (
                  "Apply to All Branches"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
