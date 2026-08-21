"use client";

import React from "react";
import { MessageSquare, Key, FileText, BellRing, RefreshCw, Send, CheckCircle2 } from "lucide-react";

interface WhatsAppIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function WhatsAppIntegrationTab({ config, updateConfig, isAdmin }: WhatsAppIntegrationTabProps) {
  const waConfig = config?.whatsapp || {
    phoneNumberId: "109823481239",
    wabaId: "209481203912",
    accessToken: "EAAGz...••••••••",
    businessNumber: "+91 98765 43210",
    autoInvoice: true,
    autoOrderUpdates: true,
    reminderMessages: true,
    templates: [
      { id: "invoice_pdf_v1", name: "invoice_send_v1", category: "TRANSACTIONAL", status: "APPROVED", lang: "en_US" },
      { id: "order_status_v2", name: "order_update_v2", category: "UTILITY", status: "APPROVED", lang: "en_US" },
      { id: "scheme_reminder_v1", name: "scheme_due_alert", category: "UTILITY", status: "APPROVED", lang: "hi" },
      { id: "gold_rate_promo", name: "daily_gold_rate", category: "MARKETING", status: "APPROVED", lang: "en_US" }
    ]
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("whatsapp", key, val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            WhatsApp Business API Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Automate tax invoice PDFs, order fulfillment notifications, and scheme payment reminders via official Meta API.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> API Connected
        </span>
      </div>

      {/* API Credentials Card */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Key className="w-4 h-4 text-gold" />
          WhatsApp API Credentials & Number
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Phone Number ID</label>
            <input
              type="text"
              value={waConfig.phoneNumberId || ""}
              onChange={(e) => updateProp("phoneNumberId", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="e.g. 109823481239"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">WhatsApp Business Account ID (WABA ID)</label>
            <input
              type="text"
              value={waConfig.wabaId || ""}
              onChange={(e) => updateProp("wabaId", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="e.g. 209481203912"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Permanent Access Token</label>
            <input
              type="password"
              value={waConfig.accessToken || ""}
              onChange={(e) => updateProp("accessToken", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="EAAGz..."
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Verified Sender WhatsApp Number</label>
            <input
              type="text"
              value={waConfig.businessNumber || ""}
              onChange={(e) => updateProp("businessNumber", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </div>

      {/* Auto Automation Toggles */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Send className="w-4 h-4 text-gold" />
          Automated Message Actions
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Auto Invoice PDF</p>
              <p className="text-[11px] text-platinum-muted">Send WhatsApp PDF bill instantly upon sale</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={!!waConfig.autoInvoice}
                onChange={(e) => updateProp("autoInvoice", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Auto Order Updates</p>
              <p className="text-[11px] text-platinum-muted">Notify readiness & karigar dispatch status</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={!!waConfig.autoOrderUpdates}
                onChange={(e) => updateProp("autoOrderUpdates", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Reminder Messages</p>
              <p className="text-[11px] text-platinum-muted">Send installment & scheme due alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={!!waConfig.reminderMessages}
                onChange={(e) => updateProp("reminderMessages", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Template Management */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            Meta Approved Template Management
          </h4>
          <button className="text-[11px] text-gold hover:underline flex items-center gap-1 font-medium">
            <RefreshCw className="w-3 h-3" /> Sync Templates from Meta
          </button>
        </div>

        <div className="space-y-2">
          {waConfig.templates?.map((tmpl: any) => (
            <div key={tmpl.id} className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <div>
                  <p className="text-[13px] font-mono text-platinum">{tmpl.name}</p>
                  <p className="text-[10px] text-platinum-muted uppercase font-sans mt-0.5">{tmpl.category} • Language: {tmpl.lang}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {tmpl.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
