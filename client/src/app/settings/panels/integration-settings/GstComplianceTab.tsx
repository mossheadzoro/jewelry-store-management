"use client";

import React from "react";
import { FileCheck, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface GstComplianceTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function GstComplianceTab({ config, updateConfig, isAdmin }: GstComplianceTabProps) {
  const gstConfig = config?.gst || {
    gstin: "27AAACG1234H1Z5",
    gspProvider: "cleartax", // cleartax, masterindia, nic
    apiKey: "ct_live_992102...",
    eInvoice: {
      enabled: true,
      autoGenerateAbove: 50000,
      username: "EINVC_USER_01",
      password: "••••••••",
      autoQrCodePrinting: true
    },
    eWayBill: {
      enabled: true,
      autoGenerateThreshold: 50000,
      transporterId: "27AAAAA0000A1Z5"
    },
    hsnSync: {
      autoLookup: true,
      goldHsn: "7113",
      silverHsn: "7114",
      diamondHsn: "7102"
    },
    gstValidation: {
      autoVerifyOnCustomerEntry: true,
      blockInvoiceIfInvalid: false
    }
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("gst", key, val);
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("gst", section, {
      ...(gstConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            GST & Government Compliance Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Automate NIC E-Invoicing (IRN), E-Way Bill generation, HSN chapter code lookup, and GSTIN verification.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> GSP Active
        </span>
      </div>

      {/* GST API & GSP Selection */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <ShieldCheck className="w-4 h-4 text-gold" />
          GST API & Suvidha Provider (GSP) Setup
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Company GSTIN Number</label>
            <input
              type="text"
              value={gstConfig.gstin || ""}
              onChange={(e) => updateProp("gstin", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-gold font-mono uppercase focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">GSP / ASP Partner</label>
            <select
              value={gstConfig.gspProvider || "cleartax"}
              onChange={(e) => updateProp("gspProvider", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            >
              <option value="cleartax">ClearTax GSP API</option>
              <option value="masterindia">Master India GSP</option>
              <option value="nic">NIC Direct Government Portal</option>
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">GSP Secret Auth Token</label>
            <input
              type="password"
              value={gstConfig.apiKey || ""}
              onChange={(e) => updateProp("apiKey", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>

      {/* E-Invoice & E-Way Bill Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* E-Invoice */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
            <div>
              <h4 className="text-[14px] font-semibold text-platinum">NIC E-Invoicing (IRN & B2B QR Code)</h4>
              <p className="text-[11px] text-platinum-muted">Generate Invoice Reference Number automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={!!gstConfig.eInvoice?.enabled}
                onChange={(e) => updateSubProp("eInvoice", "enabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {gstConfig.eInvoice?.enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">E-Invoice Portal Username</label>
                <input
                  type="text"
                  value={gstConfig.eInvoice?.username || ""}
                  onChange={(e) => updateSubProp("eInvoice", "username", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">E-Invoice Portal Password</label>
                <input
                  type="password"
                  value={gstConfig.eInvoice?.password || ""}
                  onChange={(e) => updateSubProp("eInvoice", "password", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-platinum">Auto Print Signed QR Code on Bill</span>
                <input
                  type="checkbox"
                  checked={!!gstConfig.eInvoice?.autoQrCodePrinting}
                  onChange={(e) => updateSubProp("eInvoice", "autoQrCodePrinting", e.target.checked)}
                  className="accent-gold"
                />
              </div>
            </div>
          )}
        </div>

        {/* E-Way Bill */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
            <div>
              <h4 className="text-[14px] font-semibold text-platinum">E-Way Bill Generation</h4>
              <p className="text-[11px] text-platinum-muted">Generate E-Way bill for goods transport</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={!!gstConfig.eWayBill?.enabled}
                onChange={(e) => updateSubProp("eWayBill", "enabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {gstConfig.eWayBill?.enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Mandatory Threshold Amount (₹)</label>
                <input
                  type="number"
                  value={gstConfig.eWayBill?.autoGenerateThreshold || 50000}
                  onChange={(e) => updateSubProp("eWayBill", "autoGenerateThreshold", parseInt(e.target.value))}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Default Transporter ID</label>
                <input
                  type="text"
                  value={gstConfig.eWayBill?.transporterId || ""}
                  onChange={(e) => updateSubProp("eWayBill", "transporterId", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                  placeholder="27AAAAA0000A1Z5"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HSN/SAC Sync & GST Validation */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <RefreshCw className="w-4 h-4 text-gold" />
          HSN/SAC Code Sync & Real-Time GST Validation
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] text-platinum-muted block mb-1">Gold Jewelry HSN</label>
            <input
              type="text"
              value={gstConfig.hsnSync?.goldHsn || "7113"}
              onChange={(e) => updateSubProp("hsnSync", "goldHsn", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-platinum-muted block mb-1">Silver Jewelry HSN</label>
            <input
              type="text"
              value={gstConfig.hsnSync?.silverHsn || "7114"}
              onChange={(e) => updateSubProp("hsnSync", "silverHsn", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-platinum-muted block mb-1">Diamonds & Precious Stones HSN</label>
            <input
              type="text"
              value={gstConfig.hsnSync?.diamondHsn || "7102"}
              onChange={(e) => updateSubProp("hsnSync", "diamondHsn", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>

          <div className="flex flex-col justify-center gap-2 pt-4">
            <label className="flex items-center gap-2 text-[12px] text-platinum cursor-pointer">
              <input
                type="checkbox"
                checked={!!gstConfig.gstValidation?.autoVerifyOnCustomerEntry}
                onChange={(e) => updateSubProp("gstValidation", "autoVerifyOnCustomerEntry", e.target.checked)}
                className="accent-gold"
              />
              Auto Verify GSTIN on Entry
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
