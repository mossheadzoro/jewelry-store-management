"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Settings2, ChevronDown, ChevronRight } from "lucide-react";
import LuxuryInvoiceTemplate from "@/components/Billing/Templates/LuxuryInvoiceTemplate";
import StandardInvoiceTemplate from "@/components/Billing/Templates/StandardInvoiceTemplate";
import ModernInvoiceTemplate from "@/components/Billing/Templates/ModernInvoiceTemplate";
import PremiumInvoiceTemplate from "@/components/Billing/Templates/PremiumInvoiceTemplate";

interface FormatCustomizerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formatId: string;
  initialCustomizations: any;
  onSave: (formatId: string, customizations: any) => void;
  dummyInvoice: any;
  branchSettings: any;
  formData: any;
}

const DEFAULT_CUSTOMIZATIONS = {
  standard: {
    hideProductCode: false,
    hidePurity: false,
    hideMakingCharge: false,
    hideOtherCharges: false,
    labels: {
      productCode: "Code / HUID",
      purity: "Purity",
      makingCharge: "Making",
      otherCharges: "Other"
    }
  },
  luxury: {
    hideProductId: true, // Default hide it so we don't break existing views
    hideBarcode: true,   // Default hide it
    hideProductCode: false,
    hidePurity: false,
    hideMakingCharge: false,
    hideOtherCharges: false,
    hideTerms: false, // New toggle
    labels: {
      // Columns (existing)
      productId: "Product ID",
      barcode: "Barcode",
      productCode: "Code / HUID",
      purity: "Purity",
      makingCharge: "Making",
      otherCharges: "Other",
      
      // General Info
      invoiceNo: "Invoice No.",
      date: "Date",
      time: "Time",
      branch: "Branch",
      billedTo: "Billed To",
      mobile: "Mobile",
      address: "Address",
      customerId: "Customer ID",
      invoiceDetails: "Invoice Details",
      salesExecutive: "Sales Executive",
      paymentStatus: "Payment Status",
      
      // Table Header & Footer
      jewelleryItems: "Jewellery Items",
      colNo: "#",
      colProduct: "Product / Description",
      colGrWt: "Gr.Wt",
      colNtWt: "Nt.Wt",
      colQty: "Qty",
      colMetalAmount: "Metal ₹",
      itemsLabel: "Items",
      piecesLabel: "Pieces",
      
      // Breakdown & Payments
      priceBreakdown: "Price Breakdown",
      metalAmount: "Metal Amount",
      subTotal: "Sub Total",
      cgst: "CGST",
      sgst: "SGST",
      grandTotal: "Grand Total",
      inclusiveOfTaxes: "Inclusive of all taxes",
      paymentDetails: "Payment Details",
      remainingBalance: "Remaining Balance",
      oldGoldExchange: "Old Gold Exchange",
      oldGoldText: "Credit applied to this invoice via Old Gold Cashed Out. Total value adjusted:",
      
      // GST Summary
      gstSummary: "GST Summary",
      taxableValue: "Taxable Value",
      totalTax: "Total Tax",
      
      // Signatures & Terms
      scanToPay: "Scan to Pay / Verify",
      termsTitle: "Terms & Conditions",
      termsContent: "", // Override content
      customerSignature: "Customer Signature",
      authorisedSignatory: "Authorised Signatory",
      seal: "Seal",
      
      // Footer
      footerThanks: "Thank you for choosing",
      footerService: "We are honoured to serve you. For assistance, reach our customer support team — we are always at your service.",
      footerDisclaimer: "This is a system-generated invoice and is legally valid without a physical signature."
    }
  },
  modern: {
    hideProductId: true,
    hideBarcode: true,
    hideProductCode: false,
    hidePurity: false,
    hideMakingCharge: false,
    hideOtherCharges: false,
    hideTerms: false,
    labels: {
      productId: "Product ID",
      barcode: "Barcode",
      productCode: "HUID",
      purity: "PURITY",
      makingCharge: "MAKING",
      otherCharges: "STONE",
      invoiceNo: "INVOICE NO",
      date: "DATE",
      time: "TIME",
      branch: "FLAGSHIP",
      billedTo: "BILL TO",
      mobile: "Mobile",
      address: "Address",
      customerId: "Customer ID",
      invoiceDetails: "Invoice Details",
      salesExecutive: "SALES EXECUTIVE",
      paymentStatus: "STATUS",
      jewelleryItems: "Jewellery Items",
      colNo: "#",
      colProduct: "ITEM/DESCRIPTION",
      colGrWt: "GROSS WT",
      colNtWt: "NET WT",
      colQty: "QTY",
      colMetalAmount: "METAL VALUE",
      itemsLabel: "Items",
      piecesLabel: "Pieces",
      priceBreakdown: "PAYMENT BREAKDOWN",
      metalAmount: "Metal Total",
      subTotal: "Subtotal",
      cgst: "CGST",
      sgst: "SGST",
      grandTotal: "GRAND TOTAL",
      inclusiveOfTaxes: "Inclusive of all taxes",
      paymentDetails: "Payment Details",
      remainingBalance: "Balance",
      oldGoldExchange: "GOLD EXCHANGE",
      oldGoldText: "Credit applied to this invoice via Old Gold Cashed Out. Total value adjusted:",
      gstSummary: "GST Summary",
      taxableValue: "Taxable Val",
      totalTax: "Total Tax",
      scanToPay: "SCAN TO VERIFY INVOICE",
      termsTitle: "TERMS & CONDITIONS",
      termsContent: "",
      customerSignature: "Customer Signature",
      authorisedSignatory: "AUTHORIZED SIGNATORY",
      seal: "Seal",
      footerThanks: "Thank you for choosing",
      footerService: "We are honoured to serve you.",
      footerDisclaimer: "This is a system-generated invoice."
    }
  },
  premium: {
    hideProductId: true,
    hideBarcode: true,
    hideProductCode: false,
    hidePurity: false,
    hideMakingCharge: false,
    hideOtherCharges: false,
    hideTerms: false,
    labels: {
      productId: "Product ID",
      barcode: "Barcode",
      productCode: "HUID",
      purity: "Purity",
      makingCharge: "Making",
      otherCharges: "Other"
    }
  }
};

