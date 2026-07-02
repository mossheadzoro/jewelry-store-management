"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useBookingWizardStore,
  selectTotalAdvance,
  selectAdvancePercent,
  selectRemaining,
} from "@/lib/store/useBookingWizardStore";
import { useCreateBooking } from "@/hooks/useBookings";
import { BookingStatusBadge } from "@/components/Bookings/BookingStatusBadge";
import { AdvanceProgressBar } from "@/components/Bookings/AdvanceProgressBar";
import { CurrencyDisplay } from "@/components/Bookings/CurrencyDisplay";
import { MetalWeightDisplay } from "@/components/Bookings/MetalWeightDisplay";
import {
  formatINR,
  formatWeight,
  formatPurity,
  calcBookingValue,
  getAdvanceColor,
  getPaymentModeLabel,
  generateId,
} from "@/lib/booking-utils";
import {
  mockProducts,
  mockRateLockPlans,
} from "@/lib/mock/booking-data";
import { useQuery } from "@tanstack/react-query";
import AddCustomerModal from "../../../../components/Customer/AddCustomerModal";
import type {
  BookingCustomer,
  BookingProduct,
  RateLockPlan,
  DeliveryRatePlan,
  PaymentMode,
  WizardAdvanceEntry,
} from "@/lib/types/booking";
import {
  Search,
  UserPlus,
  Check,
  ChevronRight,
  ChevronLeft,
  Gem,
  Lock,
  Unlock,
  TrendingUp,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  CreditCard,
  Landmark,
  Banknote,
  Smartphone,
  Coins,
} from "lucide-react";

