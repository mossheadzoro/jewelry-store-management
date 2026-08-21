"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { useBillingCustomer } from "@/hooks/use-billing-customer";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import BillingProductTable from "./BillingProductTable";
import BillingSummary from "./BillingSummary";
import BillingPaymentSection from "./BillingPaymentSection";
import BillingControls from "./BillingControls";
import { getDraftInfo, useBillingLogic } from "@/hooks/useBillingLogic";
import ProductSearch from "./ProductSearch";
import AddProductModal from "./AddProductModal";
import MetalExchangeSection from "./MetalExchangeSection";
import BillingAdjustments from "./BackendAdjustments";
import ExcessGoldModal from "./ExcessGoldModal";
import CustomerContextPanel from "./CustomerContextPanel";

import { Diamond, PauseCircle } from "lucide-react";

interface BillingPageProps {
  invoiceId?: number;
}

const BillingPage = ({ invoiceId }: BillingPageProps) => {
  const isEditMode = !!invoiceId;
  const { selectedBranch } = useBranchStore();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId");
  const draftIdParam = searchParams.get("draftId");
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === 'ADMIN' || user?.role?.name === 'ADMIN' || user?.role === 'ADMIN';

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Draft state
  const [draftRestored, setDraftRestored] = useState(false);
  const customerSyncedRef = useRef(false);

  // ─── Billing logic (must be before effects that reference billing) ───────────
  const billing = useBillingLogic(isEditMode);

  const { customer: queryCustomer } = useBillingCustomer(activeCustomerId || "");

  // ─── Load Draft from URL ─────────────────────────────────────────────────────
  useEffect(() => {
    if (draftIdParam && !isEditMode && !draftRestored) {
      const loadDraft = async () => {
        setIsLoadingInvoice(true);
        try {
          const res = await fetch(`/api/sales/draft/${draftIdParam}`);
          if (res.ok) {
            const data = await res.json();
            const draftData = JSON.parse(data.draft.billingData);
            
            // Restore cart data
            billing.setProducts(draftData.products || []);
            billing.setPayments(draftData.payments || []);
            billing.updateMetalRate(draftData.metalRate || 0);
            
            if (data.draft.customerId) {
              setActiveCustomerId(data.draft.customerId.toString());
              setCustomer(data.draft.customer);
            }
            
            setDraftRestored(true);
            
            // Immediately delete the draft from DB so it's active again
            // and releases the 'DRAFT_BILL' reservation lock
            fetch(`/api/sales/draft/${draftIdParam}`, { method: "DELETE" });
          }
        } catch (e) {
          console.error("Failed to load draft", e);
        } finally {
          setIsLoadingInvoice(false);
        }
      };
      loadDraft();
    }
  }, [draftIdParam, isEditMode, draftRestored]);

  // ─── Check for local draft on first load (fallback) ───────────
  useEffect(() => {
    if (isEditMode || draftIdParam || draftRestored) return;
    const info = getDraftInfo();
    if (info.hasValidDraft) {
      setDraftRestored(true);
      const savedAgo = info.savedAt
        ? Math.floor((Date.now() - info.savedAt) / 60000)
        : 0;
      const agoLabel = savedAgo < 1 ? "just now" : `${savedAgo}m ago`;
      toast(
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground text-sm">Local draft restored ⚡</span>
          <span className="text-xs text-[#aaa]">
            {info.customerName ? `Bill for ${info.customerName}` : "Previous bill"} · saved {agoLabel}
          </span>
        </div>,
        {
          duration: 6000,
          action: {
            label: "Discard",
            onClick: () => {
              billing.clearSession();
              setDraftRestored(false);
              customerSyncedRef.current = true;
              setCustomer(null);
              setActiveCustomerId(null);
            },
          },
        }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, draftIdParam, draftRestored]);

  // ─── Auto-restore customer from local draft ─────────────
  useEffect(() => {
    if (isEditMode || customerSyncedRef.current) return;
    if (!customerIdParam && billing.restoredCustomerId && billing.restoredCustomer) {
      setActiveCustomerId(billing.restoredCustomerId);
      setCustomer(billing.restoredCustomer);
      customerSyncedRef.current = true;
    }
  }, [billing.restoredCustomerId, billing.restoredCustomer, customerIdParam, isEditMode]);

  // ─── Initialize customer from URL param ─
  useEffect(() => {
    if (!isEditMode && customerIdParam && !draftIdParam) {
      setActiveCustomerId(customerIdParam);
    }
  }, [customerIdParam, isEditMode, draftIdParam]);

  useEffect(() => {
    if (!isEditMode && queryCustomer) {
      setCustomer(queryCustomer);
    }
  }, [queryCustomer, isEditMode]);

  // ─── Sync customer into the draft whenever it changes ────────────────────────
  useEffect(() => {
    if (!isEditMode && customer && activeCustomerId) {
      billing.saveCustomerToDraft(activeCustomerId, customer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, activeCustomerId, isEditMode]);

  // ─── Auto-Pause on Unmount (Mis-pressed back button or navigate away) ────────
  const isCheckingOutRef = useRef(false);
  const billingStateRef = useRef(billing);
  const customerIdRef = useRef(activeCustomerId);

  useEffect(() => {
    billingStateRef.current = billing;
    customerIdRef.current = activeCustomerId;
  }, [billing, activeCustomerId]);
  // Auto-save on unmount removed to prevent phantom drafts and stock reservations

  // ─── Router + misc state ─────────────────────────────────────────────────────
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExcessModal, setShowExcessModal] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [autoInvoiceNumber, setAutoInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dateStr, setDateStr] = useState("Today, --:--");
  const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);

  // Setup initial date for new invoice and fetch next invoice number
  useEffect(() => {
    if (!isEditMode) {
      setInvoiceDate(new Date());
      setDateStr("Today, " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      
      const branchId = selectedBranch?.id || selectedBranch;
      if (branchId) {
        fetch(`/api/billing/next-number?branchId=${branchId}`)
          .then(res => res.json())
          .then(data => {
            if (data.nextInvoiceNumber) {
              setInvoiceNumber(data.nextInvoiceNumber);
              setAutoInvoiceNumber(data.nextInvoiceNumber);
            }
          })
          .catch(err => console.error("Failed to fetch next invoice number:", err));
      }
    }
  }, [isEditMode, selectedBranch]);

  // Update "last saved" label every 30s
  useEffect(() => {
    if (isEditMode) return;
    const tick = () => {
      const info = getDraftInfo();
      if (info.savedAt) {
        const diffMin = Math.floor((Date.now() - info.savedAt) / 60000);
        setLastSavedLabel(diffMin < 1 ? "just now" : `${diffMin}m ago`);
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isEditMode]);

  // ─── Fetch invoice for edit mode ─────────────────────────────────────────────
  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoiceForEdit = async () => {
      setIsLoadingInvoice(true);
      try {
        const res = await fetch(`/api/billing/${invoiceId}`);
        if (!res.ok) throw new Error("Failed to fetch invoice details");
        const data = await res.json();

        setActiveCustomerId(data.customerId.toString());
        setCustomer(data.customer);

        billing.updateMetalRate(data.metalRate);
        billing.setTaxOnTotal(data.taxOnTotal);
        billing.setHallmarkCharge(data.hallmarkCharge);
        billing.setTaxOnMetal(data.taxOnMetal);
        billing.setTaxOnMaking(data.taxOnMaking);
        billing.setExchangeGoldWeight(data.exchangeGoldWeight);
        if (data.exchangeGoldPurity) billing.setExchangeGoldPurity(data.exchangeGoldPurity);
        if (data.exchangeGoldDeductionPercent !== undefined) billing.setExchangeGoldDeductionPercent(data.exchangeGoldDeductionPercent);
        if (data.exchangeMetalRate !== undefined) billing.setSavedExchangeMetalRate(data.exchangeMetalRate);
        billing.setProducts(data.products || []);
        billing.setPayments(data.payments || []);
        billing.setAppliedAdvance(data.appliedAdvance || null);
        billing.setAppliedSchemes(data.appliedSchemes || []);
        billing.setExcessGoldMode(data.excessGoldMode || null);
        billing.setCashOutReductionPercent(data.cashOutReductionPercent || 10);

        setInvoiceNumber(data.invoiceNumber);
        if (data.createdAt) {
          const d = new Date(data.createdAt);
          setInvoiceDate(d);
          setDateStr(d.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          }));
        }
      } catch (err) {
        console.error(err);
        alert("Could not load invoice for editing.");
      } finally {
        setIsLoadingInvoice(false);
      }
    };

    fetchInvoiceForEdit();
  }, [invoiceId]);

  // ─── Draft actions ───────────────────────────────────────────────────────────
  // (No modal needed — draft restores automatically. Discard is via toast action.)

  // ─── Pause billing (save & go to dashboard) ──────────────────────────────────
  const handlePauseBilling = async () => {
    const payload = {
      branchId: selectedBranch?.id || selectedBranch,
      customerId: activeCustomerId,
      billingData: {
        products: billing.products,
        payments: billing.payments,
        metalRate: billing.metalRate,
        netGoldValue: billing.netGoldValue,
        totalMaking: billing.totalMaking,
        hallmarkFee: billing.hallmarkFee,
        grandTotal: billing.grandTotal,
        taxOnGold: billing.goldCgst * 2,
        taxOnMaking: billing.makingCgst * 2,
        taxOnHallmarking: billing.hallmarkingCGST * 2,
        cgst: billing.cgst + billing.goldCgst + billing.makingCgst + billing.hallmarkingCGST,
        sgst: billing.sgst + billing.goldSgst + billing.makingSgst + billing.hallmarkingSGST,
        refundMethod: billing.refundMethod,
        refundDetails: billing.refundDetails,
      }
    };
    
    try {
      const res = await fetch("/api/sales/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed");
      
      toast.success("Draft is saved now you can visit other pages", {
        duration: 4000,
        icon: "⏸️",
      });
      billing.clearSession();
      setCustomer(null);
      setActiveCustomerId(null);
      setDraftRestored(false);
      // We explicitly DO NOT router.push("/dashboard") per user request.
    } catch (e) {
      toast.error("Failed to pause billing to server.");
    }
  };

  // ─── Checkout ────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    const finalCustomerId = isEditMode ? Number(activeCustomerId) : Number(customerIdParam || activeCustomerId);
    if (!finalCustomerId) return alert("Please select a customer first.");
    if (billing.products.length === 0) return alert("Your cart is empty.");

    if (billing.cashToCustomer > 0) {
      if ((billing.refundMethod === 'CHEQUE' || billing.refundMethod === 'ONLINE') && !billing.refundDetails) {
        return alert("Please enter transaction details for the selected refund method.");
      }
    }

    isCheckingOutRef.current = true; // Prevent auto-pause on unmount
    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/billing/${invoiceId}` : "/api/billing/create";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: finalCustomerId,
          branchId: selectedBranch?.id || selectedBranch,
          billingData: {
             customInvoiceNumber: (isAdmin && invoiceNumber.trim() !== "" && invoiceNumber !== autoInvoiceNumber) ? invoiceNumber : undefined,
             customCreatedAt: isAdmin ? invoiceDate.toISOString() : undefined,
             products: billing.products,
             payments: billing.payments,
             metalRate: billing.metalRate,
             netGoldValue: billing.netGoldValue,
             totalMaking: billing.totalMaking,
             totalStoneAmount: billing.products.reduce((acc: number, p: any) => acc + Number(p.additionalCharge || p.otherChargesPrice || p.stoneCharge || 0), 0),
             taxOnGold: billing.goldCgst * 2,
             taxOnMaking: billing.makingCgst * 2,
             taxOnHallmarking: billing.hallmarkingCGST * 2,
             hallmarkingCharge: billing.hallmarkFee,
             cgst: billing.cgst + billing.goldCgst + billing.makingCgst + billing.hallmarkingCGST,
             sgst: billing.sgst + billing.goldSgst + billing.makingSgst + billing.hallmarkingSGST,
             totalAmount: billing.grandTotal,
             appliedAdvanceId: billing.appliedAdvance?.id,
             excessGoldMode: billing.excessGoldMode,
             cashOutReductionPercent: billing.cashOutReductionPercent,
             cashSettlementRate: billing.cashSettlementRate,
             oldGoldCashedOutValue: billing.oldGoldCashedOutValue,
             cashToCustomer: billing.cashToCustomer,
             refundMethod: billing.refundMethod,
             refundDetails: billing.refundDetails,
             excessGoldReturnedWeight: billing.excessGoldWeight,
             exchangeGoldWeight: billing.exchangeGoldWeight,
             exchangeGoldPurity: billing.exchangeGoldPurity,
             exchangeGoldDeductionPercent: billing.exchangeGoldDeductionPercent,
             exchangeMetalRate: billing.exchangeMetalRate,
             exchangeGoldValue: billing.exchangeGoldValue,
             appliedSchemes: billing.appliedSchemes,
             metalExchange: billing.metalExchange,
             appliedWalletMetal22K: billing.appliedWalletMetal22K,
             appliedWalletMetal24K: billing.appliedWalletMetal24K,
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invoice");

      if (!isEditMode) {
        billing.clearSession();
      }
      router.push(`/sales`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Product modal ───────────────────────────────────────────────────────────
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function addToInvoice(item: any) {
    // Block products that are still in the Stamping Center
    const categoryName = item?.subCategory?.category?.name || "";
    if (categoryName.toUpperCase() === "STAMPING CENTER") {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground text-sm">⚠️ Product is in Stamping Center</span>
          <span className="text-xs text-[#ccc]">
            <strong>{item.name}</strong> is currently at the Stamping Center. 
            Please receive it into the respective inventory first before adding it to the bill.
          </span>
        </div>,
        { duration: 5000 }
      );
      return;
    }
    billing.addProduct(item);
  }

  const handleEditProduct = (product: any, index: number) => {
    setEditingProduct(product);
    setEditingIndex(index);
  };

  const handleConfirmEdit = (updatedProduct: any) => {
    if (editingIndex !== null) {
      billing.updateProduct(editingIndex, updatedProduct);
    } else {
      // Block products that are still in the Stamping Center
      const categoryName = updatedProduct?.subCategory?.category?.name || "";
      if (categoryName.toUpperCase() === "STAMPING CENTER") {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground text-sm">⚠️ Product is in Stamping Center</span>
            <span className="text-xs text-[#ccc]">
              <strong>{updatedProduct.name}</strong> is currently at the Stamping Center. 
              Please receive it into the respective inventory first before adding it to the bill.
            </span>
          </div>,
          { duration: 5000 }
        );
        setEditingProduct(null);
        setEditingIndex(null);
        return;
      }
      billing.addProduct(updatedProduct);
      // Apply advance if the product being added has one attached (e.g. from an order)
      if (updatedProduct.advance) {
        billing.applyAdvance(updatedProduct.advance);
      }
    }
    setEditingProduct(null);
    setEditingIndex(null);
  };

  return (
    <div className="flex w-full min-h-screen bg-onyx text-[#e8e8e8] font-sans p-6 md:p-8 relative">
      {/* ─── Loading Overlay ─── */}
      {isLoadingInvoice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-t-[#d4a843] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-bold text-foreground tracking-wide">Loading Invoice Details</h3>
          <p className="text-xs text-[#666] mt-1.5">Retrieving invoice details from vault...</p>
        </div>
      )}

      {/* ─── Creating Invoice Overlay ─── */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="w-16 h-16 border-4 border-[#d4a843]/20 border-t-[#d4a843] rounded-full animate-spin mb-6 drop-shadow-[0_0_15px_rgba(212,168,67,0.4)]"></div>
          <h3 className="text-2xl font-bold text-foreground tracking-wide animate-pulse mb-2">Creating the bill</h3>
          <p className="text-[#888] text-sm">Please wait while we finalize your invoice and secure it in the vault...</p>
        </div>
      )}

      {/* ─── NO BLOCKING BANNER — draft is auto-restored, toast shown instead ─── */}

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_360px] gap-6 w-full max-w-[1600px] mx-auto items-start">

        {/* ======================= LEFT COLUMN (CONTEXT) ======================= */}
        <div className="hidden xl:block">
          <CustomerContextPanel 
            customer={customer} 
            billing={billing} 
            onAddOrderProduct={(product) => handleEditProduct(product, null)} 
          />
        </div>

        {/* ======================= MIDDLE COLUMN ======================= */}
        <div className="flex flex-col gap-6">

          {/* HEADER */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                {isEditMode ? "Edit Jewellery Invoice" : "New Jewellery Invoice"}
              </h1>
              {isAdmin ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-[#888]">Invoice #</span>
                  <input 
                    type="text" 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)} 
                    className="bg-onyx-elevated text-foreground border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d4a843]"
                  />
                  <span className="text-sm text-[#888] mx-2">&bull;</span>
                  <input 
                    type="datetime-local" 
                    value={new Date(invoiceDate.getTime() - (invoiceDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setInvoiceDate(new Date(e.target.value));
                      }
                    }}
                    className="bg-onyx-elevated text-foreground border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d4a843]"
                  />
                </div>
              ) : (
                <p className="text-sm text-[#888]">
                  Invoice #{invoiceNumber} &bull; {dateStr}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Last saved indicator */}
              {!isEditMode && lastSavedLabel && billing.products.length > 0 && (
                <span className="text-[10px] text-[#555] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Auto-saved {lastSavedLabel}
                </span>
              )}

              {/* Pause button */}
              {!isEditMode && billing.products.length > 0 && (
                <button
                  onClick={handlePauseBilling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-onyx-elevated border border-border hover:border-[#d4a843]/50 hover:bg-[#1c1a17] text-[#aaa] hover:text-[#d4a843] text-xs font-semibold transition-all active:scale-[0.97]"
                  title="Save draft and go to dashboard"
                >
                  <PauseCircle className="w-4 h-4" />
                  Pause Billing
                </button>
              )}

              {/* Status badge */}
              <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 tracking-wider uppercase ${
                isEditMode
                  ? "border-[#d4a843]/30 bg-[#1c1a17] text-[#d4a843]"
                  : "border-onyx-border bg-onyx-elevated text-[#aaa]"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isEditMode ? "bg-[#d4a843]" : "bg-[#5c8aff] animate-pulse"}`}></div>
                {isEditMode ? "Editing" : "Draft"}
              </div>
            </div>
          </div>

          {/* SEARCH PRODUCTS */}
          <ProductSearch
            billing={billing}
            onSelect={(item) => addToInvoice(item)}
          />

          {/* BILLING CONTROLS (Metal Rate + Taxes UI) */}
          <BillingControls billing={billing} />

          {/* MAIN PRODUCT TABLE OR EMPTY STATE */}
          {billing.products.length === 0 ? (
            <div className="bg-onyx-surface border border-[#1e1e1e] rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-onyx-elevated flex items-center justify-center mb-6 border border-onyx-border">
                <Diamond className="w-8 h-8 text-[#555]" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Display Case is Empty</h3>
              <p className="text-[#888] text-sm max-w-sm mb-8 leading-relaxed">
                Search and add jewellery items to begin building the invoice. Scan barcodes for instant addition.
              </p>
              <button className="px-6 py-2.5 bg-[#d4a843] hover:bg-[#b8912e] text-[#0a0a0a] font-bold text-sm tracking-wide rounded-lg flex items-center gap-2 transition-colors">
                <span className="text-lg leading-none mb-0.5">+</span> Browse Vault
              </button>
            </div>
          ) : (
            <div className="bg-onyx-surface border border-[#1e1e1e] rounded-xl overflow-hidden">
               <BillingProductTable
                 products={billing.products}
                 removeProduct={billing.removeProduct}
                 onEditProduct={handleEditProduct}
               />
            </div>
          )}

          {/* OLD GOLD EXCHANGE */}
          <MetalExchangeSection
            billing={billing}
            onOpenExcessModal={() => setShowExcessModal(true)}
          />

          {/* PAYMENT BREAKDOWN */}
          <BillingPaymentSection billing={billing} customer={customer} />

        </div>

        {/* ======================= RIGHT COLUMN ======================= */}
        <div className="flex flex-col gap-4 sticky top-8">

          {/* SUMMARY PANEL */}
          <BillingSummary
            billing={billing}
            customer={customer}
            onCheckout={handleCheckout}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
          />

          {/* ADJUSTMENTS / COUPONS */}
          <BillingAdjustments billing={billing} />

        </div>
      </div>

      {/* MODAL FOR ADD & EDIT PRODUCT */}
      <AddProductModal
        open={!!editingProduct}
        product={editingProduct}
        metalRate={billing.metalRate}
        onMetalRateUpdate={billing.updateMetalRate}
        onRefreshMetalRate={billing.refreshRates}
        onClose={() => {
          setEditingProduct(null);
          setEditingIndex(null);
        }}
        onConfirm={handleConfirmEdit}
      />

      {/* 🔥 EXCESS OLD GOLD SETTLEMENT MODAL */}
      <ExcessGoldModal
        billing={billing}
        open={showExcessModal}
        onClose={() => setShowExcessModal(false)}
      />
    </div>
  );
};

export default BillingPage;
