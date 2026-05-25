

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useBranchStore } from "@/lib/store/useBranchStore";
import UploadImage from "./ProductImageUpload";

// ArkType imports
import { type } from "arktype";
import { useForm } from "react-hook-form";
import { arktypeResolver } from "@hookform/resolvers/arktype"; // ArkType resolver

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  branches: any[];
  onSuccess?: () => void;
  categoryId?: number;
};

/* ---------- ArkType Schemas ---------- */
const stoneSchema = type({
  carat: "string?",
  weight: "number|string >0", // positive number
  name: "string?",
  price: "string?",
  color: "string?",
  colorGrade: "string?",
  clarity: "string?",
  cut: "string?",
  shape: "string?",
  origin: "string?",
  treatment: "string?",
  certification: "string?",
  quality: "string?",
  quantity: "number>=1", // minimum 1
  stoneImageUrl: "string?",
  certImageUrl: "string?",
});

const productSchema = type({
  name: "string>0",
  barcode: "string>0",
  productCode: "string?",
  huidNumber: "string>=6",
  gsWeight: "string>0",
  ntWeight: "string>0",
  purity: "string>0",
  price: "string?",
  quantity: "number>0",
  image: "string?",
  description: "string?",
  branchId: "number>0",
  subCategoryId: "number>=0",
  otherCharges: "string?",
  otherChargesPrice: "number|string >=0?",
  stoneDetails: stoneSchema.array().optional(),
});

type RegisterForm = typeof productSchema.infer;
type RegisterStone = typeof stoneSchema.infer;

