import React from "react";
import { CreditCard, Tag, PiggyBank, AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function BillingPoliciesTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Credit Settings */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#C9943A]" />
          7. Credit Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.credit?.allowCreditSales ?? false} onChange={e => updateConfig('credit', 'allowCreditSales', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Credit Sales</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Default Credit Limit (₹)</span>
            <input type="number" value={config.credit?.defaultCreditLimit ?? 0} onChange={e => updateConfig('credit', 'defaultCreditLimit', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Maximum Due Days</span>
            <input type="number" value={config.credit?.maximumDueDays ?? 30} onChange={e => updateConfig('credit', 'maximumDueDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Interest on Overdue (%)</span>
            <input type="number" step="0.1" value={config.credit?.interestOnOverdue ?? 0} onChange={e => updateConfig('credit', 'interestOnOverdue', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.credit?.approvalRequiredAboveLimit ?? true} onChange={e => updateConfig('credit', 'approvalRequiredAboveLimit', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Approval Req. Above Limit</span>
          </label>
        </div>
      </section>

      {/* Discount Permissions */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#C9943A]" />
          8. Discount Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Default Discount (%)</span>
            <input type="number" step="0.1" value={config.discount?.defaultCustomerDiscount ?? 0} onChange={e => updateConfig('discount', 'defaultCustomerDiscount', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Maximum Discount (%)</span>
            <input type="number" step="0.1" value={config.discount?.maximumDiscount ?? 10} onChange={e => updateConfig('discount', 'maximumDiscount', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.discount?.managerApprovalRequired ?? true} onChange={e => updateConfig('discount', 'managerApprovalRequired', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Manager Approval Required</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.discount?.specialPricingForVIPs ?? true} onChange={e => updateConfig('discount', 'specialPricingForVIPs', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Special Pricing for VIPs</span>
          </label>
        </div>
      </section>

      {/* Saving Scheme Preferences */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-[#C9943A]" />
          9. Saving Scheme Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.schemes?.allowEnrollment ?? true} onChange={e => updateConfig('schemes', 'allowEnrollment', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Scheme Enrollment</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.schemes?.autoDebitReminder ?? true} onChange={e => updateConfig('schemes', 'autoDebitReminder', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Debit/Due Reminders</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.schemes?.autoRenewal ?? false} onChange={e => updateConfig('schemes', 'autoRenewal', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Renewal</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Max Active Schemes</span>
            <input type="number" value={config.schemes?.maximumActiveSchemes ?? 5} onChange={e => updateConfig('schemes', 'maximumActiveSchemes', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Grace Period (Days)</span>
            <input type="number" value={config.schemes?.gracePeriodDays ?? 5} onChange={e => updateConfig('schemes', 'gracePeriodDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Early Closure Rules</span>
            <select value={config.schemes?.earlyClosureRules ?? "allowed_with_penalty"} onChange={e => updateConfig('schemes', 'earlyClosureRules', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="allowed">Allowed</option>
              <option value="allowed_with_penalty">Allowed (with penalty)</option>
              <option value="not_allowed">Not Allowed</option>
            </select>
          </div>
        </div>
      </section>

      {/* Purchase Restrictions */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#C9943A]" />
          14. Purchase Restrictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Min Purchase Amount (₹)</span>
            <input type="number" value={config.purchase?.minimumPurchaseAmount ?? 1} onChange={e => updateConfig('purchase', 'minimumPurchaseAmount', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Max Purchase Amount (0 = No Limit)</span>
            <input type="number" value={config.purchase?.maximumPurchaseAmount ?? 0} onChange={e => updateConfig('purchase', 'maximumPurchaseAmount', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.purchase?.ageVerificationRequired ?? false} onChange={e => updateConfig('purchase', 'ageVerificationRequired', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Age Verification Req.</span>
          </label>
        </div>
      </section>

      {/* Returns & Exchange */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-[#C9943A]" />
          15. Returns & Exchange
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Return Window (Days)</span>
            <input type="number" value={config.returns?.returnWindowDays ?? 15} onChange={e => updateConfig('returns', 'returnWindowDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Exchange Window (Days)</span>
            <input type="number" value={config.returns?.exchangeWindowDays ?? 30} onChange={e => updateConfig('returns', 'exchangeWindowDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Refund Method</span>
            <select value={config.returns?.refundMethod ?? "store_credit"} onChange={e => updateConfig('returns', 'refundMethod', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="store_credit">Store Credit Only</option>
              <option value="original_payment">Original Payment Method</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.returns?.buybackEligibility ?? true} onChange={e => updateConfig('returns', 'buybackEligibility', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Eligible for Buyback</span>
          </label>
        </div>
      </section>

    </div>
  );
}
