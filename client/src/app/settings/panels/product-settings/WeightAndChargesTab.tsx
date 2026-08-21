import React, { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

export default function WeightAndChargesTab({ 
  weightConfig, 
  pricingConfig,
  onSaveWeight,
  onSavePricing 
}: { 
  weightConfig: any, 
  pricingConfig: any,
  onSaveWeight: (d: any) => Promise<boolean>,
  onSavePricing: (d: any) => Promise<boolean>
}) {
  const [weights, setWeights] = useState({
    unit: weightConfig?.unit || "Gram",
    precision: weightConfig?.precision || 3,
    requireGrossWeight: weightConfig?.requireGrossWeight ?? true,
    requireNetWeight: weightConfig?.requireNetWeight ?? true,
    requireStoneWeight: weightConfig?.requireStoneWeight ?? false,
  });

  const [pricing, setPricing] = useState({
    makingChargeMethod: pricingConfig?.makingChargeMethod || "PER_GRAM",
    defaultMakingCharge: pricingConfig?.defaultMakingCharge || 0,
    allowMakingOverride: pricingConfig?.allowMakingOverride ?? true,
    wastageMethod: pricingConfig?.wastageMethod || "PERCENTAGE",
    defaultWastage: pricingConfig?.defaultWastage || 0,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSaveWeight(weights);
    await onSavePricing(pricing);
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum">Weight & Pricing Rules</h3>
          <p className="text-[13px] text-platinum-muted">Global configuration for weights, making charges, and taxes.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Settings */}
        <div className="bg-onyx border border-onyx-border rounded-xl p-6">
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Weight Parameters</h4>
          
          <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-500/90 leading-relaxed">
              <strong>Important:</strong> Modifying the Weight Unit or Decimal Precision here will instantly be applied across every weight field in the entire database.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Weight Unit</label>
                <select value={weights.unit} onChange={e => setWeights({...weights, unit: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                  <option value="Gram">Grams (g)</option>
                  <option value="Kg">Kilograms (kg)</option>
                  <option value="Milligram">Milligrams (mg)</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Decimal Precision</label>
                <select value={weights.precision} onChange={e => setWeights({...weights, precision: Number(e.target.value)})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                  <option value={2}>2 Decimals (0.00)</option>
                  <option value={3}>3 Decimals (0.000)</option>
                  <option value={4}>4 Decimals (0.0000)</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-onyx-border/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={weights.requireGrossWeight} onChange={e => setWeights({...weights, requireGrossWeight: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Gross Weight is Mandatory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={weights.requireNetWeight} onChange={e => setWeights({...weights, requireNetWeight: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Net Weight is Mandatory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={weights.requireStoneWeight} onChange={e => setWeights({...weights, requireStoneWeight: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Stone Weight is Mandatory if stones exist</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing Settings */}
        <div className="bg-onyx border border-onyx-border rounded-xl p-6">
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Pricing Formulas</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Making Charge Calc</label>
                <select value={pricing.makingChargeMethod} onChange={e => setPricing({...pricing, makingChargeMethod: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                  <option value="PER_GRAM">Per Gram Rate</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage (%) of Metal Value</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Default Value</label>
                <input type="number" value={pricing.defaultMakingCharge} onChange={e => setPricing({...pricing, defaultMakingCharge: Number(e.target.value)})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
              </div>
              
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Wastage Calc</label>
                <select value={pricing.wastageMethod} onChange={e => setPricing({...pricing, wastageMethod: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                  <option value="PERCENTAGE">Percentage (%) of Net Wt</option>
                  <option value="FIXED_WEIGHT">Fixed Weight</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Default Wastage</label>
                <input type="number" value={pricing.defaultWastage} onChange={e => setPricing({...pricing, defaultWastage: Number(e.target.value)})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-onyx-border/50 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pricing.allowMakingOverride} onChange={e => setPricing({...pricing, allowMakingOverride: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Allow users to override making charge during creation</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
