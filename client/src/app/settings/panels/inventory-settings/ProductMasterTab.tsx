import React from "react";
import { Package, Gem, Settings2, Scale, Image as ImageIcon, Box } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function ProductMasterTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Product Master Settings */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Package className="w-4 h-4 text-[#C9943A]" />
          1. Product Master Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.product?.autoGenerateCode ?? true} onChange={e => updateConfig('product', 'autoGenerateCode', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Generate Product Code</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Product Code Prefix</span>
            <input type="text" value={config.product?.codePrefix ?? "PRD"} onChange={e => updateConfig('product', 'codePrefix', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.product?.huidRequired ?? true} onChange={e => updateConfig('product', 'huidRequired', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">HUID Required (Gold Only)</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.product?.huidUniqueValidation ?? true} onChange={e => updateConfig('product', 'huidUniqueValidation', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">HUID Unique Validation</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.product?.allowZeroPrice ?? false} onChange={e => updateConfig('product', 'allowZeroPrice', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Zero Price Product</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.product?.allowDescriptionEditing ?? true} onChange={e => updateConfig('product', 'allowDescriptionEditing', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Description Editing</span>
          </label>
        </div>
      </section>

      {/* 2 & 3. Metal & Purity Configuration */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Gem className="w-4 h-4 text-[#C9943A]" />
          2 & 3. Metal & Purity Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113] col-span-2">
            <span className="text-[11px] text-platinum-muted block">Supported Metals</span>
            <div className="flex gap-4 mt-2">
              {['Gold', 'Silver', 'Platinum', 'Diamond'].map(metal => (
                <label key={metal} className="flex items-center gap-2">
                  <input type="checkbox" checked={config.metal?.supported?.includes(metal) ?? (metal === 'Gold' || metal === 'Silver')} onChange={e => {
                    const current = config.metal?.supported || ['Gold', 'Silver'];
                    const updated = e.target.checked ? [...current, metal] : current.filter((m: string) => m !== metal);
                    updateConfig('metal', 'supported', updated);
                  }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
                  <span className="text-[12px] text-platinum">{metal}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Default Metal</span>
            <select value={config.metal?.defaultMetal ?? "Gold"} onChange={e => updateConfig('metal', 'defaultMetal', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.purity?.allowCustomPurity ?? false} onChange={e => updateConfig('purity', 'allowCustomPurity', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Custom Purity</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113] col-span-2 lg:col-span-4">
            <span className="text-[11px] text-platinum-muted block">Allowed Purities</span>
            <div className="flex flex-wrap gap-4 mt-2">
              {['24K', '22K', '20K', '18K', '14K', '999', '925'].map(purity => (
                <label key={purity} className="flex items-center gap-2">
                  <input type="checkbox" checked={config.purity?.allowed?.includes(purity) ?? true} onChange={e => {
                    const current = config.purity?.allowed || ['24K', '22K', '20K', '18K', '14K', '999', '925'];
                    const updated = e.target.checked ? [...current, purity] : current.filter((p: string) => p !== purity);
                    updateConfig('purity', 'allowed', updated);
                  }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
                  <span className="text-[12px] text-platinum">{purity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Weight Settings */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#C9943A]" />
          4. Weight Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Decimal Precision</span>
            <input type="number" value={config.weight?.precision ?? 3} onChange={e => updateConfig('weight', 'precision', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.weight?.autoCalcNetWeight ?? true} onChange={e => updateConfig('weight', 'autoCalcNetWeight', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Calc Net Weight</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.weight?.stoneWeightIncluded ?? true} onChange={e => updateConfig('weight', 'stoneWeightIncluded', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Include Stone in Gross</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.weight?.validateGrossGteNet ?? true} onChange={e => updateConfig('weight', 'validateGrossGteNet', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Validate Gross ≥ Net</span>
          </label>
        </div>
      </section>

      {/* 5. Stone Settings */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Box className="w-4 h-4 text-[#C9943A]" />
          5. Stone Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.stone?.enableTracking ?? true} onChange={e => updateConfig('stone', 'enableTracking', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Stone Tracking</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.stone?.allowMultiple ?? true} onChange={e => updateConfig('stone', 'allowMultiple', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Multiple Stones</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.stone?.imageRequired ?? false} onChange={e => updateConfig('stone', 'imageRequired', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Stone Image Required</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.stone?.autoCalcPrice ?? true} onChange={e => updateConfig('stone', 'autoCalcPrice', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Calculate Stone Price</span>
          </label>
        </div>
      </section>

      {/* 14. Product Images */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#C9943A]" />
          14. Product Images
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.images?.imageMandatory ?? false} onChange={e => updateConfig('images', 'imageMandatory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Image Mandatory</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.images?.multipleImages ?? true} onChange={e => updateConfig('images', 'multipleImages', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Multiple Images</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.images?.autoCompress ?? true} onChange={e => updateConfig('images', 'autoCompress', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Compress Images</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Maximum Size (MB)</span>
            <input type="number" value={config.images?.maxSizeMB ?? 5} onChange={e => updateConfig('images', 'maxSizeMB', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
        </div>
      </section>

    </div>
  );
}
