"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, Mail, Server, Send, Eye, EyeOff, FileText, CheckCircle2, 
  AlertCircle, RefreshCw, ShieldCheck, Check, Sparkles, 
  ExternalLink, Building2, Layers, AlertTriangle, Key, 
  Globe, Phone, FileCheck, Shield, ChevronRight, X
} from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";

interface EmailIntegrationTabProps {
  config?: any;
  updateConfig?: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function EmailIntegrationTab({ config, updateConfig, isAdmin }: EmailIntegrationTabProps) {
  const { selectedBranch, branches, branchSettings } = useBranchStore();
  const { user } = useUserStore();

  // State
  const [provider, setProvider] = useState<"ERP_MANAGED" | "CUSTOM_SMTP">("ERP_MANAGED");
  const [isInherited, setIsInherited] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Form Fields
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpEncryption, setSmtpEncryption] = useState("STARTTLS");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [isReplacingPassword, setIsReplacingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Brevo API Key
  const [providerApiKey, setProviderApiKey] = useState("");
  const [hasExistingApiKey, setHasExistingApiKey] = useState(false);
  const [isReplacingApiKey, setIsReplacingApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Sender Identity & Extended Branding
  const [senderName, setSenderName] = useState("Royal Heritage Jewels");
  const [senderEmail, setSenderEmail] = useState("dasankandura@gmail.com");
  const [replyTo, setReplyTo] = useState("dasankandura@gmail.com");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("https://yourdomain.com/logo.png");
  const [emailSignature, setEmailSignature] = useState("Thank you for choosing Royal Jewels. All jewellery is 100% BIS Hallmarked.");
  const [businessAddress, setBusinessAddress] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [website, setWebsite] = useState("");
  const [gstin, setGstin] = useState("27AAACR1234F1Z5");

  // Categorized Auto Dispatch Preferences
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    // Sales
    sendInvoicePdf: true,
    sendPaymentReceipt: true,
    sendOrderConfirmation: true,
    sendBookingConfirmation: true,
    sendDeliveryNotification: true,
    // Returns & Exchanges
    sendReturnConfirmation: true,
    sendExchangeConfirmation: true,
    sendCreditNote: true,
    sendDebitNote: false,
    // Accounts
    sendPaymentReminder: true,
    sendMonthlyStatement: false,
    sendOutstandingBalance: false,
    // Security
    sendPasswordReset: true,
    sendLoginAlert: false,
    sendTwoFactorOtp: true,
    sendSecurityAlert: true,
    // System
    sendBackupSuccess: true,
    sendBackupFailed: true,
    sendIntegrationFailure: true,
  });

