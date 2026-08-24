"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";

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
  const restored = useRef(false);

  const { selectedBranch } = useBranchStore();
  const { globalSettings, fetchGlobalSettings } = useProductSettingsStore();

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchGlobalSettings]);

  const [isHydrated, setIsHydrated] = useState(false);

  const [restoredCustomerId, setRestoredCustomerId] = useState<string | null>(null);
  const [restoredCustomer, setRestoredCustomer] = useState<any>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [metalRate, setMetalRate] = useState<number>(0);

  // TAX STATES (global)
  const [taxOnTotal, setTaxOnTotal] = useState(false);
  const [hallmarkCharge, setHallmarkCharge] = useState(true);
  const [taxOnMetal, setTaxOnMetal] = useState(false);
  const [taxOnMaking, setTaxOnMaking] = useState(false);
  const [metalExchange, setMetalExchange] = useState(true);

  // 🔥 Old gold exchange
  const [exchangeGoldWeight, setExchangeGoldWeight] = useState<number>(0);
  const [exchangeGoldPurity, setExchangeGoldPurity] = useState<string>("22k");
  const [exchangeGoldDeductionPercent, setExchangeGoldDeductionPercent] = useState<number>(2);
  const [savedExchangeMetalRate, setSavedExchangeMetalRate] = useState<number | null>(null);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});

  // 🔥 Fetch Live Rates
  useEffect(() => {
    if (isEditMode) return; // User requested: rate API should not work in edit mode

    const branchQuery = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
    fetch(`/api/gold-rates${branchQuery}`)
      .then(res => res.json())
      .then(data => {
        if (data.ratesPerGram) {
          setLiveRates(data.ratesPerGram);
        }
      })
      .catch(console.error);
  }, [isEditMode, selectedBranch?.id]);

  // 🔥 Payments
  const [payments, setPayments] = useState<any[]>([
    { method: "CASH", amount: "", metalWeight: "", narration: "" },
  ]);

  // 🔥 Advance
  const [appliedAdvance, setAppliedAdvance] = useState<any>(null);

  // 🔥 Saving Schemes
  const [appliedSchemes, setAppliedSchemes] = useState<any[]>([]);

  // 🔥 Wallet tracking
  const [appliedWalletMetal22K, setAppliedWalletMetal22K] = useState<number>(0);
  const [appliedWalletMetal24K, setAppliedWalletMetal24K] = useState<number>(0);

  // 🔥 Excess Old Gold Handling
  const [excessGoldMode, setExcessGoldMode] = useState<null | 'CASH_OUT' | 'RETURN_GOLD'>(null);
  const [cashOutReductionPercent, setCashOutReductionPercent] = useState<number>(10);
  const [refundMethod, setRefundMethod] = useState<string>('CASH');
  const [refundDetails, setRefundDetails] = useState<string>('');

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
    setAppliedWalletMetal22K(0);
    setAppliedWalletMetal24K(0);
  };

  /* -------------------- RESTORE SESSION -------------------- */

  useEffect(() => {
    if (isEditMode) {
      restored.current = true;
      setIsHydrated(true);
      return;
    }

    const saved = localStorage.getItem(BILLING_STORAGE_KEY);
    if (!saved) {
      restored.current = true;
      setIsHydrated(true);
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
    setHallmarkCharge(state.hallmarkCharge ?? true);
    setTaxOnMetal(state.taxOnMetal ?? false);
    setTaxOnMaking(state.taxOnMaking ?? false);
    setMetalExchange(state.metalExchange ?? true);
    setExchangeGoldWeight(state.exchangeGoldWeight ?? 0);
    setExchangeGoldPurity(state.exchangeGoldPurity ?? "22k");
    setExchangeGoldDeductionPercent(state.exchangeGoldDeductionPercent ?? 2);
    if (state.payments && state.payments.length > 0) {
      setPayments(state.payments);
    }
    setAppliedAdvance(state.appliedAdvance ?? null);
    setAppliedSchemes(state.appliedSchemes ?? []);
    setExcessGoldMode(state.excessGoldMode ?? null);
    setCashOutReductionPercent(state.cashOutReductionPercent ?? 10);
    setRefundMethod(state.refundMethod ?? 'CASH');
    setRefundDetails(state.refundDetails ?? '');
    setRestoredCustomerId(state.customerId ?? null);
    setRestoredCustomer(state.customer ?? null);
    setAppliedWalletMetal22K(state.appliedWalletMetal22K ?? 0);
    setAppliedWalletMetal24K(state.appliedWalletMetal24K ?? 0);

    restored.current = true;
    setIsHydrated(true);
  }, [isEditMode]);

  /* -------------------- SAVE SESSION -------------------- */

  const saveCustomerToDraft = (customerId: string | null, customer: any) => {
    try {
      const saved = localStorage.getItem(BILLING_STORAGE_KEY);
      const state = saved ? JSON.parse(saved) : {};
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify({ ...state, customerId, customerName: customer?.name, customer, savedAt: Date.now() }));
    } catch {}
  };

  useEffect(() => {
    if (isEditMode || !isHydrated) return;

    const saveData = {
      products,
      metalRate,
      taxOnTotal,
      hallmarkCharge,
      taxOnMetal,
      taxOnMaking,
      metalExchange,
      exchangeGoldWeight,
      exchangeGoldPurity,
      exchangeGoldDeductionPercent,
      payments,
      appliedAdvance,
      appliedSchemes,
      excessGoldMode,
      cashOutReductionPercent,
      refundMethod,
      refundDetails,
      appliedWalletMetal22K,
      appliedWalletMetal24K,
      savedAt: Date.now(),
      expiry: Date.now() + EXPIRY_MINUTES * 60 * 1000,
    };

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
    metalExchange,
    exchangeGoldWeight,
    exchangeGoldPurity,
    exchangeGoldDeductionPercent,
    payments,
    appliedAdvance,
    excessGoldMode,
    cashOutReductionPercent,
    refundMethod,
    refundDetails,
    isEditMode,
    appliedWalletMetal22K,
    appliedWalletMetal24K,
  ]);

  /* -------------------- PRODUCT HANDLERS -------------------- */

  const updateMetalRate = (rate: number) => {
    setMetalRate(rate);
    
    // Also update the 22k live rate so Old Gold Exchange automatically reflects it
    setLiveRates(prev => ({ ...prev, "22k": rate }));

    // Automatically update invoice items that are 22K or have no specific purity
    setProducts(prev => prev.map(p => {
      const purityStr = p.purity?.toString().toLowerCase() || '22k';
      const key = purityStr.endsWith('k') ? purityStr : `${purityStr}k`;
      if (key === '22k' || !p.purity) {
        return { ...p, metalRate: rate };
      }
      return p;
    }));
  };

  const refreshRates = async () => {
    try {
      const branchQuery = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
      const res = await fetch(`/api/gold-rates${branchQuery}`);
      const data = await res.json();
      if (data.ratesPerGram) {
        setLiveRates(data.ratesPerGram);
        if (data.ratesPerGram["22k"]) {
           setMetalRate(data.ratesPerGram["22k"]);
        }
        
        // Auto update all invoice items based on their purity
        setProducts(prev => prev.map(p => {
           const purityStr = p.purity?.toString().toLowerCase() || '22k';
           const key = purityStr.endsWith('k') ? purityStr : `${purityStr}k`;
           if (data.ratesPerGram[key]) {
              return { ...p, metalRate: data.ratesPerGram[key] };
           } else if (data.ratesPerGram["22k"]) {
              return { ...p, metalRate: data.ratesPerGram["22k"] };
           }
           return p;
        }));
      }
    } catch (err) {
      console.error("Failed to refresh metal rate", err);
    }
  };

  const addProduct = async (product: any) => {
    if (restored.current && product.id) {
      try {
        await axios.post("/api/stock/update", { id: product.id, action: "reserve" });
      } catch {}
    }
    setProducts((prev) => [...prev, product]);
  };

  const removeProduct = async (index: number) => {
    const prod = products[index];
    if (prod && restored.current && prod.id) {
      try {
        await axios.post("/api/stock/update", { id: prod.id, action: "unreserve" });
      } catch {}
    }

    // Auto-remove advance logic was removed based on user feedback

    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, updatedProduct: any) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? updatedProduct : p))
    );
  };

  const applyAdvance = (advance: any) => {
    if (appliedAdvance?.id === advance.id) {
      alert("This advance is already applied to the bill.");
      return false;
    }
    if (appliedAdvance) {
      alert("An advance is already applied to this bill. Please remove it first or clear the session to apply a different one.");
      return false;
    }

    setAppliedAdvance(advance);

    if (advance.metalWeight > 0) {
      setExchangeGoldWeight((prev) => prev + advance.metalWeight);
      if (advance.metalPurity) {
        setExchangeGoldPurity(advance.metalPurity.toLowerCase());
      }
    }

    if (advance.moneyAmount > 0) {
      setPayments((prev) => {
        const isFirstEmpty = prev.length === 1 && prev[0].method === "CASH" && !prev[0].amount;
        const newPayment = {
          method: "ADVANCE",
          amount: advance.moneyAmount.toString(),
          metalWeight: "",
          narration: advance.advanceReceiptNumber,
          isLocked: true,
        };
        return isFirstEmpty ? [newPayment] : [...prev, newPayment];
      });
    }
    return true;
  };

  const removeAdvance = () => {
    if (!appliedAdvance) return;
    setPayments((prev) => {
      const filtered = prev.filter(p => !(p.method === "ADVANCE" && p.narration === appliedAdvance.advanceReceiptNumber));
      if (filtered.length === 0) return [{ method: "CASH", amount: "", metalWeight: "", narration: "" }];
      return filtered;
    });
    if (appliedAdvance.metalWeight > 0) {
      setExchangeGoldWeight((prev) => Math.max(0, prev - appliedAdvance.metalWeight));
    }
    setAppliedAdvance(null);
  };

  const applyWalletBalance = (weight: number, purity: string) => {
    if (!weight || weight <= 0) {
      alert("No balance available in this purity.");
      return;
    }
    const is24K = purity.toUpperCase() === '24K';
    const alreadyApplied = is24K ? appliedWalletMetal24K : appliedWalletMetal22K;
    
    if (alreadyApplied >= weight) {
      alert(`Wallet balance for ${purity} is already fully applied.`);
      return;
    }
    
    const weightToApply = weight - alreadyApplied;
    
    setExchangeGoldWeight((prev) => prev + weightToApply);
    setExchangeGoldPurity(purity.toLowerCase());
    
    if (is24K) {
      setAppliedWalletMetal24K((prev) => prev + weightToApply);
    } else {
      setAppliedWalletMetal22K((prev) => prev + weightToApply);
    }
    
    alert(`Applied ${weightToApply.toFixed(3)}g of ${purity} from Wallet to Old Gold Exchange.`);
  };

  const removeWalletBalance = () => {
    if (appliedWalletMetal22K > 0 || appliedWalletMetal24K > 0) {
      const totalToRemove = appliedWalletMetal22K + appliedWalletMetal24K;
      setExchangeGoldWeight((prev) => Math.max(0, prev - totalToRemove));
      setAppliedWalletMetal22K(0);
      setAppliedWalletMetal24K(0);
      alert("Wallet balances removed from Old Gold Exchange.");
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
          isLocked: true,
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
    setRefundMethod('CASH');
    setRefundDetails('');
  };

  /* -------------------- ITEM CALCULATIONS -------------------- */

  const metalValue = (p: any) => p.ntWeight * (p.metalRate || metalRate);

  const makingValue = (p: any) =>
    (metalValue(p) * (p.makingChargePercent ?? 0)) / 100;

  const afterDiscount = (p: any) =>
    makingValue(p) -
    makingValue(p) * ((p.discountOnMaking ?? 0) / 100);

  const itemTotal = (p: any) =>
    metalValue(p) + afterDiscount(p) + Number(p.additionalCharge ?? p.otherChargesPrice ?? p.stoneCharge ?? 0);

  /* -------------------- AGGREGATES -------------------- */

  const totalGoldWeight = products.reduce(
    (acc, p) => acc + (p.ntWeight ?? 0),
    0
  );
  const totalGoldValue = totalGoldWeight * metalRate;
  const purityLiveRate = liveRates[exchangeGoldPurity] || metalRate;
  const computedExchangeMetalRate = purityLiveRate * (1 - exchangeGoldDeductionPercent / 100);
  const exchangeMetalRate = savedExchangeMetalRate !== null ? savedExchangeMetalRate : computedExchangeMetalRate;
  const exchangeGoldValue = exchangeGoldWeight * exchangeMetalRate;

  // 🔥 Excess Old Gold Detection
  const isOldGoldExcess = metalExchange && exchangeGoldValue > totalGoldValue && totalGoldValue > 0;
  const excessGoldValue = isOldGoldExcess ? exchangeGoldValue - totalGoldValue : 0;
  const excessGoldWeight = exchangeMetalRate > 0 ? excessGoldValue / exchangeMetalRate : 0;

  // 🔥 Cash Settlement Calculations
  const cashSettlementRate = exchangeMetalRate * (1 - cashOutReductionPercent / 100);
  const cashOutAmount = excessGoldWeight * cashSettlementRate;

  // 🔥 Effective exchange values based on mode
  let effectiveExchangeValue = exchangeGoldValue;
  let effectiveExchangeWeight = exchangeGoldWeight;

  if (!metalExchange) {
    effectiveExchangeValue = 0;
    effectiveExchangeWeight = 0;
  } else {
    if (isOldGoldExcess && excessGoldMode) {
      effectiveExchangeValue = totalGoldValue;
      effectiveExchangeWeight = totalGoldWeight;
    }
  }

  const netGoldValue = Math.max(totalGoldValue - effectiveExchangeValue, 0);
  const netGoldWeight = metalRate > 0 ? netGoldValue / metalRate : 0;

  const subtotal = products.reduce((acc, p) => acc + itemTotal(p), 0);

  const totalProductQuantityForHallmark = products.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
  const hallmarkConfig = globalSettings?.financialConfig?.hallmarkConfig || { charge: 500, cgst: 9, sgst: 9 };
  const hallmarkFee = (hallmarkCharge && products.length > 0) ? hallmarkConfig.charge * totalProductQuantityForHallmark : 0;
  
  const hallmarkingCGST = (hallmarkCharge && products.length > 0) ? hallmarkFee * (hallmarkConfig.cgst / 100) : 0;
  const hallmarkingSGST = (hallmarkCharge && products.length > 0) ? hallmarkFee * (hallmarkConfig.sgst / 100) : 0;
  const hallmarkTax = hallmarkingCGST + hallmarkingSGST;

  // 🔥 GST logic (INCLUDES ADDITIONAL CHARGES)
  const goldGST = taxOnMetal ? netGoldValue * 0.03 : 0;

  const totalMaking = products.reduce(
    (acc, p) => acc + afterDiscount(p),
    0
  );

  const totalAdditional = products.reduce(
    (acc, p) => acc + Number(p.additionalCharge ?? p.otherChargesPrice ?? p.stoneCharge ?? 0),
    0
  );

  const makingGST = taxOnMaking ? (totalMaking + totalAdditional) * 0.05 : 0;

  // Net Taxable Base = Net Gold Value + Discounted Making + Additional Charges
  const exchangeTotal = netGoldValue + totalMaking + totalAdditional;
  const totalTax = taxOnTotal ? exchangeTotal * 0.03 : 0;

  /* -------------------- GRAND TOTAL -------------------- */
  const isExchangeTotalTaxMode =
    exchangeGoldWeight > 0 &&
    taxOnTotal &&
    !taxOnMetal &&
    !taxOnMaking &&
    metalExchange;

  // Base grand total (Net Gold + Net Making + Additional Charge + 3% GST + Hallmark)
  const baseGrandTotal =
    netGoldValue +
    totalMaking +
    totalAdditional +
    hallmarkFee +
    totalTax +
    hallmarkTax +
    (isExchangeTotalTaxMode ? 0 : goldGST) +
    (isExchangeTotalTaxMode ? 0 : makingGST);

  let cashToCustomer = 0;
  // If metalExchange is OFF, deduct exchangeGoldValue from the baseGrandTotal as a cash value.
  let grandTotal = metalExchange ? baseGrandTotal : baseGrandTotal - exchangeGoldValue;
  let oldGoldCashedOutValue = 0;

  if (metalExchange) {
    if (isOldGoldExcess && excessGoldMode === 'CASH_OUT') {
      const remainingCharges = totalMaking + totalAdditional + hallmarkFee + totalTax + hallmarkTax +
        (isExchangeTotalTaxMode ? 0 : goldGST) +
        (isExchangeTotalTaxMode ? 0 : makingGST);
      
      if (cashOutAmount > remainingCharges) {
        cashToCustomer = cashOutAmount - remainingCharges;
        grandTotal = 0;
        oldGoldCashedOutValue = cashOutAmount;
      } else {
        grandTotal = remainingCharges - cashOutAmount;
        oldGoldCashedOutValue = cashOutAmount;
      }
    } else if (isOldGoldExcess && excessGoldMode === 'RETURN_GOLD') {
      grandTotal = totalMaking + totalAdditional + hallmarkFee + totalTax + hallmarkTax +
        (isExchangeTotalTaxMode ? 0 : goldGST) +
        (isExchangeTotalTaxMode ? 0 : makingGST);
    }
  } else {
    // If metalExchange is off and old gold value > grand total, customer gets cash back.
    if (grandTotal < 0) {
      cashToCustomer = Math.abs(grandTotal);
      grandTotal = 0;
    }
  }

  const goldCgst = goldGST / 2;
  const goldSgst = goldGST / 2;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const makingCgst = makingGST / 2;
  const makingSgst = makingGST / 2;

  /* -------------------- EXPORT -------------------- */
  return {
    restoredCustomerId,
    restoredCustomer,
    saveCustomerToDraft,
    products,
    metalRate,

    taxOnTotal,
    hallmarkCharge,
    taxOnMetal,
    taxOnMaking,
    metalExchange,

    exchangeGoldWeight,
    setExchangeGoldWeight,
    exchangeGoldPurity,
    setExchangeGoldPurity,
    exchangeGoldDeductionPercent,
    setExchangeGoldDeductionPercent,
    savedExchangeMetalRate,
    setSavedExchangeMetalRate,
    liveRates,
    exchangeMetalRate,

    updateMetalRate,
    refreshRates,
    addProduct,
    setTaxOnTotal,
    setHallmarkCharge,
    setTaxOnMetal,
    setTaxOnMaking,
    setMetalExchange,

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
    totalAdditional,
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
    removeAdvance,
    applyWalletBalance,
    removeWalletBalance,

    appliedSchemes,
    setAppliedSchemes,
    applyScheme,
    removeScheme,

    isOldGoldExcess,
    excessGoldValue,
    excessGoldWeight,
    excessGoldMode,
    setExcessGoldMode,
    cashOutReductionPercent,
    setCashOutReductionPercent,
    cashSettlementRate,
    refundMethod,
    setRefundMethod,
    refundDetails,
    setRefundDetails,
    cashOutAmount,
    cashToCustomer,
    oldGoldCashedOutValue,
    resetExcessGoldHandling,
    effectiveExchangeValue,
    effectiveExchangeWeight,
    appliedWalletMetal22K,
    appliedWalletMetal24K,
  };
}

