"use client";

import React, { useEffect, useState } from "react";
import { Printer, Save, Eye, Settings, FileText, Palette, Layout, List, ShieldCheck, CheckSquare, Upload, Plus, ChevronDown, Crop, Trash2, Edit3, Sparkles } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LuxuryInvoiceTemplate from "@/components/Billing/Templates/LuxuryInvoiceTemplate";
import StandardInvoiceTemplate from "@/components/Billing/Templates/StandardInvoiceTemplate";
import ModernInvoiceTemplate from "@/components/Billing/Templates/ModernInvoiceTemplate";
import PremiumInvoiceTemplate from "@/components/Billing/Templates/PremiumInvoiceTemplate";
import FormatCustomizerDialog from "./FormatCustomizerDialog";
import LogoCropperModal from "@/components/ui/LogoCropperModal";
import { toast } from "sonner";

const dummyInvoice = {
  invoiceNumber: "INV-001234",
  createdAt: new Date(),
  branch: {
    name: "Main Branch",
    city: "Mumbai",
    address: "123 Main Street",
    pincode: "400001",
    phone: "9876543210",
    email: "contact@store.com",
    settings: {}
  },
  customer: {
    id: 99,
    name: "John Doe",
    mobile: "9876543210",
    email: "john@example.com",
    address: "456 Customer Ave",
    city: "Mumbai",
    pincode: "400002",
  },
  salesperson: "Admin User",
  items: [
    {
      id: 1,
      product: { id: 101, name: "Gold Necklace Set", productCode: "GN-8842", barcode: "B-8842101", purity: 22 },
      gsWeight: 45.500,
      ntWeight: 42.000,
      quantity: 1,
      makingCharge: 8500,
      stoneCharge: 2000,
      hallmarkCharge: 150,
      totalBeforeTax: 295000,
      totalAfterTax: 303850
    }
  ],
  totalMetalAmount: 295000,
  totalMakingAmount: 8500,
  cgst: 4500,
  sgst: 4500,
  totalAmount: 303850,
  balanceAmount: 0,
  payments: [
    { method: "UPI", amount: 303850 }
  ]
};

const MockPreview = ({ color, shape = "a4" }: any) => {
  return (
    <div className={`w-full ${shape === 'receipt' ? 'h-48 w-24 mx-auto' : 'h-36'} bg-white rounded flex flex-col p-2 shadow-inner mb-1 border border-gray-200 relative opacity-70 cursor-not-allowed`}>
      <div className="absolute inset-0 flex items-center justify-center z-10">
         <span className="bg-background/80 text-foreground text-[10px] px-2 py-1 rounded">Coming Soon</span>
      </div>
      <div className={`w-full h-1 mb-2 rounded-sm ${color === 'blue' ? 'bg-blue-600' : color === 'maroon' ? 'bg-red-900' : color === 'pink' ? 'bg-pink-400' : 'bg-gray-300'}`}></div>
      <div className="w-1/2 h-2 bg-gray-300 mb-1"></div>
      <div className="w-1/3 h-2 bg-gray-200 mb-4"></div>
      <div className="w-full flex-1 bg-gray-50 border border-gray-200"></div>
    </div>
  );
};

