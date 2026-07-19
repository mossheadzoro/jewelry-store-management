import React from "react";
import { Calculator, ShieldAlert, Settings } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  updateRootConfig: (key: string, value: any) => void;
  isAdmin: boolean;
}

export default function FinancialRulesTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 8. Inventory Costing */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#C9943A]" />
          8. Inventory Costing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Costing Method</span>
            <select value={config.costing?.method ?? "WAC"} onChange={e => updateConfig('costing', 'method', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="WAC">Weighted Average Cost (WAC)</option>
              <option value="FIFO">First In, First Out (FIFO)</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.costing?.autoRecalculate ?? true} onChange={e => updateConfig('costing', 'autoRecalculate', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Recalculate Cost</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.costing?.negativeCostPrevention ?? true} onChange={e => updateConfig('costing', 'negativeCostPrevention', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Negative Cost Prevention</span>
          </label>
        </div>
      </section>

      {/* 17. Inventory Permissions */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C9943A]" />
          17. Action Permissions (Require Admin/Manager)
        </h3>
        <p className="text-[11px] text-platinum-muted">Select actions that require elevated permissions to execute.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {[
            { key: 'editWeight', label: 'Edit Weight' },
            { key: 'editPurity', label: 'Edit Purity' },
            { key: 'deleteProduct', label: 'Delete Product' },
            { key: 'editBarcode', label: 'Edit Barcode' },
            { key: 'editHUID', label: 'Edit HUID' },
            { key: 'manualAdjustment', label: 'Manual Stock Adjustment' },
            { key: 'costOverride', label: 'Cost Override' },
          ].map(perm => (
            <label key={perm.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1F1F24] bg-[#111113]">
              <input type="checkbox" checked={config.permissions?.[perm.key] ?? true} onChange={e => {
                updateConfig('permissions', perm.key, e.target.checked);
              }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4 shrink-0" />
              <span className="text-[11px] text-platinum">{perm.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 20. Advanced Inventory */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#C9943A]" />
          20. Advanced Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.advanced?.dailyClosingSnapshot ?? true} onChange={e => updateConfig('advanced', 'dailyClosingSnapshot', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Daily Closing Snapshot</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.advanced?.autoBackupBeforeAdj ?? true} onChange={e => updateConfig('advanced', 'autoBackupBeforeAdj', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Backup Before Adjustment</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.advanced?.freezeAfterAudit ?? true} onChange={e => updateConfig('advanced', 'freezeAfterAudit', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Inventory Freeze After Audit</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Inventory Lock Date</span>
            <input type="date" value={config.advanced?.lockDate ?? ""} onChange={e => updateConfig('advanced', 'lockDate', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50 [color-scheme:dark]" />
          </div>
        </div>
      </section>

    </div>
  );
}
