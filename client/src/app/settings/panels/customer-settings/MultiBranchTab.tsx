import React from "react";
import { Building2, Share2 } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function MultiBranchTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Multi-Branch Settings */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#C9943A]" />
          19. Multi-Branch Settings
        </h3>
        
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-blue-200">
          <Share2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[12px] leading-relaxed">
            These settings control how customer data is shared between different branches of your business. 
            If you operate a single branch, these settings will have no effect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.multiBranch?.shareCustomerAcrossBranches ?? true} onChange={e => updateConfig('multiBranch', 'shareCustomerAcrossBranches', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <div className="space-y-0.5">
              <span className="text-[12px] text-platinum block">Share Customer Base</span>
              <span className="text-[10px] text-platinum-muted block">Allow branches to see all customers</span>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.multiBranch?.centralizedLoyaltyPoints ?? true} onChange={e => updateConfig('multiBranch', 'centralizedLoyaltyPoints', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <div className="space-y-0.5">
              <span className="text-[12px] text-platinum block">Centralize Loyalty</span>
              <span className="text-[10px] text-platinum-muted block">Points can be redeemed anywhere</span>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.multiBranch?.crossBranchPurchaseHistory ?? true} onChange={e => updateConfig('multiBranch', 'crossBranchPurchaseHistory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <div className="space-y-0.5">
              <span className="text-[12px] text-platinum block">Cross-Branch History</span>
              <span className="text-[10px] text-platinum-muted block">Show purchases from all branches</span>
            </div>
          </label>
        </div>
      </section>

    </div>
  );
}
