"use client";

import React from "react";
import { ShieldCheck, Lock, Smartphone, Globe, CheckCircle2, Key, ShieldAlert } from "lucide-react";

interface SecurityIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function SecurityIntegrationTab({ config, updateConfig, isAdmin }: SecurityIntegrationTabProps) {
  const secConfig = config?.securityIntegration || {
    googleAuth: { enabled: true, enforceForAdmin: true, enforceForCashier: false },
    msAuth: { enabled: true },
    otpProvider: { provider: "msg91", dltApprovedRoute: "DLT_OTP" },
    recaptcha: { enabled: true, version: "v3", siteKey: "6Ld_992019...", secretKey: "••••••••" },
    ipWhitelist: { enabled: true, ips: ["192.168.1.1/24", "103.20.11.45", "49.207.210.12"] }
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("securityIntegration", section, {
      ...(secConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            2FA Security & Access Control Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Configure Google/Microsoft TOTP Authenticator 2FA, Google reCAPTCHA v3 bot protection, and store IP Whitelisting.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> 2FA Enforced
        </span>
      </div>

      {/* Grid of Security Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google & Microsoft Authenticator */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Smartphone className="w-4 h-4 text-gold" /> TOTP 2FA Authenticator Apps
          </h4>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 rounded bg-[#0A0A0B] border border-[#1F1F24]">
              <span className="text-[12px] text-platinum">Google Authenticator (TOTP)</span>
              <input
                type="checkbox"
                checked={!!secConfig.googleAuth?.enabled}
                onChange={(e) => updateSubProp("googleAuth", "enabled", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-[#0A0A0B] border border-[#1F1F24]">
              <span className="text-[12px] text-platinum">Microsoft Authenticator</span>
              <input
                type="checkbox"
                checked={!!secConfig.msAuth?.enabled}
                onChange={(e) => updateSubProp("msAuth", "enabled", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-platinum-muted pt-1">
              <span>Mandatory 2FA for Admin Accounts</span>
              <input
                type="checkbox"
                checked={!!secConfig.googleAuth?.enforceForAdmin}
                onChange={(e) => updateSubProp("googleAuth", "enforceForAdmin", e.target.checked)}
                className="accent-gold"
              />
            </div>
          </div>
        </div>

        {/* reCAPTCHA v3 */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" /> Google reCAPTCHA v3 Bot Protection
            </h4>
            <input
              type="checkbox"
              checked={!!secConfig.recaptcha?.enabled}
              onChange={(e) => updateSubProp("recaptcha", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">reCAPTCHA v3 Site Key</label>
              <input
                type="text"
                value={secConfig.recaptcha?.siteKey || ""}
                onChange={(e) => updateSubProp("recaptcha", "siteKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">reCAPTCHA Secret Key</label>
              <input
                type="password"
                value={secConfig.recaptcha?.secretKey || ""}
                onChange={(e) => updateSubProp("recaptcha", "secretKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-gold" /> Authorized IP Address Whitelist (CIDR Subnets)
            </h4>
            <input
              type="checkbox"
              checked={!!secConfig.ipWhitelist?.enabled}
              onChange={(e) => updateSubProp("ipWhitelist", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div>
            <label className="text-[11px] text-platinum-muted block mb-1">Allowed Store Static IPs (Comma-separated)</label>
            <input
              type="text"
              value={secConfig.ipWhitelist?.ips?.join(", ") || ""}
              onChange={(e) => updateSubProp("ipWhitelist", "ips", e.target.value.split(",").map((s: string) => s.trim()))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-gold font-mono focus:border-gold outline-none"
              placeholder="e.g. 192.168.1.1/24, 103.20.11.45"
            />
            <p className="text-[11px] text-platinum-muted mt-1">Only requests coming from these registered IP subnets will be allowed access to POS billing screens.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