const SECTION_GROUPS = [
  {
    id: "general",
    title: "General Information",
    fields: [
      { key: "invoiceNo", label: "Invoice No. Label" },
      { key: "date", label: "Date Label" },
      { key: "time", label: "Time Label" },
      { key: "branch", label: "Branch Label" },
      { key: "billedTo", label: "Billed To Label" },
      { key: "mobile", label: "Mobile Label" },
      { key: "address", label: "Address Label" },
      { key: "customerId", label: "Customer ID Label" },
      { key: "invoiceDetails", label: "Invoice Details Label" },
      { key: "salesExecutive", label: "Sales Executive Label" },
      { key: "paymentStatus", label: "Payment Status Label" },
    ]
  },
  {
    id: "table",
    title: "Table & Columns",
    fields: [
      { key: "jewelleryItems", label: "Section Title (Jewellery Items)" },
      { key: "colNo", label: "Column: #" },
      { key: "colProduct", label: "Column: Product / Description" },
      { key: "productId", label: "Column: Product ID" },
      { key: "barcode", label: "Column: Barcode" },
      { key: "productCode", label: "Column: Code / HUID" },
      { key: "purity", label: "Column: Purity" },
      { key: "colGrWt", label: "Column: Gr.Wt" },
      { key: "colNtWt", label: "Column: Nt.Wt" },
      { key: "colQty", label: "Column: Qty" },
      { key: "colMetalAmount", label: "Column: Metal Amount" },
      { key: "makingCharge", label: "Column: Making" },
      { key: "otherCharges", label: "Column: Other" },
      { key: "itemsLabel", label: "Summary: Items" },
      { key: "piecesLabel", label: "Summary: Pieces" },
    ]
  },
  {
    id: "breakdown",
    title: "Totals & Payments",
    fields: [
      { key: "priceBreakdown", label: "Section Title (Price Breakdown)" },
      { key: "metalAmount", label: "Row: Metal Amount" },
      { key: "subTotal", label: "Row: Sub Total" },
      { key: "cgst", label: "Row: CGST" },
      { key: "sgst", label: "Row: SGST" },
      { key: "grandTotal", label: "Row: Grand Total" },
      { key: "inclusiveOfTaxes", label: "Subtext: Inclusive of taxes" },
      { key: "paymentDetails", label: "Section Title (Payment Details)" },
      { key: "remainingBalance", label: "Row: Remaining Balance" },
      { key: "oldGoldExchange", label: "Section Title (Old Gold)" },
      { key: "oldGoldText", label: "Old Gold Description Text" },
    ]
  },
  {
    id: "gst",
    title: "GST Summary",
    fields: [
      { key: "gstSummary", label: "Section Title (GST Summary)" },
      { key: "taxableValue", label: "Column: Taxable Value" },
      { key: "totalTax", label: "Column: Total Tax" },
    ]
  },
  {
    id: "signatures",
    title: "Signatures & Footer",
    fields: [
      { key: "scanToPay", label: "QR Code Label" },
      { key: "termsTitle", label: "Terms & Conditions Title" },
      { key: "termsContent", label: "Terms & Conditions Content (Overrides branch setting if set)", isTextArea: true },
      { key: "customerSignature", label: "Customer Signature" },
      { key: "authorisedSignatory", label: "Authorised Signatory" },
      { key: "seal", label: "Seal Label" },
      { key: "footerThanks", label: "Footer: Thank you" },
      { key: "footerService", label: "Footer: Service Message" },
      { key: "footerDisclaimer", label: "Footer: Legal Disclaimer" },
    ]
  }
];