  // Verification & Testing State
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    lastVerified?: string;
  } | null>(null);

  // Send Test Email Modal
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState(user?.email || "admin@jewelleryerp.com");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Save All Branches Confirmation Modal
  const [isSaveAllModalOpen, setIsSaveAllModalOpen] = useState(false);

  // Telemetry / Usage State
  const [usageData, setUsageData] = useState<{
    monthlyLimit: number;
    monthlyUsage: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    providerName: string;
  } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEmailSettings();
  }, [selectedBranch?.id]);

  const fetchEmailSettings = async () => {
    setLoading(true);
    setVerificationResult(null);
    try {
      const branchParam = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
      const res = await fetch(`/api/settings/email${branchParam}`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        if (d) {
          setProvider(d.provider === "CUSTOM_SMTP" ? "CUSTOM_SMTP" : "ERP_MANAGED");
          setIsInherited(Boolean(d.isInherited));
          setSmtpHost(d.smtpHost || "");
          setSmtpPort(d.smtpPort || 587);
          setSmtpEncryption(d.smtpEncryption || "STARTTLS");
          setSmtpUsername(d.smtpUsername || "");
          setSmtpPassword(d.smtpPassword || "");
          setHasExistingPassword(Boolean(d.hasPassword));
          setIsReplacingPassword(false);

          setProviderApiKey(d.providerApiKey || "");
          setHasExistingApiKey(Boolean(d.hasApiKey));
          setIsReplacingApiKey(false);

          const effectiveShopName = d.senderName || branchSettings?.shopName || selectedBranch?.name || "Jewellery ERP";
          setSenderName(effectiveShopName);
          setSenderEmail(d.senderEmail || "dasankandura@gmail.com");
          setReplyTo(d.replyTo || "dasankandura@gmail.com");
          setCompanyLogoUrl(d.companyLogoUrl || branchSettings?.logoUrl || "");
          setEmailSignature(d.emailSignature || "");
          setBusinessAddress(d.businessAddress || branchSettings?.address || selectedBranch?.address || "");
          setPhone(d.phone || branchSettings?.phoneNumbers || "");
          setWebsite(d.website || branchSettings?.website || "");
          setGstin(d.gstin || branchSettings?.gstNumber || "");

          if (d.dispatchPreferences && typeof d.dispatchPreferences === "object") {
            setPreferences((prev) => ({ ...prev, ...d.dispatchPreferences }));
          }

          if (d.usage) {
            setUsageData(d.usage);
          }

          if (d.verificationStatus === "VERIFIED") {
            setVerificationResult({
              success: true,
              message: d.provider === "ERP_MANAGED" ? "Brevo Managed API Gateway Verified" : "SMTP Connection Verified & Operational",
              lastVerified: d.lastVerifiedAt ? new Date(d.lastVerifiedAt).toLocaleString("en-IN") : undefined,
              latencyMs: d.latencyMs || 280,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load email settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePreference = (key: string) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applySmtpPreset = (preset: "GMAIL" | "OUTLOOK" | "ZOHO" | "BREVO_SMTP") => {
    if (preset === "GMAIL") {
      setSmtpHost("smtp.gmail.com");
      setSmtpPort(587);
      setSmtpEncryption("STARTTLS");
    } else if (preset === "OUTLOOK") {
      setSmtpHost("smtp.office365.com");
      setSmtpPort(587);
      setSmtpEncryption("STARTTLS");
    } else if (preset === "ZOHO") {
      setSmtpHost("smtp.zoho.com");
      setSmtpPort(587);
      setSmtpEncryption("STARTTLS");
    } else if (preset === "BREVO_SMTP") {
      setSmtpHost("smtp-relay.brevo.com");
      setSmtpPort(587);
      setSmtpEncryption("STARTTLS");
    }
  };

  const handleTestConnection = async () => {
    setVerifying(true);
    setVerificationResult(null);
    setToastMessage(null);

    try {
      const res = await fetch("/api/settings/email/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          provider,
          smtpHost,
          smtpPort,
          smtpEncryption,
          smtpUsername,
          smtpPassword: isReplacingPassword ? smtpPassword : hasExistingPassword ? "••••••••••••••••" : smtpPassword,
          apiKey: isReplacingApiKey ? providerApiKey : hasExistingApiKey ? "••••••••••••••••" : providerApiKey,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setVerificationResult({
          success: true,
          message: json.data?.message || "Connection probe passed successfully!",
          latencyMs: json.data?.latencyMs,
          lastVerified: new Date().toLocaleString("en-IN"),
        });
        setToastMessage({
          type: "success",
          text: "Email provider connection verified successfully!",
        });
      } else {
        const errorMsg = json.error || json.data?.message || "Connection verification failed.";
        setVerificationResult({
          success: false,
          message: errorMsg,
        });
        setToastMessage({
          type: "error",
          text: errorMsg,
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to reach server.";
      setVerificationResult({
        success: false,
        message: errorMsg,
      });
      setToastMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient || !testRecipient.includes("@")) {
      setTestEmailResult({ success: false, message: "Please enter a valid recipient email address." });
      return;
    }

    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await fetch("/api/settings/email/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: testRecipient,
          branchId: selectedBranch?.id,
          provider,
          smtpHost,
          smtpPort,
          smtpEncryption,
          smtpUsername,
          smtpPassword: isReplacingPassword ? smtpPassword : hasExistingPassword ? "••••••••••••••••" : smtpPassword,
          apiKey: isReplacingApiKey ? providerApiKey : hasExistingApiKey ? "••••••••••••••••" : providerApiKey,
          senderName,
          senderEmail,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTestEmailResult({
          success: true,
          message: `Live test email dispatched successfully! Provider: ${json.data?.provider || provider}. Message ID: ${json.data?.messageId || "Sent"}`,
        });
      } else {
        const errorMsg = json.error || json.data?.error || json.data?.message || "Failed to send test email.";
        setTestEmailResult({
          success: false,
          message: errorMsg,
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err.message || "Network error occurred.",
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSave = async (applyToAllBranches = false) => {
    if (applyToAllBranches) {
      setSavingAll(true);
    } else {
      setSaving(true);
    }
    setToastMessage(null);

    try {
      const payload: any = {
        branchId: selectedBranch?.id,
        applyToAllBranches,
        isInherited: applyToAllBranches ? false : isInherited,
        provider,
        smtpHost: provider === "CUSTOM_SMTP" ? smtpHost : null,
        smtpPort: provider === "CUSTOM_SMTP" ? smtpPort : 587,
        smtpEncryption: provider === "CUSTOM_SMTP" ? smtpEncryption : "STARTTLS",
        smtpUsername: provider === "CUSTOM_SMTP" ? smtpUsername : null,
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

      if (provider === "CUSTOM_SMTP" && isReplacingPassword && smtpPassword) {
        payload.smtpPassword = smtpPassword;
      }

      if (provider === "ERP_MANAGED" && isReplacingApiKey && providerApiKey) {
        payload.providerApiKey = providerApiKey;
      }

      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save email settings");

      setToastMessage({
        type: "success",
        text: applyToAllBranches
          ? "Email configuration applied across all shared branches (custom overrides preserved)."
          : "Email settings saved successfully.",
      });

      setIsSaveAllModalOpen(false);
      setIsReplacingPassword(false);
      setIsReplacingApiKey(false);
      fetchEmailSettings();
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "Failed to save configuration",
      });
    } finally {
      setSaving(false);
      setSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111113] p-5 rounded-2xl border border-[#1F1F24] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
                Multi-Provider Email & SMTP Infrastructure
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Tenant-aware transactional delivery for tax invoices, payment receipts, gold rate locks, and security alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div>
          {verificationResult?.success ? (
            <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 shadow-lg shadow-emerald-500/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {provider === "ERP_MANAGED" ? "ERP Managed Active" : "SMTP Verified"} ({verificationResult.latencyMs || 280}ms)
            </span>
          ) : (
            <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Verification Pending
            </span>
          )}
        </div>
      </div>

      {/* Branch Inheritance Notice (When Viewing a Specific Branch) */}
      {selectedBranch && (
        <div className="p-4 rounded-xl bg-[#111113] border border-[#1F1F24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gold flex-shrink-0" />
            <div>
              <span className="text-[13px] font-medium text-platinum">
                Configuring: <strong className="text-gold">{selectedBranch.name}</strong>
              </span>
              <p className="text-[11px] text-platinum-muted">
                {isInherited
                  ? "This branch currently inherits the global organization email settings."
                  : "This branch uses an explicit custom email override."}
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
            {isInherited ? "Override for this Branch" : "Inherit Global Config"}
          </button>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-[13px] flex items-center justify-between border ${
            toastMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Email Delivery Provider Selector */}
      <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Layers className="w-4 h-4 text-gold" />
          Email Delivery Provider
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. ERP Managed Option */}
          <div
            onClick={() => setProvider("ERP_MANAGED")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              provider === "ERP_MANAGED"
                ? "bg-[#16161A] border-gold shadow-lg shadow-gold/5"
                : "bg-[#0A0A0B] border-[#1F1F24] hover:border-gold/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border border-gold flex items-center justify-center">
                  {provider === "ERP_MANAGED" && <div className="w-2 h-2 rounded-full bg-gold" />}
                </div>
                <h5 className="text-[14px] font-semibold text-platinum">ERP Managed Email</h5>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">Zero Config</span>
            </div>
            <p className="text-[11px] text-platinum-muted mb-3">
              Platform-managed high-reliability transactional route (Brevo). No SMTP setup or technical knowledge needed.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready Out of the Box
              </span>
              <span className="text-[11px] font-mono text-platinum-muted">5,000 Free/mo</span>
            </div>
          </div>

          {/* 2. Custom SMTP Option */}
          <div
            onClick={() => setProvider("CUSTOM_SMTP")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              provider === "CUSTOM_SMTP"
                ? "bg-[#16161A] border-gold shadow-lg shadow-gold/5"
                : "bg-[#0A0A0B] border-[#1F1F24] hover:border-gold/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border border-gold flex items-center justify-center">
                  {provider === "CUSTOM_SMTP" && <div className="w-2 h-2 rounded-full bg-gold" />}
                </div>
                <h5 className="text-[14px] font-semibold text-platinum">Custom SMTP Server</h5>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
                Custom Domain
              </span>
            </div>
            <p className="text-[11px] text-platinum-muted mb-3">
              Connect your own business email server, Google Workspace, Microsoft 365, Amazon SES, or Mailgun.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
              <span className="text-[11px] text-platinum-muted">STARTTLS, SSL/TLS, Port 587/465</span>
              <span className="text-[11px] font-mono text-platinum-muted">Custom Quota</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2A: ERP Managed Panel (When Selected) */}
      {provider === "ERP_MANAGED" && (
        <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
            <div>
              <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                Brevo Managed Transactional API Gateway
              </h4>
              <p className="text-[11px] text-platinum-muted mt-0.5">
                Direct cloud delivery via Brevo REST API v3. Delivers transactional bills, receipts, OTPs, and alerts.
              </p>
            </div>
            {hasExistingApiKey ? (
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> API Key Configured
              </span>
            ) : (
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> API Key Required
              </span>
            )}
          </div>

          {/* Brevo API Key Input Field */}
          <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-platinum flex items-center gap-2">
                <Key className="w-4 h-4 text-gold" />
                Brevo API Key (xkeysib-...)
              </label>
              <a
                href="https://app.brevo.com/settings/keys/api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-gold hover:underline flex items-center gap-1"
              >
                Get Brevo API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {hasExistingApiKey && !isReplacingApiKey ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#111113] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[12px] text-platinum-muted font-mono flex items-center justify-between">
                  <span>••••••••••••••••••••••••••••••••</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active & Encrypted
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReplacingApiKey(true);
                    setProviderApiKey("");
                  }}
                  className="px-3 py-2.5 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[12px] font-medium text-platinum hover:text-gold transition-colors flex-shrink-0"
                >
                  Replace Key
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={providerApiKey}
                  onChange={(e) => setProviderApiKey(e.target.value)}
                  placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[#111113] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 pr-10 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-platinum-muted hover:text-platinum"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Brevo IP & Sender Requirements Guide */}
            <div className="p-3 rounded-lg bg-[#141418] border border-[#25252B] space-y-1.5 text-[11px] text-platinum-muted">
              <p className="text-platinum font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Brevo Gateway Requirements:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                <li>
                  <strong>Authorized IP:</strong> If Brevo returns an IP error, add your IP in Brevo &rarr;{" "}
                  <a
                    href="https://app.brevo.com/security/authorised_ips"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold underline"
                  >
                    Authorised IPs
                  </a>.
                </li>
                <li>
                  <strong>Verified Sender:</strong> Your configured <strong>Sender Email</strong> below must match a verified sender email in your Brevo account.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24]">
              <span className="text-[11px] text-platinum-muted block mb-1">Active Gateway</span>
              <div className="text-[14px] font-semibold text-platinum">Brevo REST API v3</div>
              <p className="text-[10px] text-emerald-400 mt-1">Direct Platform Dispatch</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24]">
              <span className="text-[11px] text-platinum-muted block mb-1">Monthly Usage</span>
              <div className="text-[14px] font-semibold text-platinum font-mono">
                {usageData?.monthlyUsage?.toLocaleString() || 0} / {usageData?.monthlyLimit?.toLocaleString() || 5000}
              </div>
              <div className="w-full bg-[#1F1F24] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gold h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((usageData?.monthlyUsage || 0) / (usageData?.monthlyLimit || 5000)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24]">
              <span className="text-[11px] text-platinum-muted block mb-1">Delivered (Month)</span>
              <div className="text-[14px] font-semibold text-emerald-400 font-mono">
                {usageData?.delivered?.toLocaleString() || 0}
              </div>
              <p className="text-[10px] text-platinum-muted mt-1">98.5% Inbox Placement</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24]">
              <span className="text-[11px] text-platinum-muted block mb-1">Delivery Status</span>
              <div className="text-[14px] font-semibold text-emerald-400">
                {hasExistingApiKey ? "Operational" : "Setup Required"}
              </div>
              <p className="text-[10px] text-platinum-muted mt-1">High Reliability</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2B: Custom SMTP Configuration (When Selected) */}
      {provider === "CUSTOM_SMTP" && (
        <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F1F24] pb-4">
            <div>
              <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
                <Server className="w-4 h-4 text-gold" />
                SMTP Server Configuration
              </h4>
              <p className="text-[11px] text-platinum-muted mt-0.5">
                Connect your business mailbox or dedicated SMTP provider (Gmail, Microsoft 365, Zoho, Amazon SES).
              </p>
            </div>
            <span className="text-[11px] font-medium text-platinum-muted">
              AES-256-GCM Encrypted
            </span>
          </div>

          {/* 1-Click SMTP Presets Bar */}
          <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] space-y-2.5">
            <span className="text-[11px] font-semibold text-gold uppercase tracking-wider block">
              Quick Provider Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applySmtpPreset("GMAIL")}
                className="px-3 py-1.5 rounded-lg bg-[#16161A] border border-[#2F2F36] hover:border-gold/50 text-[12px] text-platinum font-medium transition-all"
              >
                Gmail / Google Workspace
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset("OUTLOOK")}
                className="px-3 py-1.5 rounded-lg bg-[#16161A] border border-[#2F2F36] hover:border-gold/50 text-[12px] text-platinum font-medium transition-all"
              >
                Microsoft 365 / Outlook
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset("ZOHO")}
                className="px-3 py-1.5 rounded-lg bg-[#16161A] border border-[#2F2F36] hover:border-gold/50 text-[12px] text-platinum font-medium transition-all"
              >
                Zoho Mail
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset("BREVO_SMTP")}
                className="px-3 py-1.5 rounded-lg bg-[#16161A] border border-[#2F2F36] hover:border-gold/50 text-[12px] text-platinum font-medium transition-all"
              >
                Brevo SMTP Relay
              </button>
            </div>

            {/* Gmail App Password notice */}
            {smtpHost.includes("gmail") && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Gmail Requirement:</strong> Standard Gmail password won&apos;t work with SMTP. You must enable 2-Step Verification in Google Account &rarr; Security &rarr; App passwords and paste the <strong>16-character App Password</strong> below.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SMTP Host */}
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">
                SMTP Host Server <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com or smtp.office365.com"
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
              />
            </div>

            {/* SMTP Port */}
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => {
                  const p = parseInt(e.target.value, 10);
                  setSmtpPort(p);
                  if (p === 465) setSmtpEncryption("SSL");
                  else if (p === 587) setSmtpEncryption("STARTTLS");
                }}
                placeholder="587"
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
              />
            </div>

            {/* Encryption Protocol */}
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Encryption Protocol</label>
              <select
                value={smtpEncryption}
                onChange={(e) => setSmtpEncryption(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum focus:border-gold outline-none transition-colors"
              >
                <option value="STARTTLS">STARTTLS (Port 587 - Recommended)</option>
                <option value="SSL">SSL / TLS (Port 465)</option>
                <option value="NONE">None / Insecure (Port 25)</option>
              </select>
            </div>

            {/* SMTP Username */}
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">
                SMTP Username / Account <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="billing@yourjewelstore.com"
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
              />
            </div>

            {/* SMTP Password with Masked Credential Protection */}
            <div className="md:col-span-2">
              <label className="text-[12px] font-medium text-platinum block mb-1">
                SMTP Password / App Password <span className="text-rose-400">*</span>
              </label>

              {hasExistingPassword && !isReplacingPassword ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum-muted font-mono flex items-center justify-between">
                    <span>••••••••••••••••••••••••</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                      <ShieldCheck className="w-3.5 h-3.5" /> Encrypted at Rest
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplacingPassword(true);
                      setSmtpPassword("");
                    }}
                    className="px-3 py-2 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[12px] font-medium text-platinum hover:text-gold transition-colors flex-shrink-0"
                  >
                    Replace Credential
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="Enter 16-character app password or secret"
                    className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 pr-10 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-platinum-muted hover:text-platinum"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Sender Identity & Extended Branding */}
      <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
        <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <Mail className="w-4 h-4 text-gold" />
            Sender Identity & Branding
          </h4>
          <span className="text-[11px] text-platinum-muted">Applied dynamically across all outbound email templates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Sender Name (Brand)</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Royal Jewels Fine Jewellery"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum focus:border-gold outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Sender Email Address</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="no-reply@yourjewelstore.com"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Reply-To Address</label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="support@yourjewelstore.com"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Company Logo URL (Optional)</label>
            <input
              type="text"
              value={companyLogoUrl}
              onChange={(e) => setCompanyLogoUrl(e.target.value)}
              placeholder="https://yourdomain.com/logo.png"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Contact Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum focus:border-gold outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Business GSTIN</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="27AAACR1234F1Z5"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[12px] font-medium text-platinum block mb-1">Email Signature & Footer Disclaimer</label>
            <textarea
              rows={2}
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              placeholder="Thank you for choosing Royal Jewels. All jewellery is 100% BIS Hallmarked."
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl p-3 text-[12px] text-platinum focus:border-gold outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Link to Main Notification Settings */}
      <div className="bg-[#111113] p-6 rounded-2xl border border-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-gold/5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-platinum">Customer Notification Rules & Auto-Dispatch Triggers</h4>
            <p className="text-[11px] text-platinum-muted mt-0.5">
              Configure which sales, invoices, receipts, rate locks, and security alerts trigger automatic notifications in the central Notification Manager.
            </p>
          </div>
        </div>
        <a
          href="/settings?tab=notifications"
          className="px-4 py-2.5 rounded-xl bg-gold text-black font-semibold text-[12px] hover:bg-gold-light transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-gold/10"
        >
          <span>Open Notification Settings</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1F1F24]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Test Connection Button */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={verifying}
            className="px-4 py-2.5 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[13px] font-medium text-platinum hover:bg-[#25252B] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                Testing Connection...
              </>
            ) : (
              <>
                <Server className="w-4 h-4 text-gold" />
                Test Connection
              </>
            )}
          </button>

          {/* Send Test Email Button */}
          <button
            type="button"
            onClick={() => {
              setIsTestEmailModalOpen(true);
              setTestEmailResult(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-[13px] font-medium text-platinum hover:bg-[#25252B] transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-indigo-400" />
            Send Test Email
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Save for All Branches */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsSaveAllModalOpen(true)}
              disabled={saving || savingAll}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#16161A] border border-[#2F2F36] text-[13px] font-medium text-platinum hover:text-gold transition-colors"
            >
              Save for All Branches
            </button>
          )}

          {/* Save Changes */}
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

      {/* MODAL 1: Send Test Email Dialog */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111113] border border-[#1F1F24] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
                <Send className="w-4 h-4 text-gold" /> Send Verification Test Email
              </h3>
              <button
                onClick={() => setIsTestEmailModalOpen(false)}
                className="text-platinum-muted hover:text-platinum"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[12px] text-platinum-muted">
              Dispatches an end-to-end verification email to test delivery from your active <strong>{provider === "ERP_MANAGED" ? "ERP Managed Platform" : "Custom SMTP"}</strong> route.
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

            {testEmailResult && (
              <div
                className={`p-3.5 rounded-xl text-[12px] flex items-center gap-2 border ${
                  testEmailResult.success
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                }`}
              >
                {testEmailResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{testEmailResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[12px] font-medium text-platinum-muted hover:text-platinum"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold text-[12px] hover:bg-gold-light disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {sendingTestEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-black" />
                    Send Test Email Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Save for All Branches Confirmation Dialog */}
      {isSaveAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111113] border border-[#1F1F24] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 border-b border-[#1F1F24] pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-platinum">Apply Configuration to All Branches?</h3>
                <p className="text-[11px] text-platinum-muted">Global organization email update</p>
              </div>
            </div>

            <p className="text-[12px] text-platinum-muted leading-relaxed">
              This will update the default email configuration for all branches currently inheriting shared settings.
            </p>

            <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] text-[11px] text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Branches with explicit custom overrides will remain unchanged.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveAllModalOpen(false)}
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
