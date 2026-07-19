import React, { useState } from "react";
import { Save } from "lucide-react";

export default function OtherSettingsTab({ settings, onSaveAll }: { settings: any, onSaveAll: (d: any) => Promise<boolean> }) {
  const [data, setData] = useState({
    stoneConfig: settings?.stoneConfig || { defaultRate: 0, requireCert: false },
    hallmarkConfig: settings?.hallmarkConfig || { mandatoryForGold: false, defaultCharge: 0 },
    mediaConfig: settings?.mediaConfig || { maxImages: 5, autoCompress: true },
    inventoryConfig: settings?.inventoryConfig || { allowNegative: false, lowStockAlert: 5 }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSaveAll(data);
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum">Additional Settings</h3>
          <p className="text-[13px] text-platinum-muted">Hallmarking, inventory, media, and stones defaults.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hallmarking */}
        <div className="bg-onyx border border-onyx-border rounded-xl p-5">
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Hallmark Settings</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.hallmarkConfig.mandatoryForGold} onChange={e => setData({...data, hallmarkConfig: {...data.hallmarkConfig, mandatoryForGold: e.target.checked}})} className="accent-gold w-4 h-4" />
              <span className="text-[13px] text-platinum">Hallmark (HUID) Mandatory for Gold Sales</span>
            </label>
            <div>
              <label className="block text-[12px] text-platinum-muted mb-1.5">Default Hallmark Charge</label>
              <input type="number" value={data.hallmarkConfig.defaultCharge} onChange={e => setData({...data, hallmarkConfig: {...data.hallmarkConfig, defaultCharge: Number(e.target.value)}})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-onyx border border-onyx-border rounded-xl p-5">
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Media & Images</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.mediaConfig.autoCompress} onChange={e => setData({...data, mediaConfig: {...data.mediaConfig, autoCompress: e.target.checked}})} className="accent-gold w-4 h-4" />
              <span className="text-[13px] text-platinum">Auto Compress Images before upload</span>
            </label>
            <div>
              <label className="block text-[12px] text-platinum-muted mb-1.5">Max Images per Product</label>
              <input type="number" value={data.mediaConfig.maxImages} onChange={e => setData({...data, mediaConfig: {...data.mediaConfig, maxImages: Number(e.target.value)}})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-onyx border border-onyx-border rounded-xl p-5 md:col-span-2">
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Inventory Defaults</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.inventoryConfig.allowNegative} onChange={e => setData({...data, inventoryConfig: {...data.inventoryConfig, allowNegative: e.target.checked}})} className="accent-gold w-4 h-4" />
              <span className="text-[13px] text-platinum">Allow Negative Stock (Sell before receiving)</span>
            </label>
            <div>
              <label className="block text-[12px] text-platinum-muted mb-1.5">Global Low Stock Alert Level</label>
              <input type="number" value={data.inventoryConfig.lowStockAlert} onChange={e => setData({...data, inventoryConfig: {...data.inventoryConfig, lowStockAlert: Number(e.target.value)}})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
