"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Sparkles,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranchStore } from "@/lib/store/useBranchStore";

interface AddBranchFormProps {
  onSuccess?: (branch: any) => void;
  onCancel?: () => void;
}

export default function AddBranchForm({ onSuccess, onCancel }: AddBranchFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phone: "",
      email: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Branch name and official email are required");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/branch/create", formData);

      if (response.status === 201 || response.status === 200) {
        toast.success(`Branch "${formData.name}" established successfully!`, {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        });

        useBranchStore.getState().fetchAllBranches();
        handleReset();

        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err: any) {
      console.error("Error creating branch:", err);
      toast.error(err.response?.data?.error || "Failed to create branch. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-1">
      {/* Section 1: Location & Contact */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#d4a843] uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>Branch Identity & Contact</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Branch Name <span className="text-[#d4a843]">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Atelier Flagship Store - South Ext"
                required
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-platinum mb-1.5">
                Official Email <span className="text-[#d4a843]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. branch.delhi@jewels.com"
                  required
                  className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-platinum mb-1.5">
                Primary Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Physical Address */}
      <div className="space-y-3.5 pt-2 border-t border-[#27272a]/60">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#d4a843] uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>Physical Location Details</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Street / Building Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Plot No 42, Gold Souk Heritage Mall, Ring Road"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-platinum-muted mb-1">City</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New Delhi"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-platinum-muted mb-1">State</label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Delhi"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-platinum-muted mb-1">PIN Code</label>
              <input
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="110049"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-platinum-muted mb-1">Country</label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                  className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-8 pr-2.5 py-2 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Footer */}
      <div className="pt-4 border-t border-[#27272a] flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1f] text-[13px] px-3.5 h-9 rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>

        <div className="flex items-center gap-2.5">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-[#27272a] bg-[#121215] text-zinc-300 hover:bg-[#1a1a1f] text-[13px] h-9 px-4 rounded-xl"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#d4a843] to-[#b88628] hover:from-[#e0b853] hover:to-[#c79532] text-black font-semibold text-[13px] h-9 px-5 rounded-xl shadow-lg shadow-[#d4a843]/20 flex items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Creating Branch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black fill-black" />
                <span>Establish Branch</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
