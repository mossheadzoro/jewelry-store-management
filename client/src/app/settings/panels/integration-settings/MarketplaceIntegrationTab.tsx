"use client";

import React from "react";
import { Store, RefreshCw, Key, CheckCircle2, ShieldCheck } from "lucide-react";

interface MarketplaceIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function MarketplaceIntegrationTab({ config, updateConfig, isAdmin }: MarketplaceIntegrationTabProps) {
  const mpConfig = config?.marketplace || {
    amazon: { enabled: true, merchantId: "A390192810", accessKey: "AKIA...", secretKey: "••••••••" },
    flipkart: { enabled: true, sellerId: "FK_JEWEL_001", appSecret: "••••••••" },
    meesho: { enabled: false, supplierId: "", secretKey: "" },
    indiamart: { enabled: true, crmKey: "im_key_88921...", mobileNumber: "+91 98765 43210" },
    syncSettings: {
      inventorySync: true,
      orderSync: true,
      autoUpdateLeadStatus: true,
      priceMarkupPercent: 5
    }
  };

  const updateProp = (market: string, key: string, val: any) => {
    updateConfig("marketplace", market, {
      ...(mpConfig[market] || {}),
      [key]: val
    });
  };

  const updateSyncProp = (key: string, val: any) => {
    updateConfig("marketplace", "syncSettings", {
      ...(mpConfig.syncSettings || {}),
      [key]: val
    });
  };

  const markets = [
    { id: "amazon", name: "Amazon India (SP-API)", desc: "Amazon Seller Central SP-API for Gold & Fashion Jewelry", badge: "Live Sync" },
    { id: "flipkart", name: "Flipkart Seller Hub", desc: "Flipkart marketplace listing & orders sync", badge: "Live Sync" },
    { id: "meesho", name: "Meesho Supplier Panel", desc: "Meesho bulk catalog upload & order retrieval", badge: "Bulk Order" },
    { id: "indiamart", name: "IndiaMART B2B CRM", desc: "B2B buyer leads auto-pull & WhatsApp quick reply", badge: "B2B Leads" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-400" />
            Marketplace Channels Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Synchronize stock inventory & incoming orders across Amazon, Flipkart, Meesho, and IndiaMART B2B.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> 3 Marketplaces Connected
        </span>
      </div>

      {/* Marketplace Credentials Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {markets.map(m => {
          const isEnabled = mpConfig[m.id]?.enabled;

          return (
            <div key={m.id} className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
              <div className="flex items-start justify-between border-b border-[#1F1F24] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-platinum">{m.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">{m.badge}</span>
                  </div>
                  <p className="text-[11px] text-platinum-muted mt-0.5">{m.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!isEnabled}
                    onChange={(e) => updateProp(m.id, "enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-[#1F1F24] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gold"></div>
                </label>
              </div>

              {isEnabled && (
                <div className="space-y-3 pt-1">
                  {m.id === "amazon" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Merchant / Seller ID</label>
                        <input
                          type="text"
                          value={mpConfig.amazon?.merchantId || ""}
                          onChange={(e) => updateProp("amazon", "merchantId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-platinum-muted block mb-1">AWS Access Key</label>
                          <input
                            type="text"
                            value={mpConfig.amazon?.accessKey || ""}
                            onChange={(e) => updateProp("amazon", "accessKey", e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-platinum-muted block mb-1">AWS Secret Key</label>
                          <input
                            type="password"
                            value={mpConfig.amazon?.secretKey || ""}
                            onChange={(e) => updateProp("amazon", "secretKey", e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {m.id === "flipkart" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Flipkart Seller ID</label>
                        <input
                          type="text"
                          value={mpConfig.flipkart?.sellerId || ""}
                          onChange={(e) => updateProp("flipkart", "sellerId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">App Secret</label>
                        <input
                          type="password"
                          value={mpConfig.flipkart?.appSecret || ""}
                          onChange={(e) => updateProp("flipkart", "appSecret", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                    </>
                  )}

                  {m.id === "meesho" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Supplier ID</label>
                        <input
                          type="text"
                          value={mpConfig.meesho?.supplierId || ""}
                          onChange={(e) => updateProp("meesho", "supplierId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                    </>
                  )}

                  {m.id === "indiamart" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">IndiaMART CRM Key</label>
                        <input
                          type="password"
                          value={mpConfig.indiamart?.crmKey || ""}
                          onChange={(e) => updateProp("indiamart", "crmKey", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync Preferences */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <RefreshCw className="w-4 h-4 text-gold" />
          Central Inventory & Order Sync Rules
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Realtime Inventory Sync</p>
              <p className="text-[11px] text-platinum-muted">Deduct stock across all channels instantly</p>
            </div>
            <input
              type="checkbox"
              checked={!!mpConfig.syncSettings?.inventorySync}
              onChange={(e) => updateSyncProp("inventorySync", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Order Pull Sync</p>
              <p className="text-[11px] text-platinum-muted">Import Amazon & Flipkart orders to POS</p>
            </div>
            <input
              type="checkbox"
              checked={!!mpConfig.syncSettings?.orderSync}
              onChange={(e) => updateSyncProp("orderSync", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Marketplace Price Markup (%)</label>
            <input
              type="number"
              value={mpConfig.syncSettings?.priceMarkupPercent || 5}
              onChange={(e) => updateSyncProp("priceMarkupPercent", parseFloat(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
