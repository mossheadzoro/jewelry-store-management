"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BILLING_STORAGE_KEY = "billing-session";
const EXPIRY_MINUTES = 60;

/** Standalone helper — read draft without mounting the hook */
export function getDraftInfo(): { hasValidDraft: boolean; customerId?: string | null; customerName?: string; savedAt?: number; expiry?: number } {
  try {
    const saved = localStorage.getItem(BILLING_STORAGE_KEY);
    if (!saved) return { hasValidDraft: false };
    const state = JSON.parse(saved);
    if (state.expiry && Date.now() > state.expiry) {
      // Auto-clean: unreserve all products from expired draft
      const products: any[] = state.products ?? [];
      products.forEach(p => {
        fetch("/api/stock/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: p.id, action: "unreserve" }),
        }).catch(() => {});
      });
      localStorage.removeItem(BILLING_STORAGE_KEY);
      return { hasValidDraft: false };
    }
    const hasProducts = (state.products ?? []).length > 0;
    return {
      hasValidDraft: hasProducts,
      customerId: state.customerId ?? null,
      customerName: state.customerName ?? null,
      savedAt: state.savedAt ?? null,
      expiry: state.expiry ?? null,
    };
  } catch {
    return { hasValidDraft: false };
  }
}

export function useBillingLogic(isEditMode?: boolean) {
  const restored = useRef(false); // used only for addProduct guard

  // isHydrated: TRUE only after restore completes + state update fires
  // Using STATE (not ref) so the save effect re-evaluates reactively
  const [isHydrated, setIsHydrated] = useState(false);

  // Restored customer — useState so BillingPage effect can react to changes
  const [restoredCustomerId, setRestoredCustomerId] = useState<string | null>(null);
  const [restoredCustomer, setRestoredCustomer] = useState<any>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [metalRate, setMetalRate] = useState<number>(0);

  // TAX STATES (global)
  const [taxOnTotal, setTaxOnTotal] = useState(false);
  const [hallmarkCharge, setHallmarkCharge] = useState(false);
  const [taxOnMetal, setTaxOnMetal] = useState(false);
  const [taxOnMaking, setTaxOnMaking] = useState(false);

  // 🔥 Old gold exchange
  const [exchangeGoldWeight, setExchangeGoldWeight] = useState<number>(0);

  // 🔥 Payments
  const [payments, setPayments] = useState<any[]>([
    { method: "CASH", amount: "", metalWeight: "", narration: "" },
  ]);

  // 🔥 Advance
  const [appliedAdvance, setAppliedAdvance] = useState<any>(null);

  // 🔥 Saving Schemes
  const [appliedSchemes, setAppliedSchemes] = useState<any[]>([]);

  // 🔥 Excess Old Gold Handling
  const [excessGoldMode, setExcessGoldMode] = useState<null | 'CASH_OUT' | 'RETURN_GOLD'>(null);
  const [cashOutReductionPercent, setCashOutReductionPercent] = useState<number>(10);

  /* -------------------- STOCK RESERVATION -------------------- */

  const unreserveAll = async (list: any[]) => {
    for (const p of list) {
      try {
        await axios.post("/api/stock/update", { id: p.id, action: "unreserve" });
      } catch {}
    }
  };

  const clearSession = async () => {
    const saved = localStorage.getItem(BILLING_STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      await unreserveAll(state.products ?? []);
    }
    localStorage.removeItem(BILLING_STORAGE_KEY);
    setProducts([]);
  };

  /* -------------------- RESTORE SESSION -------------------- */

  useEffect(() => {
    if (isEditMode) {
      restored.current = true;
      setIsHydrated(true); // Edit mode hydrates immediately (data loaded externally)
      return;
    }

    const saved = localStorage.getItem(BILLING_STORAGE_KEY);
    if (!saved) {
      restored.current = true;
      setIsHydrated(true); // No draft — mark hydrated so new bills can save
      return;
    }

    const state = JSON.parse(saved);

    if (state.expiry && Date.now() > state.expiry) {
      clearSession();
      restored.current = true;
      setIsHydrated(true);
      return;
    }

    setProducts(state.products ?? []);
    setMetalRate(state.metalRate ?? 0);
    setTaxOnTotal(state.taxOnTotal ?? false);
    setHallmarkCharge(state.hallmarkCharge ?? false);
    setTaxOnMetal(state.taxOnMetal ?? false);
    setTaxOnMaking(state.taxOnMaking ?? false);
    setExchangeGoldWeight(state.exchangeGoldWeight ?? 0);
    if (state.payments && state.payments.length > 0) {
      setPayments(state.payments);
    }
    setAppliedAdvance(state.appliedAdvance ?? null);
    setAppliedSchemes(state.appliedSchemes ?? []);
    setExcessGoldMode(state.excessGoldMode ?? null);
    setCashOutReductionPercent(state.cashOutReductionPercent ?? 10);
    // Restore customer info as STATE so BillingPage effect re-runs
    setRestoredCustomerId(state.customerId ?? null);
    setRestoredCustomer(state.customer ?? null);

    restored.current = true;
    // setIsHydrated(true) fires AFTER all the above setX() calls settle,
    // so the save effect only runs once with the correct restored values.
    setIsHydrated(true);
  }, [isEditMode]);

  /* -------------------- SAVE SESSION -------------------- */

  /** Called by BillingPage whenever customer changes, so draft includes customer */
  const saveCustomerToDraft = (customerId: string | null, customer: any) => {
    try {
      const saved = localStorage.getItem(BILLING_STORAGE_KEY);
      const state = saved ? JSON.parse(saved) : {};
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify({ ...state, customerId, customerName: customer?.name, customer, savedAt: Date.now() }));
    } catch {}
  };

  useEffect(() => {
    // Only save AFTER hydration is complete to avoid overwriting restored data
    if (isEditMode || !isHydrated) return;

    const saveData = {
      products,
      metalRate,
      taxOnTotal,
      hallmarkCharge,
      taxOnMetal,
      taxOnMaking,
      exchangeGoldWeight,
      payments,
      appliedAdvance,
      appliedSchemes,
      excessGoldMode,
      cashOutReductionPercent,
      savedAt: Date.now(),
      expiry: Date.now() + EXPIRY_MINUTES * 60 * 1000,
    };

    // Preserve customer info if already saved
    const existing = localStorage.getItem(BILLING_STORAGE_KEY);
    const existingState = existing ? JSON.parse(existing) : {};
    localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify({ ...existingState, ...saveData }));
  }, [
    isHydrated,
    products,
    metalRate,
    taxOnTotal,
    hallmarkCharge,
    taxOnMetal,
    taxOnMaking,
    exchangeGoldWeight,
    payments,
    appliedAdvance,
    excessGoldMode,
    cashOutReductionPercent,
    isEditMode,
  ]);

  /* -------------------- PRODUCT HANDLERS -------------------- */

  const updateMetalRate = (rate: number) => {
    setMetalRate(rate);
  };

  const addProduct = async (product: any) => {
    if (restored.current) {
      try {
        await axios.post("/api/stock/update", { id: product.id, action: "reserve" });
      } catch {}
    }
    setProducts((prev) => [...prev, product]);
  };

  const removeProduct = async (index: number) => {
    const prod = products[index];
    if (prod && restored.current) {
      try {
        await axios.post("/api/stock/update", { id: prod.id, action: "unreserve" });
      } catch {}
    }
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, updatedProduct: any) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? updatedProduct : p))
    );
  };

  /* -------------------- ADVANCE HANDLERS -------------------- */
  const applyAdvance = (advance: any) => {
    setAppliedAdvance(advance);

    if (advance.metalWeight > 0) {
      setExchangeGoldWeight((prev) => prev + advance.metalWeight);
    }

    if (advance.moneyAmount > 0) {
      setPayments((prev) => {
        // If the first payment is empty cash, replace it. Otherwise append.
        const isFirstEmpty = prev.length === 1 && prev[0].method === "CASH" && !prev[0].amount;
        const newPayment = {
          method: "ADVANCE",
          amount: advance.moneyAmount.toString(),
          metalWeight: "",
          narration: advance.advanceReceiptNumber,
        };
        return isFirstEmpty ? [newPayment] : [...prev, newPayment];
      });
    }
  };

  /* -------------------- SAVING SCHEME HANDLERS -------------------- */
  const applyScheme = (
    scheme: any,
    amountUsed: number,
    goldWeightUsed: number,
    redemptionType: 'PREMATURE' | 'MATURED' | 'SPLIT' | 'MATURED_PART1' | 'STANDARD' = 'STANDARD'
  ) => {
    setAppliedSchemes((prev) => [...prev, { ...scheme, amountUsed, goldWeightUsed, redemptionType }]);
    
    if (goldWeightUsed > 0) {
      setExchangeGoldWeight((prev) => prev + goldWeightUsed);
    }
    
    if (amountUsed > 0) {
      setPayments((prev) => {
        const isFirstEmpty = prev.length === 1 && prev[0].method === "CASH" && !prev[0].amount;
        const newPayment = {
          method: "SCHEME",
          amount: amountUsed.toString(),
          metalWeight: "",
          narration: scheme.schemeNumber,
          schemeId: scheme.id,
          isLocked: true, // Specific field to prevent removal in UI
        };
        return isFirstEmpty ? [newPayment] : [...prev, newPayment];
      });
    }
  };

  const removeScheme = (schemeId: string) => {
    setAppliedSchemes((prev) => {
      const schemeToRemove = prev.find((s) => s.id === schemeId);
      if (schemeToRemove && schemeToRemove.goldWeightUsed > 0) {
        setExchangeGoldWeight((goldPrev) => Math.max(0, goldPrev - schemeToRemove.goldWeightUsed));
      }
      return prev.filter((s) => s.id !== schemeId);
    });
    setPayments((prev) => prev.filter((p) => p.schemeId !== schemeId));
  };

  /* -------------------- EXCESS GOLD HANDLERS -------------------- */
  const resetExcessGoldHandling = () => {
    setExcessGoldMode(null);
    setCashOutReductionPercent(10);
  };

  /* -------------------- ITEM CALCULATIONS (UNCHANGED) -------------------- */

  const metalValue = (p: any) => p.ntWeight * p.metalRate;

  const makingValue = (p: any) =>
    (metalValue(p) * (p.makingChargePercent ?? 0)) / 100;

  const afterDiscount = (p: any) =>
    makingValue(p) -
    makingValue(p) * ((p.discountOnMaking ?? 0) / 100);

  const itemTotal = (p: any) =>
    metalValue(p) + afterDiscount(p) + (p.additionalCharge ?? 0);

  /* -------------------- AGGREGATES -------------------- */

  const totalGoldWeight = products.reduce(
    (acc, p) => acc + (p.ntWeight ?? 0),
    0
  );
  const totalGoldValue = totalGoldWeight * metalRate;
  

  const exchangeGoldValue = exchangeGoldWeight * metalRate;

  // 🔥 Excess Old Gold Detection
  const isOldGoldExcess = exchangeGoldValue > totalGoldValue && totalGoldValue > 0;
  const excessGoldValue = isOldGoldExcess ? exchangeGoldValue - totalGoldValue : 0;
  const excessGoldWeight = metalRate > 0 ? excessGoldValue / metalRate : 0;

  // 🔥 Cash Settlement Calculations
  const cashSettlementRate = metalRate * (1 - cashOutReductionPercent / 100);
  const cashOutAmount = excessGoldWeight * cashSettlementRate;

  // 🔥 Effective exchange values based on mode
  let effectiveExchangeValue = exchangeGoldValue;
  let effectiveExchangeWeight = exchangeGoldWeight;

  if (isOldGoldExcess && excessGoldMode) {
    // Cap old gold at purchase value — only retain what's needed
    effectiveExchangeValue = totalGoldValue;
    effectiveExchangeWeight = totalGoldWeight;
  }

  const netGoldWeight = Math.max(totalGoldWeight - effectiveExchangeWeight, 0);
  const netGoldValue = netGoldWeight * metalRate;

  const subtotal = products.reduce((acc, p) => acc + itemTotal(p), 0);

  const hallmarkFee = hallmarkCharge ? 500 : 0;
  const hallmarkTax = hallmarkCharge ? hallmarkFee * 0.18 : 0;

  // 🔥 GST logic (LEGALLY CORRECT)
  const goldGST = taxOnMetal ? netGoldValue * 0.03 : 0;

  const totalMaking = products.reduce(
    (acc, p) => acc + afterDiscount(p),
    0
  );

  const makingGST = taxOnMaking ? totalMaking * 0.05 : 0;

  const exchangeTotal = netGoldValue + totalMaking;
  const totalTax = taxOnTotal ? exchangeTotal * 0.03 : 0;

  

  /* -------------------- GRAND TOTAL -------------------- */
  const isExchangeTotalTaxMode =
    exchangeGoldWeight > 0 &&
    taxOnTotal &&
    !taxOnMetal &&
    !taxOnMaking;

  // Base grand total (before excess gold adjustments)
  const baseGrandTotal =
    netGoldValue +
    totalMaking +
    hallmarkFee +
    totalTax +
    hallmarkTax +
    (isExchangeTotalTaxMode ? 0 : goldGST) +
    (isExchangeTotalTaxMode ? 0 : makingGST);

  // 🔥 Cash to customer: when cashOutAmount exceeds the remaining charges
  let cashToCustomer = 0;
  let grandTotal = baseGrandTotal;
  let oldGoldCashedOutValue = 0;

  if (isOldGoldExcess && excessGoldMode === 'CASH_OUT') {
    // The remaining bill is just making + taxes + hallmark (net gold = 0 since old gold covers it)
    const remainingCharges = totalMaking + hallmarkFee + totalTax + hallmarkTax +
      (isExchangeTotalTaxMode ? 0 : goldGST) +
      (isExchangeTotalTaxMode ? 0 : makingGST);
    
    if (cashOutAmount > remainingCharges) {
      // Cash out covers everything + excess goes to customer
      cashToCustomer = cashOutAmount - remainingCharges;
      grandTotal = 0; // Bill is fully settled, we owe the customer money
      oldGoldCashedOutValue = cashOutAmount;
    } else {
      // Cash out partially covers remaining charges
      grandTotal = remainingCharges - cashOutAmount;
      oldGoldCashedOutValue = cashOutAmount;
    }
  } else if (isOldGoldExcess && excessGoldMode === 'RETURN_GOLD') {
    // Net gold value = 0 (old gold covers it exactly), remaining is making + taxes
    grandTotal = totalMaking + hallmarkFee + totalTax + hallmarkTax +
      (isExchangeTotalTaxMode ? 0 : goldGST) +
      (isExchangeTotalTaxMode ? 0 : makingGST);
  }


  const goldCgst = goldGST / 2;
  const goldSgst = goldGST / 2;
  const hallmarkingCGST = hallmarkTax / 2;
  const hallmarkingSGST = hallmarkTax / 2;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const makingCgst = makingGST / 2;
  const makingSgst = makingGST / 2;

  /* -------------------- EXPORT -------------------- */
  return {
    /** Customer info restored from draft — reactive state so BillingPage effect can watch it */
    restoredCustomerId,
    restoredCustomer,
    saveCustomerToDraft,
    products,
    metalRate,

    taxOnTotal,
    hallmarkCharge,
    taxOnMetal,
    taxOnMaking,

    exchangeGoldWeight,
    setExchangeGoldWeight,

    updateMetalRate,
    setTaxOnTotal,
    setHallmarkCharge,
    setTaxOnMetal,
    setTaxOnMaking,

    addProduct,
    removeProduct,
    updateProduct,
    setProducts,
    clearSession,

    metalValue,
    makingValue,
    afterDiscount,
    itemTotal,

    subtotal,
    hallmarkFee,
    totalTax,
    hallmarkTax,
    grandTotal,

    totalGoldWeight,
    netGoldWeight,
    netGoldValue,
    exchangeGoldValue,

    totalMaking,
    isExchangeTotalTaxMode,
    goldCgst,
    goldSgst,
    cgst,
    sgst,
    hallmarkingCGST,
    hallmarkingSGST,
    makingCgst,
    makingSgst,

    totalGoldValue,
    
    payments,
    setPayments,

    appliedAdvance,
    setAppliedAdvance,
    applyAdvance,

    appliedSchemes,
    setAppliedSchemes,
    applyScheme,
    removeScheme,

    // 🔥 Excess Old Gold
    isOldGoldExcess,
    excessGoldValue,
    excessGoldWeight,
    excessGoldMode,
    setExcessGoldMode,
    cashOutReductionPercent,
    setCashOutReductionPercent,
    cashSettlementRate,
    cashOutAmount,
    cashToCustomer,
    oldGoldCashedOutValue,
    resetExcessGoldHandling,
    effectiveExchangeValue,
    effectiveExchangeWeight,
  };
}
