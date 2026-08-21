"use client";

import React, { useState, useEffect } from "react";
import { PiggyBank, Save, Loader2, Calendar, Banknote, Gem, Plus, Trash2, HelpCircle } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

export default function SavingSchemeSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();
  
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  
  const [config, setConfig] = useState<any>({
    allowedTypes: ["FIXED_MONTHLY", "ANONYMOUS_DEPOSIT", "GOLD_DEPOSIT"],
    fixedMonthly: {
      minDeposit: 1000,
      maxDeposit: 50000,
      stepAmount: 500,
      durations: [12, 24],
      bonusMonths: { 12: 1, 24: 2 }
    },
    anonymousDeposit: {
      minCashDeposit: 500
    },
    goldDeposit: {
      minWeightGm: 1
    }
  });

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.schemeConfig) {
      setConfig({
        ...config,
        ...globalSettings.schemeConfig
      });
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
          schemeConfig: config,
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

  const toggleSchemeType = (type: string) => {
    const current = config.allowedTypes || [];
    if (current.includes(type)) {
      updateConfig('allowedTypes', current.filter((t: string) => t !== type));
    } else {
      updateConfig('allowedTypes', [...current, type]);
    }
  };

  const updateConfig = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateNestedConfig = (parent: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  if (loading && !globalSettings) {
    return <div className="p-8 text-center text-platinum-muted animate-pulse">Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#C9943A]" />
            Saving Scheme Settings
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Configure rules, limits, and bonuses for customer saving schemes.
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
          <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Allowed Scheme Types</h3>
            <p className="text-[11px] text-platinum-muted">Select which schemes this branch can offer to customers.</p>
            <div className="space-y-3 mt-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#1F1F24] hover:border-border transition-colors">
                <input type="checkbox" checked={config.allowedTypes?.includes("FIXED_MONTHLY")} onChange={() => toggleSchemeType("FIXED_MONTHLY")} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
                <Calendar className="w-5 h-5 text-[#C9943A]" />
                <div>
                  <div className="text-[13px] font-medium text-platinum">Fixed Monthly</div>
                  <div className="text-[11px] text-platinum-muted">Fixed duration and deposit amount</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#1F1F24] hover:border-border transition-colors">
                <input type="checkbox" checked={config.allowedTypes?.includes("ANONYMOUS_DEPOSIT")} onChange={() => toggleSchemeType("ANONYMOUS_DEPOSIT")} disabled={!isAdmin} className="accent-blue-400 w-4 h-4" />
                <Banknote className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-[13px] font-medium text-platinum">Anonymous Deposit</div>
                  <div className="text-[11px] text-platinum-muted">Flexible cash or metal deposits</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#1F1F24] hover:border-border transition-colors">
                <input type="checkbox" checked={config.allowedTypes?.includes("GOLD_DEPOSIT")} onChange={() => toggleSchemeType("GOLD_DEPOSIT")} disabled={!isAdmin} className="accent-amber-400 w-4 h-4" />
                <Gem className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-[13px] font-medium text-platinum">Gold Deposit</div>
                  <div className="text-[11px] text-platinum-muted">Book gold weight directly</div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
              <Banknote className="w-4 h-4 text-blue-400" />
              Anonymous & Gold Deposit Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Min Cash Deposit (₹)</label>
                <input type="number" value={config.anonymousDeposit?.minCashDeposit ?? ""} onChange={e => updateNestedConfig('anonymousDeposit', 'minCashDeposit', e.target.value === "" ? "" : Number(e.target.value))} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[13px] text-platinum focus:border-[#C9943A]/40 outline-none transition-colors disabled:opacity-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Min Gold Deposit (g)</label>
                <input type="number" step="0.1" value={config.goldDeposit?.minWeightGm ?? ""} onChange={e => updateNestedConfig('goldDeposit', 'minWeightGm', e.target.value === "" ? "" : Number(e.target.value))} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[13px] text-platinum focus:border-[#C9943A]/40 outline-none transition-colors disabled:opacity-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9943A]" />
              Fixed Monthly Configuration
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Min Monthly Deposit (₹)</label>
                <input type="number" value={config.fixedMonthly?.minDeposit ?? ""} onChange={e => updateNestedConfig('fixedMonthly', 'minDeposit', e.target.value === "" ? "" : Number(e.target.value))} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[13px] text-platinum focus:border-[#C9943A]/40 outline-none transition-colors disabled:opacity-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Max Monthly Deposit (₹)</label>
                <input type="number" value={config.fixedMonthly?.maxDeposit ?? ""} onChange={e => updateNestedConfig('fixedMonthly', 'maxDeposit', e.target.value === "" ? "" : Number(e.target.value))} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[13px] text-platinum focus:border-[#C9943A]/40 outline-none transition-colors disabled:opacity-50" />
              </div>

            </div>

            <div className="pt-4 border-t border-[#1F1F24]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[12px] font-medium text-platinum">Allowed Durations & Bonus Rules</h4>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      const d = config.fixedMonthly?.durations || [];
                      const newD = Math.max(0, ...d) + 1; // Get a unique default duration
                      updateNestedConfig('fixedMonthly', 'durations', [...d, newD].sort((a, b) => a - b));
                      updateNestedConfig('fixedMonthly', 'bonusMonths', { ...config.fixedMonthly?.bonusMonths, [newD]: 0 });
                    }} 
                    className="flex items-center gap-1 text-[11px] text-[#C9943A] hover:text-[#E8B84B] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Duration
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {(config.fixedMonthly?.durations || []).map((duration: number, idx: number) => (
                  <div key={`${duration}-${idx}`} className="flex items-center gap-3 p-2 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[11px] text-platinum-muted w-16">Duration:</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input type="number" value={duration === 0 ? "" : duration} onChange={e => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          if (val === duration) return;
                          
                          // We don't want duplicate keys, so just update this specific index
                          const newDurations = [...(config.fixedMonthly.durations || [])];
                          newDurations[idx] = val;
                          
                          // Transfer bonus rule to new key
                          const newBonus = { ...config.fixedMonthly.bonusMonths };
                          newBonus[val] = newBonus[duration] || 0;
                          
                          // Sort durations
                          newDurations.sort((a, b) => a - b);
                          
                          updateNestedConfig('fixedMonthly', 'durations', newDurations);
                          updateNestedConfig('fixedMonthly', 'bonusMonths', newBonus);
                        }} disabled={!isAdmin} className="w-16 h-8 px-2 rounded bg-[#111113] border border-[#1F1F24] text-[12px] text-center text-platinum focus:border-[#C9943A]/40 outline-none disabled:opacity-50" />
                        <span className="text-[11px] text-platinum-muted">months</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1 border-l border-[#1F1F24] pl-3">
                      <span className="text-[11px] text-platinum-muted">Bonus:</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input type="number" value={config.fixedMonthly?.bonusMonths?.[duration] ?? ""} onChange={e => {
                          const bonus = config.fixedMonthly?.bonusMonths || {};
                          updateNestedConfig('fixedMonthly', 'bonusMonths', { ...bonus, [duration]: e.target.value === "" ? "" : Number(e.target.value) });
                        }} disabled={!isAdmin} className="w-16 h-8 px-2 rounded bg-[#111113] border border-[#1F1F24] text-[12px] text-center text-platinum focus:border-[#C9943A]/40 outline-none disabled:opacity-50" />
                        <span className="text-[11px] text-platinum-muted">months</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          const newDurations = config.fixedMonthly.durations.filter((_: any, i: number) => i !== idx);
                          updateNestedConfig('fixedMonthly', 'durations', newDurations);
                          // We keep the bonus in the object just in case they add it back, or we can clean it up.
                        }}
                        className="p-1.5 text-[#6B6560] hover:text-red-400 hover:bg-[#111113] rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {(!config.fixedMonthly?.durations || config.fixedMonthly.durations.length === 0) && (
                  <div className="text-[11px] text-platinum-muted italic text-center py-4">
                    No durations added yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
