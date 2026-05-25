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

import { useState } from "react";
import axios from "axios";
import { useBranchStore } from "@/lib/store/useBranchStore";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function AddCategoryForm({ open, setOpen, onSuccess }: Props) {
  const { selectedBranch } = useBranchStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (!selectedBranch?.id) {
      setError("Please select a branch first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await axios.post("/api/inventory/category/create", {
        name,
        description,
        branchId: selectedBranch.id,
      });
      setOpen(false);
      setName("");
      setDescription("");
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create category. Note: You must be an ADMIN to create categories.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0f0f0f] border-[#222] text-white w-full sm:max-w-md p-0 overflow-hidden shadow-2xl [&>button]:hidden h-auto flex flex-col">
        {/* HEADER */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex justify-between items-start">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-3xl font-bold text-white tracking-tight">Add Category</DialogTitle>
                <span className="px-3 py-1 rounded-full border border-[#d4a843]/30 bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">
                  New Ledger
                </span>
              </div>
              <DialogDescription className="text-sm text-[#777] mt-1 text-left">
                Create a new main category for your inventory vault.
              </DialogDescription>
            </DialogHeader>
            <button type="button" onClick={() => setOpen(false)} className="text-[#555] hover:text-white transition-colors p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 p-8 pt-4">
          <form onSubmit={handleSubmit} id="add-category-form" className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <Label className="text-xs text-[#888] font-medium mb-1.5 block">Category Name <span className="text-red-500">*</span></Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Gold, Diamond, Silver" 
                className="bg-[#1a1a1a] border-[#333] text-white h-11" 
                required 
              />
            </div>
            <div>
              <Label className="text-xs text-[#888] font-medium mb-1.5 block">Description (Optional)</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief description about the items in this category..." 
                className="bg-[#1a1a1a] border-[#333] text-white resize-none h-32 custom-scrollbar" 
              />
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="bg-[#0a0a0a] border-t border-[#222] p-6 flex items-center justify-end shrink-0 gap-3">
          <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#aaa] uppercase tracking-wider hover:text-white transition-colors px-4 py-3">
            Cancel
          </button>
          <button 
            type="submit" 
            form="add-category-form"
            disabled={loading || !name.trim()} 
            className="bg-[#d4a843] hover:bg-[#b08b35] text-black font-bold uppercase tracking-wider text-xs px-8 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Category"}
          </button>
        </div>
      </DialogContent>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </Dialog>
  );
}
