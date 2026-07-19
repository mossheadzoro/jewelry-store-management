// lib/store/useUserStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Salesman {
  id: number;
  image: string | null; // Optional image field
  name: string;
  email: string;
  role: string;
  branchId: number | null;

  // ...other fields
}
interface User {
  id: number;
  image:string | null; // Optional image field
  name: string;
  email: string;
  role?: string;
  systemRole?: string;
  branchId: number | null;
}
interface Branch {
  id: number;
  name: string;
  Users: User[];
  // ...other fields
}



interface UserState {
  user: User | null;
  branch: Branch | null;
  salesmen: Salesman[];
  manager: User | null; // Optional, if you want to store manager data
  setUserData: (user: User, branch: Branch, salesmen: Salesman[], manager: User | null) => void;
  clearData: () => void;
}



export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      branch: null,
      salesmen: [],
      manager: null,
      setUserData: (user, branch, salesmen, manager) =>
        set({ user, branch, salesmen, manager }),
      clearData: () =>
        set({ user: null, branch: null, salesmen: [], manager: null }),
    }),
    {
      name: 'user-store', // localStorage key
    }
  )
);
