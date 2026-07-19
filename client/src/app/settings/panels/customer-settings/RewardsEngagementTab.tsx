import React from "react";
import { Gift, Wallet, Users, Link, Plus, Trash2 } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  updateRootConfig: (key: string, value: any) => void;
  isAdmin: boolean;
}

export default function RewardsEngagementTab({ config, updateConfig, updateRootConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Loyalty Program */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#C9943A]" />
          4. Loyalty Program
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.loyalty?.enableLoyalty ?? true} onChange={e => updateConfig('loyalty', 'enableLoyalty', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Loyalty Program</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Points per ₹ Spent</span>
            <input type="number" step="0.01" value={config.loyalty?.pointsPerRupeeSpent ?? 0.1} onChange={e => updateConfig('loyalty', 'pointsPerRupeeSpent', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Minimum Redemption</span>
            <input type="number" value={config.loyalty?.minimumRedemption ?? 100} onChange={e => updateConfig('loyalty', 'minimumRedemption', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Maximum Redemption</span>
            <input type="number" value={config.loyalty?.maximumRedemption ?? 10000} onChange={e => updateConfig('loyalty', 'maximumRedemption', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Point Expiry (Days)</span>
            <input type="number" value={config.loyalty?.pointExpiryDays ?? 365} onChange={e => updateConfig('loyalty', 'pointExpiryDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Birthday Bonus Points</span>
            <input type="number" value={config.loyalty?.birthdayBonusPoints ?? 500} onChange={e => updateConfig('loyalty', 'birthdayBonusPoints', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
        </div>
      </section>

      {/* Customer Wallet */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#C9943A]" />
          5. Customer Wallet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.wallet?.enableWallet ?? true} onChange={e => updateConfig('wallet', 'enableWallet', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Wallet System</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.wallet?.cashWallet ?? true} onChange={e => updateConfig('wallet', 'cashWallet', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Cash Wallet</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.wallet?.goldWallet ?? false} onChange={e => updateConfig('wallet', 'goldWallet', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Gold Wallet</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.wallet?.storeCredit ?? true} onChange={e => updateConfig('wallet', 'storeCredit', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Store Credit</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Wallet Expiry (Days, 0 = Never)</span>
            <input type="number" value={config.wallet?.walletExpiryDays ?? 0} onChange={e => updateConfig('wallet', 'walletExpiryDays', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Minimum Wallet Balance</span>
            <input type="number" value={config.wallet?.minimumWalletBalance ?? 0} onChange={e => updateConfig('wallet', 'minimumWalletBalance', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
        </div>
      </section>

      {/* Customer Groups */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C9943A]" />
            6. Customer Groups
          </h3>
          {isAdmin && (
            <button 
              onClick={() => {
                const newGroups = [...(config.groups || [])];
                newGroups.push({ id: Date.now().toString(), name: "New Group", defaultDiscount: 0, loyaltyMultiplier: 1, creditLimit: 0, exclusiveOffers: false });
                updateRootConfig('groups', newGroups);
              }}
              className="flex items-center gap-1 text-[11px] text-[#C9943A] hover:text-[#E8B84B] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Group
            </button>
          )}
        </div>
        <div className="space-y-3">
          {(config.groups || []).map((group: any, idx: number) => (
            <div key={group.id} className="grid grid-cols-2 md:grid-cols-6 gap-3 p-3 rounded-lg bg-[#111113] border border-[#1F1F24] items-center">
              <div className="space-y-1 col-span-2 md:col-span-1">
                <span className="text-[10px] text-platinum-muted">Group Name</span>
                <input type="text" value={group.name} onChange={e => {
                  const newGroups = [...config.groups];
                  newGroups[idx].name = e.target.value;
                  updateRootConfig('groups', newGroups);
                }} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-platinum-muted">Def. Discount (%)</span>
                <input type="number" step="0.1" value={group.defaultDiscount} onChange={e => {
                  const newGroups = [...config.groups];
                  newGroups[idx].defaultDiscount = Number(e.target.value);
                  updateRootConfig('groups', newGroups);
                }} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-platinum-muted">Loyalty Mult. (x)</span>
                <input type="number" step="0.1" value={group.loyaltyMultiplier} onChange={e => {
                  const newGroups = [...config.groups];
                  newGroups[idx].loyaltyMultiplier = Number(e.target.value);
                  updateRootConfig('groups', newGroups);
                }} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-platinum-muted">Credit Limit (₹)</span>
                <input type="number" value={group.creditLimit} onChange={e => {
                  const newGroups = [...config.groups];
                  newGroups[idx].creditLimit = Number(e.target.value);
                  updateRootConfig('groups', newGroups);
                }} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
              </div>
              <div className="flex items-center justify-between col-span-2 md:col-span-1 mt-4 md:mt-0">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={group.exclusiveOffers} onChange={e => {
                    const newGroups = [...config.groups];
                    newGroups[idx].exclusiveOffers = e.target.checked;
                    updateRootConfig('groups', newGroups);
                  }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
                  <span className="text-[11px] text-platinum">Excl. Offers</span>
                </label>
                {isAdmin && (
                  <button onClick={() => {
                    const newGroups = config.groups.filter((_: any, i: number) => i !== idx);
                    updateRootConfig('groups', newGroups);
                  }} className="text-[#6B6560] hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!config.groups || config.groups.length === 0) && (
            <p className="text-[11px] text-platinum-muted italic">No customer groups defined.</p>
          )}
        </div>
      </section>

      {/* Referral Program */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Link className="w-4 h-4 text-[#C9943A]" />
          16. Referral Program
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.referral?.enableReferral ?? true} onChange={e => updateConfig('referral', 'enableReferral', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Referral Program</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Referral Reward (₹)</span>
            <input type="number" value={config.referral?.referralReward ?? 500} onChange={e => updateConfig('referral', 'referralReward', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Referrer Reward (₹)</span>
            <input type="number" value={config.referral?.referrerReward ?? 500} onChange={e => updateConfig('referral', 'referrerReward', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Min Purchase for Reward (₹)</span>
            <input type="number" value={config.referral?.minimumPurchaseForReward ?? 5000} onChange={e => updateConfig('referral', 'minimumPurchaseForReward', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
        </div>
      </section>

    </div>
  );
}
