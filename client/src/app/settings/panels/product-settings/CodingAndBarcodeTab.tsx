import React, { useState } from "react";
import { Save } from "lucide-react";

export default function CodingAndBarcodeTab({ config, onSave }: { config: any, onSave: (d: any) => Promise<boolean> }) {
  const [data, setData] = useState({
    skuGeneration: config?.skuGeneration || "AUTO", // AUTO or MANUAL
    skuPrefix: config?.skuPrefix || "PRD-",
    resetCounterYearly: config?.resetCounterYearly ?? true,
    autoGenerateBarcode: config?.autoGenerateBarcode ?? true,
    barcodeFormat: config?.barcodeFormat || "CODE128",
    printAfterCreation: config?.printAfterCreation ?? true,
    qrSupport: config?.qrSupport ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum">SKU & Barcode Config</h3>
          <p className="text-[13px] text-platinum-muted">Define how product codes and labels are generated.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-onyx border border-onyx-border rounded-xl p-6 space-y-6">
        <div>
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Product Code (SKU)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] text-platinum-muted mb-1.5">Generation Method</label>
              <select value={data.skuGeneration} onChange={e => setData({...data, skuGeneration: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                <option value="AUTO">Auto Generate (Sequential)</option>
                <option value="MANUAL">Manual Entry</option>
              </select>
            </div>
            {data.skuGeneration === "AUTO" && (
              <>
                <div>
                  <label className="block text-[12px] text-platinum-muted mb-1.5">SKU Prefix</label>
                  <input type="text" value={data.skuPrefix} onChange={e => setData({...data, skuPrefix: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" placeholder="e.g. PRD-" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={data.resetCounterYearly} onChange={e => setData({...data, resetCounterYearly: e.target.checked})} className="accent-gold w-4 h-4" />
                    <span className="text-[13px] text-platinum">Reset Running Number Yearly (e.g. PRD-2026-0001)</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2 mt-4">Barcode Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.autoGenerateBarcode} onChange={e => setData({...data, autoGenerateBarcode: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Auto Generate Barcode Numbers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.printAfterCreation} onChange={e => setData({...data, printAfterCreation: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Prompt to Print Tag after Product Creation</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.qrSupport} onChange={e => setData({...data, qrSupport: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Enable QR Code Printing</span>
              </label>
            </div>
            
            <div className="mt-2">
              <label className="block text-[12px] text-platinum-muted mb-1.5">Barcode Format</label>
              <select value={data.barcodeFormat} onChange={e => setData({...data, barcodeFormat: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                <option value="CODE128">CODE128 (Standard)</option>
                <option value="EAN13">EAN-13 (Retail)</option>
                <option value="UPC">UPC-A</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
