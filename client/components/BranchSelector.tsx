'use client';

import { useEffect } from 'react';
import { useBranchStore } from '@/lib/store/useBranchStore';
import { useUserStore } from '@/lib/store/useUserStore';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
export default function BranchSelector() {
  const { branches, selectedBranch, fetchAllBranches, fetchBranchById, selectBranch } =
    useBranchStore();

  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user?.systemRole === 'ADMIN' || user?.role === 'ADMIN') {
      fetchAllBranches();
    }
  }, [user, fetchAllBranches]);

  if (user?.systemRole !== 'ADMIN' && user?.role !== 'ADMIN') {
    return (
      <div className="px-4 py-2 text-sm text-foreground">
        Branch: <strong>{selectedBranch?.name || 'Your Branch'}</strong>
      </div>
    );
  }

  const handleChange = async (value: string) => {
    const branchId = Number(value);
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      selectBranch(branch);
      const res = await fetchBranchById(branchId);
      console.log(res);
    }
  };

  return (
    <div className="w-full px-4 py-2">
  <label htmlFor="branch-selector" className="block text-sm font-medium text-foreground mb-1">
    Select Branch
  </label>
  <Select onValueChange={handleChange} value={selectedBranch?.id?.toString() || ''}>
    <SelectTrigger className="w-full bg-card text-sm text-foreground">
      <SelectValue placeholder="-- Choose a branch --" />
    </SelectTrigger>
    <SelectContent>
      {branches.map((branch) => (
        <SelectItem key={branch.id} value={branch.id.toString()}>
          {branch.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {selectedBranch && (
    <p className="mt-2 text-sm text-foreground">
      Current: <span className="font-medium">{selectedBranch.name}</span>
    </p>
  )}
</div>
  );
}
