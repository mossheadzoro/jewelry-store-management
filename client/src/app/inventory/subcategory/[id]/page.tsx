"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Edit, Eye, Printer } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ProductDetailsModal } from "../../../../../components/Inventory/Product/ProductDetailsModal";
import { printBarcodes } from "@/lib/barcodePrinter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStampingCart } from "@/lib/store/useStampingCart";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { ShieldCheck, Truck, Loader2, CheckCircle, Calendar } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ReceiveStampingForm from "../../../../../components/Inventory/Product/ReceiveStampingForm";

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
  size: string | null;
  inventoryLedger?: { refType: string; refId: string; remarks: string }[];
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

  const { cart, addToCart, removeFromCart, clearCart, isInCart } = useStampingCart();
  const { selectedBranch } = useBranchStore();
  const [isIssuingToStamping, setIsIssuingToStamping] = useState(false);

  // Receive form state
  const [receivingProduct, setReceivingProduct] = useState<Product | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    name: "",
    categoryId: "",
    subCategoryId: "",
    barcode: "",
    productCode: "",
    purity: "",
    ntWeight: "",
    gsWeight: "",
  });
  const [allCategories, setAllCategories] = useState<any[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurity, setSelectedPurity] = useState<number[]>([]);
  const [weightFilter, setWeightFilter] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrintBarcode = (product: Product) => {
    printBarcodes([product], data?.subCategory?.name);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (search) params.set("search", search);
    if (selectedPurity.length > 0) params.set("purity", selectedPurity.join(","));
    if (weightFilter) params.set("weight", weightFilter);

    fetch(`/api/inventory/subcategory/${id}?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, page, search, selectedPurity, weightFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const catName = data?.subCategory?.category?.name || "Category";
  const subName = data?.subCategory?.name || "Subcategory";
  
  const isUnmarked = catName.toUpperCase() === "UNMARKED JEWELLERY";
  const isStamping = catName.toUpperCase() === "STAMPING CENTER";

  useEffect(() => {
    if (isStamping) {
      // Fetch categories for receive modal
      fetch("/api/inventory/ledger")
        .then(res => res.json())
        .then(data => {
          if (data.branchCategories) setAllCategories(data.branchCategories);
        })
        .catch(console.error);
    }
  }, [isStamping]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen bg-onyx text-foreground p-8 w-full">
        {/* Breadcrumb */}
        <div className="bg-onyx-surface border border-border/50 rounded-xl px-5 py-3 mb-8 flex items-center gap-2 text-xs uppercase tracking-widest">
          <span className="text-muted-foreground cursor-pointer hover:text-foreground/80" onClick={() => router.push("/inventory")}>Home</span>
          <span className="text-gray-700">›</span>
          <span className="text-muted-foreground cursor-pointer hover:text-foreground/80" onClick={() => router.push(`/inventory/category/${data?.subCategory?.category?.id || ""}`)}>
            {catName}
          </span>
          <span className="text-gray-700">›</span>
          <span className="text-yellow-500 font-semibold">{subName}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground/80 mb-1">{subName}</h1>
          <p className="text-sm text-gray-600">Viewing {data?.totalCount || 0} items in category.</p>
        </div>

        {/* Filter row */}
        <div className="flex flex-col items-end mb-6 relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-sm transition-all ${
              showFilters
                ? "bg-yellow-500 text-foreground border-yellow-500 font-semibold"
                : "text-yellow-500 border-yellow-700/40 hover:bg-yellow-900/20"
            }`}
          >
            <Filter size={16} /> {showFilters ? "Hide Filters" : "Filter Options"}
          </button>

          {showFilters && (
            <div className="absolute top-12 right-0 bg-onyx-surface border border-border rounded-2xl p-6 shadow-2xl z-20 w-80 mt-2 space-y-6">
              {/* Purity Checkboxes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-3">Purity</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[24, 22, 18, 14, 9].map((k) => {
                    const isChecked = selectedPurity.includes(k);
                    return (
                      <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80 hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedPurity(selectedPurity.filter((p) => p !== k));
                            } else {
                              setSelectedPurity([...selectedPurity, k]);
                            }
                            setPage(1);
                          }}
                          className="accent-[#d4a843] rounded border-border bg-onyx-elevated"
                        />
                        <span>{k}K Purity</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Weight Search */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-2">Weight Range (Nt Wt)</h4>
                <p className="text-[10px] text-muted-foreground mb-3">Entering e.g. 5 searches for 4.5g to 5.9g</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={weightFilter}
                    onChange={(e) => {
                      setWeightFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Enter base weight..."
                    className="bg-onyx-elevated border border-border rounded-xl px-4 py-2 text-sm text-foreground w-full focus:outline-none focus:border-yellow-500"
                  />
                  {weightFilter && (
                    <button
                      onClick={() => {
                        setWeightFilter("");
                        setPage(1);
                      }}
                      className="text-xs bg-secondary border border-border px-3 rounded-xl hover:bg-secondary"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Reset All */}
              <div className="flex justify-between items-center border-t border-border/50 pt-4">
                <button
                  onClick={() => {
                    setSelectedPurity([]);
                    setWeightFilter("");
                    setPage(1);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset All
                </button>
                <span className="text-[10px] text-muted-foreground">Auto-applies</span>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Table */}
        <div className="bg-onyx-surface border border-border/50 rounded-2xl overflow-hidden">
          {/* Table header with search */}
          <div className="flex justify-between items-center p-5 border-b border-border/50">
            <h2 className="text-lg font-semibold">Inventory List</h2>
            <div className="flex items-center bg-onyx-elevated border border-border rounded-xl px-4 py-2 gap-2 w-72">
              <Search size={16} className="text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by Barcode, Product Code, or HUID..."
                className="bg-transparent outline-none text-foreground w-full text-sm placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border/50">
              <tr>
                {isUnmarked && <th className="p-4 w-10">Select</th>}
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
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Loading products...</td></tr>
              ) : !data || data.products.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No products found.</td></tr>
              ) : data.products.map((p) => {
                const status = getStatusInfo(p);
                return (
                  <tr key={p.id} className="hover:bg-onyx-elevated transition-colors">
                    {isUnmarked && (
                      <td className="p-4">
                        <div 
                          onClick={() => isInCart(p.id) ? removeFromCart(p.id) : addToCart(p)}
                          className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            isInCart(p.id) ? "bg-yellow-500 border-yellow-500" : "border-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {isInCart(p.id) && <CheckCircle className="w-3 h-3 text-foreground" />}
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="w-14 h-14 bg-card rounded-xl overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-600 text-xs">No img</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description || "—"}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-foreground/80">{p.productCode}</p>
                      <p className="text-xs text-muted-foreground font-mono">HUID: {p.huidNumber || "—"}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-card border border-border text-xs px-2 py-0.5 rounded-md mb-1">{getPurityLabel(p.purity)}</span>
                      <p className="text-xs text-muted-foreground">{p.ntWeight}g • {p.gsWeight}g GS</p>
                    </td>
                    <td className="p-4">
                      {status.label === "Reserved" && p.inventoryLedger && p.inventoryLedger.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-2 cursor-help">
                                <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                                <span className={`text-xs font-medium ${status.color} underline decoration-dashed underline-offset-2`}>{status.label}</span>
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
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        {isStamping ? (
                          <button
                            onClick={() => {
                              setReceivingProduct(p);
                              setReceiveForm({
                                ...receiveForm,
                                name: p.name || "",
                                ntWeight: p.ntWeight?.toString() || "",
                                gsWeight: p.gsWeight?.toString() || "",
                                purity: p.purity?.toString() || "",
                              });
                            }}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                          >
                            <ShieldCheck size={14} /> Receive
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }}
                              className="text-muted-foreground hover:text-emerald-400 transition-colors inline-flex items-center text-xs"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handlePrintBarcode(p)}
                              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center text-xs"
                              title="Print Barcode"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/inventory/product/${p.id}`)}
                              className="text-muted-foreground hover:text-yellow-500 transition-colors inline-flex items-center text-xs"
                              title="Edit Product"
                            >
                              <Edit size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.totalPages > 0 && (
            <div className="flex justify-between items-center p-5 border-t border-border/50 text-sm text-muted-foreground">
              <span>
                Showing {((data.page - 1) * 10) + 1} to {Math.min(data.page * 10, data.totalCount)} of <strong className="text-foreground">{data.totalCount}</strong> results
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded bg-onyx-elevated hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${page === p ? "bg-yellow-600 text-foreground font-bold" : "bg-onyx-elevated hover:bg-secondary"}`}
                  >
                    {p}
                  </button>
                ))}
                {data.totalPages > 5 && <span className="w-8 h-8 flex items-center justify-center text-gray-600">...</span>}
                {data.totalPages > 5 && (
                  <button
                    onClick={() => setPage(data.totalPages)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${page === data.totalPages ? "bg-yellow-600 text-foreground font-bold" : "bg-onyx-elevated hover:bg-secondary"}`}
                  >
                    {data.totalPages}
                  </button>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded bg-onyx-elevated hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ProductDetailsModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onEdit={() => {
          setIsModalOpen(false);
          if (selectedProduct) router.push(`/inventory/product/${selectedProduct.id}`);
        }}
      />

      {/* Floating Cart for Stamping Center */}
      {isUnmarked && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:pl-64">
          <div>
            <p className="text-sm text-muted-foreground font-semibold">{cart.length} item(s) selected</p>
            <p className="text-xs text-muted-foreground">Ready to send to Stamping Center</p>
          </div>
          <button
            onClick={async () => {
              if (!selectedBranch?.id) return;
              setIsIssuingToStamping(true);
              try {
                await axios.post("/api/inventory/stamping/issue", {
                  branchId: selectedBranch.id,
                  productIds: cart.map(c => c.id)
                });
                toast.success(`Successfully sent ${cart.length} items to Stamping Center!`);
                clearCart();
                fetchData(); // Refresh
              } catch (error) {
                toast.error("Failed to send items");
              } finally {
                setIsIssuingToStamping(false);
              }
            }}
            disabled={isIssuingToStamping}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-foreground font-bold text-sm rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isIssuingToStamping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Send to Stamping
          </button>
        </div>
      )}

      {/* RECEIVE STAMPING PRODUCT MODAL */}
      {isStamping && receivingProduct && (
        <ReceiveStampingForm
          open={!!receivingProduct}
          setOpen={(val) => {
            if (!val) setReceivingProduct(null);
          }}
          branches={[]} // or pass branches if you have them available in this scope
          stampingProduct={receivingProduct}
          onSuccess={() => {
            setReceivingProduct(null);
            fetchData();
          }}
        />
      )}
    </SidebarProvider>
  );
}
