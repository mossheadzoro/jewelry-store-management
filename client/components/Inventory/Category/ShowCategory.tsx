"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useBranchStore } from "@/lib/store/useBranchStore";

interface Category {
  id: number;
  name: string;
  totalWeight: number;
  branchId: number;
}

export default function ShowCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const { selectedBranch } = useBranchStore();
  const branchId = selectedBranch?.id;

  const fetchCategories = async () => {
    if (!branchId) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `/api/inventory/category/fetchAll?branchId=${branchId}`
      );
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      fetchCategories();
    }
  }, [branchId]); // refetch when selectedBranch is updated

  return (
    <div className="p-6 bg-background rounded-lg shadow-md text-foreground">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">All Categories</h2>
        <Button onClick={fetchCategories} disabled={loading || !branchId}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Total Weight (g)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length > 0 ? (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.totalWeight?.toFixed(2)} g</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                {loading
                  ? "Loading Categories..."
                  : "No categories found for selected branch."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
