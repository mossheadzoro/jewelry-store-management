"use client";

import React from "react";
import { Landmark, RefreshCw, CheckCircle2, Sliders, Server, Link2 } from "lucide-react";

interface AccountingIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function AccountingIntegrationTab({ config, updateConfig, isAdmin }: AccountingIntegrationTabProps) {
  const accConfig = config?.accounting || {
    activeSoftware: "tally", // tally, zoho, busy, quickbooks, xero
    tally: { host: "127.0.0.1", port: 9000, companyName: "Royal Jewels Private Ltd", autoSyncVouchers: true },
    zoho: { organizationId: "600129381", authToken: "••••••••", syncLedger: true },
    busy: { serverAddress: "http://localhost:8080", companyDb: "BUSY_JEWEL_DB" },
    quickbooks: { connected: false, realmId: "" },
    xero: { connected: false, tenantId: "" },
    syncPreferences: {
      syncSalesInvoices: true,
      syncPurchaseBills: true,
      syncReceiptsAndPayments: true,
      syncInventoryValuation: true,
      syncFrequency: "realtime" // realtime, hourly, daily
    }
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("accounting", key, val);
  };

  const updateSoftwareProp = (sw: string, key: string, val: any) => {
    updateConfig("accounting", sw, {
      ...(accConfig[sw] || {}),
      [key]: val
    });
  };

  const updateSyncPref = (key: string, val: any) => {
    updateConfig("accounting", "syncPreferences", {
      ...(accConfig.syncPreferences || {}),
      [key]: val
    });
  };

  const softwareList = [
    { id: "tally", name: "Tally Prime / ERP 9", desc: "Direct XML/ODBC Tally ERP synchronization", badge: "Most Popular in India" },
    { id: "zoho", name: "Zoho Books", desc: "Cloud Accounting API & Organization Sync", badge: "Cloud Native" },
    { id: "busy", name: "Busy Accounting", desc: "BUSY Enterprise voucher & inventory sync", badge: "GST Preferred" },
    { id: "quickbooks", name: "QuickBooks Online", desc: "Intuit OAuth 2.0 multi-currency ledger", badge: "Global" },
    { id: "xero", name: "Xero", desc: "Cloud ledger & automatic bank reconciliation", badge: "Global" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            Accounting Software Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Sync daily sales vouchers, purchase receipts, GST tax ledgers, and gold inventory valuations with top ERP software.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Sync Engine Online
        </span>
      </div>

      {/* Software Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {softwareList.map(sw => {
          const isSelected = accConfig.activeSoftware === sw.id;

          return (
            <div
              key={sw.id}
              onClick={() => updateProp("activeSoftware", sw.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#111113] border-gold shadow-lg shadow-gold/5"
                  : "bg-[#0A0A0B] border-[#1F1F24] hover:border-gold/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[14px] font-semibold text-platinum">{sw.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">
                  {sw.badge}
                </span>
              </div>
              <p className="text-[11px] text-platinum-muted mb-3">{sw.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
                <span className={`text-[11px] font-medium ${isSelected ? "text-gold" : "text-platinum-muted"}`}>
                  {isSelected ? "Active Integration" : "Click to Configure"}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Software Configuration Details */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Server className="w-4 h-4 text-gold" />
          {softwareList.find(s => s.id === accConfig.activeSoftware)?.name} Credentials & Settings
        </h4>

        {accConfig.activeSoftware === "tally" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Tally Host IP Address</label>
              <input
                type="text"
                value={accConfig.tally?.host || "127.0.0.1"}
                onChange={(e) => updateSoftwareProp("tally", "host", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Tally ODBC/XML Port</label>
              <input
                type="number"
                value={accConfig.tally?.port || 9000}
                onChange={(e) => updateSoftwareProp("tally", "port", parseInt(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Tally Company Name</label>
              <input
                type="text"
                value={accConfig.tally?.companyName || ""}
                onChange={(e) => updateSoftwareProp("tally", "companyName", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {accConfig.activeSoftware === "zoho" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Zoho Organization ID</label>
              <input
                type="text"
                value={accConfig.zoho?.organizationId || ""}
                onChange={(e) => updateSoftwareProp("zoho", "organizationId", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">OAuth Authtoken / Secret</label>
              <input
                type="password"
                value={accConfig.zoho?.authToken || ""}
                onChange={(e) => updateSoftwareProp("zoho", "authToken", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {accConfig.activeSoftware === "busy" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">BUSY Web API URL</label>
              <input
                type="text"
                value={accConfig.busy?.serverAddress || "http://localhost:8080"}
                onChange={(e) => updateSoftwareProp("busy", "serverAddress", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">BUSY Company Database Name</label>
              <input
                type="text"
                value={accConfig.busy?.companyDb || ""}
                onChange={(e) => updateSoftwareProp("busy", "companyDb", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {(accConfig.activeSoftware === "quickbooks" || accConfig.activeSoftware === "xero") && (
          <div className="p-4 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Connect via OAuth 2.0 Portal</p>
              <p className="text-[11px] text-platinum-muted">Authorize secure single sign-on cloud accounting sync</p>
            </div>
            <button className="bg-gold text-foreground px-4 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-2 hover:bg-gold-light transition-colors">
              <Link2 className="w-4 h-4" /> Authorize & Connect
            </button>
          </div>
        )}
      </div>

      {/* Sync Preferences */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Sliders className="w-4 h-4 text-gold" />
          Voucher & Ledger Sync Preferences
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "syncSalesInvoices", label: "Sync Sales Invoices", desc: "Post sales vouchers to ledger" },
            { key: "syncPurchaseBills", label: "Sync Purchase Bills", desc: "Post karigar & bullion purchases" },
            { key: "syncReceiptsAndPayments", label: "Sync Receipts & Payments", desc: "Cash & bank ledger entry" },
            { key: "syncInventoryValuation", label: "Sync Inventory Valuation", desc: "Weight-based stock valuation" }
          ].map(pref => (
            <div key={pref.key} className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">{pref.label}</p>
                <p className="text-[10px] text-platinum-muted">{pref.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={!!accConfig.syncPreferences?.[pref.key]}
                onChange={(e) => updateSyncPref(pref.key, e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
