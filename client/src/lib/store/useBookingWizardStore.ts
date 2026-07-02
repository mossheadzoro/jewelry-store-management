// ===== Aurum ERP — Booking Wizard Zustand Store =====

import { create } from "zustand";
import type {
  BookingCustomer,
  BookingProduct,
  RateLockPlan,
  DeliveryRatePlan,
  WizardAdvanceEntry,
} from "@/lib/types/booking";
import { generateId } from "@/lib/booking-utils";

interface BookingWizardStore {
  // Navigation
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1 — Customer
  selectedCustomer: BookingCustomer | null;
  setSelectedCustomer: (customer: BookingCustomer | null) => void;

  // Step 2 — Product Cart
  cartItems: BookingProduct[];
  addCartItem: (product: BookingProduct) => void;
  removeCartItem: (productId: string | number) => void;
  updateCartItem: (productId: string | number, updates: Partial<BookingProduct>) => void;

  // Step 3 — Rate Plans
  rateLockPlan: RateLockPlan | null;
  setRateLockPlan: (plan: RateLockPlan | null) => void;
  deliveryRatePlan: DeliveryRatePlan | null;
  setDeliveryRatePlan: (plan: DeliveryRatePlan | null) => void;

  // Step 4 — Advances
  advances: WizardAdvanceEntry[];
  addAdvance: (entry: Omit<WizardAdvanceEntry, "id">) => void;
  removeAdvance: (id: string) => void;
  clearAdvances: () => void;

  // Computed & Global Financials
  bookingRate: number;
  setBookingRate: (rate: number) => void;

  additionalCharges: number;
  setAdditionalCharges: (charges: number) => void;
  


  // Derived totals
  subTotal: number;

  grandTotal: number;
  setTotals: (subTotal: number, gstAmount: number, grandTotal: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  step: 1,
  selectedCustomer: null,
  cartItems: [] as BookingProduct[],
  rateLockPlan: null,
  deliveryRatePlan: null,
  advances: [] as WizardAdvanceEntry[],
  bookingRate: 0,
  additionalCharges: 0,

  subTotal: 0,
  grandTotal: 0,
};

export const useBookingWizardStore = create<BookingWizardStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(5, s.step + 1) })),
  prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) })),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  
  addCartItem: (product) => set((s) => ({ cartItems: [...s.cartItems, product] })),
  removeCartItem: (productId) => set((s) => ({ cartItems: s.cartItems.filter(p => p.id !== productId) })),
  updateCartItem: (productId, updates) => set((s) => ({
    cartItems: s.cartItems.map(p => p.id === productId ? { ...p, ...updates } : p)
  })),

  setRateLockPlan: (plan) => set({ rateLockPlan: plan }),
  setDeliveryRatePlan: (plan) => set({ deliveryRatePlan: plan }),

  addAdvance: (entry) =>
    set((s) => ({
      advances: [...s.advances, { ...entry, id: generateId() }],
    })),

  removeAdvance: (id) =>
    set((s) => ({
      advances: s.advances.filter((a) => a.id !== id),
    })),

  clearAdvances: () => set({ advances: [] }),

  setBookingRate: (rate) => set({ bookingRate: rate }),
  setAdditionalCharges: (charges) => set({ additionalCharges: charges }),

  setTotals: (subTotal, gstAmount, grandTotal) => set({ subTotal, grandTotal }),

  reset: () => set(initialState),
}));

// Selector helpers
export const selectTotalAdvance = (state: BookingWizardStore) =>
  state.advances.reduce((sum, a) => sum + a.amount, 0);

export const selectAdvancePercent = (state: BookingWizardStore) => {
  const total = state.advances.reduce((sum, a) => sum + a.amount, 0);
  return state.grandTotal > 0
    ? Math.min(100, parseFloat(((total / state.grandTotal) * 100).toFixed(2)))
    : 0;
};

export const selectRemaining = (state: BookingWizardStore) => {
  const total = state.advances.reduce((sum, a) => sum + a.amount, 0);
  return Math.max(0, state.grandTotal - total);
};

export const selectIsLockEligible = (state: BookingWizardStore) => {
  const percent = selectAdvancePercent(state);
  return percent >= 80;
};
