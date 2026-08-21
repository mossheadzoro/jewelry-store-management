

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

import { Plus, X, Printer } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useBranchStore } from "@/lib/store/useBranchStore";
import UploadImage from "./ProductImageUpload";
import { printBarcodes } from "@/lib/barcodePrinter";

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
  huidNumber: "string?",
  gsWeight: "string>0",
  ntWeight: "string>0",
  purity: "/^(\\d{1,4})$/",
  price: "string?",
  quantity: "number>0",
  image: "string?",
  description: "string?",
  size: "string?",
  branchId: "number>0",
  subCategoryId: "number>=0",
  otherCharges: "string?",
  otherChargesPrice: "number|string >=0?",
  stoneDetails: stoneSchema.array().optional(),
  certNumber: "string?",
  certCenter: "string?",
  carat: "string?",
  color: "string?",
  clarity: "string?",
  shape: "string?",
  cut: "string?",
  diamondCostPerCent: "string?",
  certCharge: "string?",
  makingCharge: "string?",
  makingChargeType: "string?",
  certImage: "string?",
});

type RegisterForm = typeof productSchema.infer;
type RegisterStone = typeof stoneSchema.infer;



/* ============================================================
   COMPONENT
   ============================================================ */

export default function AddProductModal({ open, setOpen, branches, onSuccess, categoryId }: Props) {
  const { selectedBranch } = useBranchStore();
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [queuedProducts, setQueuedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  const [showStoneDetails, setShowStoneDetails] = useState(false);
  const [stones, setStones] = useState<RegisterStone[]>([]);

  // Feature #2 — optional base price toggle
  const [showBasePrice, setShowBasePrice] = useState(false);

  // Ref for numpad-+ keyboard shortcut
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: arktypeResolver(productSchema),
    defaultValues: {
      branchId: selectedBranch?.id || 0,
      quantity: 1,
      stoneDetails: [],
      size: "",
    },
  });

  // Watched fields for auto-calculations
  const watchedGsWeight = watch("gsWeight");
  const watchedSubCategoryId = watch("subCategoryId");
  const watchedCarat = watch("carat");

  const selectedSubCategory = subCategories.find((sc) => sc.id === parseInt(watchedSubCategoryId?.toString() || "0"));
  const categoryName = selectedSubCategory?.category?.name || "";
  const isSilver = categoryName.toLowerCase().includes("silver");
  const isDiamond = categoryName.toLowerCase().includes("diamond");

  // State for diamond making charges
  const [showMakingCharge, setShowMakingCharge] = useState(false);

  // Branch metal & purity configurations
  const [branchMetalSettings, setBranchMetalSettings] = useState<any[]>([]);
  const [globalMediaConfig, setGlobalMediaConfig] = useState<any>(null);
  const [globalInventoryConfig, setGlobalInventoryConfig] = useState<any>(null);

  useEffect(() => {
    const fetchBranchProductSettings = async () => {
      if (!selectedBranch?.id) return;
      try {
        const res = await axios.get(`/api/settings/product?branchId=${selectedBranch.id}`);
        if (res.data?.metalConfig?.metals) {
          setBranchMetalSettings(res.data.metalConfig.metals);
        }
        if (res.data?.mediaConfig) {
          setGlobalMediaConfig(res.data.mediaConfig);
        }
        if (res.data?.inventoryConfig) {
          setGlobalInventoryConfig(res.data.inventoryConfig);
        }
      } catch (err) {
        console.error("Failed to fetch branch product settings:", err);
      }
    };

    if (open && selectedBranch?.id) {
      fetchBranchProductSettings();
    }
  }, [open, selectedBranch?.id]);

  // Compute selectable purities dynamically based on active branch settings & selected category
  const availablePurities = useMemo(() => {
    if (branchMetalSettings.length > 0) {
      const targetMetalName = isSilver ? "silver" : categoryName.toLowerCase().includes("platinum") ? "platinum" : "gold";
      const foundMetal = branchMetalSettings.find((m: any) => m.name?.toLowerCase().includes(targetMetalName) && m.active !== false);

      if (foundMetal && Array.isArray(foundMetal.purities) && foundMetal.purities.length > 0) {
        return foundMetal.purities.map((p: any) => {
          const caratStr = typeof p === "string" ? p : p.carat || "";
          const rawNum = caratStr.replace(/[^0-9]/g, "");
          return {
            label: caratStr.endsWith("K") || caratStr.length >= 3 ? caratStr : `${caratStr}K`,
            value: rawNum || caratStr,
          };
        }).filter((p: any) => p.value);
      }
    }

    if (isSilver) {
      return [
        { label: "925 Silver", value: "925" },
        { label: "999 Fine Silver", value: "999" }
      ];
    }

    return [
      { label: "24K Gold", value: "24" },
      { label: "22K Gold", value: "22" },
      { label: "18K Gold", value: "18" },
      { label: "14K Gold", value: "14" },
      { label: "9K Gold", value: "9" }
    ];
  }, [branchMetalSettings, isSilver, categoryName]);

  /* ---------- Feature #4 — Auto-generate codes helper ---------- */
  const generateCodes = async (overrideOffset?: number) => {
    try {
      if (!selectedBranch?.id || subCategories.length === 0) return;

      const subCatId = parseInt(getValues("subCategoryId")?.toString() || "0");
      const foundCategory = subCategories.find((sc: any) => sc.id === subCatId);
      if (!foundCategory?.category?.name) return;

      const res = await axios.post("/api/inventory/product/codes", {
        branchId: selectedBranch.id,
        categoryName: foundCategory.category.name,
        offset: overrideOffset ?? queuedProducts.length,
      });

      setValue("productCode", res.data.productCode);
      setValue("barcode", res.data.barcode);
    } catch (err) {
      console.error("Failed to auto-generate codes:", err);
    }
  };

  /* ---------- Fetch subcategories + auto-generate codes on open ---------- */
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

          // Feature #4 — auto-generate codes immediately with fresh data
          const categoryName = fetchedData[0].category?.name;
          if (categoryName && selectedBranch?.id) {
            try {
              const codesRes = await axios.post("/api/inventory/product/codes", {
                branchId: selectedBranch.id,
                categoryName,
                offset: queuedProducts.length,
              });
              setValue("productCode", codesRes.data.productCode);
              setValue("barcode", codesRes.data.barcode);
            } catch (err) {
              console.error("Failed to auto-generate codes:", err);
            }
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedBranch, setValue, categoryId]);

  /* ---------- Feature #4 — Regenerate codes when subcategory changes ---------- */
  useEffect(() => {
    if (open && subCategories.length > 0 && watchedSubCategoryId !== undefined) {
      generateCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSubCategoryId]);

  /* ---------- Feature #1 — Auto-calculate Net Weight ---------- */
  useEffect(() => {
    const gs = parseFloat(watchedGsWeight as string) || 0;
    if (gs > 0) {
      let deduction = 0;
      if (isDiamond) {
        deduction = (parseFloat(watchedCarat as string) || 0) * 0.2;
      } else {
        deduction = stones.reduce(
          (sum, s) => sum + (parseFloat(String(s.weight)) || 0),
          0
        );
      }
      const nt = Math.max(0, gs - deduction);
      setValue("ntWeight", nt.toFixed(3));
    } else {
      setValue("ntWeight", "");
    }
  }, [watchedGsWeight, stones, setValue, isDiamond, watchedCarat]);

  /* ---------- Feature #3 — Plus keyboard shortcut ---------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "+" || e.code === "NumpadAdd") && open) {
        if (document.activeElement?.tagName === "TEXTAREA") return;
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  /* ---------- Queue handlers ---------- */

  const onAddToQueue = (data: RegisterForm) => {
    // Custom conditional validations
    if (isSilver) {
      if (!/^\d{3}$/.test(data.purity || "")) {
        setError("purity", { type: "manual", message: "Purity must be a 3-digit number (e.g. 925) for Silver" });
        return;
      }
    } else {
      if (data.huidNumber && data.huidNumber.length > 0 && data.huidNumber.length < 6) {
        setError("huidNumber", { type: "manual", message: "HUID must be at least 6 characters for Gold" });
        return;
      }
    }

    const subCategoryIdAsNumber = parseInt(data.subCategoryId.toString(), 10);
    const finalSubCategoryId = isNaN(subCategoryIdAsNumber) ? 0 : subCategoryIdAsNumber;

    // Look up subcategory name (used by print labels)
    const foundSubCat = subCategories.find((sc: any) => sc.id === finalSubCategoryId);

    let finalStones = stones;
    let finalOtherChargesPrice = data.otherChargesPrice
      ? parseFloat(data.otherChargesPrice.toString())
      : undefined;
    let finalOtherCharges = data.otherCharges || "";
    let finalPrice = data.price;
    let finalDescription = data.description || "";

    if (isDiamond) {
      // 1 carat = 100 cents. Price = cents * cost_per_cent
      const caratVal = parseFloat(data.carat || "0") || 0;
      const diamondWeightGrams = caratVal * 0.2;
      const diamondPrice = caratVal * 100 * (parseFloat(data.diamondCostPerCent || "0") || 0);

      finalStones = [
        {
          name: "Diamond",
          carat: data.carat || "",
          weight: diamondWeightGrams,
          color: data.color || "",
          clarity: data.clarity || "",
          shape: data.shape || "",
          cut: data.cut || "",
          quantity: 1,
          quality: "Premium",
          price: String(diamondPrice),
          stoneImageUrl: data.image || "",
          certImageUrl: data.certImage || "",
          certification: `${data.certCenter || ""} ${data.certNumber || ""}`.trim(),
        }
      ];

      // Certificate charges
      if (data.certCharge) {
        finalOtherChargesPrice = (finalOtherChargesPrice || 0) + (parseFloat(data.certCharge) || 0);
        finalOtherCharges = `Cert Charge ${finalOtherCharges ? "+ " + finalOtherCharges : ""}`.trim();
      }

      // Making charges mapping to price / description
      if (showMakingCharge) {
        finalPrice = data.makingCharge || "";
        finalDescription = `[Making: ${data.makingChargeType || "FX"}] ${finalDescription}`.trim();
      }
    } else {
      if (data.otherChargesPrice) {
        finalOtherChargesPrice = parseFloat(data.otherChargesPrice.toString());
      }
    }

    const productWithStones = {
      ...data,
      price: finalPrice,
      description: finalDescription,
      otherCharges: finalOtherCharges || undefined,
      otherChargesPrice: finalOtherChargesPrice,
      subCategoryId: finalSubCategoryId,
      stoneDetails: finalStones,
      subCategoryName: foundSubCat?.name || "Unknown",
      allowNegativeStock: globalInventoryConfig?.allowNegative ?? false,
    };

    setQueuedProducts((prev) => [...prev, productWithStones]);

    reset({
      branchId: selectedBranch?.id || 0,
      subCategoryId: subCategories?.[0]?.id || 0,
      quantity: 1,
      stoneDetails: [],
      size: "",
      certNumber: "",
      certCenter: "",
      carat: "",
      color: "",
      clarity: "",
      shape: "",
      cut: "",
      diamondCostPerCent: "",
      certCharge: "",
      makingCharge: "",
      makingChargeType: "FX",
      certImage: "",
    });
    setStones([]);
    setShowBasePrice(false);
    setShowMakingCharge(false);

    // Feature #4 — auto-generate codes for the next product
    generateCodes(queuedProducts.length + 1);
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
      size: "",
      certNumber: "",
      certCenter: "",
      carat: "",
      color: "",
      clarity: "",
      shape: "",
      cut: "",
      diamondCostPerCent: "",
      certCharge: "",
      makingCharge: "",
      makingChargeType: "FX",
      certImage: "",
    });
    setStones([]);
    setShowStoneDetails(false);
    setShowBasePrice(false);
    setShowMakingCharge(false);
    generateCodes(0);
  };

  /* ---------- Save handlers ---------- */

  const addToStock = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/inventory/product/create", queuedProducts);
      if (!res) throw new Error("Failed to add stock");
      alert("Products Added Successfully!");
      setQueuedProducts([]);
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Error adding stocks!";
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Feature #5 — Save & Print Barcodes ---------- */

  const addToStockAndPrint = async () => {
    try {
      setLoading(true);
      const productsToSave = [...queuedProducts];
      const res = await axios.post("/api/inventory/product/create", productsToSave);
      if (!res) throw new Error("Failed to add stock");

      // Open print window with barcode labels
      printBarcodes(productsToSave);

      alert("Products Added Successfully!");
      setQueuedProducts([]);
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Error adding stocks!";
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Stone handlers ---------- */

  const handleAddStone = () => {
    setStones([...stones, { carat: "", name: "", quality: "", price: "", quantity: 1, weight: 0 }]);
  };

  const handleRemoveStone = (indexToRemove: number) => {
    setStones(stones.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveFromQueue = (indexToRemove: number) => {
    const updatedQueue = queuedProducts.filter((_, index) => index !== indexToRemove);
    setQueuedProducts(updatedQueue);
    generateCodes(updatedQueue.length);
  };

  const handleStoneChange = (index: number, field: string, value: string) => {
    const newStones = [...stones];
    newStones[index] = { ...(newStones[index] ?? {}), [field]: value };
    setStones(newStones);
  };

  /* ============================================================
     JSX
     ============================================================ */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0f0f0f] border-[#222] text-foreground w-full sm:max-w-5xl lg:max-w-6xl p-0 overflow-hidden shadow-2xl [&>button]:hidden h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex justify-between items-start">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">Add New Product</DialogTitle>
                <span className="px-3 py-1 rounded-full border border-[#d4a843]/30 bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">
                  Inventory Entry
                </span>
              </div>
              <DialogDescription className="text-sm text-[#777] mt-1 text-left">
                Create jewellery inventory item for the master ledger
              </DialogDescription>
            </DialogHeader>
            <button onClick={() => setOpen(false)} className="text-[#555] hover:text-foreground transition-colors p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-xs">
              <p className="font-bold mb-2">Please fix the following validation errors to Add to Queue:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, err]: [string, any]) => (
                  <li key={field}>
                    <span className="font-semibold uppercase text-red-300">{field}:</span> {err.message || "Invalid input"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit(onAddToQueue)} id="add-product-form">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-8">
                {/* BASIC DETAILS */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-secondary"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Basic Details</span>
                    <div className="h-[1px] flex-1 bg-secondary"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Name</Label>
                      <Input {...register("name")} placeholder="e.g. Maharani Polki Choker" className="bg-onyx-elevated border-border text-foreground h-11" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Product Code</Label>
                      <Input {...register("productCode")} readOnly placeholder="Auto-generated" className="bg-onyx-elevated border-border text-foreground h-11 opacity-70" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Barcode</Label>
                      <Input {...register("barcode")} readOnly placeholder="Auto-generated" className="bg-onyx-elevated border-border text-foreground h-11 opacity-70" />
                    </div>
                    {isDiamond && (
                      <div className="col-span-2 grid grid-cols-2 gap-4 bg-onyx-elevated/30 border border-border/50 rounded-xl p-4 my-2">
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Diamond Specifications</span>
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Certificate No</Label>
                          <Input {...register("certNumber")} placeholder="e.g. GIA 123456" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Certification Center</Label>
                          <Input {...register("certCenter")} placeholder="e.g. GIA, IGI" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Carat</Label>
                          <Input {...register("carat")} type="number" step="0.01" placeholder="e.g. 1.25" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Cost Per Cent (₹)</Label>
                          <Input {...register("diamondCostPerCent")} type="number" placeholder="e.g. 500" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Color</Label>
                          <Input {...register("color")} placeholder="e.g. G, H, F" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Clarity</Label>
                          <Input {...register("clarity")} placeholder="e.g. VVS1, VS2" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Shape</Label>
                          <Input {...register("shape")} placeholder="e.g. Round, Princess" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div>
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Cut</Label>
                          <Input {...register("cut")} placeholder="e.g. Excellent, Very Good" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-[#888] font-medium mb-1.5 block">Certificate Charge (₹)</Label>
                          <Input {...register("certCharge")} type="number" placeholder="e.g. 1500" className="bg-onyx-elevated border-border text-foreground h-11" />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">HUID {isSilver && "(Optional)"}</Label>
                      <Input {...register("huidNumber")} placeholder="Hallmark Unique ID" className="bg-onyx-elevated border-border text-foreground h-11" />
                      {errors.huidNumber && <p className="text-red-500 text-xs mt-1">{errors.huidNumber.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Quantity</Label>
                      <Input {...register("quantity", { valueAsNumber: true })} type="number" className="bg-onyx-elevated border-border text-foreground h-11" />
                      {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Size (Optional)</Label>
                      <Input {...register("size")} placeholder="e.g. 12, 14, N" className="bg-onyx-elevated border-border text-foreground h-11" />
                      {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Purity</Label>
                      <select
                        {...register("purity")}
                        className="w-full bg-onyx-elevated border border-border text-foreground rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#d4a843]"
                      >
                        <option value="">Select Purity</option>
                        {availablePurities.map((p: any, idx: number) => (
                          <option key={idx} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      {errors.purity && (
                        <p className="text-red-500 text-xs mt-1">
                          Please select a valid purity configured for {selectedBranch?.name || "this branch"}.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Branch</Label>
                      <Input disabled value={selectedBranch?.name || "Main Branch"} className="bg-onyx-elevated border-border text-foreground h-11 opacity-70" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">SubCategory</Label>
                      <select {...register("subCategoryId", { valueAsNumber: true })} className="w-full bg-onyx-elevated border border-border text-foreground rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#d4a843]">
                        {subCategories.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {errors.subCategoryId && <p className="text-red-500 text-xs mt-1">{errors.subCategoryId.message}</p>}
                    </div>
                  </div>
                </div>

                {/* WEIGHT METRICS */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-secondary"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Weight Metrics</span>
                    <div className="h-[1px] flex-1 bg-secondary"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-onyx-elevated border border-border rounded-xl p-5 relative overflow-hidden group focus-within:border-[#d4a843] transition-colors">
                      <div className="relative z-10">
                        <p className="text-xs text-[#888] font-medium mb-2">Gross Weight</p>
                        <div className="flex items-baseline gap-2">
                          <Input {...register("gsWeight")} placeholder="00.000" className="border-none bg-transparent text-3xl font-light text-foreground p-0 h-auto focus-visible:ring-0 w-32" />
                          <span className="text-sm text-[#777]">gms</span>
                        </div>
                      </div>
                      <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a843]"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>
                      </div>
                      {errors.gsWeight && <p className="text-red-500 text-xs mt-1 absolute bottom-2 left-5">{errors.gsWeight.message}</p>}
                    </div>

                    <div className="bg-onyx-elevated border border-border rounded-xl p-5 relative overflow-hidden group focus-within:border-[#d4a843] transition-colors">
                      <div className="relative z-10">
                        <p className="text-xs text-[#888] font-medium mb-2">Net Weight <span className="text-[10px] text-[#555]">(auto-calculated)</span></p>
                        <div className="flex items-baseline gap-2">
                          <Input {...register("ntWeight")} placeholder="00.000" className="border-none bg-transparent text-3xl font-light text-foreground p-0 h-auto focus-visible:ring-0 w-32" />
                          <span className="text-sm text-[#777]">gms</span>
                        </div>
                      </div>
                      <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a843]"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
                      </div>
                      {errors.ntWeight && <p className="text-red-500 text-xs mt-1 absolute bottom-2 left-5">{errors.ntWeight.message}</p>}
                    </div>
                  </div>
                </div>

                {/* ADDITIONAL CHARGES */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] w-8 bg-secondary"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Additional Charges</span>
                    <div className="h-[1px] flex-1 bg-secondary"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Additional Charges Description</Label>
                      <Input {...register("otherCharges")} placeholder="e.g. Polish, Stones" className="bg-onyx-elevated border-border text-foreground h-11" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">Additional Charges Price</Label>
                      <div className="flex items-center gap-2 bg-onyx-elevated border border-border rounded-md px-3 h-11">
                        <span className="text-[#d4a843] text-sm">₹</span>
                        <Input {...register("otherChargesPrice")} placeholder="0" className="border-none bg-transparent text-foreground p-0 h-full focus-visible:ring-0 text-sm w-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BASE PRICE / MAKING CHARGE — Feature #2: toggle via checkbox */}
                {isDiamond ? (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-[1px] w-8 bg-secondary"></div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="makingCharge"
                          checked={showMakingCharge}
                          onCheckedChange={(checked) => {
                            setShowMakingCharge(!!checked);
                            if (!checked) {
                              setValue("makingCharge", "");
                              setValue("makingChargeType", "FX");
                            }
                          }}
                          className="border-[#666] data-[state=checked]:bg-[#d4a843] data-[state=checked]:text-foreground"
                        />
                        <Label htmlFor="makingCharge" className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843] cursor-pointer">
                          Enable Making Charge
                        </Label>
                      </div>
                      <div className="h-[1px] flex-1 bg-secondary"></div>
                    </div>

                    {showMakingCharge && (
                      <div className="bg-onyx-elevated border border-border rounded-xl p-5">
                        <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Making Charge</p>
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2 flex-1 bg-secondary border border-border rounded-md px-3">
                            <span className="text-[#d4a843] font-medium">₹</span>
                            <Input {...register("makingCharge")} placeholder="0.00" className="border-none bg-transparent text-foreground p-0 h-11 focus-visible:ring-0 w-full" />
                          </div>
                          <select {...register("makingChargeType")} className="bg-secondary border border-border text-foreground rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#d4a843] w-24">
                            <option value="FX">FX</option>
                            <option value="%">%</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-[1px] w-8 bg-secondary"></div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="basePrice"
                          checked={showBasePrice}
                          onCheckedChange={(checked) => {
                            setShowBasePrice(!!checked);
                            if (!checked) {
                              setValue("price", "");
                            }
                          }}
                          className="border-[#666] data-[state=checked]:bg-[#d4a843] data-[state=checked]:text-foreground"
                        />
                        <Label htmlFor="basePrice" className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843] cursor-pointer">
                          Enable Base Price
                        </Label>
                      </div>
                      <div className="h-[1px] flex-1 bg-secondary"></div>
                    </div>

                    {showBasePrice && (
                      <div className="bg-onyx-elevated border border-border rounded-xl p-5">
                        <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Base Price</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[#d4a843] font-medium">₹</span>
                          <Input {...register("price")} placeholder="0.00" className="border-none bg-transparent text-xl text-foreground p-0 h-auto focus-visible:ring-0" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STONE DETAILS (Collapsible) — completely hidden for DIAMONDS */}
                {!isDiamond && (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-[1px] w-8 bg-secondary"></div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="stoneDetails" checked={showStoneDetails} onCheckedChange={() => setShowStoneDetails(!showStoneDetails)} className="border-[#666] data-[state=checked]:bg-[#d4a843] data-[state=checked]:text-foreground" />
                        <Label htmlFor="stoneDetails" className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843] cursor-pointer">
                          Stone Details
                        </Label>
                      </div>
                      <div className="h-[1px] flex-1 bg-secondary"></div>
                    </div>

                    {showStoneDetails && (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button type="button" onClick={handleAddStone} className="bg-secondary hover:bg-secondary text-[#d4a843] border border-border h-8 text-xs flex items-center gap-1">
                            <Plus size={14} /> Add Stone
                          </Button>
                        </div>
                        {stones.map((stone, index) => (
                          <div key={index} className="bg-onyx-elevated border border-border rounded-xl p-4 relative">
                            <button type="button" onClick={() => handleRemoveStone(index)} className="absolute top-4 right-4 text-[#666] hover:text-red-400">
                              <X size={16} />
                            </button>
                            <h4 className="text-sm font-medium text-foreground mb-4">Stone #{index + 1}</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-[10px] text-[#888] uppercase">Name</Label>
                                <Input value={stone.name} onChange={e => handleStoneChange(index, "name", e.target.value)} className="bg-secondary border-border text-foreground h-8 text-xs mt-1" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#888] uppercase">Carat</Label>
                                <Input value={stone.carat} onChange={e => handleStoneChange(index, "carat", e.target.value)} className="bg-secondary border-border text-foreground h-8 text-xs mt-1" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#888] uppercase">Weight</Label>
                                <Input value={stone.weight} onChange={e => handleStoneChange(index, "weight", e.target.value)} type="number" className="bg-secondary border-border text-foreground h-8 text-xs mt-1" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#888] uppercase">Price</Label>
                                <Input value={stone.price} onChange={e => handleStoneChange(index, "price", e.target.value)} className="bg-secondary border-border text-foreground h-8 text-xs mt-1" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#888] uppercase">Quantity</Label>
                                <Input value={stone.quantity} onChange={e => handleStoneChange(index, "quantity", e.target.value)} type="number" min="1" className="bg-secondary border-border text-foreground h-8 text-xs mt-1" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Product Image</span>
                    <div className="h-[1px] flex-1 bg-secondary"></div>
                  </div>
                  <div className="bg-onyx-elevated border border-dashed border-[#444] rounded-xl p-3">
                    <UploadImage value={watch("image")} onUpload={(url) => setValue("image", url)} autoCompress={globalMediaConfig?.autoCompress} />
                    {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>}
                  </div>
                </div>

                {isDiamond && (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Certificate Image (Optional)</span>
                      <div className="h-[1px] flex-1 bg-secondary"></div>
                    </div>
                    <div className="bg-onyx-elevated border border-dashed border-[#444] rounded-xl p-3">
                      <UploadImage value={watch("certImage")} onUpload={(url) => setValue("certImage", url)} autoCompress={globalMediaConfig?.autoCompress} />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Description</span>
                    <div className="h-[1px] flex-1 bg-secondary"></div>
                  </div>
                  <Textarea {...register("description")} placeholder="Optional notes about the piece..." className="bg-onyx-elevated border-border text-foreground resize-none h-32" />
                </div>

                {/* QUEUE SUMMARY */}
                {queuedProducts.length > 0 && (
                  <div className="bg-onyx-elevated border border-border rounded-xl p-4 flex flex-col gap-2 flex-1 min-h-[250px] overflow-hidden">
                    <h4 className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-2 sticky top-0 bg-onyx-elevated py-1">Queued ({queuedProducts.length})</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                      {queuedProducts.map((item, idx) => (
                        <div key={idx} className="bg-secondary rounded-lg p-3 text-xs border border-border relative group">
                          <button type="button" onClick={() => handleRemoveFromQueue(idx)} className="absolute top-3 right-3 text-[#555] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove from queue">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                          <div className="flex justify-between items-center mb-1 pr-6">
                            <span className="font-semibold text-foreground">{item.name}</span>
                            <span className="text-[#d4a843]">{item.productCode}</span>
                          </div>
                          <div className="text-[#888] flex gap-3">
                            <span>Wt: {item.ntWeight}g</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-onyx border-t border-[#222] p-6 flex items-center justify-between shrink-0">
          <button type="button" onClick={() => resetQueue()} disabled={queuedProducts.length === 0} className="text-xs font-bold text-[#777] uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            Reset Queue
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#aaa] uppercase tracking-wider hover:text-foreground transition-colors px-4 py-3">
              Cancel
            </button>
            <button form="add-product-form" type="submit" className="px-6 py-3 border border-[#d4a843] text-[#d4a843] hover:bg-[#d4a843]/10 text-xs font-bold tracking-widest uppercase rounded-full transition-colors">
              Add To Queue
            </button>
            {/* Feature #5 — Save & Print Barcodes */}
            <button
              type="button"
              onClick={addToStockAndPrint}
              disabled={queuedProducts.length === 0 || loading}
              className="px-6 py-3 border border-[#d4a843] text-[#d4a843] hover:bg-[#d4a843]/10 text-xs font-bold tracking-widest uppercase rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Printer size={14} />
              {loading ? "Saving..." : "Save & Print"}
            </button>
            <button type="button" onClick={addToStock} disabled={queuedProducts.length === 0 || loading} className="px-6 py-3 bg-[#d4a843] text-foreground hover:bg-[#b58b2e] text-xs font-bold tracking-widest uppercase rounded-full transition-colors disabled:opacity-50">
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
      `}
      </style>
    </Dialog>
  );
}
