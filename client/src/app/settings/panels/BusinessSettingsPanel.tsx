"use client";

import React, { useEffect, useState } from "react";
import { Building2, Save, Sparkles, UserPlus, Plus } from "lucide-react";
import { toast } from "sonner";
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "qrCodeUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "branch_settings");

    try {
      const res = await axios.post("/api/upload/branch", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.url) {
        setFormData(prev => ({ ...prev, [field]: res.data.url }));
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image");
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
            <h3 className="text-[14px] font-medium text-platinum text-left">Shop Logo</h3>
            <label className={`w-32 h-32 mx-auto rounded-full bg-onyx-surface border-2 border-dashed border-onyx-border flex items-center justify-center cursor-pointer hover:border-gold/50 transition-colors ${!isAdmin ? "pointer-events-none opacity-50" : ""} overflow-hidden`}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, "logoUrl")}
                disabled={!isAdmin}
              />
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] text-platinum-muted">Upload Logo</span>
              )}
            </label>
            <p className="text-[10px] text-platinum-muted">Recommended: 500x500px, PNG format.</p>
          </div>

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
