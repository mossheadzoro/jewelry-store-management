"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { useUserStore } from "@/lib/store/useUserStore";

const ALL_PAYMENT_METHODS = ['Cash', 'UPI', 'Credit/Debit Card', 'Bank Transfer', 'Wallet', 'EMI', 'Cheque'];

const DEFAULT_HSN_CODES = [
  { id: "1", product: "Gold Jewellery", code: "7113" },
  { id: "2", product: "Silver Jewellery", code: "7113" },
  { id: "3", product: "Articles of Goldsmiths/Silversmiths (e.g., certain silverware)", code: "7114" },
  { id: "4", product: "Diamonds (uncut/cut depending on classification)", code: "7102" },
  { id: "5", product: "Precious Stones", code: "7103" },
  { id: "6", product: "Pearls", code: "7101" },
  { id: "7", product: "Imitation Jewellery", code: "7117" },
  { id: "8", product: "Platinum Jewellery", code: "7113" }
];

export default function FinancialSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const { user } = useUserStore();
  
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";

  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  
  const [config, setConfig] = useState<any>({
    productGst: { cgst: 1.5, sgst: 1.5, igst: 3 },
    makingChargeGst: { cgst: 2.5, sgst: 2.5, igst: 5 },
    hallmarkConfig: { charge: 500, cgst: 9, sgst: 9, igst: 18 },
    taxCalculation: "exclusive",
    autoRoundOff: true,
    advanceBookingPercent: 80,
    maxCreditLimit: 50000,
    acceptedPaymentMethods: ['Cash', 'UPI', 'Credit/Debit Card'],
    hsnCodes: DEFAULT_HSN_CODES
  });

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.financialConfig) {
      setConfig({
        ...config,
        ...globalSettings.financialConfig
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
          financialConfig: config,
          applyToAllBranches
        })
      });
      // Optionally refresh settings
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

  const updateConfig = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateNestedConfig = (parent: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const togglePaymentMethod = (method: string) => {
    const current = config.acceptedPaymentMethods || [];
    if (current.includes(method)) {
      updateConfig('acceptedPaymentMethods', current.filter((m: string) => m !== method));
    } else {
      updateConfig('acceptedPaymentMethods', [...current, method]);
    }
  };

  const updateHsnCode = (id: string, field: string, value: string) => {
    const newCodes = config.hsnCodes.map((c: any) => c.id === id ? { ...c, [field]: value } : c);
    updateConfig('hsnCodes', newCodes);
  };

  const removeHsnCode = (id: string) => {
    updateConfig('hsnCodes', config.hsnCodes.filter((c: any) => c.id !== id));
  };

  const addHsnCode = () => {
    updateConfig('hsnCodes', [...config.hsnCodes, { id: Date.now().toString(), product: "", code: "" }]);
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
            <DollarSign className="w-5 h-5 text-gold" />
            Financial Settings
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Configure default GST splits, payment rules, and HSN codes.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleSave(true)} 
              disabled={saving || savingAll} 
              className="bg-onyx-surface border border-onyx-border text-platinum px-4 py-2 rounded-lg text-[13px] font-medium hover:text-gold transition-colors flex items-center gap-2"
            >
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingAll ? "Saving..." : "Save for All Branches"}
            </button>
            <button 
              onClick={() => handleSave(false)} 
              disabled={saving || savingAll} 
              className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save for this branch"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Taxes & Charges</h3>
            
            {/* Product GST */}
            <div className="border border-onyx-border p-4 rounded-lg bg-onyx-surface/30">
              <label className="block text-[12px] font-medium text-platinum mb-3">Product Default GST</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">CGST (%)</label>
                  <input type="number" step="0.1" value={config.productGst?.cgst || 0} onChange={e => updateNestedConfig('productGst', 'cgst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">SGST (%)</label>
                  <input type="number" step="0.1" value={config.productGst?.sgst || 0} onChange={e => updateNestedConfig('productGst', 'sgst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">IGST (%)</label>
                  <input type="number" step="0.1" value={config.productGst?.igst || 0} onChange={e => updateNestedConfig('productGst', 'igst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
              </div>
            </div>

            {/* Making Charge GST */}
            <div className="border border-onyx-border p-4 rounded-lg bg-onyx-surface/30">
              <label className="block text-[12px] font-medium text-platinum mb-3">Making Charge GST</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">CGST (%)</label>
                  <input type="number" step="0.1" value={config.makingChargeGst?.cgst || 0} onChange={e => updateNestedConfig('makingChargeGst', 'cgst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">SGST (%)</label>
                  <input type="number" step="0.1" value={config.makingChargeGst?.sgst || 0} onChange={e => updateNestedConfig('makingChargeGst', 'sgst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">IGST (%)</label>
                  <input type="number" step="0.1" value={config.makingChargeGst?.igst || 0} onChange={e => updateNestedConfig('makingChargeGst', 'igst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
              </div>
            </div>

            {/* Hallmark Config */}
            <div className="border border-onyx-border p-4 rounded-lg bg-onyx-surface/30">
              <label className="block text-[12px] font-medium text-platinum mb-3">Hallmarking</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">Charge (₹)</label>
                  <input type="number" value={config.hallmarkConfig?.charge || 0} onChange={e => updateNestedConfig('hallmarkConfig', 'charge', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">CGST (%)</label>
                  <input type="number" step="0.1" value={config.hallmarkConfig?.cgst || 0} onChange={e => updateNestedConfig('hallmarkConfig', 'cgst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">SGST (%)</label>
                  <input type="number" step="0.1" value={config.hallmarkConfig?.sgst || 0} onChange={e => updateNestedConfig('hallmarkConfig', 'sgst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-platinum-muted">IGST (%)</label>
                  <input type="number" step="0.1" value={config.hallmarkConfig?.igst || 0} onChange={e => updateNestedConfig('hallmarkConfig', 'igst', parseFloat(e.target.value) || 0)} disabled={!isAdmin} className="w-full h-9 px-3 rounded bg-onyx-surface border border-onyx-border text-[12px] text-platinum focus:border-gold outline-none disabled:opacity-50" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Tax Calculation</label>
                <select value={config.taxCalculation} onChange={e => updateConfig('taxCalculation', e.target.value)} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors disabled:opacity-50">
                  <option value="exclusive">Exclusive</option>
                  <option value="inclusive">Inclusive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" checked={config.autoRoundOff} onChange={e => updateConfig('autoRoundOff', e.target.checked)} disabled={!isAdmin} id="round-off" className="w-4 h-4 rounded border-onyx-border bg-onyx-surface text-gold focus:ring-gold/40 disabled:opacity-50" />
              <label htmlFor="round-off" className="text-[13px] text-platinum">Auto Round-off invoice totals</label>
            </div>
          </div>

          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Payment Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Advance % for Booking</label>
                <input type="number" value={config.advanceBookingPercent} onChange={e => updateConfig('advanceBookingPercent', parseFloat(e.target.value))} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors disabled:opacity-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Max Credit Limit (₹)</label>
                <input type="number" value={config.maxCreditLimit} onChange={e => updateConfig('maxCreditLimit', parseFloat(e.target.value))} disabled={!isAdmin} className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors disabled:opacity-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Accepted Payment Methods</h3>
            <p className="text-[11px] text-platinum-muted">Select payment methods acceptable at this branch.</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {ALL_PAYMENT_METHODS.map(method => (
                <div key={method} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={(config.acceptedPaymentMethods || []).includes(method)} 
                    onChange={() => togglePaymentMethod(method)}
                    disabled={!isAdmin}
                    id={`pm-${method}`} 
                    className="w-4 h-4 rounded border-onyx-border bg-onyx-surface text-gold focus:ring-gold/40 disabled:opacity-50" 
                  />
                  <label htmlFor={`pm-${method}`} className="text-[13px] text-platinum">{method}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[14px] font-medium text-platinum">HSN Codes</h3>
              {isAdmin && (
                <button onClick={addHsnCode} className="text-[11px] text-gold hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Code
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {config.hsnCodes?.map((codeObj: any) => (
                <div key={codeObj.id} className="flex gap-2 items-center bg-onyx-surface/50 p-2 rounded-lg border border-onyx-border">
                  <input 
                    type="text" 
                    placeholder="Product Category"
                    value={codeObj.product}
                    onChange={(e) => updateHsnCode(codeObj.id, 'product', e.target.value)}
                    disabled={!isAdmin}
                    className="flex-1 min-w-0 bg-onyx-surface px-3 py-1.5 rounded border border-onyx-border focus:border-gold outline-none text-[12px] text-platinum disabled:opacity-50"
                  />
                  <input 
                    type="text" 
                    placeholder="HSN Code"
                    value={codeObj.code}
                    onChange={(e) => updateHsnCode(codeObj.id, 'code', e.target.value)}
                    disabled={!isAdmin}
                    className="w-24 bg-onyx-surface px-3 py-1.5 rounded border border-onyx-border focus:border-gold outline-none text-[12px] text-platinum disabled:opacity-50"
                  />
                  {isAdmin && (
                    <button onClick={() => removeHsnCode(codeObj.id)} className="p-1.5 text-platinum-muted hover:text-red-400 hover:bg-onyx rounded transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {(!config.hsnCodes || config.hsnCodes.length === 0) && (
                <div className="text-[12px] text-platinum-muted italic text-center py-4">No HSN codes configured.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
