"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React, { useEffect } from "react";
import { Scale, BarChart2, Image as ImageIcon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  product: any | null;
  onConfirm: (updatedProduct: any) => void;

  // From BillingControls
  metalRate: number;
  onMetalRateUpdate: (rate: number) => void; // update billing page rate
}

export default function AddProductModal({
  open,
  onClose,
  product,
  onConfirm,
  metalRate: billingMetalRate,
  onMetalRateUpdate,
}: Props) {
  // Use state variables initialized properly
  const [metalRate, setMetalRate] = React.useState(billingMetalRate);
  const [making, setMaking] = React.useState(0);
  const [discount, setDiscount] = React.useState(0);
  const [extra, setExtra] = React.useState(0);

  // Update local state when product changes to ensure it gets the correct initial values
  useEffect(() => {
    if (product) {
      setMaking(product.makingChargePercent ?? 0);
      setDiscount(product.discountOnMaking ?? 0);
      setExtra(product.additionalCharge ?? 0);
    }
  }, [product]);

  useEffect(() => {
    setMetalRate(billingMetalRate);
  }, [billingMetalRate]);

  if (!product) return null;

  const ntWeight = product.ntWeight ?? 0;

  // Calculations
  const metalValue = ntWeight * metalRate;
  const makingValue = (metalValue * making) / 100;
  const discountedMaking = makingValue - (makingValue * discount) / 100;
  const total = metalValue + discountedMaking + extra;

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 mb-4 mt-8 first:mt-0">
      <div className="h-[1px] w-8 bg-[#333]"></div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">
        {title}
      </span>
      <div className="h-[1px] flex-1 bg-[#333]"></div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f0f] border-[#222] text-white w-[95vw] max-w-4xl sm:max-w-4xl p-0 overflow-hidden shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Add Product Pricing</DialogTitle>
        <div className="p-8">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Edit Pricing
                </h2>
                <span className="px-3 py-1 rounded-full border border-[#d4a843]/30 bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">
                  Invoice Entry
                </span>
              </div>
              <p className="text-sm text-[#777] mt-1">
                Review and adjust pricing details before adding to the current invoice
              </p>
            </div>
            {/* Custom Close Button */}
            <button 
              onClick={onClose}
              className="text-[#555] hover:text-white transition-colors p-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8">
            {/* LEFT COLUMN */}
            <div>
              {/* BASIC DETAILS */}
              <SectionHeading title="Basic Details" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] font-medium mb-1.5 block">Name</label>
                  <Input 
                    disabled 
                    value={product.name} 
                    className="bg-[#1a1a1a] border-[#333] text-white disabled:opacity-70 h-11" 
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] font-medium mb-1.5 block">Product Code</label>
                  <Input 
                    disabled 
                    value={product.productCode || product.barcode} 
                    className="bg-[#1a1a1a] border-[#333] text-white disabled:opacity-70 h-11" 
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] font-medium mb-1.5 block">Category</label>
                  <Input
                    disabled
                    value={product?.subCategory?.name ?? "Uncategorized"}
                    className="bg-[#1a1a1a] border-[#333] text-white disabled:opacity-70 h-11"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] font-medium mb-1.5 block">Purity</label>
                  <Input 
                    disabled 
                    value={product.purity} 
                    className="bg-[#1a1a1a] border-[#333] text-white disabled:opacity-70 h-11" 
                  />
                </div>
              </div>

              {/* WEIGHT METRICS */}
              <SectionHeading title="Weight Metrics" />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs text-[#888] font-medium mb-1">Gross Weight</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-light text-white">{product.gsWeight?.toFixed(3) || "0.000"}</span>
                      <span className="text-sm text-[#777]">gms</span>
                    </div>
                  </div>
                  <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-[#222] flex items-center justify-center border border-[#333]">
                    <Scale className="w-5 h-5 text-[#d4a843]" />
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs text-[#888] font-medium mb-1">Net Weight</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-light text-white">{product.ntWeight?.toFixed(3) || "0.000"}</span>
                      <span className="text-sm text-[#777]">gms</span>
                    </div>
                  </div>
                  <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-[#222] flex items-center justify-center border border-[#333]">
                    <BarChart2 className="w-5 h-5 text-[#d4a843]" />
                  </div>
                </div>
              </div>

              {/* PRICING STRUCTURE */}
              <SectionHeading title="Pricing Structure" />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                  <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Metal Rate</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843] font-medium">₹</span>
                    <Input
                      inputMode="decimal"
                      pattern="[0-9]*"
                      className="no-spinner border-none bg-transparent text-xl text-white p-0 h-auto focus-visible:ring-0"
                      value={metalRate}
                      onChange={(e) => setMetalRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#333]">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#888]">Metal Value</span>
                      <span className="text-white">₹{metalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                  <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Making & Extra</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#666] mb-1 block">Making %</label>
                      <Input
                        inputMode="decimal"
                        pattern="[0-9]*"
                        className="bg-[#222] border-[#333] text-white h-8 text-sm"
                        value={making}
                        onChange={(e) => setMaking(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#666] mb-1 block">Discount %</label>
                      <Input
                        inputMode="decimal"
                        pattern="[0-9]*"
                        className="bg-[#222] border-[#333] text-white h-8 text-sm"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-[#666] mb-1 block">Extra Charges (₹)</label>
                    <Input
                      inputMode="decimal"
                      pattern="[0-9]*"
                      className="bg-[#222] border-[#333] text-white h-8 text-sm"
                      value={extra}
                      onChange={(e) => setExtra(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (IMAGE & TOTALS) */}
            <div className="flex flex-col">
              <SectionHeading title="Product Image" />
              <div className="w-full aspect-square bg-[#1a1a1a] border border-dashed border-[#333] rounded-xl flex items-center justify-center relative overflow-hidden mb-6">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center mb-2">
                      <ImageIcon className="w-6 h-6 text-[#555]" />
                    </div>
                    <span className="text-xs text-[#555]">No Image</span>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <SectionHeading title="Final Summary" />
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Metal Value</span>
                      <span className="text-white">₹{metalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Making Chg</span>
                      <span className="text-white">₹{makingValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Discount</span>
                      <span className="text-red-400">-₹{((makingValue * discount) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Extra</span>
                      <span className="text-white">₹{extra.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#333]">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-[#888] font-bold uppercase">Total Value</span>
                      <span className="text-2xl font-bold text-[#d4a843]">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-[#0a0a0a] border-t border-[#222] p-6 flex items-center justify-between">
          <button 
            onClick={() => {
              setMetalRate(billingMetalRate);
              setMaking(product.makingChargePercent ?? 0);
              setDiscount(product.discountOnMaking ?? 0);
              setExtra(product.additionalCharge ?? 0);
            }}
            className="text-xs font-bold text-[#777] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset Form
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="text-xs font-bold text-[#aaa] uppercase tracking-wider hover:text-white transition-colors px-4 py-3"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onMetalRateUpdate(metalRate);
                onConfirm({
                  ...product,
                  metalRate,
                  makingChargePercent: making,
                  discountOnMaking: discount,
                  additionalCharge: extra,
                  finalTotal: total,
                });
                onClose();
              }}
              className="px-8 py-3 bg-[#d4a843] text-black hover:bg-[#b58b2e] text-xs font-bold tracking-widest uppercase rounded-full transition-colors"
            >
              Add to Invoice
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