const INVOICE_FORMATS = [
  {
    id: "standard",
    name: "Standard Invoice",
    description: "Classic layout optimized for simple billing and standard POS printing.",
    preview: (
      <div className="w-full h-36 bg-white rounded flex flex-col p-3 shadow-inner mx-auto mb-1 opacity-90 transition-transform hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-2">
          <div className="w-10 h-10 bg-gray-200 rounded-sm"></div>
          <div className="w-20 h-3 bg-gray-300 rounded-sm"></div>
        </div>
        <div className="w-24 h-2 bg-gray-200 rounded-sm mb-3"></div>
        <div className="w-full h-12 bg-gray-100 border border-gray-200 rounded-sm mb-2 flex flex-col gap-1 p-1">
          <div className="w-full h-2 bg-gray-200"></div>
          <div className="w-full h-2 bg-gray-200"></div>
          <div className="w-full h-2 bg-gray-200"></div>
        </div>
        <div className="flex justify-end mt-auto">
          <div className="w-24 h-4 bg-gray-300 rounded-sm"></div>
        </div>
      </div>
    )
  },
  {
    id: "luxury",
    name: "Luxury GST Invoice",
    description: "Premium two-column layout with detailed breakdowns and elegant borders.",
    preview: (
      <div className="w-full h-36 bg-[#fdfbf7] rounded flex flex-col p-3 shadow-inner mx-auto mb-1 border border-gold/20 relative opacity-95 transition-transform hover:scale-[1.02]">
        <div className="absolute inset-1 border border-gold/10 rounded-sm pointer-events-none"></div>
        <div className="flex flex-col items-center mb-2 gap-1">
          <div className="w-8 h-8 bg-gold/30 rounded-full"></div>
          <div className="w-24 h-2 bg-gold/40 rounded-sm"></div>
        </div>
        <div className="flex justify-between gap-2 mb-2">
          <div className="flex-1 h-8 bg-white border border-gray-200 rounded-sm p-1 flex flex-col gap-1">
            <div className="w-1/2 h-1.5 bg-gray-200"></div>
          </div>
          <div className="flex-1 h-8 bg-white border border-gray-200 rounded-sm p-1 flex flex-col gap-1 items-end">
            <div className="w-1/2 h-1.5 bg-gray-200"></div>
          </div>
        </div>
        <div className="w-full flex-1 bg-white border border-gray-200 rounded-sm mb-2"></div>
      </div>
    )
  },
  {
    id: "modern",
    name: "Modern Professional",
    description: "Sleek, dark-themed header with detailed modern breakdown.",
    preview: (
      <div className="w-full h-36 bg-white rounded flex flex-col p-3 shadow-inner mx-auto mb-1 border border-gray-200 relative opacity-95 transition-transform hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-2 border-b pb-1">
          <div className="w-8 h-8 bg-background rounded-sm flex items-center justify-center">
             <div className="w-3 h-3 bg-gold/50 rounded-sm"></div>
          </div>
          <div className="flex-1 px-2 text-center">
            <div className="w-16 h-2 bg-background mx-auto mb-1 rounded-sm"></div>
            <div className="w-10 h-1 bg-gray-400 mx-auto rounded-sm"></div>
          </div>
        </div>
        <div className="w-full h-4 bg-gray-50 flex items-center justify-between px-1 mb-2 rounded-sm border-y border-gray-200"></div>
        <div className="w-full flex-1 bg-background rounded-sm mb-1"></div>
      </div>
    )
  },
  {
    id: "premium",
    name: "Premium Invoice",
    description: "Highly detailed A4 format with exchange breakdown, adjustment summaries.",
    preview: (
      <div className="w-full h-36 bg-white rounded flex flex-col p-2 shadow-inner mx-auto mb-1 border border-gray-200 relative opacity-95 transition-transform hover:scale-[1.02]">
        <div className="w-full h-1 bg-gold/80 mb-1 rounded-sm"></div>
        <div className="flex justify-between items-center mb-1">
           <div className="w-8 h-4 border border-black p-0.5"><div className="w-full h-0.5 bg-background"></div></div>
           <div className="flex-1 px-2 text-center">
             <div className="w-16 h-2 bg-background mx-auto mb-0.5"></div>
           </div>
           <div className="w-8 h-4 border border-black"></div>
        </div>
        <div className="w-full flex-1 border border-gray-300 mb-1 flex flex-col">
           <div className="w-full h-2 bg-gray-100 border-b border-gray-300"></div>
           <div className="flex-1 border-b border-gray-100"></div>
           <div className="w-full h-3 bg-gray-50 border-t-2 border-gray-400"></div>
        </div>
      </div>
    )
  },
  { id: "traditional", name: "Traditional Maroon", description: "Classic Indian layout with maroon accents.", preview: <MockPreview color="maroon" /> },
  { id: "minimal", name: "Minimal White", description: "Clean, distraction-free layout focusing on numbers.", preview: <MockPreview color="white" /> },
  { id: "corporate", name: "Corporate Blue", description: "B2B focused professional invoice.", preview: <MockPreview color="blue" /> },
  { id: "thermal80", name: "80mm Thermal Print", description: "Optimized for POS receipt printers.", preview: <MockPreview shape="receipt" /> },
  { id: "wedding", name: "Wedding Collection", description: "Elegant layout for bridal trousseau billing.", preview: <MockPreview color="pink" /> }
];

