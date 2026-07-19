import { create } from 'zustand';

interface ProductSettingsState {
  globalSettings: any | null;
  loading: boolean;
  error: string | null;
  fetchGlobalSettings: (branchId: number) => Promise<void>;
  clearData: () => void;
}

export const useProductSettingsStore = create<ProductSettingsState>((set, get) => ({
  globalSettings: null,
  loading: false,
  error: null,

  fetchGlobalSettings: async (branchId: number) => {
    // Prevent fetching if already loading to avoid duplicate requests
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/settings/product?branchId=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        set({ globalSettings: data, loading: false });
      } else {
        set({ error: 'Failed to fetch global settings', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message || 'An error occurred', loading: false });
    }
  },

  clearData: () => set({ globalSettings: null, loading: false, error: null }),
}));
