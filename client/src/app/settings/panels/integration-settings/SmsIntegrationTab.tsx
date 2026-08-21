"use client";

import React from "react";
import { Send, Key, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

interface SmsIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function SmsIntegrationTab({ config, updateConfig, isAdmin }: SmsIntegrationTabProps) {
  const smsConfig = config?.sms || {
    provider: "msg91", // msg91, twilio, fast2sms, custom
    apiKey: "3928102931...",
    senderId: "JWELRY",
    authToken: "••••••••",
    entityId: "12071615...",
    otpSettings: {
      length: 6,
      expiryMinutes: 10,
      resendDelaySeconds: 30,
      dltApprovedOtpRoute: "DLT_OTP_TRANSACTIONAL"
    },
    autoNotifications: {
      otpVerification: true,
      orderConfirmed: true,
      paymentReceived: true,
      schemeReminder: true
    },
    templates: [
      { id: "tmpl_otp", name: "OTP Verification", dltId: "170716...", text: "Your Jewellry Store OTP code is {#var#}. Valid for 10 mins." },
      { id: "tmpl_order", name: "Order Confirmation", dltId: "170717...", text: "Dear {#var#}, order {#var#} of Rs. {#var#} is confirmed. Thank you!" }
    ]
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("sms", key, val);
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("sms", section, {
      ...(smsConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            SMS Gateway Integration (DLT Compliant)
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Configure Indian DLT registered transactional SMS gateways for OTP login, sale receipts, and customer alerts.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> DLT Active
        </span>
      </div>

      {/* Provider Selector & Credentials */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Key className="w-4 h-4 text-gold" />
          SMS Provider Selection & API Credentials
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {[
            { id: "msg91", name: "MSG91", desc: "India DLT Direct Route" },
            { id: "twilio", name: "Twilio SMS", desc: "Global & High Deliverability" },
            { id: "fast2sms", name: "Fast2SMS", desc: "Quick Setup & Instant OTP" },
            { id: "custom", name: "Custom HTTP Gateway", desc: "REST Webhook Integration" }
          ].map(prov => (
            <button
              key={prov.id}
              onClick={() => updateProp("provider", prov.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                smsConfig.provider === prov.id
                  ? "bg-gold/10 border-gold text-gold"
                  : "bg-[#0A0A0B] border-[#1F1F24] text-platinum hover:border-gold/40"
              }`}
            >
              <p className="text-[13px] font-semibold">{prov.name}</p>
              <p className="text-[10px] text-platinum-muted mt-0.5">{prov.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">API Key / Auth Key</label>
            <input
              type="password"
              value={smsConfig.apiKey || ""}
              onChange={(e) => updateProp("apiKey", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Sender ID (6 Characters DLT Header)</label>
            <input
              type="text"
              maxLength={6}
              value={smsConfig.senderId || ""}
              onChange={(e) => updateProp("senderId", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none uppercase font-mono"
              placeholder="e.g. JWELRY"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">DLT Principal Entity ID (PE ID)</label>
            <input
              type="text"
              value={smsConfig.entityId || ""}
              onChange={(e) => updateProp("entityId", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Auth Token / Secret (If Applicable)</label>
            <input
              type="password"
              value={smsConfig.authToken || ""}
              onChange={(e) => updateProp("authToken", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>

      {/* OTP Settings */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <ShieldCheck className="w-4 h-4 text-gold" />
          OTP Settings & Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">OTP Digit Length</label>
            <select
              value={smsConfig.otpSettings?.length || 6}
              onChange={(e) => updateSubProp("otpSettings", "length", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            >
              <option value={4}>4 Digits</option>
              <option value={6}>6 Digits</option>
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">OTP Expiry Time (Minutes)</label>
            <input
              type="number"
              value={smsConfig.otpSettings?.expiryMinutes || 10}
              onChange={(e) => updateSubProp("otpSettings", "expiryMinutes", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Resend Delay (Seconds)</label>
            <input
              type="number"
              value={smsConfig.otpSettings?.resendDelaySeconds || 30}
              onChange={(e) => updateSubProp("otpSettings", "resendDelaySeconds", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>

      {/* Auto Notifications Toggles */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Send className="w-4 h-4 text-gold" />
          Auto Notification Rules
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "otpVerification", label: "OTP Verification", desc: "Login & high-value actions" },
            { key: "orderConfirmed", label: "Order Confirmed", desc: "Notify upon booking" },
            { key: "paymentReceived", label: "Payment Received", desc: "Send payment confirmation" },
            { key: "schemeReminder", label: "Scheme Reminders", desc: "Monthly installment alerts" }
          ].map(rule => (
            <div key={rule.key} className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">{rule.label}</p>
                <p className="text-[10px] text-platinum-muted">{rule.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!!smsConfig.autoNotifications?.[rule.key]}
                  onChange={(e) => updateSubProp("autoNotifications", rule.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
