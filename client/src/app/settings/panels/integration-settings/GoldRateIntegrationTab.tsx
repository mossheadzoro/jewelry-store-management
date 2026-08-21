"use client";

import React from "react";
import { TrendingUp, RefreshCw, CheckCircle2, Clock, DollarSign, Sliders } from "lucide-react";

interface GoldRateIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function GoldRateIntegrationTab({ config, updateConfig, isAdmin }: GoldRateIntegrationTabProps) {
  const grConfig = config?.goldRate || {
    source: "ibja", // ibja, mcx, metals_api, manual
    ibja: { apiKey: "ibja_live_992102...", memberId: "MBR-99201" },
    mcx: { feedCredentials: "mcx_live_feed_881", contractMonth: "GOLDM_CURRENT" },
    metalsApi: { apiKey: "metals_api_key_1029", currency: "INR" },
    manualRates: {
      "24k": 7250,
      "22k": 6650,
      "18k": 5450,
      "14k": 4230,
      "silver": 88.50
    },
    autoUpdateSchedule: {
      enabled: true,
      frequency: "15m", // 15m, 1h, daily_morning
      morningTime: "09:30"
    }
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("goldRate", key, val);
  };

  const updateManualRate = (carat: string, val: number) => {
    updateConfig("goldRate", "manualRates", {
      ...(grConfig.manualRates || {}),
      [carat]: val
    });
  };

  const updateScheduleProp = (key: string, val: any) => {
    updateConfig("goldRate", "autoUpdateSchedule", {
      ...(grConfig.autoUpdateSchedule || {}),
      [key]: val
    });
  };

  const sources = [
    { id: "ibja", name: "IBJA Rate API", desc: "Indian Bullion and Jewellers Association daily official bench rates", badge: "Official India Standard" },
    { id: "mcx", name: "MCX Realtime Commodity Feed", desc: "Multi Commodity Exchange live gold & silver ticker feed", badge: "Real-time Live" },
    { id: "metals_api", name: "Metals API Global", desc: "International spot gold prices converted to INR per gram", badge: "Global Spot" },
    { id: "manual", name: "Manual Rate Board", desc: "Set custom rates per gram manually for 24K, 22K, 18K, 14K", badge: "Manual Override" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Gold & Silver Rate API Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Integrate live bullion market feeds from IBJA, MCX, or Metals API with automated scheduled pricing.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Market Feed Active
        </span>
      </div>

      {/* Source Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map(src => {
          const isSelected = grConfig.source === src.id;

          return (
            <div
              key={src.id}
              onClick={() => updateProp("source", src.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#111113] border-gold shadow-lg shadow-gold/5"
                  : "bg-[#0A0A0B] border-[#1F1F24] hover:border-gold/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[14px] font-semibold text-platinum">{src.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">{src.badge}</span>
              </div>
              <p className="text-[11px] text-platinum-muted mb-3">{src.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
                <span className={`text-[11px] font-medium ${isSelected ? "text-gold" : "text-platinum-muted"}`}>
                  {isSelected ? "Active Feed Source" : "Select Source"}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Rates Board */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <DollarSign className="w-4 h-4 text-gold" />
          Current Rate Board (Per Gram in INR)
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: "24k", label: "24K Fine Gold (999)" },
            { key: "22k", label: "22K Standard (916)" },
            { key: "18k", label: "18K Gold (750)" },
            { key: "14k", label: "14K Gold (585)" },
            { key: "silver", label: "Silver Fine (999)" }
          ].map(item => (
            <div key={item.key} className="bg-[#0A0A0B] p-3 rounded-lg border border-[#1F1F24]">
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">{item.label}</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[12px] text-gold font-bold">₹</span>
                <input
                  type="number"
                  value={grConfig.manualRates?.[item.key] || 0}
                  onChange={(e) => updateManualRate(item.key, parseFloat(e.target.value))}
                  disabled={grConfig.source !== "manual" && !isAdmin}
                  className="w-full bg-[#111113] border border-[#1F1F24] rounded px-3 py-1 text-[13px] text-platinum font-semibold font-mono pl-6 focus:border-gold outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto Update Schedule */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Clock className="w-4 h-4 text-gold" />
          Auto Rate Fetching & Refresh Schedule
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-platinum">Auto Rate Sync Engine</p>
              <p className="text-[11px] text-platinum-muted">Automatically fetch latest rates</p>
            </div>
            <input
              type="checkbox"
              checked={!!grConfig.autoUpdateSchedule?.enabled}
              onChange={(e) => updateScheduleProp("enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Refresh Frequency</label>
            <select
              value={grConfig.autoUpdateSchedule?.frequency || "15m"}
              onChange={(e) => updateScheduleProp("frequency", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            >
              <option value="15m">Every 15 Minutes</option>
              <option value="1h">Every 1 Hour</option>
              <option value="daily_morning">Daily Morning at Fixed Time</option>
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Morning Refresh Time</label>
            <input
              type="time"
              value={grConfig.autoUpdateSchedule?.morningTime || "09:30"}
              onChange={(e) => updateScheduleProp("morningTime", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
