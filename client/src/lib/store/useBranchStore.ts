// store/branchStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface Branch {
  id: number;
  name: string;
  users?: {
    id: number;
    name: string;
    role: string;
    email: string;
  }[];
}

interface BranchState {
  branches: Branch[];
  selectedBranch: Branch | null;
  branchSettings: any | null;
  setBranches: (branches: Branch[]) => void;
  selectBranch: (branch: Branch) => void;
  clearBranchData: () => void;
  fetchAllBranches: () => Promise<void>;
  fetchBranchById: (id: number) => Promise<void>;
  fetchBranchSettings: (id: number) => Promise<void>;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branches: [],
      selectedBranch: null,
      branchSettings: null,
      setBranches: (branches) => set({ branches }),
      selectBranch: (branch) => set({ selectedBranch: branch }),
      clearBranchData: () => set({ branches: [], selectedBranch: null, branchSettings: null }),

      // Fetch all branch names (lightweight)
      fetchAllBranches: async () => {
        try {
          const res = await axios.get('/api/branch/fetch'); // <- Endpoint returns [{id, name}]
          console.log('Fetched branches:', res.data);
          set({ branches: res.data });
        } catch (err) {
          console.error('Failed to fetch branches', err);
        }
      },

      // Fetch full branch info when selected
      fetchBranchById: async (id) => {
        try {
          const res = await axios.get(`/api/branch/fetchById/${id}`); // <- Full branch data
          set({ selectedBranch: res.data });
        } catch (err) {
          console.error('Failed to fetch branch details', err);
        }
      },

      fetchBranchSettings: async (id) => {
        try {
          const res = await axios.get(`/api/branch/settings?branchId=${id}`);
          set({ branchSettings: res.data });
        } catch (err) {
          console.error('Failed to fetch branch settings', err);
        }
      },
    }),
    { name: 'branch-store' }
  )
);
