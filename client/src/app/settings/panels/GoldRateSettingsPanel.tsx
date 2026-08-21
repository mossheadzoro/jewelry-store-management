"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Save, Loader2, RefreshCw, AlertCircle, Edit3 } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

export default function GoldRateSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();
  
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  
  const [config, setConfig] = useState<any>({
    isLive: true,
    manualRates: {
      "24k": 0,
      "22k": 0,
      "18k": 0,
      "14k": 0,
    }
  });

  const [liveRates, setLiveRates] = useState<any>(null);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchLiveRates = async () => {
    try {
      setFetchingLive(true);
      const res = await fetch("/api/gold-rates");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLiveRates(data.ratesPerGram);
      setLastFetched(new Date(data.timestamp || Date.now()));
    } catch (e) {
      console.error("Failed to fetch live gold rates", e);
    } finally {
      setFetchingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveRates();
    const interval = setInterval(() => {
      fetchLiveRates();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.goldRateConfig) {
      setConfig((prev: any) => ({
        ...prev,
        ...globalSettings.goldRateConfig
      }));
    }
  }, [globalSettings]);

  const handleSave = async (applyToAllBranches: boolean) => {
    if (applyToAllBranches) setSavingAll(true);
    else setSaving(true);
    
    try {
      await fetch("/api/settings/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          goldRateConfig: config,
          applyToAllBranches
        })
      });
      if (selectedBranch?.id) {
        await fetchGlobalSettings(selectedBranch.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setSavingAll(false);
    }
  };

  const updateManualRate = (carat: string, value: number | string) => {
    setConfig((prev: any) => ({
      ...prev,
      manualRates: {
        ...prev.manualRates,
        [carat]: value
      }
    }));
  };

  if (loading && !globalSettings) {
    return <div className="p-8 text-center text-platinum-muted animate-pulse">Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9943A]" />
            Gold Rate Settings
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Manage how gold rates are fetched and applied across the branch.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleSave(true)} 
              disabled={saving || savingAll} 
              className="bg-onyx-surface border border-onyx-border text-platinum px-4 py-2 rounded-lg text-[13px] font-medium hover:text-[#C9943A] transition-colors flex items-center gap-2"
            >
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingAll ? "Saving..." : "Save for All Branches"}
            </button>
            <button 
              onClick={() => handleSave(false)} 
              disabled={saving || savingAll} 
              className="bg-[#C9943A] text-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#E8B84B] transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save for this branch"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-medium text-platinum">Rate Sourcing Mode</h3>
                <p className="text-[11px] text-platinum-muted">Choose between live fetching or manual entry.</p>
              </div>
              <div className="flex bg-[#0A0A0B] border border-[#1F1F24] rounded-lg p-1">
                <button
                  onClick={() => isAdmin && setConfig((prev: any) => ({ ...prev, isLive: true }))}
                  disabled={!isAdmin}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${config.isLive ? "bg-[#C9943A] text-foreground shadow-sm" : "text-platinum-muted hover:text-platinum"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Live API
                  </div>
                </button>
                <button
                  onClick={() => isAdmin && setConfig((prev: any) => ({ ...prev, isLive: false }))}
                  disabled={!isAdmin}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${!config.isLive ? "bg-[#C9943A] text-foreground shadow-sm" : "text-platinum-muted hover:text-platinum"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    Manual
                  </div>
                </button>
              </div>
            </div>

            {config.isLive && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[12px] text-blue-200 flex gap-3">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  You are currently using <strong>Live API Rates</strong>. The system will automatically fetch and apply the latest market rates every 5 minutes. Manual rates below will be ignored.
                </p>
              </div>
            )}
            {!config.isLive && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-200 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  You are currently using <strong>Manual Rates</strong>. The system will rely on the rates you define below. Live API rates are displayed for reference but are not actively used.
                </p>
              </div>
            )}
          </div>

          <div className={`bg-[#111113] rounded-xl border border-[#1F1F24] p-6 space-y-4 transition-opacity ${config.isLive ? 'opacity-50' : 'opacity-100'}`}>
            <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#C9943A]" />
              Manual Rates Entry (₹ / gram)
            </h3>
            <p className="text-[11px] text-platinum-muted">Define static prices for each carat purity.</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {['24k', '22k', '18k', '14k'].map((carat) => (
                <div key={carat} className="space-y-1.5">
                  <label className="text-[11px] text-platinum-muted uppercase tracking-wider">{carat} Gold Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-platinum-muted">₹</span>
                    <input 
                      type="number" 
                      value={config.manualRates?.[carat] ?? ""} 
                      onChange={e => updateManualRate(carat, e.target.value === "" ? "" : Number(e.target.value))} 
                      disabled={!isAdmin || config.isLive} 
                      className="w-full h-10 pl-7 pr-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[13px] text-platinum focus:border-[#C9943A]/40 outline-none transition-colors disabled:opacity-50" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Live Market Reference
              </h3>
              <p className="text-[11px] text-platinum-muted mt-1">
                Fetched from external Gold Rate API.
              </p>
            </div>
            <button 
              onClick={fetchLiveRates}
              disabled={fetchingLive}
              className="text-[#6B6560] hover:text-platinum transition-colors p-1"
              title="Refresh now"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingLive ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {lastFetched && (
            <p className="text-[10px] text-platinum-muted text-right">
              Last updated: {lastFetched.toLocaleTimeString()}
            </p>
          )}

          <div className="bg-[#0A0A0B] rounded-lg border border-[#1F1F24] overflow-hidden">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#151518] text-platinum-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Carat Purity</th>
                  <th className="px-4 py-3 font-medium text-right">Rate (₹ / g)</th>
                  <th className="px-4 py-3 font-medium text-right">Rate (₹ / 10g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {['24k', '22k', '18k', '14k'].map((carat) => {
                  const ratePerGram = liveRates?.[carat] || 0;
                  const ratePer10Gram = ratePerGram * 10;
                  
                  return (
                    <tr key={`live-${carat}`} className="hover:bg-[#151518]/50 transition-colors">
                      <td className="px-4 py-3 text-platinum font-medium">{carat.toUpperCase()}</td>
                      <td className="px-4 py-3 text-[#C9943A] font-semibold text-right">
                        {fetchingLive ? (
                          <div className="h-4 bg-[#1F1F24] rounded animate-pulse w-16 ml-auto"></div>
                        ) : (
                          `₹${ratePerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-platinum-muted text-right">
                        {fetchingLive ? (
                          <div className="h-4 bg-[#1F1F24] rounded animate-pulse w-20 ml-auto"></div>
                        ) : (
                          `₹${ratePer10Gram.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {!liveRates && !fetchingLive && (
             <div className="text-[11px] text-red-400/80 text-center py-4 bg-red-400/10 rounded-lg">
               Failed to connect to Live API. Please ensure the external service is running.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
