"use client";

import React, { useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import axios from "axios";
import { Order } from "../../types/order";
import CreateCustomerModal from "./CreateCustomerModal";
import {
  User, Phone, Calendar, Plus, X, Trash2, Upload, FileText, Loader2, Mic, ImageIcon
} from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageUploader } from "./ImageUploader";

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

  // Order fields
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [notes, setNotes] = useState("");
  const [karigarId, setKarigarId] = useState("");
  
  // Advance Fields
  const [cashAdvance, setCashAdvance] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  
  const [goldAdvance, setGoldAdvance] = useState("");
  const [metalType, setMetalType] = useState("GOLD");
  const [metalPurity, setMetalPurity] = useState("22K");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  useEffect(() => {
    if (!selectedBranch?.id) return;
    axios.get("/api/karigar/available").then((r) => setKarigars(r.data)).catch(console.error);
    axios.get(`/api/inventory/category/fetchAll?branchId=${selectedBranch.id}`).then((r) => setCategories(r.data)).catch(console.error);
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

  const handleSubmit = async () => {
    if (!customerMobile || !customerName) { alert("Customer details are required"); return; }
    if (!items[0].categoryId) { alert("At least one item with category is required"); return; }
    if (!deliveryDate) { alert("Delivery date is required"); return; }

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
      formData.append("priority", priority);
      formData.append("notes", notes);
      formData.append("deliveryDate", deliveryDate);
      formData.append("branchId", String(selectedBranch?.id));
      if (karigarId) formData.append("karigarId", karigarId);

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
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-white tracking-tight">Create New Order</h1>
        <p className="text-[14px] text-[#666] mt-1">Document a bespoke commission in the digital ledger.</p>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-[#D4A843]" />
              <h3 className="text-[16px] font-bold text-white">Customer Details</h3>
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
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors"
                  />
                </div>
                {showDropdown && (
                  <div className="absolute z-50 w-full bg-[#1a1a1a] border border-[#333] rounded-xl mt-1 overflow-hidden shadow-xl">
                    {searching && <div className="px-4 py-3 text-[12px] text-[#666]">Searching...</div>}
                    {customerResults.map((c) => (
                      <div key={c.id} className="px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer transition-colors" onClick={() => { setCustomerName(c.name); setCustomerMobile(c.mobile); setSearchQuery(""); setShowDropdown(false); }}>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-white">{c.name}</p>
                          {c.tags && c.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {c.tags.map((tag) => {
                                const colorMap: Record<string, string> = {
                                  gold: "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30",
                                  red: "bg-red-500/10 text-red-400 border-red-500/25",
                                  blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
                                  gray: "bg-gray-500/10 text-gray-400 border-gray-500/25",
                                  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                                  orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
                                  purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
                                };
                                const colorClass = colorMap[tag.color.toLowerCase()] || "bg-gray-500/10 text-gray-400 border-gray-500/25";
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
                  className="w-full h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              </div>
            </div>
              <div className="mt-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Contact Number</label>
              <div className="flex gap-2">
                <span className="h-11 px-3 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-[#888] flex items-center">+91</span>
                <input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="98765 43210"
                  className="flex-1 h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              </div>
            </div>
          </div>

          {/* Timeline & Logistics */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-[#D4A843]" />
              <h3 className="text-[16px] font-bold text-white">Timeline & Logistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
                  <option value="STANDARD">Standard Delivery</option>
                  <option value="URGENT">Urgent</option>
                  <option value="RUSH">Rush</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Order Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Specific client requests, design nuances, or gift messages..."
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors resize-none" />
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[#D4A843] text-lg">💎</span>
                <h3 className="text-[16px] font-bold text-white">Order Items</h3>
              </div>
              <button onClick={addItem} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#D4A843] hover:text-[#e6bc5a] transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="border border-[#2a2a2a] rounded-xl p-4 mb-3 relative group">
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className="grid grid-cols-[1fr_0.6fr_0.6fr_1.2fr] gap-3 items-end">
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Category</label>
                    <select value={item.categoryId} onChange={(e) => updateItem(idx, "categoryId", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
                      <option value="">Select</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Weight (g)</label>
                    <input value={item.weight} onChange={(e) => updateItem(idx, "weight", e.target.value)} placeholder="0.00"
                      className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Measure</label>
                    <input value={item.measurement} onChange={(e) => updateItem(idx, "measurement", e.target.value)} placeholder="18 inch"
                      className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                  </div>
                  <div className="col-span-full mt-2 space-y-4">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.1em] mb-1.5 block">Description</label>
                        <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Floral kunda"
                          className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
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

            <button onClick={addItem} className="w-full py-3 border border-dashed border-[#333] rounded-xl text-[12px] text-[#555] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-colors mt-2">
              + Click to add another article
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Advance Details */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[#D4A843] text-lg">₹</span>
              <h3 className="text-[16px] font-bold text-white">Advance Details</h3>
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Cash Advance (₹)</label>
              <div className="grid grid-cols-[1fr_0.8fr] gap-2 mb-2">
                <input type="number" value={cashAdvance} onChange={(e) => setCashAdvance(e.target.value)} placeholder="0.00"
                  className="w-full h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[18px] font-bold text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none">
                  <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="NEFT">NEFT/RTGS</option><option value="CHEQUE">Cheque</option>
                </select>
              </div>
              {paymentMethod !== "CASH" && (
                <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Txn Ref / UTR No"
                  className="w-full h-10 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
              )}
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Metal Advance</label>
              <div className="flex gap-2">
                <input type="number" value={goldAdvance} onChange={(e) => setGoldAdvance(e.target.value)} placeholder="0.00"
                  className="flex-1 h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[18px] font-bold text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" />
                <select value={metalType} onChange={(e) => setMetalType(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none">
                  <option value="GOLD">Gold</option><option value="SILVER">Silver</option>
                </select>
                <select value={metalPurity} onChange={(e) => setMetalPurity(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 text-[13px] font-bold text-[#D4A843] focus:outline-none appearance-none">
                  <option value="24K">24K</option><option value="22K">22K</option><option value="20K">20K</option><option value="18K">18K</option>
                </select>
              </div>
            </div>

            {/* Total Booking Value */}
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em]">Total Booking Value</p>
                <span className="text-[#D4A843]">◎</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#888]">Cash Recorded</span>
                  <span className="text-white font-semibold">₹ {Number(cashAdvance || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#888]">Gold Weight</span>
                  <span className="text-white font-semibold">{Number(goldAdvance || 0).toFixed(3)} g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Assignment */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[#D4A843] text-lg">👨‍🔧</span>
              <h3 className="text-[16px] font-bold text-white">Work Assignment</h3>
            </div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Select Master Artisan (Karigar)</label>
            <select value={karigarId} onChange={(e) => setKarigarId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none">
              <option value="">Select from workshop...</option>
              {karigars.map((k) => <option key={k.id} value={k.id}>{k.name} ({k.department})</option>)}
            </select>
            <div className="mt-3 p-3 bg-[#D4A843]/5 border border-[#D4A843]/20 rounded-xl">
              <p className="text-[11px] text-[#D4A843] leading-relaxed">
                <strong>Assign Later</strong> helper text: You can skip this step now and assign the job to a workshop after design finalization.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full h-14 rounded-2xl bg-[#D4A843] text-black text-[14px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#e6bc5a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#D4A843]/20">
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
