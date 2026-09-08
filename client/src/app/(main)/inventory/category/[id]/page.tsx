"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Plus, ArrowUpRight, ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBranchStore } from "@/lib/store/useBranchStore";
import SubCategoryModal from "@/components/Inventory/SubCategory/AddSubCategory";
import AddProductModal from "@/components/Inventory/Product/AddProductForm";

interface SubCat {
  id: number;
  name: string;
  itemCount: number;
  totalWeight: number;
}

interface CategoryData {
  id: number;
  name: string;
  description?: string;
  totalWeight: number;
  subCategories: SubCat[];
}

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { branches } = useBranchStore();
  const [search, setSearch] = useState("");
  const [subCatOpen, setSubCatOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery<CategoryData | null>({
    queryKey: ["categoryDetail", id],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/category/${id}`);
      if (!res.ok) throw new Error("Failed to fetch category");
      return res.json();
    },
    enabled: !!id,
  });

  const invalidateCategory = () => queryClient.invalidateQueries({ queryKey: ["categoryDetail", id] });

  const filtered = data?.subCategories?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <main className="flex-1 min-h-screen bg-onyx text-foreground overflow-auto">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-20 flex items-center justify-center text-muted-foreground">
          Loading category data...
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 min-h-screen bg-onyx text-foreground overflow-auto">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <p>Category not found.</p>
          <button
            onClick={() => router.push("/inventory")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Inventory
          </button>
        </div>
      </main>
    );
  }

  if ('error' in data) {
    return (
      <main className="flex-1 min-h-screen bg-onyx text-foreground overflow-auto">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-20 flex flex-col items-center justify-center gap-4 text-red-500">
          <p>{(data as any).error}</p>
          <button
            onClick={() => router.push("/inventory")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Inventory
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-onyx text-foreground overflow-auto">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-8">
          <span className="cursor-pointer hover:text-foreground/80" onClick={() => router.push("/inventory")}>Home</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-foreground/80" onClick={() => router.push("/inventory")}>Category</span>
          <span>/</span>
          <span className="text-yellow-500 font-semibold">{data.name}</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tight uppercase mb-2">{data.name}</h1>
            <p className="text-muted-foreground text-sm">{data.description || "Fine Jewellery Collection"}</p>
          </div>
          <div className="bg-onyx-elevated border border-yellow-800/50 rounded-2xl px-8 py-5 text-right shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Stock Weight</p>
            <p className="text-3xl font-bold">
              {data.totalWeight.toLocaleString("en-IN")}
              <span className="text-lg text-muted-foreground ml-1">g</span>
            </p>
          </div>
        </div>

        {/* Search + Add Buttons */}
        <div className="flex gap-4 mb-10 flex-wrap sm:flex-nowrap">
          <div className="flex-1 flex items-center bg-onyx-surface border border-border rounded-2xl px-5 py-3 gap-3">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subcategories..."
              className="bg-transparent outline-none text-foreground w-full text-sm placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSubCatOpen(true)}
              className="flex items-center gap-2 bg-onyx-elevated hover:bg-secondary text-foreground border border-border font-medium px-6 py-3 rounded-2xl text-sm transition-colors cursor-pointer"
            >
              <Plus size={18} /> Add Subcategory
            </button>
            <button
              onClick={() => setAddProductOpen(true)}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-foreground font-semibold px-6 py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-yellow-900/20 cursor-pointer"
            >
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>

        {/* Subcategory Cards */}
        {filtered.length === 0 ? (
          <div className="text-muted-foreground text-center py-20 bg-onyx-surface/50 border border-border/30 rounded-2xl">
            No subcategories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                onClick={() => router.push(`/inventory/subcategory/${sub.id}`)}
                className="bg-onyx-surface border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-onyx-elevated hover:border-yellow-600/40 transition-all group shadow-sm"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-yellow-400 transition-colors">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground">Jewellery subcategory</p>
                  </div>
                  <ArrowUpRight size={18} className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
                </div>

                <div className="border-t border-border/50 pt-4 flex justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Items</p>
                    <p className="text-lg font-bold">{sub.itemCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Weight</p>
                    <p className="text-lg font-bold text-yellow-500">{sub.totalWeight.toFixed(2)} g</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <SubCategoryModal 
          open={subCatOpen} 
          setOpen={setSubCatOpen} 
          onSuccess={invalidateCategory} 
          parentCategoryId={parseInt(id as string)} 
        />
        {addProductOpen && (
          <AddProductModal 
            open={addProductOpen} 
            setOpen={setAddProductOpen} 
            branches={branches} 
            onSuccess={invalidateCategory} 
            categoryId={parseInt(id as string)}
          />
        )}
      </div>
    </main>
  );
}