const DOCUMENT_TYPES = [
  { id: "taxInvoice", name: "Tax Invoice" },
  { id: "estimate", name: "Estimate / Quotation" },
  { id: "advanceReceipt", name: "Advance Receipt" },
  { id: "repairSlip", name: "Repair Slip" },
  { id: "deliveryChallan", name: "Delivery Challan" }
];

const TABS = [
  { id: "templates", name: "Templates", icon: FileText },
  { id: "branding", name: "Branding", icon: Palette },
  { id: "layout", name: "Layout & Theme", icon: Layout },
  { id: "content", name: "Invoice Content", icon: List },
  { id: "printing", name: "Printing & PDF", icon: Printer },
  { id: "automation", name: "Automation & Rules", icon: ShieldCheck }
];

export default function DocumentsAndPrintingPanel() {
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";
  
  const { selectedBranch, branchSettings, fetchBranchSettings } = useBranchStore();
  
  const [activeDocType, setActiveDocType] = useState("taxInvoice");
  const [activeTab, setActiveTab] = useState("templates");
  
  const defaultDocSettings = {
    format: "standard",
    paperSize: "A4",
    orientation: "portrait",
    invoiceColor: "brand",
    termsPrintLocation: "front",
    termsAndConditions: "",
    theme: "default",
    content: {
      showLogo: true,
      showQR: true,
      showCustomerGST: true,
      showCustomerPAN: true,
      showHUID: true,
      showStoneDetails: true,
      showGoldRate: true,
      showMakingPercentage: true,
      showHallmarkCharge: true,
      showDiscount: true,
      showTerms: true,
      showSignature: true,
      showFooter: true,
      showAmountInWords: true,
      showGSTSummary: true,
      showHSN: true,
      showSAC: false,
      taxInclusive: false,
      showPurity: true,
      showGrossWeight: true,
      showNetWeight: true,
      showFineWeight: false,
      showDiamondDetails: true,
      showHallmarkNumber: false,
      showPaymentHistory: true,
      showBalance: true,
      showOldGold: true
    },
    printing: {
      copies: 1,
      autoPrintAfterSave: false,
      printPreviewFirst: true,
      pdfExportResolution: "high"
    },
    automation: {
      requireManagerApproval: false,
      autoEmail: false,
      autoWhatsApp: false
    }
  };

  const [formData, setFormData] = useState<any>({
    taxInvoice: { ...defaultDocSettings },
    estimate: { ...defaultDocSettings },
    advanceReceipt: { ...defaultDocSettings },
    repairSlip: { ...defaultDocSettings },
    deliveryChallan: { ...defaultDocSettings }
  });
  const [saving, setSaving] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [customizingFormat, setCustomizingFormat] = useState("");
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);
  const [previewFormatId, setPreviewFormatId] = useState("");

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchBranchSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchBranchSettings]);

  useEffect(() => {
    if (branchSettings) {
      const custom = typeof branchSettings.invoiceCustomizations === 'object' ? branchSettings.invoiceCustomizations : {};
      
      setFormData((prev: any) => ({
        ...prev,
        taxInvoice: {
          ...defaultDocSettings,
          ...prev.taxInvoice,
          format: branchSettings.invoiceFormat || "standard",
          paperSize: branchSettings.invoicePageSize || "A4",
          invoiceColor: branchSettings.invoiceColor || "brand",
          termsPrintLocation: branchSettings.termsPrintLocation || "front",
          termsAndConditions: branchSettings.termsAndConditions || "",
          ...(custom?.taxInvoice || {}) 
        },
        estimate: { ...defaultDocSettings, ...(custom?.estimate || {}) },
        advanceReceipt: { ...defaultDocSettings, ...(custom?.advanceReceipt || {}) },
        repairSlip: { ...defaultDocSettings, ...(custom?.repairSlip || {}) },
        deliveryChallan: { ...defaultDocSettings, ...(custom?.deliveryChallan || {}) },
        customizations: custom 
      }));
    }
  }, [branchSettings]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    
    if (name.includes(".")) {
      const [category, key] = name.split(".");
      setFormData((prev: any) => ({
        ...prev,
        [activeDocType]: {
          ...prev[activeDocType],
          [category]: {
            ...prev[activeDocType]?.[category],
            [key]: val
          }
        }
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [activeDocType]: {
          ...prev[activeDocType],
          [name]: val
        }
      }));
    }
  };

  const [logoCropperOpen, setLogoCropperOpen] = useState(false);
  const [selectedLogoForCrop, setSelectedLogoForCrop] = useState<File | string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedLogoForCrop(file);
    setLogoCropperOpen(true);
    e.target.value = "";
  };

  const handleLogoCropComplete = async (file: File) => {
    setIsLogoUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "branch_settings");

    try {
      const res = await axios.post("/api/upload/branch", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.url) {
        setFormData((prev: any) => ({
          ...prev,
          customizations: {
            ...prev.customizations,
            companyLogoUrl: res.data.url
          }
        }));
        toast.success("Company logo cropped & updated successfully");
      }
    } catch (error) {
      console.error("Logo upload failed", error);
      toast.error("Failed to upload cropped logo");
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "companyLogoUrl" | "digitalSignatureUrl" | "companySealUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "branch_settings");

    try {
      const res = await axios.post("/api/upload/branch", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.url) {
        setFormData((prev: any) => ({
          ...prev,
          customizations: {
            ...prev.customizations,
            [field]: res.data.url
          }
        }));
        toast.success("Asset uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload asset");
    }
  };

  const handleCustomizationsSave = (formatId: string, customizations: any) => {
    setFormData((prev: any) => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [formatId]: customizations,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedBranch?.id) return;
    try {
      setSaving(true);
      
      const taxInvoiceData = formData.taxInvoice;
      
      const updatedCustomizations = {
        ...formData.customizations,
        taxInvoice: taxInvoiceData,
        estimate: formData.estimate,
        advanceReceipt: formData.advanceReceipt,
        repairSlip: formData.repairSlip,
        deliveryChallan: formData.deliveryChallan,
      };

      await axios.post("/api/branch/settings", {
        branchId: selectedBranch.id,
        ...branchSettings,
        invoiceFormat: taxInvoiceData.format,
        invoicePageSize: taxInvoiceData.paperSize,
        invoiceColor: taxInvoiceData.invoiceColor,
        termsPrintLocation: taxInvoiceData.termsPrintLocation,
        termsAndConditions: taxInvoiceData.termsAndConditions,
        invoiceCustomizations: updatedCustomizations
      });
      alert("Settings Saved Successfully");
      await fetchBranchSettings(selectedBranch.id);
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const openLivePreview = (e: React.MouseEvent, formatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewFormatId(formatId);
    setLivePreviewOpen(true);
  };

  const openCustomizer = (e: React.MouseEvent, formatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomizingFormat(formatId);
    setCustomizerOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-platinum-muted">
        <Printer className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <h2 className="text-xl">Access Restricted</h2>
        <p>Only administrators can modify document settings.</p>
      </div>
    );
  }

  const docSettings = formData[activeDocType] || {};
  const currentContent = docSettings.content || {};

  return (
    <div className="bg-onyx-surface rounded-xl gold-border p-6 shadow-xl relative overflow-hidden flex flex-col h-[calc(100vh-120px)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-bl-full -z-10 blur-3xl pointer-events-none" />
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-onyx-border shrink-0 gap-4">
        <div>
          <h2 className="text-[22px] font-heading font-semibold text-platinum flex items-center gap-2">
            <Printer className="w-6 h-6 text-gold" />
            Documents & Printing
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Manage templates, branding, content, and automation rules for all your customer-facing documents.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <select
              value={activeDocType}
              onChange={(e) => setActiveDocType(e.target.value)}
              className="w-full appearance-none bg-onyx border border-gold/30 text-gold font-medium rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {DOCUMENT_TYPES.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold pointer-events-none" />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gold text-onyx text-[13px] font-bold rounded hover:bg-gold/90 transition-all flex items-center gap-2 shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* SIDEBAR TABS */}
        <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 pb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-gold/10 text-gold border border-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.05)]" 
                  : "text-platinum-muted hover:bg-onyx-elevated hover:text-platinum"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-gold" : "text-platinum-muted"}`} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12">
          
          {/* TAB 1: TEMPLATES */}
          {activeTab === "templates" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2">Template Library</h3>
                <button className="text-[12px] text-gold hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Import Template
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {INVOICE_FORMATS.map((format) => (
                  <div key={format.id} className="relative group">
                    <label 
                      className={`cursor-pointer border p-3 rounded-lg flex flex-col gap-2 transition-all h-full ${
                        docSettings.format === format.id 
                          ? 'border-gold bg-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                          : 'border-onyx-border bg-onyx-elevated hover:border-onyx-border/80'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="format" 
                        value={format.id} 
                        checked={docSettings.format === format.id} 
                        onChange={handleChange} 
                        className="hidden" 
                      />
                      
                      {format.preview}

                      <div className="mt-2 flex flex-col justify-end flex-1">
                        <div className="font-medium text-platinum flex items-center justify-between text-[13px]">
                          {format.name}
                          {docSettings.format === format.id && <div className="w-2 h-2 rounded-full bg-gold"></div>}
                        </div>
                        <div className="text-[11px] text-platinum-muted mt-1 leading-tight line-clamp-2">
                          {format.description}
                        </div>
                      </div>
                    </label>
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => openLivePreview(e, format.id)}
                        className="p-1.5 bg-onyx border border-onyx-border rounded text-platinum-muted hover:text-gold hover:border-gold/50 shadow-sm"
                        title="Live Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openCustomizer(e, format.id)}
                        className="p-1.5 bg-onyx border border-onyx-border rounded text-platinum-muted hover:text-gold hover:border-gold/50 shadow-sm"
                        title="Customize Format"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === "branding" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2">Brand Assets</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Company Logo with Crop & Shape Customizer */}
                 <div className={`bg-onyx-elevated border border-onyx-border p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-center h-52 border-dashed transition-all ${isAdmin ? "hover:border-gold/50 hover:bg-onyx-surface" : "opacity-80"} relative overflow-hidden group`}>
                    <input 
                      type="file" 
                      id="company-logo-input"
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoFileSelect}
                      disabled={!isAdmin}
                    />
                    {formData.customizations?.companyLogoUrl ? (
                      <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-onyx-surface">
                        <div className="w-24 h-24 rounded-xl bg-white p-2 border border-onyx-border flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                          <img src={formData.customizations.companyLogoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-xs font-semibold text-platinum">Company Logo</span>
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-4">
                           <button
                             type="button"
                             onClick={() => {
                               setSelectedLogoForCrop(formData.customizations.companyLogoUrl);
                               setLogoCropperOpen(true);
                             }}
                             className="text-onyx text-xs font-bold px-3 py-1.5 bg-gold hover:bg-gold-light rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
                           >
                              <Crop className="w-3.5 h-3.5" /> Crop / Shape
                           </button>
                           <label
                             htmlFor="company-logo-input"
                             className="text-platinum text-xs font-medium px-3 py-1 bg-onyx border border-onyx-border hover:border-gold/50 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                           >
                              <Upload className="w-3 h-3" /> Change File
                           </label>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="company-logo-input" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <div className="w-14 h-14 bg-onyx rounded-full flex items-center justify-center mb-2 border border-onyx-border group-hover:border-gold/40 group-hover:scale-105 transition-all">
                          <Upload className="w-6 h-6 text-platinum-muted group-hover:text-gold transition-colors" />
                        </div>
                        <div>
                          <p className="text-xs text-platinum font-semibold flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-gold" /> Company Logo
                          </p>
                          <p className="text-[10px] text-platinum-muted mt-0.5">Crop in Circle / Square with zoom</p>
                        </div>
                      </label>
                    )}
                 </div>

                 {/* Digital Signature */}
                 <label className={`bg-onyx-elevated border border-onyx-border p-4 rounded-lg flex flex-col items-center justify-center gap-3 text-center h-48 border-dashed transition-colors ${isAdmin ? "cursor-pointer hover:border-gold/50 hover:bg-onyx-surface" : "cursor-not-allowed opacity-80"} relative overflow-hidden group`}>
                    <input 
                      type="file" 
                      accept="image/png" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, "digitalSignatureUrl")}
                      disabled={!isAdmin}
                    />
                    {formData.customizations?.digitalSignatureUrl ? (
                      <div className="absolute inset-0 p-4 flex items-center justify-center bg-white/10">
                        <img src={formData.customizations.digitalSignatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <span className="text-white text-xs font-semibold px-3 py-1 bg-black/60 rounded">Change Signature</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-onyx rounded-full flex items-center justify-center mb-2">
                          <Upload className="w-6 h-6 text-platinum-muted group-hover:text-gold transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm text-platinum font-medium">Digital Signature</p>
                          <p className="text-[11px] text-platinum-muted">Transparent PNG</p>
                        </div>
                      </>
                    )}
                 </label>

                 {/* Company Seal */}
                 <label className={`bg-onyx-elevated border border-onyx-border p-4 rounded-lg flex flex-col items-center justify-center gap-3 text-center h-48 border-dashed transition-colors ${isAdmin ? "cursor-pointer hover:border-gold/50 hover:bg-onyx-surface" : "cursor-not-allowed opacity-80"} relative overflow-hidden group`}>
                    <input 
                      type="file" 
                      accept="image/png" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, "companySealUrl")}
                      disabled={!isAdmin}
                    />
                    {formData.customizations?.companySealUrl ? (
                      <div className="absolute inset-0 p-4 flex items-center justify-center bg-white/10">
                        <img src={formData.customizations.companySealUrl} alt="Company Seal" className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <span className="text-white text-xs font-semibold px-3 py-1 bg-black/60 rounded">Change Seal</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-onyx rounded-full flex items-center justify-center mb-2">
                          <Upload className="w-6 h-6 text-platinum-muted group-hover:text-gold transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm text-platinum font-medium">Company Seal</p>
                          <p className="text-[11px] text-platinum-muted">Stamp overlay image</p>
                        </div>
                      </>
                    )}
                 </label>
              </div>
              
              <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2 mt-8">Terms & Footer</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[12px] text-platinum-muted mb-2">Footer Policy Text</label>
                  <textarea
                    name="termsAndConditions"
                    value={docSettings.termsAndConditions || ""}
                    onChange={handleChange}
                    placeholder="Enter return policies, exchange rules, and statutory warnings..."
                    className="w-full bg-onyx-elevated border border-onyx-border rounded-md px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none h-32 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT */}
          {activeTab === "content" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-gold/10 border border-gold/30 text-gold text-[12px] p-3 rounded flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <p>Toggle the visibility of specific fields and columns on the invoice. This gives you granular control over what the customer sees.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                
                {/* General Content */}
                <div>
                  <h4 className="text-[13px] font-semibold text-platinum mb-3 pb-2 border-b border-onyx-border">General Elements</h4>
                  <div className="space-y-3">
                    {['showLogo', 'showQR', 'showCustomerGST', 'showCustomerPAN', 'showTerms', 'showSignature', 'showAmountInWords'].map(key => (
                      <label key={key} className="flex items-center gap-2 text-[12px] text-platinum-muted cursor-pointer hover:text-platinum">
                        <input type="checkbox" name={`content.${key}`} checked={currentContent[key] || false} onChange={handleChange} className="accent-gold w-3.5 h-3.5" />
                        {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Jewellery Details */}
                <div>
                  <h4 className="text-[13px] font-semibold text-platinum mb-3 pb-2 border-b border-onyx-border">Jewellery Columns</h4>
                  <div className="space-y-3">
                    {['showHUID', 'showPurity', 'showGrossWeight', 'showNetWeight', 'showFineWeight', 'showDiamondDetails', 'showHallmarkNumber', 'showMakingPercentage', 'showHallmarkCharge'].map(key => (
                      <label key={key} className="flex items-center gap-2 text-[12px] text-platinum-muted cursor-pointer hover:text-platinum">
                        <input type="checkbox" name={`content.${key}`} checked={currentContent[key] || false} onChange={handleChange} className="accent-gold w-3.5 h-3.5" />
                        {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tax Settings */}
                <div>
                  <h4 className="text-[13px] font-semibold text-platinum mb-3 pb-2 border-b border-onyx-border">Tax & Pricing</h4>
                  <div className="space-y-3">
                    {['showGoldRate', 'showDiscount', 'showGSTSummary', 'showHSN', 'showSAC', 'taxInclusive'].map(key => (
                      <label key={key} className="flex items-center gap-2 text-[12px] text-platinum-muted cursor-pointer hover:text-platinum">
                        <input type="checkbox" name={`content.${key}`} checked={currentContent[key] || false} onChange={handleChange} className="accent-gold w-3.5 h-3.5" />
                        {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="text-[13px] font-semibold text-platinum mb-3 pb-2 border-b border-onyx-border">Payment Breakdown</h4>
                  <div className="space-y-3">
                    {['showPaymentHistory', 'showBalance', 'showOldGold'].map(key => (
                      <label key={key} className="flex items-center gap-2 text-[12px] text-platinum-muted cursor-pointer hover:text-platinum">
                        <input type="checkbox" name={`content.${key}`} checked={currentContent[key] || false} onChange={handleChange} className="accent-gold w-3.5 h-3.5" />
                        {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT & THEME */}
          {activeTab === "layout" && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2 mb-4">Paper Profile</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] text-platinum-muted mb-1">Paper Size</label>
                        <select name="paperSize" value={docSettings.paperSize || "A4"} onChange={handleChange} className="w-full bg-onyx-elevated border border-onyx-border rounded px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none">
                          <option value="A4">A4 (Standard Letter)</option>
                          <option value="A5">A5 (Half Letter)</option>
                          <option value="80mm">80mm Thermal Receipt</option>
                          <option value="58mm">58mm Thermal Receipt</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] text-platinum-muted mb-1">Orientation</label>
                        <select name="orientation" value={docSettings.orientation || "portrait"} onChange={handleChange} className="w-full bg-onyx-elevated border border-onyx-border rounded px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none">
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2 mb-4">Color Theme</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] text-platinum-muted mb-1">Pre-defined Themes</label>
                        <select name="theme" value={docSettings.theme || "default"} onChange={handleChange} className="w-full bg-onyx-elevated border border-onyx-border rounded px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none">
                          <option value="default">Default Brand Colors</option>
                          <option value="luxuryGold">Luxury Gold & Black</option>
                          <option value="corporateBlue">Corporate Blue</option>
                          <option value="minimalWhite">Minimalist White</option>
                          <option value="traditionalMaroon">Traditional Maroon</option>
                          <option value="grayscale">Grayscale Printing</option>
                        </select>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB 5: PRINTING */}
          {activeTab === "printing" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2">Print Behavior</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[13px] text-platinum cursor-pointer">
                    <input type="checkbox" name="printing.autoPrintAfterSave" checked={docSettings.printing?.autoPrintAfterSave || false} onChange={handleChange} className="accent-gold w-4 h-4" />
                    Auto Print After Save
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-platinum cursor-pointer">
                    <input type="checkbox" name="printing.printPreviewFirst" checked={docSettings.printing?.printPreviewFirst || false} onChange={handleChange} className="accent-gold w-4 h-4" />
                    Show Print Preview First
                  </label>
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1 mt-4">Number of Copies</label>
                    <input type="number" min="1" max="5" name="printing.copies" value={docSettings.printing?.copies || 1} onChange={handleChange} className="w-32 bg-onyx-elevated border border-onyx-border rounded px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[13px] font-semibold text-platinum pb-2 border-b border-onyx-border">PDF Export Preferences</h4>
                  <label className="block text-[12px] text-platinum-muted mb-1">Resolution</label>
                  <select name="printing.pdfExportResolution" value={docSettings.printing?.pdfExportResolution || "high"} onChange={handleChange} className="w-full max-w-[200px] bg-onyx-elevated border border-onyx-border rounded px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none">
                    <option value="high">High (Print Quality)</option>
                    <option value="medium">Medium (Email Friendly)</option>
                    <option value="low">Low (Compressed)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUTOMATION */}
          {activeTab === "automation" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="text-sm font-semibold text-platinum border-l-2 border-gold pl-2">Rules & Workflows</h3>
              
              <div className="bg-onyx-elevated border border-onyx-border p-5 rounded-lg">
                <h4 className="text-[13px] font-semibold text-platinum mb-4">Approval Rules</h4>
                <label className="flex items-center gap-2 text-[13px] text-platinum cursor-pointer mb-2">
                  <input type="checkbox" name="automation.requireManagerApproval" checked={docSettings.automation?.requireManagerApproval || false} onChange={handleChange} className="accent-gold w-4 h-4" />
                  Require Manager Approval for High Value / High Discount
                </label>
                <p className="text-[11px] text-platinum-muted pl-6">If enabled, invoices over ₹5 Lakhs or with discounts {">"} 10% will require a manager PIN.</p>
              </div>

              <div className="bg-onyx-elevated border border-onyx-border p-5 rounded-lg">
                <h4 className="text-[13px] font-semibold text-platinum mb-4">Automated Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[13px] text-platinum cursor-pointer">
                    <input type="checkbox" name="automation.autoEmail" checked={docSettings.automation?.autoEmail || false} onChange={handleChange} className="accent-gold w-4 h-4" />
                    Auto Email Invoice to Customer
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-platinum cursor-pointer">
                    <input type="checkbox" name="automation.autoWhatsApp" checked={docSettings.automation?.autoWhatsApp || false} onChange={handleChange} className="accent-gold w-4 h-4" />
                    Send WhatsApp Confirmation Link
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* LIVE PREVIEW DIALOG */}
      <Dialog open={livePreviewOpen} onOpenChange={setLivePreviewOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-[90vw] h-[95vh] overflow-hidden bg-[#e5e5e5] p-0 border-gold/30 flex flex-col">
          <DialogHeader className="p-3 bg-onyx-surface border-b border-onyx-border shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-platinum flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-gold"/> Live Preview</span>
              <div className="hidden md:flex items-center gap-3 text-[11px] text-platinum-muted bg-onyx-elevated px-3 py-1 rounded-full border border-onyx-border">
                 <span>{docSettings.paperSize || "A4"} {docSettings.orientation || "Portrait"}</span>
                 <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                 <span>Light Mode</span>
                 <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                 <span>100% Zoom</span>
              </div>
            </DialogTitle>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-gold text-onyx font-semibold text-[12px] rounded flex items-center gap-1 shadow">
                 <Printer className="w-3 h-3" /> Print
               </button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            <div className="bg-white shadow-2xl text-foreground max-w-[1000px] w-full mx-auto self-start">
              {previewFormatId === "modern" ? (
                <ModernInvoiceTemplate 
                  invoice={{...dummyInvoice, branch: { ...dummyInvoice.branch, settings: { ...branchSettings, ...docSettings, documentTitle: DOCUMENT_TYPES.find(d => d.id === activeDocType)?.name || "TAX INVOICE", invoiceFormat: previewFormatId, invoiceCustomizations: formData.customizations } }}} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={null}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              ) : previewFormatId === "luxury" ? (
                <LuxuryInvoiceTemplate 
                  invoice={{...dummyInvoice, branch: { ...dummyInvoice.branch, settings: { ...branchSettings, ...docSettings, documentTitle: DOCUMENT_TYPES.find(d => d.id === activeDocType)?.name || "TAX INVOICE", invoiceFormat: previewFormatId, invoiceCustomizations: formData.customizations } }}} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={null}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              ) : previewFormatId === "premium" ? (
                <PremiumInvoiceTemplate 
                  invoice={{...dummyInvoice, branch: { ...dummyInvoice.branch, settings: { ...branchSettings, ...docSettings, documentTitle: DOCUMENT_TYPES.find(d => d.id === activeDocType)?.name || "TAX INVOICE", invoiceFormat: previewFormatId, invoiceCustomizations: formData.customizations } }}} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={null}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              ) : (
                <StandardInvoiceTemplate 
                  invoice={{...dummyInvoice, branch: { ...dummyInvoice.branch, settings: { ...branchSettings, ...docSettings, documentTitle: DOCUMENT_TYPES.find(d => d.id === activeDocType)?.name || "TAX INVOICE", invoiceFormat: previewFormatId, invoiceCustomizations: formData.customizations } }}} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={null}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FormatCustomizerDialog
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        formatId={customizingFormat}
        initialCustomizations={formData.customizations?.[customizingFormat]}
        onSave={handleCustomizationsSave}
        dummyInvoice={dummyInvoice}
        branchSettings={branchSettings}
        formData={docSettings}
      />

      <LogoCropperModal
        isOpen={logoCropperOpen}
        onClose={() => setLogoCropperOpen(false)}
        imageFileOrUrl={selectedLogoForCrop}
        onCropComplete={handleLogoCropComplete}
        isSaving={isLogoUploading}
        title="Crop & Customize Invoice Logo"
        initialShape="square"
      />
    </div>
  );
}