export default function AddProductModal({ open, setOpen, branches, onSuccess, categoryId }: Props) {
  const { selectedBranch } = useBranchStore();
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [queuedProducts, setQueuedProducts] = useState<RegisterForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  const [showStoneDetails, setShowStoneDetails] = useState(false);
  const [stones, setStones] = useState<RegisterStone[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: arktypeResolver(productSchema),
    defaultValues: {
      branchId: selectedBranch?.id || 0,
      quantity: 1,
      stoneDetails: [],
    },
  });

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const res = await axios.get(
          `/api/inventory/subcategory/fetchAll?branchId=${selectedBranch?.id}`
        );
        
        let fetchedData = res.data;
        if (categoryId) {
          fetchedData = fetchedData.filter((s: any) => s.category?.id === categoryId);
        }
        
        setSubCategories(fetchedData);

        setValue("branchId", selectedBranch?.id || 0);
        if (fetchedData?.length > 0) {
          setValue("subCategoryId", fetchedData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch subcategories:", error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    if (open) {
      fetchSubCategories();
    }
  }, [open, selectedBranch, setValue, categoryId]);

  const onAddToQueue = (data: RegisterForm) => {
    const subCategoryIdAsNumber = parseInt(data.subCategoryId.toString(), 10);
    const otherChargesPriceAsNumber = data.otherChargesPrice
      ? parseFloat(data.otherChargesPrice.toString())
      : undefined;

    const finalSubCategoryId = isNaN(subCategoryIdAsNumber) ? 0 : subCategoryIdAsNumber;
    const finalOtherChargesPrice = isNaN(otherChargesPriceAsNumber as number)
      ? undefined
      : otherChargesPriceAsNumber;

    const productWithStones = {
      ...data,
      subCategoryId: finalSubCategoryId,
      otherChargesPrice: finalOtherChargesPrice,
      stoneDetails: stones,
    };

    setQueuedProducts((prev) => [...prev, productWithStones]);

    reset({
      branchId: selectedBranch?.id || 0,
      subCategoryId: subCategories?.[0]?.id || 0,
      quantity: 1,
      stoneDetails: [],
    });
    setStones([]);
  };

  const resetQueue = () => {
    if (queuedProducts.length > 0) {
      if (!window.confirm("Are you sure you want to clear the entire queue? All added products will be lost.")) {
        return;
      }
    }
    setQueuedProducts([]);
    reset({
      branchId: selectedBranch?.id || 0,
      subCategoryId: subCategories?.[0]?.id || 0,
      quantity: 1,
      stoneDetails: [],
    });
    setStones([]);
    setShowStoneDetails(false);
  };

  const addToStock = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/inventory/product/create", queuedProducts);
      if (!res) throw new Error("Failed to add stock");
      alert("Products Added Successfully!");
      setQueuedProducts([]);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      alert("Error adding stocks!");
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async () => {
    try {
      setLoading(true);
      if (!selectedBranch?.id) {
        alert("Please select a branch first");
        return;
      }

      const foundCategory = subCategories.find(
        (sc) => sc.id === parseInt(getValues("subCategoryId").toString())
      );

      if (!foundCategory) {
        alert("Category name not found! Please try again.");
        return;
      }

      const categoryName = foundCategory.category.name;

      const res = await axios.post("/api/inventory/product/codes", {
        branchId: selectedBranch.id,
        categoryName,
        offset: queuedProducts.length
      });

      setValue("productCode", res.data.productCode);
      setValue("barcode", res.data.barcode);
      setLoading(false);

      alert("Codes generated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to generate codes");
    }
  };

  const handleAddStone = () => {
    setStones([...stones, { carat: "", name: "", quality: "", price: "", quantity: 1, weight: 0 }]);
  };

  const handleRemoveStone = (indexToRemove: number) => {
    setStones(stones.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveFromQueue = (indexToRemove: number) => {
    setQueuedProducts(queuedProducts.filter((_, index) => index !== indexToRemove));
  };

  const handleStoneChange = (index: number, field: string, value: string) => {
    const newStones = [...stones];
    newStones[index] = { ...(newStones[index] ?? {}), [field]: value };
    setStones(newStones);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0f0f0f] border-[#222] text-white w-full sm:max-w-5xl lg:max-w-6xl p-0 overflow-hidden shadow-2xl [&>button]:hidden h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex justify-between items-start">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-3xl font-bold text-white tracking-tight">Add New Product</DialogTitle>
                <span className="px-3 py-1 rounded-full border border-[#d4a843]/30 bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">
                  Inventory Entry
                </span>
              </div>
              <DialogDescription className="text-sm text-[#777] mt-1 text-left">
                Create jewellery inventory item for the master ledger
              </DialogDescription>
            </DialogHeader>
            <button onClick={() => setOpen(false)} className="text-[#555] hover:text-white transition-colors p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onAddToQueue)} id="add-product-form">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-8">
                {/* BASIC DETAILS */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-[#333]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Basic Details</span>
                    <div className="h-[1px] flex-1 bg-[#333]"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Name</Label>
                      <Input {...register("name")} placeholder="e.g. Maharani Polki Choker" className="bg-[#1a1a1a] border-[#333] text-white h-11" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Product Code</Label>
                      <Input {...register("productCode")} disabled placeholder="Generated Code" className="bg-[#1a1a1a] border-[#333] text-white h-11 opacity-70" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Barcode</Label>
                      <Input {...register("barcode")} disabled placeholder="Scan or Enter Barcode" className="bg-[#1a1a1a] border-[#333] text-white h-11 opacity-70" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">HUID</Label>
                      <Input {...register("huidNumber")} placeholder="Hallmark Unique ID" className="bg-[#1a1a1a] border-[#333] text-white h-11" />
                      {errors.huidNumber && <p className="text-red-500 text-xs mt-1">{errors.huidNumber.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Quantity</Label>
                      <Input {...register("quantity", { valueAsNumber: true })} type="number" className="bg-[#1a1a1a] border-[#333] text-white h-11" />
                      {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Purity</Label>
                      <Input {...register("purity")} placeholder="e.g. 22K Gold" className="bg-[#1a1a1a] border-[#333] text-white h-11" />
                      {errors.purity && <p className="text-red-500 text-xs mt-1">{errors.purity.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Branch</Label>
                      <Input disabled value={selectedBranch?.name || "Main Branch"} className="bg-[#1a1a1a] border-[#333] text-white h-11 opacity-70" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">SubCategory</Label>
                      <div className="flex gap-2">
                        <select {...register("subCategoryId", { valueAsNumber: true })} className="flex-1 bg-[#1a1a1a] border border-[#333] text-white rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#d4a843]">
                          {subCategories.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <Button type="button" onClick={handleCode} disabled={isCategoriesLoading || !selectedBranch?.id || subCategories.length === 0 || loading} className="h-11 bg-[#222] hover:bg-[#333] text-[#d4a843] border border-[#333]">
                          Gen Codes
                        </Button>
                      </div>
                      {errors.subCategoryId && <p className="text-red-500 text-xs mt-1">{errors.subCategoryId.message}</p>}
                    </div>
                  </div>
                </div>

                {/* WEIGHT METRICS */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-[#333]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Weight Metrics</span>
                    <div className="h-[1px] flex-1 bg-[#333]"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 relative overflow-hidden group focus-within:border-[#d4a843] transition-colors">
                      <div className="relative z-10">
                        <p className="text-xs text-[#888] font-medium mb-2">Gross Weight</p>
                        <div className="flex items-baseline gap-2">
                          <Input {...register("gsWeight")} placeholder="00.000" className="border-none bg-transparent text-3xl font-light text-white p-0 h-auto focus-visible:ring-0 w-32" />
                          <span className="text-sm text-[#777]">gms</span>
                        </div>
                      </div>
                      <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-[#222] flex items-center justify-center border border-[#333]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a843]"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>
                      </div>
                      {errors.gsWeight && <p className="text-red-500 text-xs mt-1 absolute bottom-2 left-5">{errors.gsWeight.message}</p>}
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 relative overflow-hidden group focus-within:border-[#d4a843] transition-colors">
                      <div className="relative z-10">
                        <p className="text-xs text-[#888] font-medium mb-2">Net Weight</p>
                        <div className="flex items-baseline gap-2">
                          <Input {...register("ntWeight")} placeholder="00.000" className="border-none bg-transparent text-3xl font-light text-white p-0 h-auto focus-visible:ring-0 w-32" />
                          <span className="text-sm text-[#777]">gms</span>
                        </div>
                      </div>
                      <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-[#222] flex items-center justify-center border border-[#333]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a843]"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
                      </div>
                      {errors.ntWeight && <p className="text-red-500 text-xs mt-1 absolute bottom-2 left-5">{errors.ntWeight.message}</p>}
                    </div>
                  </div>
                </div>

                {/* PRICING STRUCTURE */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-[#333]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Pricing Structure</span>
                    <div className="h-[1px] flex-1 bg-[#333]"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                      <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Base Price</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[#d4a843] font-medium">₹</span>
                        <Input {...register("price")} placeholder="0.00" className="border-none bg-transparent text-xl text-white p-0 h-auto focus-visible:ring-0" />
                      </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                      <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Other Charges</p>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <Input {...register("otherCharges")} placeholder="e.g. Labour" className="bg-[#222] border-[#333] text-white h-9 text-sm" />
                        <div className="flex items-center gap-1 bg-[#222] border border-[#333] rounded-md px-2">
                          <span className="text-[#d4a843] text-sm">₹</span>
                          <Input {...register("otherChargesPrice")} placeholder="0" className="border-none bg-transparent text-white p-0 h-9 focus-visible:ring-0 text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STONE DETAILS (Collapsible) */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-[#333]"></div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="stoneDetails" checked={showStoneDetails} onCheckedChange={() => setShowStoneDetails(!showStoneDetails)} className="border-[#666] data-[state=checked]:bg-[#d4a843] data-[state=checked]:text-black" />
                      <Label htmlFor="stoneDetails" className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843] cursor-pointer">
                        Stone Details
                      </Label>
                    </div>
                    <div className="h-[1px] flex-1 bg-[#333]"></div>
                  </div>

                  {showStoneDetails && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button type="button" onClick={handleAddStone} className="bg-[#222] hover:bg-[#333] text-[#d4a843] border border-[#333] h-8 text-xs flex items-center gap-1">
                          <Plus size={14} /> Add Stone
                        </Button>
                      </div>
                      {stones.map((stone, index) => (
                        <div key={index} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 relative">
                          <button type="button" onClick={() => handleRemoveStone(index)} className="absolute top-4 right-4 text-[#666] hover:text-red-400">
                            <X size={16} />
                          </button>
                          <h4 className="text-sm font-medium text-white mb-4">Stone #{index + 1}</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-[10px] text-[#888] uppercase">Name</Label>
                              <Input value={stone.name} onChange={e => handleStoneChange(index, "name", e.target.value)} className="bg-[#222] border-[#333] text-white h-8 text-xs mt-1" />
                            </div>
                            <div>
                              <Label className="text-[10px] text-[#888] uppercase">Carat</Label>
                              <Input value={stone.carat} onChange={e => handleStoneChange(index, "carat", e.target.value)} className="bg-[#222] border-[#333] text-white h-8 text-xs mt-1" />
                            </div>
                            <div>
                              <Label className="text-[10px] text-[#888] uppercase">Weight</Label>
                              <Input value={stone.weight} onChange={e => handleStoneChange(index, "weight", e.target.value)} type="number" className="bg-[#222] border-[#333] text-white h-8 text-xs mt-1" />
                            </div>
                            <div>
                              <Label className="text-[10px] text-[#888] uppercase">Price</Label>
                              <Input value={stone.price} onChange={e => handleStoneChange(index, "price", e.target.value)} className="bg-[#222] border-[#333] text-white h-8 text-xs mt-1" />
                            </div>
                            <div>
                              <Label className="text-[10px] text-[#888] uppercase">Quantity</Label>
                              <Input value={stone.quantity} onChange={e => handleStoneChange(index, "quantity", e.target.value)} type="number" min="1" className="bg-[#222] border-[#333] text-white h-8 text-xs mt-1" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Product Image</span>
                    <div className="h-[1px] flex-1 bg-[#333]"></div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-dashed border-[#444] rounded-xl p-4 flex justify-center items-center">
                    <UploadImage onUpload={(url) => setValue("image", url)} />
                    {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Description</span>
                    <div className="h-[1px] flex-1 bg-[#333]"></div>
                  </div>
                  <Textarea {...register("description")} placeholder="Optional notes about the piece..." className="bg-[#1a1a1a] border-[#333] text-white resize-none h-32" />
                </div>

                {/* QUEUE SUMMARY */}
                {queuedProducts.length > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    <h4 className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-2 sticky top-0 bg-[#1a1a1a] py-1">Queued ({queuedProducts.length})</h4>
                    {queuedProducts.map((item, idx) => (
                      <div key={idx} className="bg-[#222] rounded-lg p-3 text-xs border border-[#333] relative group">
                        <button type="button" onClick={() => handleRemoveFromQueue(idx)} className="absolute top-3 right-3 text-[#555] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove from queue">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                        <div className="flex justify-between items-center mb-1 pr-6">
                          <span className="font-semibold text-white">{item.name}</span>
                          <span className="text-[#d4a843]">{item.productCode}</span>
                        </div>
                        <div className="text-[#888] flex gap-3">
                          <span>Wt: {item.ntWeight}g</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-[#0a0a0a] border-t border-[#222] p-6 flex items-center justify-between shrink-0">
          <button type="button" onClick={() => resetQueue()} disabled={queuedProducts.length === 0} className="text-xs font-bold text-[#777] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            Reset Queue
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#aaa] uppercase tracking-wider hover:text-white transition-colors px-4 py-3">
              Cancel
            </button>
            <button form="add-product-form" type="submit" className="px-6 py-3 border border-[#d4a843] text-[#d4a843] hover:bg-[#d4a843]/10 text-xs font-bold tracking-widest uppercase rounded-full transition-colors">
              Add To Queue
            </button>
            <button type="button" onClick={addToStock} disabled={queuedProducts.length === 0 || loading} className="px-6 py-3 bg-[#d4a843] text-black hover:bg-[#b58b2e] text-xs font-bold tracking-widest uppercase rounded-full transition-colors disabled:opacity-50">
              {loading ? "Saving..." : "Save Product(s)"}
            </button>
          </div>
        </div>
      </DialogContent>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </Dialog>
  );
}
