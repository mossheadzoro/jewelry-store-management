import React from "react";
import { Building2, BookOpen, ShieldCheck, Printer, UserCog } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function CoreOperationsTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 6. Branch Inventory */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#C9943A]" />
          6. Branch Inventory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.branchInv?.branchWiseInventory ?? true} onChange={e => updateConfig('branchInv', 'branchWiseInventory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Branch-wise Inventory</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.branchInv?.sharedInventory ?? false} onChange={e => updateConfig('branchInv', 'sharedInventory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Shared Inventory View</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.branchInv?.branchCostTracking ?? true} onChange={e => updateConfig('branchInv', 'branchCostTracking', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Branch Cost Tracking</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.branchInv?.productTransferAllowed ?? true} onChange={e => updateConfig('branchInv', 'productTransferAllowed', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Product Transfers</span>
          </label>
        </div>
      </section>

      {/* 7. Inventory Ledger */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C9943A]" />
          7. Inventory Ledger Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.ledger?.enableHistory ?? true} onChange={e => updateConfig('ledger', 'enableHistory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Inventory History</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.ledger?.recordEveryMovement ?? true} onChange={e => updateConfig('ledger', 'recordEveryMovement', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Record Every Movement</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Lock Ledger After (Days)</span>
            <input type="number" value={config.ledger?.lockDays ?? 30} onChange={e => updateConfig('ledger', 'lockDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.ledger?.allowEditing ?? false} onChange={e => updateConfig('ledger', 'allowEditing', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Ledger Editing</span>
          </label>
        </div>
      </section>

      {/* 12. Hallmark Settings */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C9943A]" />
          12. Hallmark Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.hallmark?.huidMandatory ?? true} onChange={e => updateConfig('hallmark', 'huidMandatory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">HUID Mandatory</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.hallmark?.lockDuplicateHUID ?? true} onChange={e => updateConfig('hallmark', 'lockDuplicateHUID', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Lock Duplicate HUID</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.hallmark?.printOnInvoice ?? true} onChange={e => updateConfig('hallmark', 'printOnInvoice', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Print HUID On Invoice</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.hallmark?.printOnTag ?? true} onChange={e => updateConfig('hallmark', 'printOnTag', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Print HUID On Tag</span>
          </label>
        </div>
      </section>

      {/* 15. Barcode & Tag Printing */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Printer className="w-4 h-4 text-[#C9943A]" />
          15. Barcode & Tag Printing
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113] w-fit">
            <input type="checkbox" checked={config.barcode?.autoPrint ?? false} onChange={e => updateConfig('barcode', 'autoPrint', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Print Tag After Product Creation</span>
          </label>
          
          <p className="text-[12px] text-platinum pt-2">Information to Include on Tag:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { key: 'barcode', label: 'Barcode' },
              { key: 'productCode', label: 'Product Code' },
              { key: 'productName', label: 'Product Name' },
              { key: 'grossWeight', label: 'Gross Weight' },
              { key: 'netWeight', label: 'Net Weight' },
              { key: 'purity', label: 'Purity' },
              { key: 'huid', label: 'HUID' },
              { key: 'branch', label: 'Branch' },
              { key: 'stoneWeight', label: 'Stone Weight' },
              { key: 'price', label: 'Price' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1F1F24] bg-[#111113]">
                <input type="checkbox" checked={config.barcode?.tagFields?.[item.key] ?? true} onChange={e => {
                  const newFields = { ...(config.barcode?.tagFields || {}), [item.key]: e.target.checked };
                  updateConfig('barcode', 'tagFields', newFields);
                }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4 shrink-0" />
                <span className="text-[11px] text-platinum">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 19. Karigar Inventory */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <UserCog className="w-4 h-4 text-[#C9943A]" />
          19. Karigar Inventory Config
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.karigar?.trackRemainingMetal ?? true} onChange={e => updateConfig('karigar', 'trackRemainingMetal', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Track Remaining Metal</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.karigar?.fineGoldCalculation ?? true} onChange={e => updateConfig('karigar', 'fineGoldCalculation', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Fine Gold Calculation</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.karigar?.wastageTracking ?? true} onChange={e => updateConfig('karigar', 'wastageTracking', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Strict Wastage Tracking</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Remaining Metal Policy</span>
            <select value={config.karigar?.remainingPolicy ?? "hold"} onChange={e => updateConfig('karigar', 'remainingPolicy', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="hold">Hold with Karigar</option>
              <option value="return">Must Return immediately</option>
            </select>
          </div>
        </div>
      </section>

    </div>
  );
}
