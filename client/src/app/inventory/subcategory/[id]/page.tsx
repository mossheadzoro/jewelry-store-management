"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Edit } from "lucide-react";
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
  description: string | null;
  otherCharges: string | null;
  otherChargesPrice: number | null;
}

interface SubCategoryData {
  subCategory: { id: number; name: string; category: { id: number; name: string } };
  products: Product[];
  totalCount: number;
  page: number;
  totalPages: number;
}

function getStatusInfo(product: Product) {
  if (product.quantity <= 0) return { label: "Sold", color: "text-red-400", dot: "bg-red-400" };
  if (product.reservedQty > 0) return { label: "Reserved", color: "text-yellow-400", dot: "bg-yellow-400" };
  return { label: "In Stock", color: "text-emerald-400", dot: "bg-emerald-400" };
}

function getPurityLabel(purity: number) {
  if (purity >= 22) return "22K GOLD";
  if (purity >= 18) return "18K GOLD";
  if (purity >= 14) return "14K GOLD";
  if (purity >= 9) return `${purity}K`;
  return `${purity}`;
}

export default function SubcategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<SubCategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (search) params.set("search", search);

    fetch(`/api/inventory/subcategory/${id}?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const catName = data?.subCategory?.category?.name || "Category";
  const subName = data?.subCategory?.name || "Subcategory";

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full">
        {/* Breadcrumb */}
        <div className="bg-[#141414] border border-gray-800/50 rounded-xl px-5 py-3 mb-8 flex items-center gap-2 text-xs uppercase tracking-widest">
          <span className="text-gray-500 cursor-pointer hover:text-gray-300" onClick={() => router.push("/inventory")}>Home</span>
          <span className="text-gray-700">›</span>
          <span className="text-gray-500 cursor-pointer hover:text-gray-300" onClick={() => router.push(`/inventory/category/${data?.subCategory?.category?.id || ""}`)}>
            {catName}
          </span>
          <span className="text-gray-700">›</span>
          <span className="text-yellow-500 font-semibold">{subName}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-300 mb-1">{subName}</h1>
          <p className="text-sm text-gray-600">Viewing {data?.totalCount || 0} items in category.</p>
        </div>

        {/* Filter row */}
        <div className="flex justify-end mb-6">
          <button className="flex items-center gap-2 text-yellow-500 border border-yellow-700/40 px-4 py-2 rounded-xl text-sm hover:bg-yellow-900/20 transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Inventory Table */}
        <div className="bg-[#141414] border border-gray-800/50 rounded-2xl overflow-hidden">
          {/* Table header with search */}
          <div className="flex justify-between items-center p-5 border-b border-gray-800/50">
            <h2 className="text-lg font-semibold">Inventory List</h2>
            <div className="flex items-center bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-2 gap-2 w-72">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by Barcode, Product Code, or HUID..."
                className="bg-transparent outline-none text-white w-full text-sm placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-800/50">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Product Details</th>
                <th className="p-4">Code / HUID</th>
                <th className="p-4">Specs</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-gray-500">Loading products...</td></tr>
              ) : !data || data.products.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-gray-500">No products found.</td></tr>
              ) : data.products.map((p) => {
                const status = getStatusInfo(p);
                return (
                  <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <div className="w-14 h-14 bg-[#1e1e1e] rounded-xl overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-600 text-xs">No img</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.description || "—"}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-gray-300">{p.productCode}</p>
                      <p className="text-xs text-gray-500 font-mono">HUID: {p.huidNumber || "—"}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-[#1e1e1e] border border-gray-700 text-xs px-2 py-0.5 rounded-md mb-1">{getPurityLabel(p.purity)}</span>
                      <p className="text-xs text-gray-400">{p.ntWeight}g • {p.gsWeight}g GS</p>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => router.push(`/inventory/product/${p.id}`)}
                        className="text-gray-500 hover:text-yellow-500 transition-colors inline-flex items-center gap-1 text-xs"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.totalPages > 0 && (
            <div className="flex justify-between items-center p-5 border-t border-gray-800/50 text-sm text-gray-400">
              <span>
                Showing {((data.page - 1) * 10) + 1} to {Math.min(data.page * 10, data.totalCount)} of <strong className="text-white">{data.totalCount}</strong> results
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${page === p ? "bg-yellow-600 text-black font-bold" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
                  >
                    {p}
                  </button>
                ))}
                {data.totalPages > 5 && <span className="w-8 h-8 flex items-center justify-center text-gray-600">...</span>}
                {data.totalPages > 5 && (
                  <button
                    onClick={() => setPage(data.totalPages)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${page === data.totalPages ? "bg-yellow-600 text-black font-bold" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
                  >
                    {data.totalPages}
                  </button>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
