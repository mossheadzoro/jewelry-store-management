"use client";

import React from "react";
import { Globe, Truck, MapPin, DollarSign, BarChart3, Users, CheckCircle2 } from "lucide-react";

interface ThirdPartyServicesTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function ThirdPartyServicesTab({ config, updateConfig, isAdmin }: ThirdPartyServicesTabProps) {
  const tpConfig = config?.thirdParty || {
    shipping: { provider: "delhivery", apiKey: "delh_live_992019...", clientName: "ROYAL_JEWELS" },
    courierTracking: { autoTrackWaybill: true, webhookUrl: "https://api.jewelstore.com/v1/courier/track" },
    mapsLocation: { googleMapsApiKey: "AIzaSy...", enableAddressAutocomplete: true },
    currencyExchange: { provider: "fixer_io", apiKey: "fixer_key_9920...", baseCurrency: "INR" },
    analytics: { ga4MeasurementId: "G-992019201", mixpanelToken: "mp_token_8820" },
    crmIntegration: { provider: "hubspot", accessToken: "pat-na1-99201...", syncContacts: true }
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("thirdParty", section, {
      ...(tpConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            Third-Party Services & Utility Integrations
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Connect logistics couriers (Delhivery/BlueDart), Google Maps location APIs, currency conversion feeds, GA4 analytics, and HubSpot CRM.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> 6 Services Active
        </span>
      </div>

      {/* Grid of Third Party Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Shipping & Logistics */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Truck className="w-4 h-4 text-gold" /> Shipping & Courier Logistics
          </h4>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Logistics Partner</label>
              <select
                value={tpConfig.shipping?.provider || "delhivery"}
                onChange={(e) => updateSubProp("shipping", "provider", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="delhivery">Delhivery Direct API</option>
                <option value="shiprocket">Shiprocket Aggregator</option>
                <option value="bluedart">BlueDart Apex Express</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">API Key</label>
              <input
                type="password"
                value={tpConfig.shipping?.apiKey || ""}
                onChange={(e) => updateSubProp("shipping", "apiKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Maps & Location */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <MapPin className="w-4 h-4 text-gold" /> Google Maps & Places API
          </h4>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Google Maps Browser API Key</label>
              <input
                type="password"
                value={tpConfig.mapsLocation?.googleMapsApiKey || ""}
                onChange={(e) => updateSubProp("mapsLocation", "googleMapsApiKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-platinum pt-1">
              <span>Enable Customer Address Autocomplete</span>
              <input
                type="checkbox"
                checked={!!tpConfig.mapsLocation?.enableAddressAutocomplete}
                onChange={(e) => updateSubProp("mapsLocation", "enableAddressAutocomplete", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* 3. Currency Exchange Rate API */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <DollarSign className="w-4 h-4 text-gold" /> Multi-Currency Conversion API
          </h4>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Exchange Rate API Provider</label>
              <select
                value={tpConfig.currencyExchange?.provider || "fixer_io"}
                onChange={(e) => updateSubProp("currencyExchange", "provider", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="fixer_io">Fixer.io API</option>
                <option value="openexchangerates">Open Exchange Rates</option>
                <option value="currencylayer">CurrencyLayer</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">API Key</label>
              <input
                type="password"
                value={tpConfig.currencyExchange?.apiKey || ""}
                onChange={(e) => updateSubProp("currencyExchange", "apiKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Analytics & CRM */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <BarChart3 className="w-4 h-4 text-gold" /> Analytics & HubSpot CRM
          </h4>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Google Analytics 4 Measurement ID</label>
              <input
                type="text"
                value={tpConfig.analytics?.ga4MeasurementId || ""}
                onChange={(e) => updateSubProp("analytics", "ga4MeasurementId", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">HubSpot CRM Access Token</label>
              <input
                type="password"
                value={tpConfig.crmIntegration?.accessToken || ""}
                onChange={(e) => updateSubProp("crmIntegration", "accessToken", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
