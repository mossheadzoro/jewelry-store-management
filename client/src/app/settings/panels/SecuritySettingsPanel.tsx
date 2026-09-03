// client/src/app/settings/panels/SecuritySettingsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Shield, ShieldAlert, Lock, Smartphone, Globe, 
  KeyRound, Users, Server, History, CheckCircle2, AlertCircle, 
  Loader2, Save, Plus, Trash2, RefreshCw, Eye, Copy, Download, 
  Printer, LogOut, Check, Search, Filter, Laptop, Monitor, AlertTriangle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";

export default function SecuritySettingsPanel() {
  const { data: authSession } = useSession();
  const queryClient = useQueryClient();
  const { selectedBranch, branches } = useBranchStore();
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "2fa" | "enrollment" | "recaptcha" | "ip_whitelist" | "sessions" | "login_protection" | "audit_log"
  >("overview");

  // Save States
  const [savingPolicy, setSavingPolicy] = useState(false);

  // ==========================================
  // POLICY STATE
  // ==========================================
  const [policyData, setPolicyData] = useState<any>({
    twoFactorEnabled: false,
    allowUserDisable2FA: true,
    require2FAAfterPasswordReset: true,
    require2FAForNewDevices: false,
    rememberTrustedDevice: true,
    trustedDeviceDurationDays: 30,
    twoFactorRoles: {
      SUPER_ADMIN: "REQUIRED",
      ADMIN: "REQUIRED",
      MANAGER: "REQUIRED",
      ACCOUNTANT: "OPTIONAL",
      SALESMAN: "OPTIONAL",
      VIEWER: "OPTIONAL",
    },
    requireEnrollmentAfterFirstLogin: false,
    enrollmentGracePeriodHours: 24,
    blockAccessUntilEnrolled: false,
    totpIssuer: "MOUAL ERP",
    totpAlgorithm: "SHA-1",
    totpDigits: 6,
    totpPeriod: 30,
    totpTolerance: 1,
    recaptchaEnabled: false,
    recaptchaActions: { login: true, passwordReset: true, recovery: true },
    recaptchaLoginThreshold: 0.5,
    recaptchaPasswordResetThreshold: 0.7,
    recaptchaRecoveryThreshold: 0.8,
    ipWhitelistEnabled: false,
    ipWhitelistMode: "MONITOR_ONLY",
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    progressiveLockout: true,
    rateLimitLogin: true,
    rateLimitPasswordReset: true,
    rateLimit2FA: true,
    notifyAdminOnSuspiciousLogin: true,
    sessionTimeoutMinutes: 480,
    idleTimeoutMinutes: 30,
    maxConcurrentSessions: 5,
  });

  // ==========================================
  // 1. FETCH POLICY
  // ==========================================
  const { data: fetchedPolicy, isLoading: loadingPolicy, refetch: refetchPolicy } = useQuery({
    queryKey: ["securityPolicy"],
    queryFn: async () => {
      const res = await axios.get("/api/security/policy");
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (fetchedPolicy) {
      setPolicyData((prev: any) => ({
        ...prev,
        ...fetchedPolicy,
        twoFactorRoles: fetchedPolicy.twoFactorRoles || prev.twoFactorRoles,
        recaptchaActions: fetchedPolicy.recaptchaActions || prev.recaptchaActions,
      }));
    }
  }, [fetchedPolicy]);

  // ==========================================
  // 2. FETCH USER 2FA STATUS
  // ==========================================
  const { data: user2FAStatus, isLoading: loadingUser2FA, refetch: refetchUser2FA } = useQuery({
    queryKey: ["user2FAStatus"],
    queryFn: async () => {
      const res = await axios.get("/api/security/2fa/status");
      return res.data?.data;
    },
  });

  // ==========================================
  // 3. FETCH IP WHITELIST RULES
  // ==========================================
  const { data: ipData, isLoading: loadingIp, refetch: refetchIp } = useQuery({
    queryKey: ["ipWhitelist", selectedBranch?.id],
    queryFn: async () => {
      const bParam = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
      const res = await axios.get(`/api/security/ip-whitelist${bParam}`);
      return res.data?.data;
    },
  });

  // ==========================================
  // 4. FETCH ACTIVE SESSIONS
  // ==========================================
  const { data: sessionsData, isLoading: loadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ["activeSessions"],
    queryFn: async () => {
      const res = await axios.get("/api/security/sessions");
      return res.data?.data;
    },
    enabled: activeTab === "sessions",
  });

  // ==========================================
  // 5. FETCH AUDIT LOGS
  // ==========================================
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [auditPage, setAuditPage] = useState(1);

  const { data: auditData, isLoading: loadingAudit, refetch: refetchAudit } = useQuery({
    queryKey: ["securityAudit", auditSearch, auditFilter, auditPage, selectedBranch?.id],
    queryFn: async () => {
      const bParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
      const res = await axios.get(
        `/api/security/audit-log?page=${auditPage}&limit=15&eventType=${auditFilter}&search=${encodeURIComponent(auditSearch)}${bParam}`
      );
      return res.data?.data;
    },
    enabled: activeTab === "audit_log",
  });

  // ==========================================
  // SAVE POLICY HANDLER
  // ==========================================
  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const { securityScore, id, createdAt, updatedAt, ...cleanPolicy } = policyData;
      const res = await axios.put("/api/security/policy", cleanPolicy);
      if (res.data?.success) {
        toast.success("Security policies updated successfully!");
        refetchPolicy();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update security policies");
    } finally {
      setSavingPolicy(false);
    }
  };

  // ==========================================
  // TOTP ENROLLMENT MODAL STATES
  // ==========================================
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollStep, setEnrollStep] = useState<1 | 2 | 3>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; otpauthUri: string; qrCodeDataUrl: string } | null>(null);
  const [enrollTokenInput, setEnrollTokenInput] = useState("");
  const [recoveryCodesResult, setRecoveryCodesResult] = useState<string[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Disable 2FA Modal States
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  // Regenerate Recovery Codes Modal
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  // Add IP Rule Modal
  const [addIpModalOpen, setAddIpModalOpen] = useState(false);
  const [newIpCidr, setNewIpCidr] = useState("");
  const [newIpDesc, setNewIpDesc] = useState("");
  const [newIpBranch, setNewIpBranch] = useState<number | "ALL">("ALL");
  const [newIpRoles, setNewIpRoles] = useState<string[]>([]);
  const [addingIp, setAddingIp] = useState(false);

  // Audit Detail Modal
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Start Enrollment Wizard
  const handleStartEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    setEnrollLoading(true);
    try {
      const res = await axios.post("/api/security/2fa/setup", { currentPassword });
      if (res.data?.success) {
        setTotpSetupData(res.data.data);
        setEnrollStep(2);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Re-authentication failed");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Verify Enrollment Code
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpSetupData?.secret || !enrollTokenInput) {
      toast.error("Please enter the 6-digit passcode from your authenticator app");
      return;
    }

    setEnrollLoading(true);
    try {
      const res = await axios.post("/api/security/2fa/verify-setup", {
        secret: totpSetupData.secret,
        token: enrollTokenInput.trim(),
      });

      if (res.data?.success) {
        setRecoveryCodesResult(res.data.data.recoveryCodes || []);
        setEnrollStep(3);
        refetchUser2FA();
        refetchPolicy();
        toast.success("Two-Factor Authentication successfully verified & activated!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid 6-digit code");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      toast.error("Password is required");
      return;
    }

    setDisableLoading(true);
    try {
      const res = await axios.post("/api/security/2fa/disable", { password: disablePassword });
      if (res.data?.success) {
        toast.success("Two-Factor Authentication disabled.");
        setDisableModalOpen(false);
        setDisablePassword("");
        refetchUser2FA();
        refetchPolicy();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to disable 2FA");
    } finally {
      setDisableLoading(false);
    }
  };

  // Regenerate Recovery Codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenPassword) {
      toast.error("Password is required");
      return;
    }

    setRegenLoading(true);
    try {
      const res = await axios.post("/api/security/2fa/recovery/regenerate", { password: regenPassword });
      if (res.data?.success) {
        setRecoveryCodesResult(res.data.data.recoveryCodes || []);
        setRegenModalOpen(false);
        setRegenPassword("");
        setEnrollStep(3);
        setEnrollModalOpen(true);
        refetchUser2FA();
        toast.success("10 new backup recovery codes generated!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to regenerate recovery codes");
    } finally {
      setRegenLoading(false);
    }
  };

  // Revoke Trusted Device
  const handleRevokeTrustedDevice = async (deviceId: string) => {
    try {
      const res = await axios.delete(`/api/security/2fa/devices/${deviceId}`);
      if (res.data?.success) {
        toast.success("Trusted device revoked successfully");
        refetchUser2FA();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke trusted device");
    }
  };

  // Add IP Rule
  const handleAddIpRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpCidr) {
      toast.error("Please enter a valid IP address or CIDR subnet");
      return;
    }

    setAddingIp(true);
    try {
      const res = await axios.post("/api/security/ip-whitelist", {
        ipCidr: newIpCidr.trim(),
        description: newIpDesc.trim() || "Store Static IP Access",
        branchId: newIpBranch === "ALL" ? null : newIpBranch,
        appliesToRoles: newIpRoles,
        status: "ACTIVE",
      });

      if (res.data?.success) {
        toast.success(`Allowed IP rule ${newIpCidr} added successfully!`);
        setAddIpModalOpen(false);
        setNewIpCidr("");
        setNewIpDesc("");
        setNewIpRoles([]);
        refetchIp();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add IP rule");
    } finally {
      setAddingIp(false);
    }
  };

  // Delete IP Rule with Lockout Prevention
  const handleDeleteIpRule = async (id: string, ipCidr: string) => {
    if (!confirm(`Are you sure you want to delete IP whitelist rule ${ipCidr}?`)) return;

    try {
      const res = await axios.delete(`/api/security/ip-whitelist?id=${id}`);
      if (res.data?.success) {
        toast.success(`IP rule ${ipCidr} removed successfully.`);
        refetchIp();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete IP rule");
    }
  };

  // Revoke Session
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Revoke this active login session? The user will be signed out.")) return;

    try {
      const res = await axios.delete(`/api/security/sessions?id=${sessionId}`);
      if (res.data?.success) {
        toast.success("Session revoked successfully.");
        const currentSessionId = (authSession?.user as any)?.sessionId;
        if (currentSessionId === sessionId || !sessionsData?.sessions || sessionsData.sessions.length <= 1) {
          signOut({ callbackUrl: "/login" });
        } else {
          refetchSessions();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke session");
    }
  };

  // Revoke All Other Sessions
  const handleRevokeAllOtherSessions = async () => {
    if (!confirm("Revoke all other active login sessions across all devices?")) return;

    try {
      const currentSessionId = (authSession?.user as any)?.sessionId;
      const res = await axios.post("/api/security/sessions", {
        action: "REVOKE_ALL_OTHER",
        currentSessionId,
      });
      if (res.data?.success) {
        toast.success("All other active sessions revoked.");
        refetchSessions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke other sessions");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            Security Access Control & 2FA Policies
          </h2>
          <p className="text-[13px] text-platinum-muted mt-0.5">
            Configure multi-tenant Two-Factor Authentication, Google reCAPTCHA v3, branch IP whitelisting, session timeouts, and live security audits.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-gold-light transition-colors flex items-center gap-2 shadow-lg shadow-gold/10"
            >
              {savingPolicy ? <Loader2 className="w-4 h-4 animate-spin text-onyx" /> : <Save className="w-4 h-4" />}
              {savingPolicy ? "Saving Policies..." : "Save Policies"}
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1F1F24] scrollbar-none text-[13px]">
        {[
          { id: "overview", label: "Security Dashboard", icon: ShieldCheck },
          { id: "2fa", label: "2FA Policy & RBAC Grid", icon: Users },
          { id: "enrollment", label: "My TOTP & Recovery Codes", icon: Smartphone },
          { id: "recaptcha", label: "reCAPTCHA Protection", icon: Globe },
          { id: "ip_whitelist", label: "Branch IP Whitelist", icon: Server },
          { id: "login_protection", label: "Login & Rate Limiting", icon: Lock },
          { id: "sessions", label: "Active Sessions & Devices", icon: Laptop },
          { id: "audit_log", label: "Security Audit Logs", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "text-platinum-muted hover:bg-[#111113] hover:text-platinum"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-platinum-muted"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: OVERVIEW & HEALTH SCORE             */}
      {/* ========================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Health Score Banner */}
          <div className="bg-gradient-to-r from-[#16161A] via-[#111113] to-[#0A0A0B] p-6 rounded-2xl border border-gold/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-[12px] font-medium border border-gold/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Multi-Tenant Security Engine
              </div>
              <h3 className="text-[22px] font-bold text-platinum font-heading">
                Store Security Posture & Access Health
              </h3>
              <p className="text-[13px] text-platinum-muted max-w-xl">
                Protection is active across 2FA enrollment, invisible reCAPTCHA v3 bot prevention, branch IP whitelisting, and rate-limiting barriers.
              </p>
            </div>

            <div className="bg-[#0A0A0B] p-4 rounded-xl border border-[#25252B] flex items-center gap-5 shrink-0">
              <div className="text-center">
                <div className="text-3xl font-black text-gold font-mono">
                  {fetchedPolicy?.securityScore || 85}%
                </div>
                <div className="text-[11px] text-platinum-muted uppercase tracking-wider mt-0.5">Security Score</div>
              </div>
              <div className="h-10 w-px bg-[#25252B]" />
              <div className="text-[12px] space-y-1">
                <div className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> High Hardening Level</div>
                <div className="text-platinum-muted text-[11px]">Audit Logging: <strong className="text-platinum">Continuous</strong></div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
              <div className="flex items-center justify-between text-platinum-muted text-[12px]">
                <span>Two-Factor Authentication</span>
                <Smartphone className="w-4 h-4 text-gold" />
              </div>
              <div className="text-[18px] font-bold text-platinum flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${policyData.twoFactorEnabled ? "bg-emerald-400" : "bg-neutral-600"}`} />
                <span>{policyData.twoFactorEnabled ? "Enforced" : "Optional"}</span>
              </div>
              <div className="text-[11px] text-platinum-muted">Mandatory for Admins & Managers</div>
            </div>

            <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
              <div className="flex items-center justify-between text-platinum-muted text-[12px]">
                <span>reCAPTCHA v3 Bot Shield</span>
                <Globe className="w-4 h-4 text-gold" />
              </div>
              <div className="text-[18px] font-bold text-platinum flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${policyData.recaptchaEnabled ? "bg-emerald-400" : "bg-neutral-600"}`} />
                <span>{policyData.recaptchaEnabled ? "Protected" : "Disabled"}</span>
              </div>
              <div className="text-[11px] text-platinum-muted">Threshold: {policyData.recaptchaLoginThreshold.toFixed(2)} score</div>
            </div>

            <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
              <div className="flex items-center justify-between text-platinum-muted text-[12px]">
                <span>IP Access Control</span>
                <Server className="w-4 h-4 text-gold" />
              </div>
              <div className="text-[18px] font-bold text-platinum flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${policyData.ipWhitelistEnabled ? "bg-emerald-400" : "bg-neutral-600"}`} />
                <span>{policyData.ipWhitelistMode.replace("_", " ")}</span>
              </div>
              <div className="text-[11px] text-platinum-muted">{ipData?.rules?.length || 0} active CIDR/IP rules</div>
            </div>

            <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] space-y-2">
              <div className="flex items-center justify-between text-platinum-muted text-[12px]">
                <span>Login Lockout Shield</span>
                <Lock className="w-4 h-4 text-gold" />
              </div>
              <div className="text-[18px] font-bold text-platinum flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>{policyData.maxLoginAttempts} Max Attempts</span>
              </div>
              <div className="text-[11px] text-platinum-muted">Lockout: {policyData.lockoutDurationMinutes} minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: 2FA POLICIES & DYNAMIC RBAC GRID   */}
      {/* ========================================== */}
      {activeTab === "2fa" && (
        <div className="space-y-6">
          {/* Global 2FA Toggles */}
          <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
            <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
              <Smartphone className="w-4 h-4 text-gold" /> Global Two-Factor Authentication Requirements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
                <div>
                  <span className="text-[13px] text-platinum font-medium block">Enable Two-Factor Authentication</span>
                  <span className="text-[11px] text-platinum-muted">Activate 2FA engine across the store for all users</span>
                </div>
                <input
                  type="checkbox"
                  checked={policyData.twoFactorEnabled}
                  onChange={(e) => setPolicyData({ ...policyData, twoFactorEnabled: e.target.checked })}
                  className="accent-gold w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
                <div>
                  <span className="text-[13px] text-platinum font-medium block">Allow Users to Disable 2FA</span>
                  <span className="text-[11px] text-platinum-muted">Allow non-mandatory roles to toggle 2FA on/off themselves</span>
                </div>
                <input
                  type="checkbox"
                  checked={policyData.allowUserDisable2FA}
                  onChange={(e) => setPolicyData({ ...policyData, allowUserDisable2FA: e.target.checked })}
                  className="accent-gold w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
                <div>
                  <span className="text-[13px] text-platinum font-medium block">Require 2FA After Password Reset</span>
                  <span className="text-[11px] text-platinum-muted">Force step-up authentication immediately following password reset</span>
                </div>
                <input
                  type="checkbox"
                  checked={policyData.require2FAAfterPasswordReset}
                  onChange={(e) => setPolicyData({ ...policyData, require2FAAfterPasswordReset: e.target.checked })}
                  className="accent-gold w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
                <div>
                  <span className="text-[13px] text-platinum font-medium block">Remember Trusted Devices</span>
                  <span className="text-[11px] text-platinum-muted">Allow users to bypass 2FA on recognized browser devices</span>
                </div>
                <input
                  type="checkbox"
                  checked={policyData.rememberTrustedDevice}
                  onChange={(e) => setPolicyData({ ...policyData, rememberTrustedDevice: e.target.checked })}
                  className="accent-gold w-4 h-4"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Role-Based 2FA Matrix */}
          <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <div>
                <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" /> Role-Based 2FA Requirement Matrix
                </h3>
                <p className="text-[12px] text-platinum-muted mt-0.5">
                  Configure mandatory vs optional 2FA enforcement by employee system role.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-y border-[#1F1F24]">
                  <tr>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Access Level</th>
                    <th className="py-3 px-4">2FA Policy Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {[
                    { role: "SUPER_ADMIN", label: "Super Admin", level: "Full Tenant & Infrastructure Control" },
                    { role: "ADMIN", label: "Administrator", level: "Store Owner & Manager Authorization" },
                    { role: "MANAGER", label: "Store Manager", level: "Branch Approval, Rates & Reports" },
                    { role: "ACCOUNTANT", label: "Accountant", level: "Financial Ledgers & Tax Reports" },
                    { role: "SALESMAN", label: "Sales Staff", level: "POS Billing & Customer Relations" },
                    { role: "VIEWER", label: "Auditor / Viewer", level: "Read-only Inspection" },
                  ].map((r) => {
                    const currentMode = policyData.twoFactorRoles?.[r.role] || "OPTIONAL";
                    return (
                      <tr key={r.role} className="hover:bg-[#16161A] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-platinum">{r.label}</td>
                        <td className="py-3.5 px-4 text-platinum-muted text-[12px]">{r.level}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={currentMode}
                            onChange={(e) => {
                              setPolicyData({
                                ...policyData,
                                twoFactorRoles: {
                                  ...policyData.twoFactorRoles,
                                  [r.role]: e.target.value,
                                },
                              });
                            }}
                            className={`bg-[#0A0A0B] border rounded-lg px-3 py-1.5 text-[12px] font-semibold outline-none transition-colors ${
                              currentMode === "REQUIRED"
                                ? "border-amber-500/50 text-amber-400"
                                : currentMode === "DISABLED"
                                ? "border-neutral-700 text-neutral-400"
                                : "border-emerald-500/50 text-emerald-400"
                            }`}
                          >
                            <option value="REQUIRED">Mandatory (Required)</option>
                            <option value="OPTIONAL">Optional (User Decides)</option>
                            <option value="DISABLED">Disabled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: USER ENROLLMENT & RECOVERY CODES   */}
      {/* ========================================== */}
      {activeTab === "enrollment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User 2FA Status Card */}
          <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-platinum">Authenticator App (TOTP)</h3>
                  <p className="text-[12px] text-platinum-muted">{user?.email}</p>
                </div>
              </div>

              <span className={`text-[12px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                user2FAStatus?.twoFactorEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}>
                {user2FAStatus?.twoFactorEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {user2FAStatus?.twoFactorEnabled ? "2FA Active" : "Not Enrolled"}
              </span>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Method</span>
                <span className="text-platinum font-medium">RFC Time-based Passcodes (TOTP)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Enrolled At</span>
                <span className="text-platinum">
                  {user2FAStatus?.totpEnabledAt ? new Date(user2FAStatus.totpEnabledAt).toLocaleString("en-IN") : "Never"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Policy Status</span>
                <span className={user2FAStatus?.isPolicyMandatory ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                  {user2FAStatus?.isPolicyMandatory ? "Mandatory for your role" : "Optional"}
                </span>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              {!user2FAStatus?.twoFactorEnabled ? (
                <button
                  onClick={() => {
                    setEnrollStep(1);
                    setCurrentPassword("");
                    setEnrollModalOpen(true);
                  }}
                  className="w-full bg-gold hover:bg-gold-light text-onyx font-semibold py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
                >
                  <Plus className="w-4 h-4" /> Setup Authenticator App
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEnrollStep(1);
                      setCurrentPassword("");
                      setEnrollModalOpen(true);
                    }}
                    className="flex-1 bg-[#0A0A0B] border border-[#25252B] hover:border-gold/40 text-platinum font-medium py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 text-gold" /> Re-Enroll Device
                  </button>

                  <button
                    onClick={() => setDisableModalOpen(true)}
                    className="flex-1 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-medium py-2.5 rounded-xl text-[13px] transition-colors"
                  >
                    Disable 2FA
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Backup Recovery Codes Card */}
          <div className="bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-5">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-platinum">Emergency Recovery Codes</h3>
                  <p className="text-[12px] text-platinum-muted">One-time emergency offline backup keys</p>
                </div>
              </div>

              <span className="text-[12px] font-mono px-3 py-1 rounded-full bg-[#0A0A0B] border border-[#25252B] text-gold font-bold">
                {user2FAStatus?.recoveryCodesRemaining || 0} / 10 Remaining
              </span>
            </div>

            <p className="text-[13px] text-platinum-muted leading-relaxed">
              If you ever lose access to your mobile phone or authenticator app, you can sign in using one of your 10 emergency recovery codes. Each code can only be used once.
            </p>

            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] text-[12px] space-y-1.5">
              <div className="flex items-center gap-2 text-platinum font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Encrypted & Hashed Storage</span>
              </div>
              <p className="text-platinum-muted text-[11px]">
                Recovery codes are stored as irreversible cryptographic hashes in the database.
              </p>
            </div>

            <button
              onClick={() => setRegenModalOpen(true)}
              className="w-full bg-[#0A0A0B] border border-[#25252B] hover:border-gold/40 text-platinum font-medium py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-gold" /> Regenerate 10 Backup Codes
            </button>
          </div>

          {/* Trusted Devices (30-Day Bypass) Card */}
          <div className="col-span-1 lg:col-span-2 bg-[#111113] p-6 rounded-2xl border border-[#1F1F24] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-platinum">Recognized Trusted Devices</h3>
                  <p className="text-[12px] text-platinum-muted">
                    Devices remembered for 30 days that can sign in without a 2FA prompt
                  </p>
                </div>
              </div>

              <span className="text-[12px] font-mono px-3 py-1 rounded-full bg-[#0A0A0B] border border-[#25252B] text-gold font-bold">
                {user2FAStatus?.trustedDevices?.length || 0} Active Device{user2FAStatus?.trustedDevices?.length === 1 ? "" : "s"}
              </span>
            </div>

            {user2FAStatus?.trustedDevices && user2FAStatus.trustedDevices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-y border-[#1F1F24]">
                    <tr>
                      <th className="py-2.5 px-3.5">Device Name</th>
                      <th className="py-2.5 px-3.5">Browser & OS</th>
                      <th className="py-2.5 px-3.5">Last Used</th>
                      <th className="py-2.5 px-3.5">Expires</th>
                      <th className="py-2.5 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F24]">
                    {user2FAStatus.trustedDevices.map((dev: any) => (
                      <tr key={dev.id} className="hover:bg-[#16161A] transition-colors">
                        <td className="py-3 px-3.5 font-medium text-platinum flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{dev.deviceName || "Trusted Browser"}</span>
                        </td>
                        <td className="py-3 px-3.5 text-platinum-muted text-[12px] max-w-[200px] truncate">
                          {dev.browser || "Web Browser"}
                        </td>
                        <td className="py-3 px-3.5 text-platinum-muted text-[12px]">
                          {dev.lastUsedAt ? new Date(dev.lastUsedAt).toLocaleDateString("en-IN") : "Never"}
                        </td>
                        <td className="py-3 px-3.5 text-emerald-400 font-mono text-[12px]">
                          {dev.expiresAt ? new Date(dev.expiresAt).toLocaleDateString("en-IN") : "30 Days"}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => handleRevokeTrustedDevice(dev.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Revoke Trust"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-platinum-muted text-[13px] bg-[#0A0A0B] rounded-xl border border-[#1F1F24]">
                No trusted devices registered yet. When signing in with 2FA, check &ldquo;Remember this trusted device for 30 days&rdquo; to register this device.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: reCAPTCHA POLICIES & THRESHOLDS    */}
      {/* ========================================== */}
      {activeTab === "recaptcha" && (
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-5">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
            <div>
              <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                <Globe className="w-4 h-4 text-gold" /> Google reCAPTCHA v3 Bot Policies & Thresholds
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Configure risk score thresholds for high-security ERP interactions. Scores range from 0.0 (likely bot) to 1.0 (legitimate human).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-semibold text-platinum">Login Action</span>
                <span className="text-gold font-mono font-bold">{policyData.recaptchaLoginThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={policyData.recaptchaLoginThreshold}
                onChange={(e) => setPolicyData({ ...policyData, recaptchaLoginThreshold: parseFloat(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-platinum-muted">Default recommendation: 0.50. Blocks high-risk bot authentication.</p>
            </div>

            <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-semibold text-platinum">Password Reset</span>
                <span className="text-gold font-mono font-bold">{policyData.recaptchaPasswordResetThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={policyData.recaptchaPasswordResetThreshold}
                onChange={(e) => setPolicyData({ ...policyData, recaptchaPasswordResetThreshold: parseFloat(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-platinum-muted">Default recommendation: 0.70. Protects against account takeover.</p>
            </div>

            <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-semibold text-platinum">Account Recovery</span>
                <span className="text-gold font-mono font-bold">{policyData.recaptchaRecoveryThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={policyData.recaptchaRecoveryThreshold}
                onChange={(e) => setPolicyData({ ...policyData, recaptchaRecoveryThreshold: parseFloat(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-platinum-muted">Default recommendation: 0.80. Strict anti-abuse verification.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: BRANCH IP WHITELIST                 */}
      {/* ========================================== */}
      {activeTab === "ip_whitelist" && (
        <div className="space-y-6">
          <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                  <Server className="w-4 h-4 text-gold" /> Branch-Aware Store IP Whitelist (IPv4, IPv6, CIDR)
                </h3>
                <p className="text-[12px] text-platinum-muted mt-0.5">
                  Restrict login and POS billing access to verified static store subnets and head office networks.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAddIpModalOpen(true)}
                  className="bg-gold text-onyx font-semibold px-3.5 py-1.5 rounded-lg text-[12px] hover:bg-gold-light transition-colors flex items-center gap-1.5 shadow-lg shadow-gold/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Add IP / CIDR Rule
                </button>
              </div>
            </div>

            {/* Mode Selector & Current IP Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-2">
                <label className="text-[12px] font-medium text-platinum-muted block">Enforcement Mode</label>
                <select
                  value={policyData.ipWhitelistMode}
                  onChange={(e) => setPolicyData({ ...policyData, ipWhitelistMode: e.target.value })}
                  className="w-full bg-[#111113] border border-[#25252B] rounded-lg px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none"
                >
                  <option value="DISABLED">Disabled (Any IP Permitted)</option>
                  <option value="MONITOR_ONLY">Monitor Only (Log unauthorized IPs without blocking)</option>
                  <option value="RESTRICT_ADMIN_MANAGER">Restrict Admins & Managers Only</option>
                  <option value="RESTRICT_ALL">Restrict All Employees</option>
                </select>
              </div>

              <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-platinum-muted uppercase tracking-wider block">Your Current IP</span>
                  <span className="text-[16px] font-mono font-bold text-gold">{ipData?.currentClientIp || "127.0.0.1"}</span>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  ipData?.evaluation?.allowed
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}>
                  {ipData?.evaluation?.allowed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {ipData?.evaluation?.allowed ? "Permitted Connection" : "Unlisted IP"}
                </span>
              </div>
            </div>

            {/* Rules Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-y border-[#1F1F24]">
                  <tr>
                    <th className="py-3 px-4">IP / CIDR Block</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Branch Scope</th>
                    <th className="py-3 px-4">Role Filter</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {ipData?.rules?.length > 0 ? (
                    ipData.rules.map((rule: any) => (
                      <tr key={rule.id} className="hover:bg-[#16161A] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-platinum">{rule.ipCidr}</td>
                        <td className="py-3.5 px-4 text-platinum-muted">{rule.description}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] bg-[#0A0A0B] border border-[#25252B] px-2 py-0.5 rounded text-platinum">
                            {rule.branchId ? `Branch #${rule.branchId}` : "All Branches"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[12px] text-platinum-muted">
                          {rule.appliesToRoles?.length > 0 ? rule.appliesToRoles.join(", ") : "All Roles"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            rule.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-neutral-800 text-neutral-400"
                          }`}>
                            {rule.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteIpRule(rule.id, rule.ipCidr)}
                            className="p-1.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-platinum-muted text-[13px]">
                        No static IP whitelist rules configured. Click "Add IP / CIDR Rule" to restrict access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: ACTIVE SESSIONS & DEVICE MANAGER   */}
      {/* ========================================== */}
      {activeTab === "sessions" && (
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                <Laptop className="w-4 h-4 text-gold" /> Active Login Sessions & Recognized Devices
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Inspect active authenticated sessions across mobile, desktop, and POS terminals. Remotely revoke suspicious sessions.
              </p>
            </div>

            <button
              onClick={handleRevokeAllOtherSessions}
              className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-medium px-3.5 py-1.5 rounded-lg text-[12px] transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Revoke All Other Sessions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-y border-[#1F1F24]">
                <tr>
                  <th className="py-3 px-4">Device & Browser</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {sessionsData?.sessions?.length > 0 ? (
                  sessionsData.sessions.map((sess: any) => (
                    <tr key={sess.id} className="hover:bg-[#16161A] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-platinum flex items-center gap-2.5">
                        <Monitor className="w-4 h-4 text-gold" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{sess.browser || "Web Browser"}</span>
                            {(sess.id === (authSession?.user as any)?.sessionId || sessionsData?.currentIp === sess.ipAddress) && (
                              <span className="text-[10px] bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded font-mono font-medium">
                                Current Session
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-platinum-muted">{sess.os || "Desktop OS"}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-platinum-muted">{sess.ipAddress}</td>
                      <td className="py-3.5 px-4 text-platinum-muted">{new Date(sess.lastActiveAt).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="text-[12px] text-rose-400 hover:underline"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-platinum-muted text-[13px]">
                      No active remote sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 7: LOGIN & RATE LIMITING               */}
      {/* ========================================== */}
      {activeTab === "login_protection" && (
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-5">
          <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
            <Lock className="w-4 h-4 text-gold" /> Login Protection & Rate Limiting Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-2">
              <label className="text-[12px] font-medium text-platinum-muted block">
                Max Failed Login Attempts Before Lockout
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={policyData.maxLoginAttempts}
                onChange={(e) => setPolicyData({ ...policyData, maxLoginAttempts: parseInt(e.target.value, 10) })}
                className="w-full bg-[#111113] border border-[#25252B] rounded-lg px-3 py-2 text-[13px] text-platinum font-mono focus:border-gold outline-none"
              />
            </div>

            <div className="p-4 bg-[#0A0A0B] rounded-xl border border-[#1F1F24] space-y-2">
              <label className="text-[12px] font-medium text-platinum-muted block">
                Lockout Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={policyData.lockoutDurationMinutes}
                onChange={(e) => setPolicyData({ ...policyData, lockoutDurationMinutes: parseInt(e.target.value, 10) })}
                className="w-full bg-[#111113] border border-[#25252B] rounded-lg px-3 py-2 text-[13px] text-platinum font-mono focus:border-gold outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
              <div>
                <span className="text-[13px] text-platinum font-medium block">Progressive Lockout</span>
                <span className="text-[11px] text-platinum-muted">Multiply lockout duration on repeated consecutive lockouts</span>
              </div>
              <input
                type="checkbox"
                checked={policyData.progressiveLockout}
                onChange={(e) => setPolicyData({ ...policyData, progressiveLockout: e.target.checked })}
                className="accent-gold w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
              <div>
                <span className="text-[13px] text-platinum font-medium block">Server-Side Rate Limiting</span>
                <span className="text-[11px] text-platinum-muted">Throttle rapid brute-force authentication requests</span>
              </div>
              <input
                type="checkbox"
                checked={policyData.rateLimitLogin}
                onChange={(e) => setPolicyData({ ...policyData, rateLimitLogin: e.target.checked })}
                className="accent-gold w-4 h-4"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 8: LIVE SECURITY AUDIT LOG             */}
      {/* ========================================== */}
      {activeTab === "audit_log" && (
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F24] pb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                <History className="w-4 h-4 text-gold" /> Security Event Audit Trail
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Append-only immutable record of all logins, 2FA verifications, lockout blocks, and policy updates.
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-platinum-muted" />
                <input
                  type="text"
                  placeholder="Search IP, email, action..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="bg-[#0A0A0B] border border-[#25252B] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-platinum placeholder:text-platinum-muted focus:border-gold outline-none w-56"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-[#0A0A0B] border border-[#25252B] rounded-lg px-2.5 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="ALL">All Events</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="LOGIN_BLOCKED">Login Blocked</option>
                <option value="2FA_ENABLED">2FA Enabled</option>
                <option value="2FA_VERIFICATION_SUCCESS">2FA Verified</option>
                <option value="IP_BLOCKED">IP Blocked</option>
                <option value="SESSION_REVOKED">Session Revoked</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#0A0A0B] text-platinum-muted text-[11px] uppercase tracking-wider border-y border-[#1F1F24]">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">User / Target</th>
                  <th className="py-3 px-4">Action Summary</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {auditData?.logs?.length > 0 ? (
                  auditData.logs.map((log: any) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedAuditLog(log)}
                      className="hover:bg-[#16161A] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          log.success
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-platinum">{log.userEmail || "System"}</td>
                      <td className="py-3 px-4 text-platinum-muted max-w-xs truncate">{log.action}</td>
                      <td className="py-3 px-4 font-mono text-[12px] text-platinum-muted">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="py-3 px-4 text-[12px] text-platinum-muted">
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-platinum-muted text-[13px]">
                      No security audit events matched your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: TOTP ENROLLMENT WIZARD            */}
      {/* ========================================== */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#25252B] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            {enrollStep === 1 && (
              <form onSubmit={handleStartEnrollment} className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3 text-gold">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-[17px] font-bold text-platinum font-heading">
                    Step-Up Authorization
                  </h3>
                  <p className="text-[12px] text-platinum-muted mt-1">
                    Please enter your current account password to begin Authenticator 2FA setup.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3 py-2.5 text-[13px] text-platinum focus:border-gold outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEnrollModalOpen(false)}
                    className="flex-1 bg-[#0A0A0B] border border-[#25252B] text-platinum font-medium py-2.5 rounded-xl text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrollLoading}
                    className="flex-1 bg-gold hover:bg-gold-light text-onyx font-semibold py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {enrollLoading ? <Loader2 className="w-4 h-4 animate-spin text-onyx" /> : "Continue to QR Code"}
                  </button>
                </div>
              </form>
            )}

            {enrollStep === 2 && totpSetupData && (
              <form onSubmit={handleVerifyEnrollment} className="space-y-4">
                <div className="text-center">
                  <h3 className="text-[17px] font-bold text-platinum font-heading">
                    Scan Authenticator QR Code
                  </h3>
                  <p className="text-[12px] text-platinum-muted mt-1">
                    Open Google Authenticator, Microsoft Authenticator, or 1Password and scan the barcode below.
                  </p>
                </div>

                {/* QR Code Graphic */}
                <div className="p-3 bg-[#0A0A0B] rounded-xl border border-[#25252B] flex items-center justify-center">
                  {totpSetupData.qrCodeDataUrl ? (
                    <img
                      src={totpSetupData.qrCodeDataUrl}
                      alt="TOTP QR Code"
                      className="w-48 h-48 rounded-lg shadow-md"
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                    Manual Setup Key (If unable to scan)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={totpSetupData.secret}
                      className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg px-3 py-1.5 text-[12px] text-gold font-mono focus:border-gold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSetupData.secret);
                        toast.success("Secret key copied to clipboard");
                      }}
                      className="bg-[#0A0A0B] border border-[#25252B] p-2 rounded-lg text-platinum-muted hover:text-platinum"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1 uppercase tracking-wider text-center">
                    Enter 6-Digit Passcode from App
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="000000"
                    value={enrollTokenInput}
                    onChange={(e) => setEnrollTokenInput(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl py-2.5 text-[20px] text-gold font-mono tracking-widest text-center focus:border-gold outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEnrollStep(1)}
                    className="flex-1 bg-[#0A0A0B] border border-[#25252B] text-platinum font-medium py-2.5 rounded-xl text-[13px]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={enrollLoading}
                    className="flex-1 bg-gold hover:bg-gold-light text-onyx font-semibold py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {enrollLoading ? <Loader2 className="w-4 h-4 animate-spin text-onyx" /> : "Verify & Activate"}
                  </button>
                </div>
              </form>
            )}

            {enrollStep === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-[17px] font-bold text-platinum font-heading">
                    2FA Activated Successfully!
                  </h3>
                  <p className="text-[12px] text-platinum-muted mt-1">
                    Save your 10 emergency backup recovery codes in a safe place.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3.5 bg-[#0A0A0B] rounded-xl border border-[#25252B] font-mono text-[12px] text-gold font-bold">
                  {recoveryCodesResult.map((code, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-[#111113] border border-[#1F1F24] text-center">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryCodesResult.join("\n"));
                      toast.success("Recovery codes copied to clipboard!");
                    }}
                    className="flex-1 bg-[#0A0A0B] border border-[#25252B] hover:border-gold/40 text-platinum font-medium py-2 rounded-xl text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-gold" /> Copy All
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([recoveryCodesResult.join("\n")], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `MOUAL_ERP_Backup_Codes_${user?.email}.txt`;
                      a.click();
                    }}
                    className="flex-1 bg-[#0A0A0B] border border-[#25252B] hover:border-gold/40 text-platinum font-medium py-2 rounded-xl text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" /> Download
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="w-full bg-gold hover:bg-gold-light text-onyx font-semibold py-2.5 rounded-xl text-[13px] transition-colors"
                >
                  I Have Saved My Recovery Codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: DISABLE 2FA                       */}
      {/* ========================================== */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#25252B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-3 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-[17px] font-bold text-platinum font-heading">
                Disable Two-Factor Authentication
              </h3>
              <p className="text-[12px] text-platinum-muted mt-1">
                Disabling 2FA reduces account security. Enter your password to confirm.
              </p>
            </div>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••••••"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3 py-2.5 text-[13px] text-platinum focus:border-gold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="flex-1 bg-[#0A0A0B] border border-[#25252B] text-platinum font-medium py-2.5 rounded-xl text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-foreground font-semibold py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5"
                >
                  {disableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Disable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: REGENERATE RECOVERY CODES         */}
      {/* ========================================== */}
      {regenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#25252B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3 text-gold">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-[17px] font-bold text-platinum font-heading">
                Regenerate Backup Codes
              </h3>
              <p className="text-[12px] text-platinum-muted mt-1">
                This will immediately invalidate all existing recovery codes. Enter your password to continue.
              </p>
            </div>

            <form onSubmit={handleRegenerateCodes} className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••••••"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3 py-2.5 text-[13px] text-platinum focus:border-gold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegenModalOpen(false)}
                  className="flex-1 bg-[#0A0A0B] border border-[#25252B] text-platinum font-medium py-2.5 rounded-xl text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regenLoading}
                  className="flex-1 bg-gold hover:bg-gold-light text-onyx font-semibold py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5"
                >
                  {regenLoading ? <Loader2 className="w-4 h-4 animate-spin text-onyx" /> : "Regenerate Codes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: ADD IP WHITELIST RULE             */}
      {/* ========================================== */}
      {addIpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#25252B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 border-b border-[#1F1F24] pb-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-platinum font-heading">Add Allowed IP / Subnet</h3>
                <p className="text-[11px] text-platinum-muted">Supports IPv4, IPv6, and CIDR blocks (e.g. /24)</p>
              </div>
            </div>

            <form onSubmit={handleAddIpRule} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                  IP Address or CIDR Block *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 103.25.10.15 or 103.25.10.0/24"
                  value={newIpCidr}
                  onChange={(e) => setNewIpCidr(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3 py-2 text-[13px] text-gold font-mono focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                  Description / Store Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Showroom POS Gateway"
                  value={newIpDesc}
                  onChange={(e) => setNewIpDesc(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                    Branch Assignment
                  </label>
                  <select
                    value={newIpBranch}
                    onChange={(e) => setNewIpBranch(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value, 10))}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg px-2.5 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                  >
                    <option value="ALL">All Branches</option>
                    {branches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                    Role Restrictions
                  </label>
                  <select
                    multiple
                    value={newIpRoles}
                    onChange={(e) => setNewIpRoles(Array.from(e.target.selectedOptions, (option) => option.value))}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-lg px-2.5 py-1 text-[11px] text-platinum focus:border-gold outline-none h-16"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SALESMAN">Salesman</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddIpModalOpen(false)}
                  className="flex-1 bg-[#0A0A0B] border border-[#25252B] text-platinum font-medium py-2 rounded-xl text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingIp}
                  className="flex-1 bg-gold hover:bg-gold-light text-onyx font-semibold py-2 rounded-xl text-[12px] transition-colors flex items-center justify-center gap-1.5"
                >
                  {addingIp ? <Loader2 className="w-4 h-4 animate-spin text-onyx" /> : "Save Allowed Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
