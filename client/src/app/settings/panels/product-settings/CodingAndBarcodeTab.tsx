import React, { useState, useRef } from "react";
import { Save, Image as ImageIcon, Upload, X, Tag, AlignJustify, AlignLeft, BarChart2, Crop } from "lucide-react";
import LogoCropperModal from "@/components/ui/LogoCropperModal";

export default function CodingAndBarcodeTab({ config, onSave }: { config: any, onSave: (d: any) => Promise<boolean> }) {
  const [data, setData] = useState({
    skuGeneration: config?.skuGeneration || "AUTO",
    skuPrefix: config?.skuPrefix || "PRD-",
    resetCounterYearly: config?.resetCounterYearly ?? true,
    autoGenerateBarcode: config?.autoGenerateBarcode ?? true,
    barcodeFormat: config?.barcodeFormat || "CODE128",
    printAfterCreation: config?.printAfterCreation ?? true,
    printLogo: config?.printLogo ?? false,
    logoUrl: config?.logoUrl || "",
    printLayout: config?.printLayout || "standard",
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for the preview modal
  const [previewLayout, setPreviewLayout] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<File | string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageForCrop(file);
      setCropperOpen(true);
      e.target.value = "";
    }
  };

  const handleCropComplete = (file: File, previewUrl: string) => {
    setData((prev) => ({ ...prev, logoUrl: previewUrl }));
  };

  const layouts = [
    { id: "standard", name: "Standard Tag", desc: "Classic rectangular layout", icon: <Tag className="w-6 h-6 text-platinum" /> },
    { id: "dumbbell", name: "Dumbbell Label", desc: "Standard jewelry wrap-around", icon: <AlignJustify className="w-6 h-6 text-platinum" /> },
    { id: "rat_tail", name: "Rat-tail Label", desc: "Long tail for rings & chains", icon: <AlignLeft className="w-6 h-6 text-platinum" /> },
    { id: "compact", name: "Compact Square", desc: "Minimalist small footprint", icon: <BarChart2 className="w-6 h-6 text-platinum" /> },
  ];

  const handleLayoutSelect = (id: string) => {
    setPreviewLayout(id);
  };

  const confirmLayout = () => {
    if (previewLayout) {
      setData({ ...data, printLayout: previewLayout });
    }
    setPreviewLayout(null);
  };

  // Render visual sample based on layout ID
  const renderSample = (layoutId: string) => {
    const logoPlaceholder = data.printLogo ? (
      data.logoUrl ? <img src={data.logoUrl} alt="Logo" className="h-4 object-contain" /> : <div className="h-4 w-12 bg-gray-300 flex items-center justify-center text-[6px] text-gray-600 font-bold">LOGO</div>
    ) : null;

    const barcodeLines = (
      <div className="flex h-6 w-full justify-center space-x-[1px]">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`bg-background h-full ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-[1.5px]'}`}></div>
        ))}
      </div>
    );

    switch (layoutId) {
      case "standard":
        return (
          <div className="bg-white text-foreground p-3 rounded-sm shadow-sm w-48 h-32 flex flex-col justify-between border border-gray-200">
            <div className="flex justify-between items-start">
              {logoPlaceholder}
              <span className="text-[10px] font-bold">$1,250</span>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold">{data.skuPrefix}12345</div>
              <div className="text-[8px] text-gray-600">18K Gold Ring</div>
            </div>
            <div className="flex flex-col items-center">
              {barcodeLines}
            </div>
          </div>
        );
      case "dumbbell":
        return (
          <div className="flex items-center justify-center w-full h-32">
            <div className="bg-white text-foreground p-2 rounded-lg shadow-sm w-20 h-20 flex flex-col items-center justify-center border border-gray-200 gap-1">
              {logoPlaceholder}
              <div className="text-[9px] font-bold mt-1">$850</div>
              <div className="text-[7px] text-muted-foreground">2.5g</div>
            </div>
            <div className="bg-white h-4 w-16 border-y border-gray-200"></div>
            <div className="bg-white text-foreground p-2 rounded-lg shadow-sm w-20 h-20 flex flex-col items-center justify-center border border-gray-200">
              {barcodeLines}
              <div className="text-[8px] font-bold mt-1">{data.skuPrefix}9876</div>
            </div>
          </div>
        );
      case "rat_tail":
        return (
          <div className="flex items-center justify-center w-full h-32">
            <div className="bg-white text-foreground p-2 rounded-sm shadow-sm w-24 h-24 flex flex-col items-center justify-between border border-gray-200">
              <div className="w-full flex justify-between items-center">
                {logoPlaceholder}
                <span className="text-[9px] font-bold">$499</span>
              </div>
              <div className="text-center w-full my-1">
                <div className="text-[9px] font-bold">{data.skuPrefix}5544</div>
              </div>
              <div className="w-full flex justify-center scale-90">
                {barcodeLines}
              </div>
            </div>
            <div className="bg-white h-4 w-24 border-y border-r border-gray-200 rounded-r-full"></div>
          </div>
        );
      case "compact":
        return (
          <div className="bg-white text-foreground p-2 rounded-sm shadow-sm w-24 h-24 flex flex-col justify-between items-center border border-gray-200">
            {logoPlaceholder}
            <div className="text-[9px] font-bold">{data.skuPrefix}1122</div>
            <div className="w-full flex justify-center scale-75 -my-1">
              {barcodeLines}
            </div>
            <div className="text-[10px] font-bold">$299</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative">
      {/* Preview Modal Overlay */}
      {previewLayout && (
        <div className="fixed inset-0 bg-background/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-onyx border border-onyx-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-onyx-border bg-onyx-surface/50">
              <h3 className="text-[16px] font-semibold text-platinum">Preview Print Layout</h3>
              <button onClick={() => setPreviewLayout(null)} className="text-platinum-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center bg-gray-100 min-h-[200px] border-b border-onyx-border overflow-hidden">
              <div className="scale-125 transform origin-center">
                {renderSample(previewLayout)}
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h4 className="text-[15px] font-medium text-platinum">
                  {layouts.find(l => l.id === previewLayout)?.name}
                </h4>
                <p className="text-[13px] text-platinum-muted mt-1">
                  {layouts.find(l => l.id === previewLayout)?.desc}
                </p>
              </div>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setPreviewLayout(null)} 
                  className="flex-1 py-2.5 rounded-xl border border-onyx-border text-platinum text-[13px] font-medium hover:bg-onyx-surface transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLayout} 
                  className="flex-1 py-2.5 rounded-xl bg-gold text-onyx text-[13px] font-medium hover:bg-gold/90 transition-colors shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                >
                  Apply Layout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum">SKU & Barcode Config</h3>
          <p className="text-[13px] text-platinum-muted">Define how product codes and labels are generated.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-onyx border border-onyx-border rounded-xl p-6 space-y-8">
        {/* SKU Settings */}
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
                  <label className="block text-[12px] text-platinum-muted mb-1.5">Database SKU Prefix</label>
                  <input type="text" value={data.skuPrefix} onChange={e => setData({...data, skuPrefix: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" placeholder="e.g. PRD-" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" checked={data.resetCounterYearly} onChange={e => setData({...data, resetCounterYearly: e.target.checked})} className="accent-gold w-4 h-4" />
                    <span className="text-[13px] text-platinum">Reset Running Number Yearly (e.g. PRD-2026-0001)</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Barcode Encoding & General Settings */}
        <div>
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Barcode Generation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input type="checkbox" checked={data.autoGenerateBarcode} onChange={e => setData({...data, autoGenerateBarcode: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Auto Generate Barcode Numbers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input type="checkbox" checked={data.printAfterCreation} onChange={e => setData({...data, printAfterCreation: e.target.checked})} className="accent-gold w-4 h-4" />
                <span className="text-[13px] text-platinum">Prompt to Print Tag after Product Creation</span>
              </label>
            </div>
            
            <div>
              <label className="block text-[12px] text-platinum-muted mb-1.5">Encoding Format</label>
              <select value={data.barcodeFormat} onChange={e => setData({...data, barcodeFormat: e.target.value})} className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                <option value="CODE128">CODE128 (Standard)</option>
                <option value="EAN13">EAN-13 (Retail)</option>
                <option value="UPC">UPC-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Layouts & Logo */}
        <div>
          <h4 className="text-[14px] font-medium text-platinum mb-4 border-b border-onyx-border pb-2">Printable Formats & Design</h4>
          
          {/* Logo Section */}
          <div className="mb-6 p-4 bg-onyx-surface rounded-xl border border-onyx-border">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer w-fit mb-2">
                  <input type="checkbox" checked={data.printLogo} onChange={e => setData({...data, printLogo: e.target.checked})} className="accent-gold w-4 h-4" />
                  <span className="text-[13px] font-medium text-platinum">Include Company Logo on Print</span>
                </label>
                <p className="text-[12px] text-platinum-muted ml-6">Upload a black & white logo for best printing results on thermal labels.</p>
              </div>
              
              <div className="flex items-center gap-4">
                {data.logoUrl ? (
                  <div className="relative w-16 h-16 bg-white rounded-lg border border-onyx-border flex items-center justify-center overflow-hidden group">
                    <img src={data.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageForCrop(data.logoUrl);
                          setCropperOpen(true);
                        }}
                        className="p-1 bg-gold text-onyx rounded hover:bg-gold-light"
                        title="Crop / Edit"
                      >
                        <Crop className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setData({ ...data, logoUrl: "" })}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-onyx border border-onyx-border border-dashed rounded-lg flex flex-col items-center justify-center text-platinum-muted">
                    <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                    <span className="text-[9px]">No Logo</span>
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-onyx border border-onyx-border text-platinum text-[12px] rounded-lg hover:border-gold transition-colors flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload Logo
                </button>
              </div>
            </div>
          </div>

          {/* Print Layouts */}
          <div>
            <label className="block text-[13px] font-medium text-platinum mb-3">Select Print Layout</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {layouts.map((layout) => (
                <div 
                  key={layout.id}
                  onClick={() => handleLayoutSelect(layout.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${data.printLayout === layout.id ? 'border-gold bg-gold/5' : 'border-onyx-border bg-onyx-surface hover:border-gold/50'}`}
                >
                  <div className={`p-3 rounded-full ${data.printLayout === layout.id ? 'bg-gold/20' : 'bg-onyx'}`}>
                    {layout.icon}
                  </div>
                  <div>
                    <h5 className="text-[13px] font-medium text-platinum">{layout.name}</h5>
                    <p className="text-[11px] text-platinum-muted mt-1 leading-tight">{layout.desc}</p>
                  </div>
                  {data.printLayout === layout.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <LogoCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageFileOrUrl={selectedImageForCrop}
        onCropComplete={handleCropComplete}
        title="Crop & Customize Barcode Logo"
        initialShape="square"
      />
    </div>
  );
}
