"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Search, ScanLine } from "lucide-react";
import axios from "axios";
// Removing AddProductModal from here as it's now meant to be handled in BillingPage or we can leave it here if it's tightly coupled.
// But wait, ProductSearch has AddProductModal inside it currently. I'll keep it exactly as it was logically, just change the UI.
import AddProductModal from "./AddProductModal";

interface Product {
  id: number;
  name: string;
  barcode: string;
  productCode: string;
  huidNumber?: string | null;
  gsWeight: number;
  ntWeight: number;
  purity: number;
  price?: number | null;
  quantity: number;
  reservedQty?: number;
  image?: string | null;
  subCategory?: {
    name: string;
    category?: { name: string };
  };
}

interface ProductSearchProps {
  branchId?: number;
  onSelect: (product: any) => void;
  billing: any;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ branchId, onSelect, billing }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/products/search", {
          params: { search: query, branchId },
        });

        setResults(res.data.products || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [query, branchId]);

  const handleAdd = (product: Product) => {
    setSelectedProduct(product);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="w-full relative z-50">
      {/* SEARCH INPUT FIELD (Premium Style) */}
      <div className="flex items-center w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-5 py-3.5 focus-within:border-[#d4a843] focus-within:ring-1 focus-within:ring-[#d4a843] transition-all shadow-inner">
        <ScanLine className="w-5 h-5 text-[#d4a843] mr-4 flex-shrink-0" />
        <input
          type="text"
          placeholder="Scan Barcode or Search by HUID / Name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#e8e8e8] placeholder-[#666] text-sm md:text-base"
        />
        <div className="flex items-center gap-2 ml-4 border-l border-[#333] pl-4">
          {loading ? (
             <Loader2 className="animate-spin w-4 h-4 text-[#888]" />
          ) : (
             <Search className="w-4 h-4 text-[#888]" />
          )}
          <span className="text-[#888] text-sm font-medium tracking-wide">Find</span>
        </div>
      </div>

      {/* DROPDOWN SEARCH RESULTS */}
      {results.length > 0 && (
        <Card className="absolute top-[calc(100%+8px)] w-full bg-[#111] border border-[#2a2a2a] rounded-xl max-h-[350px] overflow-y-auto shadow-2xl z-50 p-2 custom-scrollbar">
          {results.map((p) => {
            const isReserved = (p.reservedQty ?? 0) >= (p.quantity ?? 1) && p.quantity > 0;
            return (
            <div
              key={p.id}
              onClick={() => !isReserved && handleAdd(p)}
              className={`group flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-transparent transition-all duration-200 mb-1 ${
                isReserved
                  ? "opacity-60 cursor-not-allowed bg-[#1a1212] border-[#3a2020]"
                  : "hover:bg-[#1a1a1a] hover:border-[#333] cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 transition-colors ${
                    isReserved
                      ? "bg-[#3a1a1a] border-[#5a2a2a]"
                      : "bg-[#222] border-[#333] group-hover:border-[#d4a843]"
                  }`}>
                  {isReserved ? (
                    <span className="text-[#e55] text-[9px] font-bold text-center leading-tight">IN USE</span>
                  ) : (
                    <Plus className="w-5 h-5 text-[#888] group-hover:text-[#d4a843]" />
                  )}
                </div>

                <div className="flex flex-col">
                  <p className={`font-semibold transition-colors ${
                    isReserved ? "text-[#888]" : "text-white group-hover:text-[#d4a843]"
                  }`}>
                    {p.name}
                    {isReserved && (
                      <span className="ml-2 text-[9px] font-bold text-[#e55] bg-[#e55]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Reserved</span>
                    )}
                  </p>
                  <p className="text-[#777] text-xs font-medium uppercase tracking-wider mb-1">
                    {p.subCategory?.category?.name
                      ? `${p.subCategory.category.name} › ${p.subCategory?.name}`
                      : p.subCategory?.name || "Uncategorized"}
                  </p>
                  <div className="flex items-center gap-3 text-[#555] text-[11px] uppercase tracking-wider">
                    <span><strong className="text-[#888]">BC:</strong> {p.barcode}</span>
                    {p.huidNumber && <span><strong className="text-[#888]">HUID:</strong> {p.huidNumber}</span>}
                    <span><strong className="text-[#888]">Purity:</strong> {p.purity}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between mt-2 md:mt-0 pt-2 md:pt-0 border-t border-[#222] md:border-none">
                <p className="text-white font-medium text-sm">
                  ₹{p.price ? p.price.toFixed(2) : "N/A"}
                </p>
                <div className="flex gap-2 text-xs text-[#777]">
                  <span>Qty: <strong className="text-[#aaa]">{p.quantity}</strong></span>
                  <span>&bull;</span>
                  <span>Wt: <strong className="text-[#aaa]">{p.ntWeight.toFixed(2)}g</strong></span>
                </div>
              </div>
            </div>
            );
          })}
        </Card>
      )}

      {/* EMPTY STATE (Search no match) */}
      {!loading && query && results.length === 0 && (
        <Card className="absolute top-[calc(100%+8px)] w-full bg-[#111] border border-[#2a2a2a] rounded-xl p-6 shadow-2xl z-50 text-center">
            <p className="text-[#888] text-sm">No products found matching "{query}"</p>
        </Card>
      )}

      {/* Add Product Modal is untouched logically */}
      <AddProductModal
        open={!!selectedProduct}
        product={selectedProduct}
        metalRate={billing.metalRate}
        onMetalRateUpdate={billing.updateMetalRate}
        onClose={() => setSelectedProduct(null)}
        onConfirm={(updatedProduct) => onSelect(updatedProduct)}
      />

      {/* Quick custom scrollbar style for this component dropdown */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
};

export default ProductSearch;
