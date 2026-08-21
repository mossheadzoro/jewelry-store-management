"use client";

import React, { useState } from "react";
import { Mail, Server, Send, Eye, EyeOff, FileText, CheckCircle2 } from "lucide-react";

interface EmailIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function EmailIntegrationTab({ config, updateConfig, isAdmin }: EmailIntegrationTabProps) {
  const emailConfig = config?.email || {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    username: "billing@jewelstore.com",
    password: "••••••••••••••••",
    encryption: "tls", // ssl, tls, none
    senderEmail: "no-reply@jewelstore.com",
    senderName: "Royal Jewels Customer Support",
    replyTo: "support@jewelstore.com",
    autoSettings: {
      sendInvoicePdf: true,
      sendPaymentReceipt: true,
      sendSchemeAlert: true,
      sendMonthlyStatement: false
    },
    templates: [
      { id: "tmpl_inv", name: "Tax Invoice PDF Email", subject: "Your Tax Invoice - {INVOICE_NO}" },
      { id: "tmpl_stmt", name: "Monthly Saving Scheme Statement", subject: "Monthly Scheme Statement - {MONTH}" },
      { id: "tmpl_appreciation", name: "VIP Customer Appreciation", subject: "Special Offer Exclusive for You" }
    ]
  };

  const [showPass, setShowPass] = useState(false);

  const updateProp = (key: string, val: any) => {
    updateConfig("email", key, val);
  };

  const updateAutoProp = (key: string, val: boolean) => {
    updateConfig("email", "autoSettings", {
      ...(emailConfig.autoSettings || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            Email & SMTP Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Configure custom domain SMTP server, branded HTML invoice templates, and automated email dispatches.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> SMTP Verified
        </span>
      </div>

      {/* SMTP Configuration */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Server className="w-4 h-4 text-gold" />
          SMTP Server Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">SMTP Host Server</label>
            <input
              type="text"
              value={emailConfig.smtpHost || ""}
              onChange={(e) => updateProp("smtpHost", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="smtp.mailgun.org or smtp.gmail.com"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Port</label>
            <input
              type="number"
              value={emailConfig.smtpPort || 587}
              onChange={(e) => updateProp("smtpPort", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Encryption Protocol</label>
            <select
              value={emailConfig.encryption || "tls"}
              onChange={(e) => updateProp("encryption", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            >
              <option value="tls">STARTTLS (Port 587)</option>
              <option value="ssl">SSL / TLS (Port 465)</option>
              <option value="none">None (Port 25)</option>
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">SMTP Username / Account</label>
            <input
              type="text"
              value={emailConfig.username || ""}
              onChange={(e) => updateProp("username", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">SMTP App Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={emailConfig.password || ""}
                onChange={(e) => updateProp("password", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-2.5 text-platinum-muted hover:text-platinum"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sender Email & Name Details */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Mail className="w-4 h-4 text-gold" />
          Sender Identity & Branding
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Sender Name</label>
            <input
              type="text"
              value={emailConfig.senderName || ""}
              onChange={(e) => updateProp("senderName", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="Royal Jewels POS"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Sender Email Address</label>
            <input
              type="email"
              value={emailConfig.senderEmail || ""}
              onChange={(e) => updateProp("senderEmail", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="no-reply@yourjewelstore.com"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Reply-To Address</label>
            <input
              type="email"
              value={emailConfig.replyTo || ""}
              onChange={(e) => updateProp("replyTo", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="support@yourjewelstore.com"
            />
          </div>
        </div>
      </div>

      {/* Auto Email Settings */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Send className="w-4 h-4 text-gold" />
          Auto Email Dispatch Preferences
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "sendInvoicePdf", label: "Auto Send Invoice PDF", desc: "Attach PDF bill upon closing sale" },
            { key: "sendPaymentReceipt", label: "Send Payment Receipt", desc: "Confirmation for partial or full payments" },
            { key: "sendSchemeAlert", label: "Scheme Installment Alert", desc: "Monthly scheme installment notice" },
            { key: "sendMonthlyStatement", label: "Monthly Account Statement", desc: "Send account ledger summary" }
          ].map(setting => (
            <div key={setting.key} className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">{setting.label}</p>
                <p className="text-[10px] text-platinum-muted">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!!emailConfig.autoSettings?.[setting.key]}
                  onChange={(e) => updateAutoProp(setting.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
