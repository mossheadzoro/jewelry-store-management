import { create } from 'zustand';

interface ProductItem {
  id: number;
  name?: string | null;
  productCode?: string | null;
  ntWeight?: number | null;
  gsWeight?: number | null;
  purity?: number | null;
}

interface StampingCartState {
  cart: ProductItem[];
  addToCart: (item: ProductItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
}

export const useStampingCart = create<StampingCartState>((set, get) => ({
  cart: [],
  addToCart: (item) => {
    if (!get().isInCart(item.id)) {
      set((state) => ({ cart: [...state.cart, item] }));
    }
  },
  removeFromCart: (id) => {
    set((state) => ({ cart: state.cart.filter((i) => i.id !== id) }));
  },
  clearCart: () => set({ cart: [] }),
  isInCart: (id) => get().cart.some((i) => i.id === id),
}));
