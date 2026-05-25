"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Props {
  wholesalerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WholesalerNewOrderModal({ wholesalerId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerMobile: "",
    deliveryDate: "",
    categoryId: "",
    weight: "",
    description: "",
  });

  useEffect(() => {
    // Attempt to fetch some categories so the dropdown isn't empty, if possible
    fetch("/api/inventory/category/fetchAll?branchId=1")
      .then(res => res.json())
      .then(data => setCategories(data || []))
      .catch(e => console.error(e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("customerName", formData.customerName);
      data.append("customerMobile", formData.customerMobile);
      data.append("deliveryDate", formData.deliveryDate);
      data.append("categoryId", formData.categoryId || "1"); // fallback
      data.append("weight", formData.weight);
      data.append("description", formData.description);
      data.append("wholesalerId", wholesalerId);
      data.append("branchId", "1"); // Assuming branch 1 is default or we need selectedBranch context

      const res = await fetch("/api/order/create", {
        method: "POST",
        body: data,
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        console.error("Failed to create order:", err);
        alert(err?.error || "Failed to create order");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Create New Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400">Customer Name</label>
              <input 
                required
                type="text" 
                value={formData.customerName}
                onChange={e => setFormData(p => ({...p, customerName: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400">Mobile Number</label>
              <input 
                required
                type="text" 
                value={formData.customerMobile}
                onChange={e => setFormData(p => ({...p, customerMobile: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400">Design / Category</label>
            <select 
              required
              value={formData.categoryId}
              onChange={e => setFormData(p => ({...p, categoryId: e.target.value}))}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Select Category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {categories.length === 0 && <option value="1">Default Category</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400">Est. Weight (g)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.weight}
                onChange={e => setFormData(p => ({...p, weight: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. 15.5"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400">Delivery Date</label>
              <input 
                required
                type="date" 
                value={formData.deliveryDate}
                onChange={e => setFormData(p => ({...p, deliveryDate: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400">Notes / Details</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData(p => ({...p, description: e.target.value}))}
              rows={3}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="e.g. 18K Gold, Size 7"
            ></textarea>
          </div>

          <div className="pt-2 flex flex-col">
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-3 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