// ===== Step Indicator =====

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Customer" },
    { num: 2, label: "Product" },
    { num: 3, label: "Configuration" },
    { num: 4, label: "Advance" },
    { num: 5, label: "Confirm" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold transition-all border-2",
                currentStep > step.num
                  ? "bg-gold border-gold text-onyx"
                  : currentStep === step.num
                  ? "border-gold text-gold bg-gold/10"
                  : "border-onyx-border text-platinum-muted bg-onyx-elevated"
              )}
            >
              {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
            </div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider font-medium",
                currentStep >= step.num ? "text-gold" : "text-platinum-muted"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-16 lg:w-24 h-0.5 mt-[-20px]",
                currentStep > step.num ? "bg-gold" : "bg-onyx-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ===== Step 1: Customer Selection =====

function Step1Customer() {
  const { selectedCustomer, setSelectedCustomer, nextStep } = useBookingWizardStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["booking-customer-search", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/customer/list?search=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: true, // Always fetch to show initial list
  });

  const filtered = data?.customers || [];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-[24px] font-heading font-semibold text-platinum mb-2">Select Customer</h2>
      <p className="text-[13px] text-platinum-muted mb-6">Search an existing customer or create a new one.</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
        <input
          type="text"
          placeholder="Search by name or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-onyx-elevated border border-onyx-border text-[14px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 transition-colors"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <button
        onClick={() => setShowAddCustomer(true)}
        className="flex items-center gap-2 text-[12px] text-gold hover:text-gold-light mb-6 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Create new customer
      </button>

      <AddCustomerModal 
        open={showAddCustomer} 
        onClose={() => setShowAddCustomer(false)} 
        onSuccess={() => {
          refetch();
        }} 
      />

      <div className="space-y-2">
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-6 text-platinum-muted text-[13px]">
            No customers found. Please try a different search or create a new customer.
          </div>
        )}
        {filtered.map((c: any) => {
          const cMapped = {
            id: c.id,
            name: c.name,
            mobile: c.mobile,
            email: c.email,
            gender: c.gender,
            city: c.city,
            tier: c.tier || "REGULAR",
            walletBalance: 0, // Fallback
            totalBookings: c.totalPurchases || 0,
          };
          
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(cMapped)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                selectedCustomer?.id === c.id
                  ? "bg-gold/5 gold-border-strong gold-glow"
                  : "bg-onyx-elevated border-onyx-border hover:border-gold/20"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-[14px] font-semibold text-gold shrink-0">
                {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-platinum">{c.name}</p>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-gold/70 bg-gold/10 px-1.5 py-0.5 rounded">{c.tier}</span>
                </div>
                <p className="text-[12px] text-platinum-muted">{c.mobile}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-platinum-muted">Wallet</p>
                <p className="text-[13px] font-medium text-gold tabular-nums">{formatINR(0)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-platinum-muted">Bookings</p>
                <p className="text-[13px] font-medium text-platinum tabular-nums">{c.totalPurchases || 0}</p>
              </div>
              {selectedCustomer?.id === c.id && (
                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-onyx" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== Step 2: Product Selection =====

function Step2Product() {
  const store = useBookingWizardStore();
  const { cartItems, addCartItem, removeCartItem } = store;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-product-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: debouncedSearch.length > 0,
  });

  const fetchedProducts = data || [];
  const filtered = [...fetchedProducts];
  
  const isInCart = (id: number | string) => cartItems.some(item => item.id === id);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-[24px] font-heading font-semibold text-platinum mb-2">Build Your Cart</h2>
      <p className="text-[13px] text-platinum-muted mb-6">Search and add multiple products to reserve for this booking.</p>

      {store.cartItems.length > 0 && (
        <div className="flex items-center justify-between p-4 mb-6 rounded-xl bg-gold/10 border border-gold/30">
          <div>
            <p className="text-[14px] font-medium text-gold flex items-center gap-2">
              <Gem className="w-4 h-4" /> Booking in Progress
            </p>
            <p className="text-[12px] text-platinum-muted mt-1">{store.cartItems.length} product(s) selected for this customer.</p>
          </div>
          <button 
            onClick={() => store.nextStep()}
            className="px-5 py-2.5 bg-gold text-onyx rounded-lg text-[13px] font-medium hover:bg-gold-light transition-colors flex items-center gap-2"
          >
            Continue with booking <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
        <input
          type="text"
          placeholder="Search by product code, barcode, or HUID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-onyx-elevated border border-onyx-border text-[14px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 transition-colors"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {!debouncedSearch && store.cartItems.length === 0 && (
        <div className="text-center py-10 text-platinum-muted text-[13px]">
          Type to search for a product.
        </div>
      )}

      {debouncedSearch && !isLoading && filtered.length === 0 && (
        <div className="text-center py-10 text-platinum-muted text-[13px]">
          No products found matching "{debouncedSearch}".
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p: any) => {
          const isAvailable = (p.quantity - (p.reservedQty || 0)) > 0;
          const pName = p.name || p.subCategory?.name || "Product";
          
          return (
            <button
              key={p.id}
              onClick={() => {
                if (!isAvailable && !isInCart(p.id)) return;
                
                if (isInCart(p.id)) {
                  removeCartItem(p.id);
                } else {
                  addCartItem({
                    ...p,
                    name: pName,
                    category: p.subCategory?.category?.name || p.category || "Category",
                    makingChargePercent: p.makingChargePercent || 0,
                    currentMarketValue: 0,
                  });
                }
              }}
              disabled={!isAvailable && !isInCart(p.id)}
              className={cn(
                "flex flex-col p-5 rounded-xl border transition-all text-left relative",
                isInCart(p.id)
                  ? "bg-gold/5 gold-border-strong gold-glow"
                  : isAvailable 
                    ? "bg-onyx-elevated border-onyx-border hover:border-gold/20"
                    : "bg-onyx-elevated/50 border-onyx-border/50 opacity-50 cursor-not-allowed"
              )}
            >
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-onyx-surface border border-onyx-border text-[9px] font-medium uppercase tracking-wider z-10">
                <span className={cn("w-1.5 h-1.5 rounded-full", isAvailable ? "bg-emerald-400" : "bg-red-400")} />
                {isAvailable ? "Available" : "Out of Stock"}
              </div>

              <div className="w-full h-32 rounded-lg bg-onyx-surface border border-onyx-border flex items-center justify-center mb-4 overflow-hidden relative">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={pName} className="w-full h-full object-cover" />
                ) : (
                  <Gem className="w-10 h-10 text-gold/30" />
                )}
              </div>
              <p className="text-[14px] font-medium text-platinum mb-4 truncate w-full pr-20">{pName}</p>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-2 w-full">
                <div>
                  <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-0.5">Code</p>
                  <p className="text-[12px] font-mono text-gold truncate">{p.productCode || "-"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-0.5">Barcode</p>
                  <p className="text-[12px] font-mono text-platinum truncate">{p.barcode || "-"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-0.5">HUID</p>
                  <p className="text-[12px] font-mono text-platinum truncate">{p.huidNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-0.5">Purity</p>
                  <p className="text-[12px] font-mono text-platinum truncate">{p.purity}K</p>
                </div>
                <div>
                  <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-0.5">Gr. Wt</p>
                  <p className="text-[12px] font-mono text-platinum truncate">{formatWeight(p.gsWeight || 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-0.5">Net Wt</p>
                  <p className="text-[12px] font-mono text-platinum truncate">{formatWeight(p.ntWeight || 0)}</p>
                </div>
              </div>

              {isInCart(p.id) && (
                <div className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-gold/10 text-gold text-[11px] font-medium w-full">
                  <Check className="w-4 h-4" /> Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== Step 3: Booking Configuration =====

function Step3Config() {
  const store = useBookingWizardStore();

  useEffect(() => {
    let newSubTotal = 0;
    const rateToUse = store.bookingRate;
    
    store.cartItems.forEach(item => {
      const mc = item.makingChargePercent || 0;
      const value = calcBookingValue(item.ntWeight, item.purity, rateToUse, mc);
      newSubTotal += value;
    });

    const newGrandTotal = newSubTotal + store.additionalCharges;

    store.setTotals(newSubTotal, 0, newGrandTotal);
  }, [store.cartItems, store.bookingRate, store.additionalCharges, store.setTotals]);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-[24px] font-heading font-semibold text-platinum mb-2">Mini-Bill Configuration</h2>
      <p className="text-[13px] text-platinum-muted mb-6">Set individual making charges, global gold rate, and taxes.</p>

      {/* Global Rates & Taxes */}
      <div className="mb-6 p-5 rounded-xl bg-onyx-elevated gold-border space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gold" /> Global Rates & Charges
        </h3>
        <p className="text-[12px] text-platinum-muted">
          Enter the gold rate (₹/g) to calculate item values.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">
              Global Booking Rate (₹/g)
            </label>
            <input
              type="number"
              value={store.bookingRate || ""}
              onChange={(e) => store.setBookingRate(parseFloat(e.target.value) || 0)}
              placeholder="Live rate if empty"
              className="w-full h-10 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[14px] text-platinum focus:outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">
              Additional Charges (₹)
            </label>
            <input
              type="number"
              value={store.additionalCharges || ""}
              onChange={(e) => store.setAdditionalCharges(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full h-10 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[14px] text-platinum focus:outline-none focus:border-gold/40"
            />
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-4 mb-8">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Gem className="w-4 h-4 text-gold" /> Cart Items ({store.cartItems.length})
        </h3>
        {store.cartItems.map(item => {
          const rateToUse = store.bookingRate;
          const mc = item.makingChargePercent || 0;
          const itemValue = calcBookingValue(item.ntWeight, item.purity, rateToUse, mc);

          return (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-onyx-elevated border border-onyx-border">
              <div className="flex-1">
                <p className="text-[14px] font-medium text-platinum">{item.name}</p>
                <p className="text-[11px] text-platinum-muted mt-1">
                  {formatWeight(item.ntWeight)} • {item.purity}K • Code: {item.productCode}
                </p>
              </div>
              <div className="w-32">
                <label className="block text-[9px] text-platinum-muted uppercase tracking-wider mb-1">
                  Making Chg (%)
                </label>
                <input
                  type="number"
                  value={item.makingChargePercent || ""}
                  onChange={(e) => store.updateCartItem(item.id, { makingChargePercent: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full h-8 px-2 rounded bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold/40"
                />
              </div>
              <div className="text-right min-w-[100px]">
                <p className="text-[9px] text-platinum-muted uppercase tracking-wider mb-1">Item Value</p>
                <p className="text-[14px] font-medium text-gold tabular-nums">{formatINR(itemValue)}</p>
              </div>
              <button
                onClick={() => store.removeCartItem(item.id)}
                className="p-2 ml-2 rounded-lg hover:bg-red-500/10 text-onyx-muted hover:text-red-400 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Estimated Value */}
      <div className="mt-8 p-5 rounded-xl bg-onyx-elevated gold-border space-y-3">
        <div className="flex justify-between text-[13px] text-platinum-muted">
          <span>Items Subtotal</span>
          <span className="tabular-nums">{formatINR(store.subTotal)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-platinum-muted">
          <span>Additional Charges</span>
          <span className="tabular-nums">{formatINR(store.additionalCharges)}</span>
        </div>
        <div className="pt-3 border-t border-onyx-border flex items-center justify-between">
          <span className="text-[12px] text-platinum font-medium uppercase tracking-wider">Estimated Grand Total</span>
          <CurrencyDisplay amount={store.grandTotal} size="lg" animate />
        </div>
      </div>
    </div>
  );
}

// ===== Step 4: Advance Entry =====

const PAYMENT_MODES: { mode: PaymentMode; icon: React.ElementType; label: string }[] = [
  { mode: "CASH", icon: Banknote, label: "Cash" },
  { mode: "UPI", icon: Smartphone, label: "UPI" },
  { mode: "CARD", icon: CreditCard, label: "Card" },
  { mode: "BANK_TRANSFER", icon: Landmark, label: "Bank Transfer" },
  { mode: "WALLET", icon: Wallet, label: "Wallet" },
  { mode: "GOLD_22K", icon: Coins, label: "22K Gold" },
  { mode: "GOLD_24K", icon: Coins, label: "24K Gold" },
];

function Step4Advance() {
  const store = useBookingWizardStore();
  const totalAdvance = selectTotalAdvance(store);
  const advancePercent = selectAdvancePercent(store);
  const remaining = selectRemaining(store);
  const colors = getAdvanceColor(advancePercent);

  const [selectedMode, setSelectedMode] = useState<PaymentMode>("CASH");
  const [amount, setAmount] = useState("");
  const [metalWeight, setMetalWeight] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const isMetalMode = selectedMode === "GOLD_22K" || selectedMode === "GOLD_24K";
  // Use the manually-entered booking rate for metal advance calculation
  const metalRate22K = store.bookingRate;
  const metalRate24K = store.bookingRate > 0 ? Math.round(store.bookingRate * (24 / 22)) : 0;
  const metalRate = selectedMode === "GOLD_22K" ? metalRate22K : metalRate24K;

  const calculatedAmount = isMetalMode && metalWeight && metalRate > 0
    ? Math.round(parseFloat(metalWeight) * metalRate)
    : parseFloat(amount) || 0;

  function addPayment() {
    if (calculatedAmount <= 0) return;
    store.addAdvance({
      mode: selectedMode,
      amount: calculatedAmount,
      metalWeight: isMetalMode ? parseFloat(metalWeight) : undefined,
      metalRate: isMetalMode ? metalRate : undefined,
      paymentRef: paymentRef || undefined,
    });
    setAmount("");
    setMetalWeight("");
    setPaymentRef("");
  }

  // Determine lock status message based on plan selection
  const isFixedRate = store.deliveryRatePlan === "FIXED_RATE";
  const isMarketRate = store.deliveryRatePlan === "MARKET_RATE";

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-[24px] font-heading font-semibold text-platinum mb-2">Add Advance Payments</h2>
      <p className="text-[13px] text-platinum-muted mb-6">Add one or more payment entries for this booking.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Payment Entry & Plan Selection */}
        <div className="lg:col-span-3 space-y-5">
          {/* Plan Selection */}
          <div className="bg-onyx-elevated rounded-xl gold-border p-5 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" /> Plan Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => store.setDeliveryRatePlan("OPTION_A_MARKET_RATE")}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  store.deliveryRatePlan === "OPTION_A_MARKET_RATE"
                    ? "bg-gold/5 gold-border-strong gold-glow"
                    : "bg-onyx-elevated border-onyx-border hover:border-gold/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-medium text-platinum">Option A: Market Rate</p>
                  {store.deliveryRatePlan === "OPTION_A_MARKET_RATE" && (
                    <div className="w-4 h-4 rounded-full bg-gold flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-onyx" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-platinum-muted leading-relaxed">Delivery rate applied. Max 3 months limit.</p>
              </button>
              
              <button
                onClick={() => store.setDeliveryRatePlan("OPTION_B_15_DAY_LOCK")}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  store.deliveryRatePlan === "OPTION_B_15_DAY_LOCK"
                    ? "bg-gold/5 gold-border-strong gold-glow"
                    : "bg-onyx-elevated border-onyx-border hover:border-gold/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-medium text-platinum">Option B: 15-Day Lock</p>
                  {store.deliveryRatePlan === "OPTION_B_15_DAY_LOCK" && (
                    <div className="w-4 h-4 rounded-full bg-gold flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-onyx" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-platinum-muted leading-relaxed">&gt;80% advance locks 100% rate for 15 days.</p>
              </button>

              <button
                onClick={() => store.setDeliveryRatePlan("OPTION_C_METAL_WALLET")}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  store.deliveryRatePlan === "OPTION_C_METAL_WALLET"
                    ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "bg-onyx-elevated border-onyx-border hover:border-blue-500/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-medium text-platinum">Option C: Metal Wallet</p>
                  {store.deliveryRatePlan === "OPTION_C_METAL_WALLET" && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-platinum-muted leading-relaxed">Advance &gt;10K converted to 24K metal in wallet.</p>
              </button>

              <button
                onClick={() => store.setDeliveryRatePlan("OPTION_D_FIXED_RATE")}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  store.deliveryRatePlan === "OPTION_D_FIXED_RATE"
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "bg-onyx-elevated border-onyx-border hover:border-emerald-500/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-medium text-platinum">Option D: Fixed Rate</p>
                  {store.deliveryRatePlan === "OPTION_D_FIXED_RATE" && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-platinum-muted leading-relaxed">Rate fully locked regardless of advance amount.</p>
              </button>
            </div>
          </div>

          {/* No booking rate warning for metal advances */}
          {isMetalMode && store.bookingRate <= 0 && (
            <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/30 text-[12px] text-red-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Please enter a booking rate in Configuration (Step 3) before adding metal advance.
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex flex-wrap gap-2">
            {PAYMENT_MODES.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[12px] font-medium transition-all",
                  selectedMode === mode
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "bg-onyx-elevated border-onyx-border text-platinum-muted hover:border-gold/20"
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Input Fields */}
          <div className="bg-onyx-elevated rounded-xl gold-border p-5 space-y-4">
            {isMetalMode ? (
              <div className="space-y-3">
                <label className="block text-[11px] text-platinum-muted uppercase tracking-wider">
                  Weight in Grams ({selectedMode === "GOLD_22K" ? "22K" : "24K"})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={metalWeight}
                  onChange={(e) => setMetalWeight(e.target.value)}
                  placeholder="Enter weight in grams"
                  className="w-full h-12 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[16px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 tabular-nums"
                />
                {metalWeight && metalRate > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-onyx-surface">
                    <span className="text-[11px] text-platinum-muted">
                      {metalWeight}g × {formatINR(metalRate)}/g {selectedMode === "GOLD_24K" && "(24K conv.)"}
                    </span>
                    <span className="text-[16px] font-medium text-gold tabular-nums">
                      = {formatINR(calculatedAmount)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-12 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[16px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40 tabular-nums"
                />
              </div>
            )}

            {(selectedMode === "UPI" || selectedMode === "CARD" || selectedMode === "BANK_TRANSFER") && (
              <div>
                <label className="block text-[11px] text-platinum-muted uppercase tracking-wider mb-2">
                  {selectedMode === "UPI" ? "UPI Ref Number" : selectedMode === "CARD" ? "Last 4 Digits" : "UTR Number"}
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={selectedMode === "CARD" ? "XXXX" : "Reference number"}
                  className="w-full h-10 px-4 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum placeholder-platinum-muted/50 focus:outline-none focus:border-gold/40"
                />
              </div>
            )}

            <button
              onClick={addPayment}
              disabled={calculatedAmount <= 0}
              className="w-full h-11 rounded-lg bg-gold text-onyx font-semibold text-[13px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Payment — {formatINR(calculatedAmount)}
            </button>
          </div>

          {/* Added Payments List */}
          {store.advances.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-platinum-muted uppercase tracking-wider font-medium">Added Payments</p>
              {store.advances.map((adv) => (
                <div key={adv.id} className="flex items-center justify-between p-3 rounded-lg bg-onyx-elevated border border-onyx-border">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-platinum-muted uppercase tracking-wider font-medium w-20">
                      {getPaymentModeLabel(adv.mode)}
                    </span>
                    {adv.metalWeight && (
                      <span className="text-[11px] text-platinum-muted">({formatWeight(adv.metalWeight)} @ {formatINR(adv.metalRate || 0)}/g)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-gold tabular-nums">{formatINR(adv.amount)}</span>
                    <button
                      onClick={() => store.removeAdvance(adv.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Live Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-28 bg-onyx-elevated rounded-xl gold-border p-6 space-y-5">
            <h3 className="text-[14px] font-medium text-platinum">Booking Summary</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Grand Total</span>
                <span className="text-[16px] font-medium text-platinum tabular-nums">{formatINR(store.grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Total Advance</span>
                <span className="text-[16px] font-medium text-gold tabular-nums">{formatINR(totalAdvance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-platinum-muted uppercase tracking-wider">Remaining</span>
                <span className="text-[16px] font-medium text-platinum tabular-nums">{formatINR(remaining)}</span>
              </div>
            </div>

            <AdvanceProgressBar percentage={advancePercent} variant="circular" size="lg" className="mx-auto" />

            {/* Dynamic Alert */}
            <div className={cn("p-3 rounded-lg border text-[12px] font-medium", isFixedRate ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : colors.bg, !isFixedRate && colors.border, !isFixedRate && colors.text)}>
              {isFixedRate ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  ✓ FIXED GOLD RATE — Rate locked at {formatINR(store.bookingRate)}/g regardless of advance.
                </div>
              ) : isMarketRate ? (
                <div className="flex items-center gap-2 text-platinum-muted">
                  <Unlock className="w-4 h-4" />
                  Market Rate — No rate protection. Delivery-day rate applies.
                </div>
              ) : advancePercent >= 80 ? (
                <div className="flex items-center gap-2 gold-shimmer rounded-lg p-2 -m-1">
                  <ShieldCheck className="w-4 h-4" />
                  ✓ FULL RATE LOCK — protected for 15 days
                </div>
              ) : advancePercent > 0 ? (
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  PARTIAL RATE LOCK — only advanced value is protected. Pay 80% to lock fully.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-platinum-muted">
                  <AlertTriangle className="w-4 h-4" />
                  No advance paid. No rate protection.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Step 5: Confirmation =====

function Step5Confirm() {
  const store = useBookingWizardStore();
  const totalAdvance = selectTotalAdvance(store);
  const advancePercent = selectAdvancePercent(store);
  const { mutateAsync: createBooking } = useCreateBooking();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [printMode, setPrintMode] = useState(false);

  const planLabel = store.deliveryRatePlan === "OPTION_A_MARKET_RATE"
    ? "Option A: Market Rate"
    : store.deliveryRatePlan === "OPTION_B_15_DAY_LOCK"
    ? "Option B: 15-Day Lock"
    : store.deliveryRatePlan === "OPTION_C_METAL_WALLET"
    ? "Option C: Metal Wallet"
    : "Option D: Fixed Rate";

  const isRateLocked = store.deliveryRatePlan === "OPTION_D_FIXED_RATE" || (store.deliveryRatePlan === "OPTION_B_15_DAY_LOCK" && advancePercent >= 80);

  async function handleConfirm(andPrint = false) {
    if (store.deliveryRatePlan === "OPTION_B_15_DAY_LOCK" && advancePercent < 80) {
      alert("Option B requires at least 80% advance.");
      return;
    }
    if (store.deliveryRatePlan === "OPTION_C_METAL_WALLET" && totalAdvance < 10000) {
      alert("Option C requires at least ₹10,000 advance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: store.selectedCustomer?.id,
        items: store.cartItems.map(i => ({ productId: i.id, makingChargePercent: i.makingChargePercent || 0 })),
        branchId: store.cartItems[0]?.branchId || 1,
        deliveryRatePlan: store.deliveryRatePlan || "OPTION_A_MARKET_RATE",
        advances: store.advances.map(a => ({
          advanceType: a.mode === "GOLD_22K" ? "METAL_22K" : a.mode === "GOLD_24K" ? "METAL_24K" : a.mode,
          cashAmount: a.amount,
          metalWeight: a.metalWeight,
          paymentRef: a.paymentRef
        })),
        bookingRate: store.bookingRate,
        additionalCharges: store.additionalCharges,
      };
      const res = await createBooking(payload);
      if (andPrint) {
        setBookingResult(res);
        setPrintMode(true);
        setTimeout(() => {
          window.print();
          router.push(`/book-products/${res.id}`);
        }, 500);
      } else {
        router.push(`/book-products/${res.id}`);
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  }

  const bookingDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const bookingTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ====== PRINT SLIP (hidden, only visible when printing) ====== */}
      <div id="print-slip" className="hidden print:block bg-white text-black p-8 max-w-[800px] mx-auto text-[12px] leading-relaxed">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            #print-slip, #print-slip * { visibility: visible; }
            #print-slip { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}} />

        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-[22px] font-bold tracking-wide">JEWELLERY STORE</h1>
          <p className="text-[10px] text-gray-600 mt-1">Booking Advance Receipt</p>
        </div>

        {/* Booking Info Row */}
        <div className="flex justify-between border-b border-gray-300 pb-3 mb-3">
          <div>
            <p><strong>Booking No:</strong> {bookingResult?.bookingNumber || "Generating..."}</p>
            <p><strong>Date:</strong> {bookingDate} at {bookingTime}</p>
          </div>
          <div className="text-right">
            <p><strong>Customer:</strong> {store.selectedCustomer?.name}</p>
            <p><strong>Mobile:</strong> {store.selectedCustomer?.mobile}</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="mb-4">
          <h3 className="text-[13px] font-bold border-b border-gray-400 pb-1 mb-2">PRODUCT DETAILS</h3>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">Code</th>
                <th className="text-left py-1">Product</th>
                <th className="text-right py-1">Gr. Wt</th>
                <th className="text-right py-1">Net Wt</th>
                <th className="text-right py-1">Purity</th>
                <th className="text-right py-1">Making %</th>
                <th className="text-right py-1">Value</th>
              </tr>
            </thead>
            <tbody>
              {store.cartItems.map(item => {
                const itemVal = calcBookingValue(item.ntWeight, item.purity, store.bookingRate, item.makingChargePercent || 0);
                return (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-1 font-mono">{item.productCode}</td>
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 text-right">{formatWeight(item.gsWeight)}</td>
                    <td className="py-1 text-right">{formatWeight(item.ntWeight)}</td>
                    <td className="py-1 text-right">{item.purity}K</td>
                    <td className="py-1 text-right">{item.makingChargePercent || 0}%</td>
                    <td className="py-1 text-right font-medium">{formatINR(itemVal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Estimated Cost */}
        <div className="mb-4 border border-gray-300 rounded p-3">
          <h3 className="text-[13px] font-bold mb-2">ESTIMATED COST</h3>
          <div className="flex justify-between py-0.5"><span>Subtotal</span><span>{formatINR(store.subTotal)}</span></div>
          <div className="flex justify-between py-0.5"><span>Additional Charges</span><span>{formatINR(store.additionalCharges)}</span></div>
          <div className="flex justify-between py-1 border-t border-gray-300 mt-1 font-bold text-[13px]">
            <span>Grand Total (Estimated)</span><span>{formatINR(store.grandTotal)}</span>
          </div>
        </div>

        {/* Advance Payments */}
        <div className="mb-4 border border-gray-300 rounded p-3">
          <h3 className="text-[13px] font-bold mb-2">ADVANCE PAYMENTS</h3>
          {store.advances.map((adv) => (
            <div key={adv.id} className="flex justify-between py-0.5 text-[11px]">
              <span>
                {getPaymentModeLabel(adv.mode)}
                {adv.metalWeight ? ` (${formatWeight(adv.metalWeight)} @ ${formatINR(adv.metalRate || 0)}/g)` : ""}
                {adv.paymentRef ? ` — Ref: ${adv.paymentRef}` : ""}
              </span>
              <span className="font-medium">{formatINR(adv.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between py-1 border-t border-gray-300 mt-1 font-bold">
            <span>Total Advance</span><span>{formatINR(totalAdvance)} ({advancePercent}%)</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Remaining Balance</span><span>{formatINR(Math.max(0, store.grandTotal - totalAdvance))}</span>
          </div>
        </div>

        {/* Rate & Lock Details */}
        <div className="mb-4 border border-gray-300 rounded p-3">
          <h3 className="text-[13px] font-bold mb-2">RATE & LOCK STATUS</h3>
          <div className="flex justify-between py-0.5"><span>Booking Gold Rate</span><span className="font-medium">{formatINR(store.bookingRate)}/g</span></div>
          <div className="flex justify-between py-0.5"><span>Lock Plan Selected</span><span className="font-medium">{planLabel}</span></div>
          <div className="flex justify-between py-0.5">
            <span>Rate Status</span>
            <span className="font-bold">{isRateLocked ? "✓ RATE IS LOCKED" : "✗ RATE NOT LOCKED"}</span>
          </div>
          <div className="flex justify-between py-0.5"><span>Rate Lock Validity</span><span>15 days from booking date</span></div>
          <div className="flex justify-between py-0.5"><span>Collection Deadline</span><span>30 days from booking date</span></div>
        </div>

        {/* Booking Rules */}
        <div className="border-t-2 border-black pt-3 mt-4">
          <h3 className="text-[13px] font-bold mb-2">BOOKING RULES & TERMS</h3>
          <ol className="text-[10px] text-gray-700 space-y-1 list-decimal pl-4">
            <li>This booking is valid for <strong>30 days</strong> from the date of booking. Product must be collected within this period.</li>
            <li>Rate lock (if applicable) is valid for <strong>15 days</strong> from the booking date. After expiry, delivery-day market rate applies.</li>
            <li><strong>Option A (Rate Lock Plan):</strong> Advance of 80% or more automatically locks the full gold rate for 15 days. Partial advance locks only the equivalent metal value.</li>
            <li><strong>Option B (Market Rate):</strong> No rate protection. Final price is calculated using the gold rate on the day of delivery.</li>
            <li><strong>Option C (Fixed Gold Rate):</strong> Gold rate is locked immediately at the booking rate, regardless of the advance amount.</li>
            <li>A <strong>2% cancellation charge</strong> applies on refunds if the booking is cancelled by the customer.</li>
            <li>All advance payments are non-transferable. Refunds (if applicable) will be processed to the customer&apos;s wallet or via deduction.</li>
            <li>The estimated total is based on the booking-day gold rate. Final amount may vary for unlocked portions.</li>
            <li>This receipt is a proof of advance payment only and does not constitute a purchase invoice.</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-300 mt-4 pt-3 text-[9px] text-gray-500">
          <p>Thank you for your booking. For any queries, please contact the store.</p>
          <p className="mt-1">This is a computer-generated receipt.</p>
        </div>
      </div>

      {/* ====== SCREEN VIEW ====== */}
      <div className={cn("max-w-4xl mx-auto", printMode && "no-print")}>
        <h2 className="text-[24px] font-heading font-semibold text-platinum mb-2">Booking Confirmation</h2>
        <p className="text-[13px] text-platinum-muted mb-8">Review all details before confirming.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Cart Items */}
          <div className="bg-onyx-elevated rounded-xl gold-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2 mb-4">
              <Gem className="w-4 h-4 text-gold" /> Items to Book
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {store.cartItems.map(item => (
                <div key={item.id} className="p-3 rounded-lg bg-onyx-surface border border-onyx-border">
                  <p className="text-[10px] font-mono text-gold mb-1">{item.productCode}</p>
                  <p className="text-[14px] font-heading font-semibold text-platinum mb-2">{item.name}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-platinum-muted">Weight</span>
                      <MetalWeightDisplay weight={item.ntWeight ?? 0} purity={item.purity ?? 0} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-platinum-muted">Making Charge</span>
                      <span className="text-[11px] text-platinum">{item.makingChargePercent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-onyx-border space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted">SubTotal</span>
                <span className="text-[12px] text-platinum tabular-nums">{formatINR(store.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted">Additional Charges</span>
                <span className="text-[12px] text-platinum tabular-nums">{formatINR(store.additionalCharges)}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-onyx-border">
                <span className="text-[13px] font-medium text-platinum">Grand Total</span>
                <span className="text-[14px] font-semibold text-gold tabular-nums">{formatINR(store.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="bg-onyx-elevated rounded-xl gold-border p-5">
              <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-3">Customer</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-[12px] font-semibold text-gold">
                  {store.selectedCustomer?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-platinum">{store.selectedCustomer?.name}</p>
                  <p className="text-[12px] text-platinum-muted">{store.selectedCustomer?.mobile}</p>
                </div>
                <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">
                  {store.selectedCustomer?.tier}
                </span>
              </div>
            </div>

            {/* Rate & Plan */}
            <div className="bg-onyx-elevated rounded-xl gold-border p-5 space-y-3">
              <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-1">Rate Details</p>
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted">Booking Rate</span>
                <span className="text-[13px] text-gold tabular-nums">{formatINR(store.bookingRate)}/g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted">Lock Plan</span>
                <span className="text-[13px] text-platinum">{planLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-platinum-muted">Rate Status</span>
                <span className={cn("text-[13px] font-semibold", isRateLocked ? "text-emerald-400" : "text-amber-400")}>
                  {isRateLocked ? "✓ LOCKED" : "✗ NOT LOCKED"}
                </span>
              </div>
            </div>

            {/* Advance Summary */}
            <div className="bg-onyx-elevated rounded-xl gold-border p-5 space-y-3">
              <p className="text-[10px] text-platinum-muted uppercase tracking-wider mb-1">Advance Summary</p>
              {store.advances.map((adv) => (
                <div key={adv.id} className="flex justify-between text-[12px]">
                  <span className="text-platinum-muted">
                    {getPaymentModeLabel(adv.mode)}
                    {adv.metalWeight ? ` (${formatWeight(adv.metalWeight)})` : ""}
                  </span>
                  <span className="text-platinum tabular-nums">{formatINR(adv.amount)}</span>
                </div>
              ))}
              <div className="border-t border-onyx-border pt-2 flex justify-between">
                <span className="text-[12px] text-platinum font-medium">Total Advance</span>
                <span className="text-[14px] text-gold font-semibold tabular-nums">{formatINR(totalAdvance)} ({advancePercent}%)</span>
              </div>
            </div>

            {/* Lock Status */}
            <div className="p-4 rounded-xl bg-onyx-elevated gold-border flex items-center justify-center">
              {isRateLocked ? (
                <BookingStatusBadge status="RATE_LOCKED" size="lg" />
              ) : advancePercent >= 30 ? (
                <BookingStatusBadge status="PARTIAL_LOCK" size="lg" />
              ) : (
                <BookingStatusBadge status="ACTIVE" size="lg" />
              )}
            </div>
          </div>
        </div>

        {/* Confirm Buttons */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => handleConfirm(true)}
            disabled={isSubmitting}
            className="h-12 px-6 rounded-xl border border-gold/40 bg-gold/5 text-gold font-heading font-semibold text-[14px] hover:bg-gold/10 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                Confirm & Print Slip
              </>
            )}
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl bg-gold text-onyx font-heading font-semibold text-[16px] hover:bg-gold-light transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-onyx border-t-transparent rounded-full animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Confirm Booking
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ===== Main Wizard Page =====

export default function CreateBookingPage() {
  const store = useBookingWizardStore();

  // Reset wizard on mount
  useEffect(() => {
    store.reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceed = () => {
    switch (store.step) {
      case 1: return !!store.selectedCustomer;
      case 2: return store.cartItems.length > 0;
      case 3: return store.grandTotal > 0; // Configured rates properly
      case 4: return store.advances.length > 0;
      default: return true;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-heading font-semibold text-platinum">New Booking</h1>
        <p className="text-[12px] text-platinum-muted mt-0.5">Create a new product booking</p>
      </div>

      <StepIndicator currentStep={store.step} />

      {/* Step Content */}
      <div className="mb-10">
        {store.step === 1 && <Step1Customer />}
        {store.step === 2 && <Step2Product />}
        {store.step === 3 && <Step3Config />}
        {store.step === 4 && <Step4Advance />}
        {store.step === 5 && <Step5Confirm />}
      </div>

      {/* Navigation */}
      {store.step < 5 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => store.prevStep()}
            disabled={store.step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-onyx-border text-[13px] text-platinum-muted hover:text-platinum hover:border-gold/20 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => store.nextStep()}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-onyx font-semibold text-[13px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
