import React from "react";
import { Bell, Megaphone, Settings2, Globe, Activity } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function CommunicationPortalTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Notification Settings */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#C9943A]" />
          10. Notification Settings
        </h3>
        
        <div className="space-y-3">
          <p className="text-[12px] text-platinum">Enabled Channels:</p>
          <div className="flex flex-wrap gap-4">
            {['sms', 'whatsapp', 'email', 'push'].map(channel => (
              <label key={`chan-${channel}`} className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#111113] border border-[#1F1F24]">
                <input type="checkbox" checked={config.notifications?.[channel] ?? false} onChange={e => updateConfig('notifications', channel, e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-3.5 h-3.5" />
                <span className="text-[12px] text-platinum capitalize">{channel}</span>
              </label>
            ))}
          </div>

          <p className="text-[12px] text-platinum pt-2">Trigger Events:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'purchaseConfirmation', label: 'Purchase Confirmation' },
              { key: 'paymentReceipt', label: 'Payment Receipt' },
              { key: 'schemeDueReminder', label: 'Scheme Due Reminder' },
              { key: 'birthdayWishes', label: 'Birthday Wishes' },
              { key: 'anniversaryWishes', label: 'Anniversary Wishes' },
              { key: 'goldRateAlerts', label: 'Gold Rate Alerts' },
              { key: 'offerNotifications', label: 'Offer Notifications' },
              { key: 'orderReadyForPickup', label: 'Order Ready' },
            ].map(event => (
              <label key={event.key} className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
                <input type="checkbox" checked={config.notifications?.events?.[event.key] ?? false} onChange={e => {
                  const newEvents = { ...(config.notifications?.events || {}), [event.key]: e.target.checked };
                  updateConfig('notifications', 'events', newEvents);
                }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4 shrink-0" />
                <span className="text-[11px] text-platinum leading-tight">{event.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing Preferences */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#C9943A]" />
          11. Marketing Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.marketing?.receivePromotions ?? true} onChange={e => updateConfig('marketing', 'receivePromotions', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Send General Promotions</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.marketing?.goldRateUpdates ?? false} onChange={e => updateConfig('marketing', 'goldRateUpdates', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Daily Gold Rate Updates</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.marketing?.festivalOffers ?? true} onChange={e => updateConfig('marketing', 'festivalOffers', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Festival Special Offers</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.marketing?.newCollectionAlerts ?? true} onChange={e => updateConfig('marketing', 'newCollectionAlerts', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">New Collection Alerts</span>
          </label>
        </div>
      </section>

      {/* Customer Portal */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#C9943A]" />
          17. Customer Portal Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.customerLoginEnabled ?? true} onChange={e => updateConfig('portal', 'customerLoginEnabled', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Enable Customer Portal</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.orderHistory ?? true} onChange={e => updateConfig('portal', 'orderHistory', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Order History</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.downloadInvoices ?? true} onChange={e => updateConfig('portal', 'downloadInvoices', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Download Invoices</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.viewSavingSchemes ?? true} onChange={e => updateConfig('portal', 'viewSavingSchemes', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">View Saving Schemes</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.viewWalletBalance ?? true} onChange={e => updateConfig('portal', 'viewWalletBalance', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">View Wallet Balance</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.trackRepairs ?? true} onChange={e => updateConfig('portal', 'trackRepairs', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Track Repairs/Orders</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.portal?.updateProfile ?? true} onChange={e => updateConfig('portal', 'updateProfile', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Allow Profile Updates</span>
          </label>
        </div>
      </section>

      {/* Customer Analytics */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C9943A]" />
          20. Customer Analytics Tracking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.analytics?.trackLTV ?? true} onChange={e => updateConfig('analytics', 'trackLTV', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Track Lifetime Value (LTV)</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.analytics?.trackAOV ?? true} onChange={e => updateConfig('analytics', 'trackAOV', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Track Avg Order Value</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.analytics?.trackVisits ?? true} onChange={e => updateConfig('analytics', 'trackVisits', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Track Total Visits</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.analytics?.trackFavoriteCategories ?? true} onChange={e => updateConfig('analytics', 'trackFavoriteCategories', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Track Favorite Categories</span>
          </label>
        </div>
      </section>

    </div>
  );
}
