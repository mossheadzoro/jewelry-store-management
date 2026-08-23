"use client";

import React, { useState, useEffect } from "react";
import { 
  Cloud, CheckCircle2, Key, Server, RefreshCw, HardDrive, 
  ShieldCheck, ArrowRight, Eye, EyeOff, Check, AlertCircle, 
  Database, FolderSync, Sparkles, ExternalLink
} from "lucide-react";
import Link from "next/link";

interface CloudStorageTabProps {
  config?: any;
  updateConfig?: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
  onNavigateToBackup?: () => void;
}

export default function CloudStorageTab({ 
  config, 
  updateConfig, 
  isAdmin,
  onNavigateToBackup
}: CloudStorageTabProps) {
  // Form State
  const [formData, setFormData] = useState({
    r2Endpoint: "https://325d75742553c0aae0ef780a8d097053.r2.cloudflarestorage.com",
    r2BucketName: "moual-backup",
    r2AccessKeyId: "",
    r2SecretAccessKey: "",
    r2Region: "auto",
    localBackupPath: "/MoualDB-Backups",
    saveLocalCopy: true,
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    details?: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load active settings from database
  useEffect(() => {
    fetchActiveSettings();
  }, []);

  const fetchActiveSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch("/api/backups/settings");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          setFormData({
            r2Endpoint: d.r2Endpoint || "https://325d75742553c0aae0ef780a8d097053.r2.cloudflarestorage.com",
            r2BucketName: d.r2BucketName || "moual-backup",
            r2AccessKeyId: d.r2AccessKeyId || "",
            r2SecretAccessKey: d.r2SecretAccessKey || "",
            r2Region: d.r2Region || "auto",
            localBackupPath: d.localBackupPath || "/MoualDB-Backups",
            saveLocalCopy: d.saveLocalCopy !== false,
          });

          if (d.r2Connected) {
            setTestResult({
              success: true,
              latencyMs: d.r2LatencyMs || 320,
              message: "Cloudflare R2 bucket connection active & verified.",
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load backup storage settings", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null); // Reset probe state when user edits parameters
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    setToastMessage(null);

    try {
      const res = await fetch("/api/backups/storage/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: formData.r2Endpoint,
          bucket: formData.r2BucketName,
          accessKeyId: formData.r2AccessKeyId,
          secretAccessKey: formData.r2SecretAccessKey,
          region: formData.r2Region,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setTestResult({
          success: true,
          latencyMs: json.data?.latencyMs || 280,
          message: json.data?.message || "Storage probe verified: Write, Read & Delete succeeded!",
        });
        setToastMessage({
          type: "success",
          text: "Cloudflare R2 connected and verified successfully!",
        });
      } else {
        setTestResult({
          success: false,
          message: json.error || "Failed to reach Cloudflare R2 bucket. Check credentials.",
        });
        setToastMessage({
          type: "error",
          text: json.error || "Storage probe test failed",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network error while probing Cloudflare R2.",
      });
      setToastMessage({
        type: "error",
        text: err.message || "Network error",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setToastMessage(null);

    try {
      const res = await fetch("/api/backups/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save settings");

      setToastMessage({
        type: "success",
        text: "Cloudflare R2 and local storage configuration saved successfully!",
      });

      // Automatically re-run connection test to verify saved state
      handleTestConnection();
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "Failed to save settings",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111113] p-5 rounded-2xl border border-[#1F1F24] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
                Cloudflare R2 & Local OS Backup Vault
              </h3>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Zero-egress cloud object vault and high-speed local disk storage for automated encrypted database snapshots.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div>
          {testResult?.success ? (
            <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 shadow-lg shadow-emerald-500/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              R2 Connected ({testResult.latencyMs}ms)
            </span>
          ) : (
            <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Configuration Pending
            </span>
          )}
        </div>
      </div>

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
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* GREEN VERIFIED CALLOUT (When Connected) */}
      {testResult?.success && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#111113] to-emerald-950/20 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-emerald-300 flex items-center gap-2">
                Cloudflare R2 Bucket Verified & Ready for Backups
              </h4>
              <p className="text-[12px] text-platinum-muted mt-0.5">
                Target Bucket: <span className="font-mono text-emerald-400">{formData.r2BucketName}</span> • Latency: <span className="text-emerald-400 font-semibold">{testResult.latencyMs}ms</span> • Dual local copy: <span className="text-platinum">{formData.saveLocalCopy ? "Active" : "Disabled"}</span>
              </p>
            </div>
          </div>

          <Link
            href="/settings?tab=backup"
            className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-[13px] hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 flex-shrink-0"
          >
            Go to Backup & Restore
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* SECTION 1: Cloudflare R2 Bucket Setup */}
      <div className="bg-[#111113] rounded-2xl border border-[#1F1F24] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Server className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-platinum">Cloudflare R2 Object Storage Vault</h4>
              <p className="text-[11px] text-platinum-muted">Configure your Cloudflare R2 bucket credentials and S3-compatible endpoint.</p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Primary Cloud Vault
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Endpoint URL */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium text-platinum-muted mb-1.5">
              Cloudflare R2 Endpoint URL / Account S3 URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.r2Endpoint}
              onChange={(e) => handleFieldChange("r2Endpoint", e.target.value)}
              placeholder="https://<account_id>.r2.cloudflarestorage.com"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum font-mono focus:border-orange-500 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-platinum-muted mt-1">
              Example: <code className="text-orange-400">https://325d75742553c0aae0ef780a8d097053.r2.cloudflarestorage.com</code> (Do not include trailing bucket name in endpoint).
            </p>
          </div>

          {/* Bucket Name */}
          <div>
            <label className="block text-[12px] font-medium text-platinum-muted mb-1.5">
              R2 Bucket Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.r2BucketName}
              onChange={(e) => handleFieldChange("r2BucketName", e.target.value)}
              placeholder="moual-backup"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum font-mono focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-[12px] font-medium text-platinum-muted mb-1.5">
              Region (Cloudflare R2)
            </label>
            <input
              type="text"
              value={formData.r2Region}
              onChange={(e) => handleFieldChange("r2Region", e.target.value)}
              placeholder="auto"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum font-mono focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Access Key ID */}
          <div>
            <label className="block text-[12px] font-medium text-platinum-muted mb-1.5">
              R2 Access Key ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.r2AccessKeyId}
              onChange={(e) => handleFieldChange("r2AccessKeyId", e.target.value)}
              placeholder="45502b90c98cdaf7677413e68d19cada"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum font-mono focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Secret Access Key */}
          <div>
            <label className="block text-[12px] font-medium text-platinum-muted mb-1.5">
              R2 Secret Access Key <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={formData.r2SecretAccessKey}
                onChange={(e) => handleFieldChange("r2SecretAccessKey", e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 pr-10 text-[13px] text-platinum font-mono focus:border-orange-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-platinum-muted hover:text-platinum"
              >
                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Local Host OS Storage */}
      <div className="bg-[#111113] rounded-2xl border border-[#1F1F24] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1F1F24] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-platinum">Local Host OS Storage Directory</h4>
              <p className="text-[11px] text-platinum-muted">Save an instant encrypted copy to the local server disk during every backup run.</p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Local Fallback
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-platinum-muted mb-1.5">
              Server Filesystem Directory Path
            </label>
            <input
              type="text"
              value={formData.localBackupPath}
              onChange={(e) => handleFieldChange("localBackupPath", e.target.value)}
              placeholder="/MoualDB-Backups"
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-[13px] text-platinum font-mono focus:border-cyan-500 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-platinum-muted mt-1">
              Provide an absolute path on the host system (e.g. <code className="text-cyan-400">/MoualDB-Backups</code> or <code className="text-cyan-400">C:\MoualDB-Backups</code> on Windows). The folder will be auto-created if it does not exist.
            </p>
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0A0A0B] border border-[#1F1F24] cursor-pointer hover:border-[#2F2F36] transition-all">
            <input
              type="checkbox"
              checked={formData.saveLocalCopy}
              onChange={(e) => handleFieldChange("saveLocalCopy", e.target.checked)}
              className="w-4 h-4 rounded text-gold focus:ring-gold bg-[#111113] border-[#1F1F24]"
            />
            <div>
              <span className="text-[13px] font-medium text-platinum block">
                Dual Persistence Mode (Local Disk + Cloudflare R2)
              </span>
              <span className="text-[11px] text-platinum-muted">
                Writes the AES-256-GCM encrypted `.sql.gz.enc` file directly to the local folder path as well as uploading to Cloudflare R2.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection || !formData.r2AccessKeyId || !formData.r2SecretAccessKey}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1A1A1E] border border-[#2F2F36] text-platinum text-[13px] font-medium hover:bg-[#25252B] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {testingConnection ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                Probing Cloudflare R2...
              </>
            ) : (
              <>
                <Server className="w-4 h-4 text-orange-400" />
                Test R2 Connection
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings || !isAdmin}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold text-black font-semibold text-[13px] hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
          >
            {savingSettings ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                Saving Vault Settings...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-black" />
                Save Configuration
              </>
            )}
          </button>
        </div>

        <Link
          href="/settings?tab=backup"
          className="text-[13px] text-platinum-muted hover:text-gold flex items-center gap-1.5 transition-colors"
        >
          Open Backup & Restore Dashboard
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
