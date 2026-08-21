"use client";

import React, { useEffect, useRef, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import axios from "axios";
import { Order } from "../../types/order";
import CreateCustomerModal from "./CreateCustomerModal";
import {
  User, Phone, Calendar, Plus, X, Trash2, Upload, FileText, Loader2, Mic, ImageIcon
} from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageUploader } from "./ImageUploader";
import { toast } from "sonner";

type Category = { id: number; name: string };
type Karigar = { id: string; name: string; department: string };
type Customer = {
  id: string;
  name: string;
  mobile: string;
  address: string;
  tags?: Array<{
    id: string;
    name: string;
    label: string;
    color: string;
    type: "SYSTEM" | "MANUAL";
  }>;
};
type Wholesaler = { id: string; name: string };
type ItemDraft = {
  categoryId: string;
  weight: string;
  measurement: string;
  description: string;
  imageFiles: File[];
  voiceFile: File | null;
};

const emptyItem = (): ItemDraft => ({
  categoryId: "", weight: "", measurement: "", description: "", imageFiles: [], voiceFile: null,
});

export default function CreateOrderView({ onOrderCreated }: { onOrderCreated: (order: Order) => void }) {
  const { selectedBranch } = useBranchStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Customer
  const [searchQuery, setSearchQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [walletData, setWalletData] = useState<any>(null);

  useEffect(() => {
    if (customerId) {
      axios.get(`/api/customer/${customerId}/wallet`)
        .then(res => setWalletData(res.data))
        .catch(console.error);
    } else {
      setWalletData(null);
    }
  }, [customerId]);

  // Order fields
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [notes, setNotes] = useState("");
  
  const [assigneeType, setAssigneeType] = useState<"KARIGAR" | "WHOLESALER" | "NONE">("NONE");
  const [karigarId, setKarigarId] = useState("");
  const [wholesalerId, setWholesalerId] = useState("");
  
  // Advance Fields
  const [cashAdvance, setCashAdvance] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  
  const [goldAdvance, setGoldAdvance] = useState("");
  const [metalType, setMetalType] = useState("GOLD");
  const [metalPurity, setMetalPurity] = useState("22K");
  const [metalSource, setMetalSource] = useState("PHYSICAL");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  useEffect(() => {
    if (!selectedBranch?.id) return;
    axios.get("/api/karigar/available").then((r) => setKarigars(r.data)).catch(console.error);
    axios.get("/api/wholesalers?branchId=" + selectedBranch.id).then((r) => setWholesalers(r.data.table || [])).catch(console.error);
    axios.get(`/api/inventory/category/fetchAll?branchId=${selectedBranch.id}`).then((r) => {
      // Filter out prebuilt/system categories
      const filtered = r.data.filter((c: Category) => 
        c.name !== "Raw Metal" && 
        c.name !== "UNMARKED JEWELLERY" && 
        !(c.name || "").toLowerCase().includes("stamping")
      );
      setCategories(filtered);
    }).catch(console.error);
    axios.get(`/api/settings/order-book?branchId=${selectedBranch.id}`).then((r) => setSettings(r.data)).catch(console.error);
  }, [selectedBranch]);

  // Customer search
  useEffect(() => {
    if (searchQuery.length < 3) { setCustomerResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`/api/customer/search?query=${searchQuery}`);
        setCustomerResults(res.data?.customers || []);
      } catch { 
        setCustomerResults([]); 
      } finally {
        setShowDropdown(true);
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addItem = () => {
    if (settings?.multiItemSettings?.maxItemsPerOrder > 0 && items.length >= settings.multiItemSettings.maxItemsPerOrder) {
      alert(`Maximum of ${settings.multiItemSettings.maxItemsPerOrder} items allowed per order based on settings.`);
      return;
    }
    setItems([...items, emptyItem()]);
  };
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: keyof ItemDraft, value: any) => {
    const copy = [...items]; (copy[i] as any)[field] = value; setItems(copy);
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    if (!customerMobile || !customerName) { alert("Customer details are required"); return; }
    if (!items[0].categoryId) { alert("At least one item with category is required"); return; }
    if (!deliveryDate) { alert("Delivery date is required"); return; }
    
    if (metalSource === "WALLET" && parseFloat(goldAdvance) > 0) {
      const requiredAdvance = parseFloat(goldAdvance);
      if (metalPurity === "24K" && (walletData?.metal24KBalance || 0) < requiredAdvance) {
        toast.error("No gold found of the required purity in the wallet.");
        return;
      }
      if (metalPurity === "22K" && (walletData?.metal22KBalance || 0) < requiredAdvance) {
        toast.error("No gold found of the required purity in the wallet.");
        return;
      }
    }

    if (isSubmittingRef.current || submitting) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("customerName", customerName);
      formData.append("customerMobile", customerMobile);
      formData.append("advanceAmount", cashAdvance || "0");
      formData.append("paymentMethod", paymentMethod);
      formData.append("paymentRef", paymentRef);
      
      formData.append("advanceMetal", goldAdvance || "0");
      formData.append("metalType", metalType);
      formData.append("metalPurity", metalPurity);
      formData.append("metalSource", metalSource);
      formData.append("priority", priority);
      formData.append("notes", notes);
      formData.append("deliveryDate", deliveryDate);
      formData.append("branchId", String(selectedBranch?.id));
      if (assigneeType === "KARIGAR" && karigarId) formData.append("karigarId", karigarId);
      if (assigneeType === "WHOLESALER" && wholesalerId) formData.append("wholesalerId", wholesalerId);

      const itemsPayload = items.filter(it => it.categoryId).map(it => ({
        categoryId: Number(it.categoryId),
        weight: it.weight ? Number(it.weight) : undefined,
        measurement: it.measurement,
        description: it.description,
      }));
      formData.append("items", JSON.stringify(itemsPayload));

      items.forEach((it, idx) => { 
        it.imageFiles.forEach((file, fIdx) => {
          formData.append(`image_${idx}_${fIdx}`, file);
        });
        if (it.voiceFile) {
          formData.append(`voice_${idx}`, it.voiceFile);
        }
      });

      const res = await axios.post("/api/order/create", formData);
      onOrderCreated(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to create order ❌");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-foreground tracking-tight">Create New Order</h1>
        <p className="text-[14px] text-[#666] mt-1">Document a bespoke commission in the digital ledger.</p>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-[#D4A843]" />
              <h3 className="text-[16px] font-bold text-foreground">Customer Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Search Mobile / Name</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input
                    value={searchQuery}
                    placeholder="Start typing to find..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors"
                  />
                </div>
                {showDropdown && (
                  <div className="absolute z-50 w-full bg-onyx-elevated border border-border rounded-xl mt-1 overflow-hidden shadow-xl">
                    {searching && <div className="px-4 py-3 text-[12px] text-[#666]">Searching...</div>}
                    {customerResults.map((c) => (
                      <div key={c.id} className="px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer transition-colors" onClick={() => { setCustomerName(c.name); setCustomerMobile(c.mobile); setCustomerId(Number(c.id)); setSearchQuery(""); setShowDropdown(false); }}>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-foreground">{c.name}</p>
                          {c.tags && c.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {c.tags.map((tag) => {
                                const colorMap: Record<string, string> = {
                                  gold: "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30",
                                  red: "bg-red-500/10 text-red-400 border-red-500/25",
                                  blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
                                  gray: "bg-gray-500/10 text-muted-foreground border-gray-500/25",
                                  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                                  orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
                                  purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
                                };
                                const colorClass = colorMap[(tag.color || "").toLowerCase()] || "bg-gray-500/10 text-muted-foreground border-gray-500/25";
                                return (
                                  <span
                                    key={tag.id}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${colorClass}`}
                                    title={tag.label}
                                  >
                                    {tag.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-[#666]">{c.mobile}</p>
                      </div>
                    ))}
                    {!searching && customerResults.length === 0 && settings?.customerSettings?.quickCreation !== false && (
                      <div className="px-4 py-3 text-[#D4A843] cursor-pointer hover:bg-[#2a2a2a] text-[12px]" onClick={() => { setShowCustomerModal(true); setShowDropdown(false); }}>
                        ➕ Create new customer with "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Manual Entry Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full legal name"
                  className="w-full h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              </div>
            </div>
              <div className="mt-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Contact Number</label>
              <div className="flex gap-2">
                <span className="h-11 px-3 rounded-xl bg-onyx border border-onyx-border text-[13px] text-[#888] flex items-center">+91</span>
                <input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="98765 43210"
                  className="flex-1 h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              </div>
            </div>
          </div>

          {/* Timeline & Logistics */}
          <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-[#D4A843]" />
              <h3 className="text-[16px] font-bold text-foreground">Timeline & Logistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
                  <option value="STANDARD">Standard Delivery</option>
                  <option value="URGENT">Urgent</option>
                  <option value="RUSH">Rush</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Order Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Specific client requests, design nuances, or gift messages..."
                className="w-full px-4 py-3 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors resize-none" />
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[#D4A843] text-lg">💎</span>
                <h3 className="text-[16px] font-bold text-foreground">Order Items</h3>
              </div>
              <button onClick={addItem} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#D4A843] hover:text-[#e6bc5a] transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="border border-onyx-border rounded-xl p-4 mb-3 relative group">
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className="grid grid-cols-[1fr_0.6fr_0.6fr_1.2fr] gap-3 items-end">
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Category</label>
                    <select value={item.categoryId} onChange={(e) => updateItem(idx, "categoryId", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
                      <option value="">Select</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Weight (g)</label>
                    <input value={item.weight} onChange={(e) => updateItem(idx, "weight", e.target.value)} placeholder="0.00"
                      className="w-full h-10 px-3 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Measure</label>
                    <input value={item.measurement} onChange={(e) => updateItem(idx, "measurement", e.target.value)} placeholder="18 inch"
                      className="w-full h-10 px-3 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                  </div>
                  <div className="col-span-full mt-2 space-y-4">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Description</label>
                        <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Floral kunda"
                          className="w-full h-10 px-3 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                      </div>
                      <div className="mb-0.5">
                        <VoiceRecorder
                          existingFile={item.voiceFile}
                          onRecordingComplete={(file) => updateItem(idx, "voiceFile", file)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Reference Images</label>
                      <ImageUploader 
                        images={item.imageFiles} 
                        onChange={(files) => updateItem(idx, "imageFiles", files)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addItem} className="w-full py-3 border border-dashed border-border rounded-xl text-[12px] text-[#555] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-colors mt-2">
              + Click to add another article
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Advance Details */}
          <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[#D4A843] text-lg">₹</span>
              <h3 className="text-[16px] font-bold text-foreground">Advance Details</h3>
            </div>
            {/* Wallet Display */}
            {walletData && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#D4A843]/10 to-transparent border border-[#D4A843]/20">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider">Customer Wallet Balance</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-[#888] uppercase">Cash (₹)</p>
                    <p className="text-[16px] font-bold text-foreground">{walletData.cashBalance?.toLocaleString("en-IN") || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#888] uppercase">Fine Gold (24K)</p>
                    <p className="text-[16px] font-bold text-foreground">{(walletData.metal24KBalance || 0).toFixed(3)} g</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#888] uppercase">Std Gold (22K)</p>
                    <p className="text-[16px] font-bold text-foreground">{(walletData.metal22KBalance || 0).toFixed(3)} g</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Cash Advance (₹)</label>
              <div className="grid grid-cols-[1fr_0.8fr] gap-2 mb-2">
                <input type="number" value={cashAdvance} onChange={(e) => setCashAdvance(e.target.value)} placeholder="0.00"
                  className="w-full h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[18px] font-bold text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none">
                  <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="NEFT">NEFT/RTGS</option><option value="CHEQUE">Cheque</option><option value="WALLET">Wallet Balance</option>
                </select>
              </div>
              {paymentMethod !== "CASH" && paymentMethod !== "WALLET" && (
                <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Txn Ref / UTR No"
                  className="w-full h-10 px-4 rounded-xl bg-onyx border border-onyx-border text-[12px] text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              )}
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Metal Advance</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input type="number" value={goldAdvance} onChange={(e) => setGoldAdvance(e.target.value)} placeholder="0.00"
                    className="flex-1 h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[18px] font-bold text-foreground placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                  <select value={metalType} onChange={(e) => setMetalType(e.target.value)}
                    className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none">
                    <option value="GOLD">Gold</option><option value="SILVER">Silver</option>
                  </select>
                  <select value={metalPurity} onChange={(e) => setMetalPurity(e.target.value)}
                    className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none">
                    <option value="24K">24K</option><option value="22K">22K</option><option value="20K">20K</option><option value="18K">18K</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-1">
                  <select value={metalSource} onChange={(e) => setMetalSource(e.target.value)}
                    className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none w-full">
                    <option value="PHYSICAL">Physical Metal Check-in</option><option value="WALLET">From Customer Wallet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Total Booking Value */}
            <div className="bg-onyx border border-onyx-border rounded-xl p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em]">Total Booking Value</p>
                <span className="text-[#D4A843]">◎</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#888]">Cash Recorded</span>
                  <span className="text-foreground font-semibold">₹ {Number(cashAdvance || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#888]">Gold Weight</span>
                  <span className="text-foreground font-semibold">{Number(goldAdvance || 0).toFixed(3)} g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Assignment */}
          <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[#D4A843] text-lg">👨‍🔧</span>
              <h3 className="text-[16px] font-bold text-foreground">Work Assignment</h3>
            </div>
            
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Assign To</label>
            <select value={assigneeType} onChange={(e) => { setAssigneeType(e.target.value as any); setKarigarId(""); setWholesalerId(""); }}
              className="w-full h-11 px-4 mb-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
              <option value="NONE">Assign Later</option>
              <option value="KARIGAR">Master Artisan (Karigar)</option>
              <option value="WHOLESALER">Wholesaler</option>
            </select>

            {assigneeType === "KARIGAR" && (
              <>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Select Master Artisan</label>
                <select value={karigarId} onChange={(e) => setKarigarId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
                  <option value="">Select from workshop...</option>
                  {karigars.map((k) => <option key={k.id} value={k.id}>{k.name} ({k.department})</option>)}
                </select>
              </>
            )}

            {assigneeType === "WHOLESALER" && (
              <>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Select Wholesaler</label>
                <select value={wholesalerId} onChange={(e) => setWholesalerId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
                  <option value="">Select wholesaler...</option>
                  {wholesalers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </>
            )}

            <div className="mt-4 p-3 bg-[#D4A843]/5 border border-[#D4A843]/20 rounded-xl">
              <p className="text-[11px] text-[#D4A843] leading-relaxed">
                <strong>Assign Later</strong>: You can skip this step now and assign the job to a workshop or wholesaler after design finalization.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full h-14 rounded-2xl bg-[#D4A843] text-foreground text-[14px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#e6bc5a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#D4A843]/20">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5" /> Generate Order Slip & Save</>}
          </button>

          <p className="text-center text-[11px] text-[#555] tracking-widest uppercase">
            Digital Ledger Entry
          </p>
        </div>
      </div>

      <CreateCustomerModal open={showCustomerModal} mobile={searchQuery}
        onClose={() => setShowCustomerModal(false)}
        onCreated={(c) => { setCustomerName(c.name); setCustomerMobile(c.mobile); setSearchQuery(""); }} />
    </div>
  );
}