export default function FormatCustomizerDialog({
  isOpen,
  onClose,
  formatId,
  initialCustomizations,
  onSave,
  dummyInvoice,
  branchSettings,
  formData
}: FormatCustomizerDialogProps) {
  const [customizations, setCustomizations] = useState<any>({});
  const [expandedSection, setExpandedSection] = useState<string>("general");

  useEffect(() => {
    if (isOpen) {
      // Merge initial customizations with defaults to ensure all keys exist
      const defaults = DEFAULT_CUSTOMIZATIONS[formatId as keyof typeof DEFAULT_CUSTOMIZATIONS] || {};
      const initial = initialCustomizations || {};
      
      // Ensure all deeply nested label keys are initialized properly
      const defaultLabels = defaults.labels || {};
      const initialLabels = initial.labels || {};
      const mergedLabels = { ...defaultLabels };
      
      for (const key in initialLabels) {
         if (initialLabels[key] !== undefined) {
             mergedLabels[key] = initialLabels[key];
         }
      }

      setCustomizations({
        ...defaults,
        ...initial,
        labels: mergedLabels
      });
    }
  }, [isOpen, formatId, initialCustomizations]);

  const handleToggle = (key: string) => {
    setCustomizations((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLabelChange = (key: string, value: string) => {
    setCustomizations((prev: any) => ({
      ...prev,
      labels: {
        ...prev.labels,
        [key]: value
      }
    }));
  };

  const handleSaveClick = () => {
    onSave(formatId, customizations);
    onClose();
  };

  const invoiceWithPreviewSettings = {
    ...dummyInvoice,
    branch: { 
      ...dummyInvoice.branch, 
      settings: { 
        ...branchSettings, 
        ...formData,
        invoiceCustomizations: {
          ...formData.invoiceCustomizations,
          [formatId]: customizations
        }
      } 
    }
  };

  const isLuxury = formatId === "luxury";
  const isModern = formatId === "modern";
  const isPremium = formatId === "premium";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] h-[95vh] overflow-hidden bg-onyx p-0 border-gold/30 flex flex-col">
        <DialogHeader className="p-4 bg-onyx-surface border-b border-onyx-border flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-platinum flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-gold" />
              Customize {isLuxury ? "Luxury" : isModern ? "Modern" : isPremium ? "Premium" : "Standard"} Format
            </DialogTitle>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-gold/10 text-gold text-[13px] font-medium rounded hover:bg-gold/20 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
            >
              <Save className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDE: CONTROLS */}
          <div className="w-[380px] bg-onyx-elevated border-r border-onyx-border flex flex-col overflow-hidden shrink-0">
            
            <div className="p-5 border-b border-onyx-border bg-onyx-surface/50">
                <h3 className="text-sm font-semibold text-platinum mb-4 border-l-2 border-gold pl-2">Visibility Toggles</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Product ID Column</span>
                    <input type="checkbox" checked={!customizations.hideProductId} onChange={() => handleToggle('hideProductId')} className="accent-gold w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Barcode Column</span>
                    <input type="checkbox" checked={!customizations.hideBarcode} onChange={() => handleToggle('hideBarcode')} className="accent-gold w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Product Code / HUID Column</span>
                    <input type="checkbox" checked={!customizations.hideProductCode} onChange={() => handleToggle('hideProductCode')} className="accent-gold w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Purity Column</span>
                    <input type="checkbox" checked={!customizations.hidePurity} onChange={() => handleToggle('hidePurity')} className="accent-gold w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Making Charges Column</span>
                    <input type="checkbox" checked={!customizations.hideMakingCharge} onChange={() => handleToggle('hideMakingCharge')} className="accent-gold w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Other Charges Column</span>
                    <input type="checkbox" checked={!customizations.hideOtherCharges} onChange={() => handleToggle('hideOtherCharges')} className="accent-gold w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-onyx-border">
                    <span className="text-[13px] text-platinum group-hover:text-gold transition-colors">Show Terms & Conditions Block</span>
                    <input type="checkbox" checked={!customizations.hideTerms} onChange={() => handleToggle('hideTerms')} className="accent-gold w-4 h-4" />
                  </label>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <h3 className="text-sm font-semibold text-platinum mb-4 border-l-2 border-gold pl-2">Text & Labels</h3>
                
                {(isLuxury || isModern || isPremium) ? (
                    <div className="space-y-2">
                        {SECTION_GROUPS.map((section) => (
                            <div key={section.id} className="border border-onyx-border rounded-lg overflow-hidden bg-onyx">
                                <button 
                                    onClick={() => setExpandedSection(expandedSection === section.id ? "" : section.id)}
                                    className="w-full flex items-center justify-between p-3 bg-onyx-surface hover:bg-onyx-surface/80 transition-colors text-[13px] font-medium text-platinum"
                                >
                                    {section.title}
                                    {expandedSection === section.id ? <ChevronDown className="w-4 h-4 text-gold" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                
                                {expandedSection === section.id && (
                                    <div className="p-3 space-y-3 bg-onyx-elevated/50">
                                        {section.fields.map((field: any) => (
                                            <div key={field.key}>
                                                <label className="block text-[11px] text-platinum-muted mb-1">{field.label}</label>
                                                {field.isTextArea ? (
                                                  <textarea 
                                                      value={customizations.labels?.[field.key] || ""}
                                                      onChange={(e) => handleLabelChange(field.key, e.target.value)}
                                                      placeholder="Leave empty to use main branch setting..."
                                                      className="w-full bg-onyx-surface border border-onyx-border rounded px-3 py-1.5 text-[13px] text-platinum focus:border-gold outline-none transition-colors h-24 resize-none"
                                                  />
                                                ) : (
                                                  <input 
                                                      type="text" 
                                                      value={customizations.labels?.[field.key] || ""}
                                                      onChange={(e) => handleLabelChange(field.key, e.target.value)}
                                                      placeholder={DEFAULT_CUSTOMIZATIONS.luxury.labels[field.key as keyof typeof DEFAULT_CUSTOMIZATIONS.luxury.labels] || ""}
                                                      className="w-full bg-onyx-surface border border-onyx-border rounded px-3 py-1.5 text-[13px] text-platinum focus:border-gold outline-none transition-colors"
                                                  />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] text-platinum-muted mb-1">Product Code Column Header</label>
                            <input 
                            type="text" 
                            value={customizations.labels?.productCode || ""}
                            onChange={(e) => handleLabelChange('productCode', e.target.value)}
                            className="w-full bg-onyx-surface border border-onyx-border rounded px-3 py-2 text-[13px] text-platinum focus:border-gold outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
            
          </div>

          {/* RIGHT SIDE: LIVE PREVIEW */}
          <div className="flex-1 overflow-y-auto bg-[#e5e5e5] p-8 flex justify-center custom-scrollbar">
            <div className="bg-white shadow-2xl text-foreground max-w-[1000px] w-full mx-auto self-start border border-gray-300">
              {isPremium ? (
                <PremiumInvoiceTemplate 
                  invoice={invoiceWithPreviewSettings} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={dummyInvoice.payments[0]}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              ) : isModern ? (
                <ModernInvoiceTemplate 
                  invoice={invoiceWithPreviewSettings} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={dummyInvoice.payments[0]}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              ) : isLuxury ? (
                <LuxuryInvoiceTemplate 
                  invoice={invoiceWithPreviewSettings} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={dummyInvoice.payments[0]}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              ) : (
                <StandardInvoiceTemplate 
                  invoice={invoiceWithPreviewSettings} 
                  regularPayments={dummyInvoice.payments}
                  cashOutPayment={null}
                  cashToCustomerPayment={null}
                  returnGoldPayment={null}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
