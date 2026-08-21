"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Edit } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  inventoryLedger?: { refType: string; refId: string; remarks: string }[];
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-onyx text-foreground p-8">Loading Search...</div>}>
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
      <div className="min-h-screen bg-onyx text-foreground p-8 w-full">
        {/* Back + Search */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/inventory")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 flex items-center bg-onyx-surface border border-border rounded-2xl px-5 py-3 gap-3">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by product code, HUID, barcode, name..."
              className="bg-transparent outline-none text-foreground w-full text-sm placeholder:text-gray-600"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {loading ? "Searching..." : `${results.length} results for "${q}"`}
        </p>

        {/* Results Table */}
        <div className="bg-onyx-surface border border-border/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border/50">
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
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Searching...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No products found matching your search.</td></tr>
              ) : results.map((p) => {
                const sold = p.quantity <= 0;
                const reserved = p.reservedQty > 0;
                return (
                  <tr key={p.id} className="hover:bg-onyx-elevated transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-card rounded-xl overflow-hidden flex items-center justify-center">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-600 text-[10px]">No img</span>}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{p.name}</td>
                    <td className="p-4">
                      <p className="font-mono text-foreground/80">{p.productCode}</p>
                      <p className="text-xs text-muted-foreground">HUID: {p.huidNumber || "—"}</p>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {p.subCategory?.category?.name || "—"} / {p.subCategory?.name || "—"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{p.ntWeight}g • {p.purity}K</td>
                    <td className="p-4">
                      {reserved && p.inventoryLedger && p.inventoryLedger.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-medium text-yellow-400 cursor-help underline decoration-dashed underline-offset-2">
                                Reserved
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-onyx-elevated border border-border text-foreground/90">
                              <p className="font-semibold text-yellow-500 mb-1">Reservation Details</p>
                              <p>Type: <span className="text-foreground">{p.inventoryLedger[0].refType}</span></p>
                              {p.inventoryLedger[0].refId && <p>Ref ID: <span className="text-foreground font-mono">{p.inventoryLedger[0].refId}</span></p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className={`text-xs font-medium ${sold ? "text-red-400" : reserved ? "text-yellow-400" : "text-emerald-400"}`}>
                          {sold ? "Sold" : reserved ? "Reserved" : "In Stock"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => router.push(`/inventory/product/${p.id}`)} className="text-muted-foreground hover:text-yellow-500 text-xs inline-flex items-center gap-1">
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
