import React from "react";
import { Lock, Truck, FileCheck, MinusCircle } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function StockManagementTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 9. Stock Reservation */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#C9943A]" />
          9. Stock Reservation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.reservation?.enableReservation ?? true} onChange={e => updateConfig('reservation', 'enableReservation', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Stock Reservation</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Reservation Timeout (Hours)</span>
            <input type="number" value={config.reservation?.timeoutHours ?? 48} onChange={e => updateConfig('reservation', 'timeoutHours', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.reservation?.autoRelease ?? true} onChange={e => updateConfig('reservation', 'autoRelease', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Release Reserved Stock</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.reservation?.reserveDuringDraft ?? false} onChange={e => updateConfig('reservation', 'reserveDuringDraft', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Reserve During Draft Invoice</span>
          </label>
        </div>
      </section>

      {/* 10. Inventory Transfer */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#C9943A]" />
          10. Inventory Transfer Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.transfer?.approvalRequired ?? true} onChange={e => updateConfig('transfer', 'approvalRequired', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Transfer Approval Required</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.transfer?.autoReceive ?? false} onChange={e => updateConfig('transfer', 'autoReceive', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Receive Transfer</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.transfer?.partialAllowed ?? false} onChange={e => updateConfig('transfer', 'partialAllowed', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Partial Transfer Allowed</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.transfer?.printChallan ?? true} onChange={e => updateConfig('transfer', 'printChallan', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Print Transfer Challan</span>
          </label>
        </div>
      </section>

      {/* 11. Stock Audit */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#C9943A]" />
          11. Stock Audit Config
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.audit?.barcodeAudit ?? true} onChange={e => updateConfig('audit', 'barcodeAudit', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enforce Barcode Audit</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.audit?.huidAudit ?? true} onChange={e => updateConfig('audit', 'huidAudit', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enforce HUID Audit</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Weight Tolerance (g)</span>
            <input type="number" step="0.001" value={config.audit?.weightTolerance ?? 0.05} onChange={e => updateConfig('audit', 'weightTolerance', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.audit?.autoAdjust ?? false} onChange={e => updateConfig('audit', 'autoAdjust', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Inventory Adjustment</span>
          </label>
        </div>
      </section>

      {/* 13. Negative Stock */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <MinusCircle className="w-4 h-4 text-[#C9943A]" />
          13. Negative Stock Rules
        </h3>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
          <p className="text-[12px] text-amber-200">
            Allowing negative stock can cause discrepancies in your inventory ledger and valuation. Use with extreme caution.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113] col-span-2">
            <span className="text-[11px] text-platinum-muted block">Negative Stock Policy</span>
            <select value={config.negativeStock?.policy ?? "never"} onChange={e => updateConfig('negativeStock', 'policy', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="never">Never Allow</option>
              <option value="manager">Allow (Manager Approval Required)</option>
              <option value="admin">Allow (Admin Approval Required)</option>
              <option value="always">Always Allow</option>
            </select>
          </div>
        </div>
      </section>

    </div>
  );
}
