"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Edit } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface Product {
  id: number;
  name: string;
  productCode: string;
  barcode: string;
  huidNumber: string | null;
  image: string | null;
  gsWeight: number;
  ntWeight: number;
  purity: number;
  quantity: number;
  reservedQty: number;
  subCategory?: { name: string; category?: { name: string } };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white p-8">Loading Search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const branchId = searchParams.get("branchId") || "1";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/inventory/search?q=${encodeURIComponent(q)}&branchId=${branchId}`)
      .then((r) => r.json())
      .then((d) => setResults(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, branchId]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      router.push(`/inventory/search?q=${encodeURIComponent(searchInput)}&branchId=${branchId}`);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full">
        {/* Back + Search */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/inventory")} className="text-gray-400 hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 flex items-center bg-[#141414] border border-gray-800 rounded-2xl px-5 py-3 gap-3">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by product code, HUID, barcode, name..."
              className="bg-transparent outline-none text-white w-full text-sm placeholder:text-gray-600"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-500 text-sm mb-8">
          {loading ? "Searching..." : `${results.length} results for "${q}"`}
        </p>

        {/* Results Table */}
        <div className="bg-[#141414] border border-gray-800/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-800/50">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Product</th>
                <th className="p-4">Code / HUID</th>
                <th className="p-4">Category</th>
                <th className="p-4">Specs</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-500">Searching...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-500">No products found matching your search.</td></tr>
              ) : results.map((p) => {
                const sold = p.quantity <= 0;
                const reserved = p.reservedQty > 0;
                return (
                  <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-[#1e1e1e] rounded-xl overflow-hidden flex items-center justify-center">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-600 text-[10px]">No img</span>}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{p.name}</td>
                    <td className="p-4">
                      <p className="font-mono text-gray-300">{p.productCode}</p>
                      <p className="text-xs text-gray-500">HUID: {p.huidNumber || "—"}</p>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {p.subCategory?.category?.name || "—"} / {p.subCategory?.name || "—"}
                    </td>
                    <td className="p-4 text-xs text-gray-400">{p.ntWeight}g • {p.purity}K</td>
                    <td className="p-4">
                      <span className={`text-xs font-medium ${sold ? "text-red-400" : reserved ? "text-yellow-400" : "text-emerald-400"}`}>
                        {sold ? "Sold" : reserved ? "Reserved" : "In Stock"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => router.push(`/inventory/product/${p.id}`)} className="text-gray-500 hover:text-yellow-500 text-xs inline-flex items-center gap-1">
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarProvider>
  );
}
