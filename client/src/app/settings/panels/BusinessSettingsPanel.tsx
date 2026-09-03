"use client";

import React, { useEffect, useState } from "react";
import { Building2, Save, Sparkles, UserPlus, Plus, Crop, Trash2, Edit3, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import LogoCropperModal from "@/components/ui/LogoCropperModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddBranchForm from "../../../../components/AddBranchForm";
import AddUserForm from "../../../../components/AddUserForm";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/lib/store/useUserStore";
import axios from "axios";

export default function BusinessSettingsPanel() {
  const { user } = useUserStore();
  const isAdmin = user?.systemRole === "ADMIN" || user?.role === "ADMIN";
  
  const { branches, selectedBranch, branchSettings, fetchBranchSettings } = useBranchStore();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    gstNumber: "",
    pan: "",
    currency: "INR",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phoneNumbers: "",
    email: "",
    website: "",
    invoiceHeaderText: "",
    termsAndConditions: "",
    logoUrl: "",
    qrCodeUrl: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchBranchSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, fetchBranchSettings]);

  useEffect(() => {
    if (branchSettings) {
      setFormData({
        name: branchSettings.branch?.name || "",
        shopName: branchSettings.shopName || "",
        gstNumber: branchSettings.gstNumber || "",
        pan: branchSettings.pan || "",
        currency: branchSettings.currency || "INR",
        address: branchSettings.branch?.address || branchSettings.address || "",
        city: branchSettings.branch?.city || "",
        state: branchSettings.branch?.state || "",
        pincode: branchSettings.branch?.pincode || "",
        country: branchSettings.branch?.country || "India",
        phoneNumbers: branchSettings.branch?.phone || branchSettings.phoneNumbers || "",
        email: branchSettings.branch?.email || branchSettings.email || "",
        website: branchSettings.website || "",
        invoiceHeaderText: branchSettings.invoiceHeaderText || "",
        termsAndConditions: branchSettings.termsAndConditions || "",
        logoUrl: branchSettings.logoUrl || "",
        qrCodeUrl: branchSettings.qrCodeUrl || "",
      });
    } else {
      setFormData({
        name: "",
        shopName: "",
        gstNumber: "",
        pan: "",
        currency: "INR",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        phoneNumbers: "",
        email: "",
        website: "",
        invoiceHeaderText: "",
        termsAndConditions: "",
        logoUrl: "",
        qrCodeUrl: "",
      });
    }
  }, [branchSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<File | string | null>(null);
  const [isCropperUploading, setIsCropperUploading] = useState(false);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageForCrop(file);
    setCropperOpen(true);
    e.target.value = ""; // reset input so same file can be selected again
  };

  const handleReCrop = () => {
    if (!formData.logoUrl) return;
    setSelectedImageForCrop(formData.logoUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = async (file: File) => {
    setIsCropperUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "branch_settings");

    try {
      const res = await axios.post("/api/upload/branch", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.url) {
        setFormData(prev => ({ ...prev, logoUrl: res.data.url }));
        toast.success("Shop logo cropped and updated successfully");
      }
    } catch (error) {
      console.error("Logo upload failed", error);
      toast.error("Failed to upload cropped logo");
    } finally {
      setIsCropperUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBranch) {
      toast.error("Please select a branch first");
      return;
    }
    
    setSaving(true);
    try {
      await axios.post("/api/branch/settings", {
        branchId: selectedBranch.id,
        ...formData
      });
      toast.success("Business settings saved successfully!");
      fetchBranchSettings(selectedBranch.id);
      useBranchStore.getState().fetchAllBranches(); // refresh branch names if changed
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold" />
            Business Settings {selectedBranch ? `- ${selectedBranch.name}` : ""}
          </h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Manage your core shop identity, contact details, and localization preferences.
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-[#d4a843] to-[#b88628] hover:from-[#e0b853] hover:to-[#c79532] text-black font-semibold text-[13px] h-10 px-4 rounded-xl shadow-lg shadow-[#d4a843]/20 flex items-center gap-2 active:scale-[0.98] transition-all border-none"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Quick Create</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[650px] bg-[#09090b] border border-[#d4a843]/30 shadow-[0_0_60px_-15px_rgba(212,168,67,0.2)] rounded-2xl p-0 overflow-hidden text-foreground">
              {/* Luxury Modal Header */}
              <div className="bg-gradient-to-b from-[#18181b] to-[#0f0f12] px-6 py-5 border-b border-[#27272a] relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 border border-[#d4a843]/30 flex items-center justify-center text-[#d4a843] shadow-inner">
                    <Sparkles className="w-5 h-5 text-[#d4a843]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[17px] font-semibold text-foreground tracking-tight">
                      Quick Entity Provisioning
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-zinc-400 mt-0.5">
                      Fast-track setup for a new store branch or staff member.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <Tabs defaultValue="branch" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-[#121215] border border-[#27272a] p-1 rounded-xl h-11">
                    <TabsTrigger
                      value="branch"
                      className="rounded-lg text-[13px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4a843] data-[state=active]:to-[#b88628] data-[state=active]:text-black data-[state=active]:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>New Branch Location</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="manager"
                      className="rounded-lg text-[13px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4a843] data-[state=active]:to-[#b88628] data-[state=active]:text-black data-[state=active]:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Staff / Manager Account</span>
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="max-h-[60vh] mt-4 pr-1">
                    <TabsContent value="branch" className="mt-0 focus-visible:outline-none">
                      <AddBranchForm
                        onSuccess={() => setIsQuickCreateOpen(false)}
                        onCancel={() => setIsQuickCreateOpen(false)}
                      />
                    </TabsContent>

                    <TabsContent value="manager" className="mt-0 focus-visible:outline-none">
                      <AddUserForm
                        branches={branches}
                        onSuccess={() => setIsQuickCreateOpen(false)}
                        onCancel={() => setIsQuickCreateOpen(false)}
                      />
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Shop Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Branch System Name</label>
                <input disabled={!isAdmin} name="name" value={formData.name} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Display Shop Name</label>
                <input disabled={!isAdmin} name="shopName" value={formData.shopName} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">GST Number</label>
                <input disabled={!isAdmin} name="gstNumber" value={formData.gstNumber} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors uppercase" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">PAN</label>
                <input disabled={!isAdmin} name="pan" value={formData.pan} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors uppercase" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Currency</label>
                <select disabled={!isAdmin} name="currency" value={formData.currency} onChange={handleChange} className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors appearance-none">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Contact & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Address</label>
                <textarea disabled={!isAdmin} name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full py-2 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">City</label>
                <input disabled={!isAdmin} name="city" value={formData.city} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">State</label>
                <input disabled={!isAdmin} name="state" value={formData.state} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Pincode</label>
                <input disabled={!isAdmin} name="pincode" value={formData.pincode} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Country</label>
                <input disabled={!isAdmin} name="country" value={formData.country} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Phone Numbers</label>
                <input disabled={!isAdmin} name="phoneNumbers" value={formData.phoneNumbers} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Email</label>
                <input disabled={!isAdmin} name="email" value={formData.email} onChange={handleChange} type="email" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Website</label>
                <input disabled={!isAdmin} name="website" value={formData.website} onChange={handleChange} type="url" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 space-y-4">
            <h3 className="text-[14px] font-medium text-platinum">Invoice Branding</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Invoice Header Text</label>
                <input disabled={!isAdmin} name="invoiceHeaderText" value={formData.invoiceHeaderText} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-platinum-muted uppercase tracking-wider">Terms & Conditions</label>
                <textarea disabled={!isAdmin} name="termsAndConditions" value={formData.termsAndConditions} onChange={handleChange} rows={3} className="w-full py-2 px-3 rounded-lg bg-onyx-surface border border-onyx-border text-[13px] text-platinum focus:border-gold/40 focus:outline-none transition-colors resize-y" />
              </div>
            </div>
          </div>
        </div>

        {/* Side Actions & Uploads */}
        <div className="space-y-6">
          <div className="bg-onyx-elevated rounded-xl border border-onyx-border p-6 text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-medium text-platinum text-left flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> Shop Logo
              </h3>
              {formData.logoUrl && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">
                  Active
                </span>
              )}
            </div>

            {/* Logo Preview / Upload Area */}
            <div className="relative w-36 h-36 mx-auto group">
              {formData.logoUrl ? (
                <div className="w-full h-full rounded-2xl bg-onyx-surface border-2 border-gold/40 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.15)] relative">
                  <img
                    src={formData.logoUrl}
                    alt="Shop Logo"
                    className="w-full h-full object-contain p-2"
                  />
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleReCrop}
                        className="px-3 py-1.5 rounded-lg bg-gold text-onyx font-semibold text-[11px] flex items-center gap-1.5 hover:bg-gold-light transition-all shadow-md"
                      >
                        <Crop className="w-3.5 h-3.5" /> Crop / Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white font-medium text-[10px] flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  className={`w-full h-full rounded-2xl bg-onyx-surface border-2 border-dashed border-onyx-border flex flex-col items-center justify-center cursor-pointer hover:border-gold/60 hover:bg-onyx transition-all ${
                    !isAdmin ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileSelect}
                    disabled={!isAdmin}
                  />
                  <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-[12px] font-medium text-platinum">Upload Logo</span>
                  <span className="text-[10px] text-platinum-muted mt-0.5">Crop & Customize</span>
                </label>
              )}
            </div>

            {/* Action buttons below logo */}
            {isAdmin && formData.logoUrl && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-onyx border border-onyx-border text-platinum-muted hover:text-gold hover:border-gold/40 text-[11px] font-medium flex items-center gap-1.5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileSelect}
                  />
                  <Upload className="w-3.5 h-3.5" /> Upload New
                </label>

                <button
                  type="button"
                  onClick={handleReCrop}
                  className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Crop className="w-3.5 h-3.5" /> Crop / Shape
                </button>
              </div>
            )}

            <p className="text-[10px] text-platinum-muted leading-relaxed">
              Customizable in <strong>Circle</strong> or <strong>Square</strong> shape with real-time invoice preview.
            </p>
          </div>

          {/* LOGO CROPPER MODAL */}
          <LogoCropperModal
            isOpen={cropperOpen}
            onClose={() => setCropperOpen(false)}
            imageFileOrUrl={selectedImageForCrop}
            onCropComplete={handleCropComplete}
            isSaving={isCropperUploading}
            title="Crop & Customize Shop Logo"
            initialShape="circle"
          />
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end border-t border-onyx-border pt-4">
          <button 
            onClick={handleSave} 
            disabled={saving || !selectedBranch}
            className="flex items-center gap-2 bg-gold text-onyx px-6 py-2.5 rounded-lg text-[13px] font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Business Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
