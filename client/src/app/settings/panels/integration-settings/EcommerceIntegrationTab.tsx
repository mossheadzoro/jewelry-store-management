"use client";

import React from "react";
import { ShoppingBag, RefreshCw, CheckCircle2, Key, Layers, Globe } from "lucide-react";

interface EcommerceIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function EcommerceIntegrationTab({ config, updateConfig, isAdmin }: EcommerceIntegrationTabProps) {
  const ecomConfig = config?.ecommerce || {
    platform: "shopify", // shopify, woocommerce, magento, custom
    shopify: { storeDomain: "royal-jewels.myshopify.com", accessToken: "shpat_992019...", apiVersion: "2024-04" },
    woocommerce: { storeUrl: "https://online.royaljewels.com", consumerKey: "ck_9920...", consumerSecret: "cs_1092..." },
    magento: { hostUrl: "https://magento.royaljewels.com", accessToken: "••••••••" },
    customApi: { endpoint: "https://api.mywebstore.com/v1/sync", apiKey: "••••••••" },
    syncSettings: {
      productSyncEnabled: true,
      orderSyncEnabled: true,
      syncPricesWithGoldRate: true,
      syncStockQuantities: true,
      autoCreateCustomerOnOrder: true
    }
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("ecommerce", key, val);
  };

  const updatePlatformProp = (platform: string, key: string, val: any) => {
    updateConfig("ecommerce", platform, {
      ...(ecomConfig[platform] || {}),
      [key]: val
    });
  };

  const updateSyncProp = (key: string, val: boolean) => {
    updateConfig("ecommerce", "syncSettings", {
      ...(ecomConfig.syncSettings || {}),
      [key]: val
    });
  };

  const platforms = [
    { id: "shopify", name: "Shopify", desc: "Sync Shopify store catalog, prices & web orders", badge: "Direct App Sync" },
    { id: "woocommerce", name: "WooCommerce", desc: "REST API integration with WordPress e-commerce", badge: "Open Source" },
    { id: "magento", name: "Magento / Adobe Commerce", desc: "Enterprise Magento 2 API catalog connector", badge: "Enterprise" },
    { id: "customApi", name: "Custom Webstore API", desc: "Connect custom React / Next.js e-commerce website", badge: "Custom API" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            E-Commerce Storefront Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Connect online store catalog, auto-recalculate online jewelry prices on live gold rate changes, and import web orders.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Webstore Connected
        </span>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map(pf => {
          const isSelected = ecomConfig.platform === pf.id;

          return (
            <div
              key={pf.id}
              onClick={() => updateProp("platform", pf.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#111113] border-gold shadow-lg shadow-gold/5"
                  : "bg-[#0A0A0B] border-[#1F1F24] hover:border-gold/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[14px] font-semibold text-platinum">{pf.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">
                  {pf.badge}
                </span>
              </div>
              <p className="text-[11px] text-platinum-muted mb-3">{pf.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
                <span className={`text-[11px] font-medium ${isSelected ? "text-gold" : "text-platinum-muted"}`}>
                  {isSelected ? "Active Platform" : "Select Platform"}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credentials */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Key className="w-4 h-4 text-gold" />
          {platforms.find(p => p.id === ecomConfig.platform)?.name} API Credentials
        </h4>

        {ecomConfig.platform === "shopify" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Shopify Store Domain</label>
              <input
                type="text"
                value={ecomConfig.shopify?.storeDomain || ""}
                onChange={(e) => updatePlatformProp("shopify", "storeDomain", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
                placeholder="store.myshopify.com"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Admin API Access Token</label>
              <input
                type="password"
                value={ecomConfig.shopify?.accessToken || ""}
                onChange={(e) => updatePlatformProp("shopify", "accessToken", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">API Version</label>
              <input
                type="text"
                value={ecomConfig.shopify?.apiVersion || "2024-04"}
                onChange={(e) => updatePlatformProp("shopify", "apiVersion", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
          </div>
        )}

        {ecomConfig.platform === "woocommerce" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">WooCommerce Site URL</label>
              <input
                type="text"
                value={ecomConfig.woocommerce?.storeUrl || ""}
                onChange={(e) => updatePlatformProp("woocommerce", "storeUrl", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Consumer Key</label>
              <input
                type="text"
                value={ecomConfig.woocommerce?.consumerKey || ""}
                onChange={(e) => updatePlatformProp("woocommerce", "consumerKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Consumer Secret</label>
              <input
                type="password"
                value={ecomConfig.woocommerce?.consumerSecret || ""}
                onChange={(e) => updatePlatformProp("woocommerce", "consumerSecret", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {ecomConfig.platform === "magento" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Magento Host Domain</label>
              <input
                type="text"
                value={ecomConfig.magento?.hostUrl || ""}
                onChange={(e) => updatePlatformProp("magento", "hostUrl", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Bearer Access Token</label>
              <input
                type="password"
                value={ecomConfig.magento?.accessToken || ""}
                onChange={(e) => updatePlatformProp("magento", "accessToken", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {ecomConfig.platform === "customApi" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">API Webhook Endpoint URL</label>
              <input
                type="text"
                value={ecomConfig.customApi?.endpoint || ""}
                onChange={(e) => updatePlatformProp("customApi", "endpoint", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Header Secret Key</label>
              <input
                type="password"
                value={ecomConfig.customApi?.apiKey || ""}
                onChange={(e) => updatePlatformProp("customApi", "apiKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sync Preferences */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <RefreshCw className="w-4 h-4 text-gold" />
          Product & Order Synchronization Rules
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "productSyncEnabled", label: "Product Catalog Sync", desc: "Sync new designs & tags to web" },
            { key: "orderSyncEnabled", label: "Web Order Import", desc: "Auto pull web orders to POS" },
            { key: "syncPricesWithGoldRate", label: "Gold Rate Auto Pricing", desc: "Recalculate online prices dynamically" },
            { key: "syncStockQuantities", label: "Realtime Stock Sync", desc: "Deduct stock instantly when sold" },
            { key: "autoCreateCustomerOnOrder", label: "Auto Customer Creation", desc: "Add online buyers to customer CRM" }
          ].map(rule => (
            <div key={rule.key} className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">{rule.label}</p>
                <p className="text-[10px] text-platinum-muted">{rule.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={!!ecomConfig.syncSettings?.[rule.key]}
                onChange={(e) => updateSyncProp(rule.key, e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
