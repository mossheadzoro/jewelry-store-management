"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useBranchStore } from "@/lib/store/useBranchStore";
import SubCategoryModal from "../../../../../components/Inventory/SubCategory/AddSubCategory";
import AddProductModal from "../../../../../components/Inventory/Product/AddProductForm";


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
  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subCatOpen, setSubCatOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/inventory/category/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const filtered = data?.subCategories?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full flex items-center justify-center text-gray-500">Loading...</div>
      </SidebarProvider>
    );
  }

  if (!data) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full flex items-center justify-center text-gray-500">Category not found</div>
      </SidebarProvider>
    );
  }

  if ('error' in data) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full flex items-center justify-center text-red-500">
          {(data as any).error}
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest mb-8">
          <span className="cursor-pointer hover:text-gray-300" onClick={() => router.push("/inventory")}>Home</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-gray-300" onClick={() => router.push("/inventory")}>Category</span>
          <span>/</span>
          <span className="text-yellow-500 font-semibold">{data.name}</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tight uppercase mb-2">{data.name}</h1>
            <p className="text-gray-500 text-sm">{data.description || "Fine Jewellery Collection"}</p>
          </div>
          <div className="bg-[#1a1800] border border-yellow-800/50 rounded-2xl px-8 py-5 text-right">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Stock Weight</p>
            <p className="text-3xl font-bold">
              {data.totalWeight.toLocaleString("en-IN")}
              <span className="text-lg text-gray-400 ml-1">g</span>
            </p>
          </div>
        </div>

        {/* Search + Add Buttons */}
        <div className="flex gap-4 mb-10">
          <div className="flex-1 flex items-center bg-[#141414] border border-gray-800 rounded-2xl px-5 py-3 gap-3">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subcategories..."
              className="bg-transparent outline-none text-white w-full text-sm placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSubCatOpen(true)}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white border border-gray-700 font-medium px-6 py-3 rounded-2xl text-sm transition-colors"
            >
              <Plus size={18} /> Add Subcategory
            </button>
            <button
              onClick={() => setAddProductOpen(true)}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-yellow-900/20"
            >
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>

        {/* Subcategory Cards */}
        {filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No subcategories found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                onClick={() => router.push(`/inventory/subcategory/${sub.id}`)}
                className="bg-[#141414] border border-gray-800/50 rounded-2xl p-6 cursor-pointer hover:bg-[#1a1a1a] hover:border-gray-700 transition-all group"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{sub.name}</h3>
                  <p className="text-xs text-gray-500">Jewellery subcategory</p>
                </div>

                <div className="border-t border-gray-800/50 pt-4 flex justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Items</p>
                    <p className="text-lg font-bold">{sub.itemCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Weight</p>
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
          onSuccess={fetchData} 
          parentCategoryId={parseInt(id as string)} 
        />
        {addProductOpen && (
          <AddProductModal 
            open={addProductOpen} 
            setOpen={setAddProductOpen} 
            branches={branches} 
            onSuccess={fetchData} 
            categoryId={parseInt(id as string)}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
