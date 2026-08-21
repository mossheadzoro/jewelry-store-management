"use client";

import React, { useState } from "react";
import { Key, Shield, Lock, Sliders, CheckCircle2, Copy, Eye, EyeOff, Plus } from "lucide-react";

interface ApiManagementTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function ApiManagementTab({ config, updateConfig, isAdmin }: ApiManagementTabProps) {
  const apiConfig = config?.apiManagement || {
    apiKeys: [
      { id: "key_1", label: "Mobile App Production Key", key: "pk_live_8901928019283019", created: "2026-01-15", scope: "READ_WRITE" },
      { id: "key_2", label: "Custom E-Commerce Webhook Key", key: "pk_live_1092830192830192", created: "2026-03-20", scope: "READ_ONLY" }
    ],
    secretKey: "sk_live_99201920192019201920",
    oauthTokens: {
      clientId: "client_id_royal_jewels_app",
      clientSecret: "••••••••••••••••",
      allowedGrantTypes: ["authorization_code", "refresh_token", "client_credentials"]
    },
    accessControl: {
      ipWhitelist: ["192.168.1.0/24", "103.21.12.44"],
      enforceHttpsOnly: true,
      requireSignedRequests: true
    },
    rateLimits: {
      requestsPerMinute: 600,
      burstLimit: 1000,
      quotaResetSeconds: 60
    }
  };

  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const updateProp = (key: string, val: any) => {
    updateConfig("apiManagement", key, val);
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("apiManagement", section, {
      ...(apiConfig[section] || {}),
      [key]: val
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            Developer API Keys & OAuth Management
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Manage public & secret API tokens, OAuth 2.0 client credentials, granular scopes, and rate limiting thresholds.
          </p>
        </div>
        <button className="bg-gold text-foreground px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> Generate New API Key
        </button>
      </div>

      {/* API Keys List */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Key className="w-4 h-4 text-gold" />
          Active API Keys & Tokens
        </h4>

        <div className="space-y-3">
          {apiConfig.apiKeys?.map((k: any) => (
            <div key={k.id} className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-platinum">{k.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-medium">
                    {k.scope}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-platinum-muted mt-1">{k.key}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(k.key, k.id)}
                  className="px-3 py-1.5 rounded bg-[#1F1F24] text-[11px] text-platinum hover:text-gold transition-colors flex items-center gap-1.5 font-medium"
                >
                  {copiedKey === k.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === k.id ? "Copied!" : "Copy Key"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secret Keys & OAuth Tokens */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Lock className="w-4 h-4 text-gold" />
          Master Secret Key & OAuth 2.0 Credentials
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Master Backend Secret Key</label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={apiConfig.secretKey || ""}
                onChange={(e) => updateProp("secretKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-2.5 text-platinum-muted hover:text-platinum"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">OAuth Client ID</label>
            <input
              type="text"
              value={apiConfig.oauthTokens?.clientId || ""}
              onChange={(e) => updateSubProp("oauthTokens", "clientId", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Rate Limits & Access Control */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Sliders className="w-4 h-4 text-gold" />
          API Rate Throttling & Protection
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Max Requests Per Minute</label>
            <input
              type="number"
              value={apiConfig.rateLimits?.requestsPerMinute || 600}
              onChange={(e) => updateSubProp("rateLimits", "requestsPerMinute", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Burst Request Threshold</label>
            <input
              type="number"
              value={apiConfig.rateLimits?.burstLimit || 1000}
              onChange={(e) => updateSubProp("rateLimits", "burstLimit", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div className="flex flex-col justify-center gap-2 pt-4">
            <label className="flex items-center gap-2 text-[12px] text-platinum cursor-pointer">
              <input
                type="checkbox"
                checked={!!apiConfig.accessControl?.enforceHttpsOnly}
                onChange={(e) => updateSubProp("accessControl", "enforceHttpsOnly", e.target.checked)}
                className="accent-gold"
              />
              Enforce Strict HTTPS TLS 1.3
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
