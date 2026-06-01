"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
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

import { Diamond, PauseCircle } from "lucide-react";

interface BillingPageProps {
  invoiceId?: number;
}

const BillingPage = ({ invoiceId }: BillingPageProps) => {
  const isEditMode = !!invoiceId;
  const { selectedBranch } = useBranchStore();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Draft state — no blocking modal, restore is automatic
  const [draftRestored, setDraftRestored] = useState(false);
  const customerSyncedRef = useRef(false);

  // ─── Billing logic (must be before effects that reference billing) ───────────
  const billing = useBillingLogic(isEditMode);

  const { customer: queryCustomer } = useBillingCustomer(activeCustomerId || "");

  // ─── Check for draft on first load (new bill only) — auto-restore ───────────
  useEffect(() => {
    if (isEditMode) return;
    const info = getDraftInfo();
    if (info.hasValidDraft) {
      setDraftRestored(true);
      // Show a small non-blocking toast so user knows the draft was loaded
      const savedAgo = info.savedAt
        ? Math.floor((Date.now() - info.savedAt) / 60000)
        : 0;
      const agoLabel = savedAgo < 1 ? "just now" : `${savedAgo}m ago`;
      toast(
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-white text-sm">Draft restored ⚡</span>
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
              // Reset customer
              setCustomer(null);
              setActiveCustomerId(null);
            },
          },
        }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // ─── Auto-restore customer from draft when billing hook hydrates ─────────────
  useEffect(() => {
    if (isEditMode || customerSyncedRef.current) return;
    if (!customerIdParam && billing.restoredCustomerId && billing.restoredCustomer) {
      setActiveCustomerId(billing.restoredCustomerId);
      setCustomer(billing.restoredCustomer);
      customerSyncedRef.current = true;
    }
  }, [billing.restoredCustomerId, billing.restoredCustomer, customerIdParam, isEditMode]);

  // ─── Initialize customer from URL param (new bill with pre-selected customer) ─
  useEffect(() => {
    if (!isEditMode && customerIdParam) {
      setActiveCustomerId(customerIdParam);
    }
  }, [customerIdParam, isEditMode]);

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

  // ─── Router + misc state ─────────────────────────────────────────────────────
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExcessModal, setShowExcessModal] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("INV-......");
  const [dateStr, setDateStr] = useState("Today, --:--");
  const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);

  // Generate temporary invoice number only for new invoice
  useEffect(() => {
    if (!isEditMode) {
      setInvoiceNumber(`INV-${new Date().getTime().toString().slice(-6)}`);
      setDateStr("Today, " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [isEditMode]);

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
        billing.setProducts(data.products || []);
        billing.setPayments(data.payments || []);
        billing.setAppliedAdvance(data.appliedAdvance || null);
        billing.setExcessGoldMode(data.excessGoldMode || null);
        billing.setCashOutReductionPercent(data.cashOutReductionPercent || 10);

        setInvoiceNumber(data.invoiceNumber);
        if (data.createdAt) {
          setDateStr(new Date(data.createdAt).toLocaleDateString("en-IN", {
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
  const handlePauseBilling = () => {
    // Draft auto-saves continuously — just toast and navigate
    toast.success("Billing paused. Your draft is saved for 1 hour.", {
      duration: 4000,
      icon: "⏸️",
    });
    setTimeout(() => router.push("/dashboard"), 1200);
  };

  // ─── Checkout ────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    const finalCustomerId = isEditMode ? Number(activeCustomerId) : Number(customerIdParam || activeCustomerId);
    if (!finalCustomerId) return alert("Please select a customer first.");
    if (billing.products.length === 0) return alert("Your cart is empty.");

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
             products: billing.products,
             payments: billing.payments,
             metalRate: billing.metalRate,
             netGoldValue: billing.netGoldValue,
             totalMaking: billing.totalMaking,
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
             excessGoldReturnedWeight: billing.excessGoldWeight,
             exchangeGoldWeight: billing.exchangeGoldWeight,
             exchangeGoldValue: billing.exchangeGoldValue,
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
      billing.addProduct(updatedProduct);
    }
    setEditingProduct(null);
    setEditingIndex(null);
  };

  return (
    <div className="flex w-full min-h-screen bg-[#0a0a0a] text-[#e8e8e8] font-sans p-6 md:p-8 relative">
      {/* ─── Loading Overlay ─── */}
      {isLoadingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-t-[#d4a843] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-bold text-white tracking-wide">Loading Invoice Details</h3>
          <p className="text-xs text-[#666] mt-1.5">Retrieving invoice details from vault...</p>
        </div>
      )}

      {/* ─── NO BLOCKING BANNER — draft is auto-restored, toast shown instead ─── */}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 w-full max-w-[1400px] mx-auto items-start">

        {/* ======================= LEFT COLUMN ======================= */}
        <div className="flex flex-col gap-6">

          {/* HEADER */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                {isEditMode ? "Edit Jewellery Invoice" : "New Jewellery Invoice"}
              </h1>
              <p className="text-sm text-[#888]">
                Invoice #{invoiceNumber} &bull; {dateStr}
              </p>
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-[#d4a843]/50 hover:bg-[#1c1a17] text-[#aaa] hover:text-[#d4a843] text-xs font-semibold transition-all active:scale-[0.97]"
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
                  : "border-[#2a2a2a] bg-[#1a1a1a] text-[#aaa]"
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
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6 border border-[#2a2a2a]">
                <Diamond className="w-8 h-8 text-[#555]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Display Case is Empty</h3>
              <p className="text-[#888] text-sm max-w-sm mb-8 leading-relaxed">
                Search and add jewellery items to begin building the invoice. Scan barcodes for instant addition.
              </p>
              <button className="px-6 py-2.5 bg-[#d4a843] hover:bg-[#b8912e] text-[#0a0a0a] font-bold text-sm tracking-wide rounded-lg flex items-center gap-2 transition-colors">
                <span className="text-lg leading-none mb-0.5">+</span> Browse Vault
              </button>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden">
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
          <BillingPaymentSection billing={billing} />

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
