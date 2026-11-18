"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useBranchStore } from "@/lib/store/useBranchStore";

export default function AppearanceSettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { selectedBranch, branches } = useBranchStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedBranchTheme, setSavedBranchTheme] = useState<string | null>(null);

  // Active branch ID resolution: selected branch -> session user branch -> first available branch
  const activeBranchId =
    selectedBranch?.id ||
    (session?.user?.branchId ? parseInt(session.user.branchId, 10) : null) ||
    (branches.length > 0 ? branches[0].id : null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial setting from DB for the active branch
  useEffect(() => {
    if (!activeBranchId) return;
    let isCancelled = false;
    const fetchAppearance = async () => {
      try {
        const res = await axios.get(`/api/settings/appearance?branchId=${activeBranchId}`);
        if (!isCancelled && res.data?.themeMode) {
          setSavedBranchTheme(res.data.themeMode);
        }
      } catch {
        // Fallback gracefully if not set
      }
    };
    fetchAppearance();
    return () => {
      isCancelled = true;
    };
  }, [activeBranchId]);

  const handleSave = async (applyToAll: boolean) => {
    if (!activeBranchId) {
      toast.error("Please select an active branch first before saving appearance settings");
      return;
    }
    setIsSaving(true);
    try {
      await axios.put("/api/settings/appearance", {
        branchId: activeBranchId,
        themeMode: theme,
        applyToAllBranches: applyToAll,
      });
      setSavedBranchTheme(theme || "system");
      toast.success(`Theme mode saved ${applyToAll ? "for all branches" : "for this branch"}`);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.error || "Failed to save appearance settings";
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return <div className="p-8 text-platinum">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum">Appearance</h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Customize how the application looks on your device and configure branch store themes.
          </p>
        </div>
        {savedBranchTheme && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium self-start sm:self-auto">
            <span>Branch Saved Mode: <strong className="capitalize">{savedBranchTheme}</strong></span>
          </div>
        )}
      </div>

      <div className="bg-onyx-surface rounded-xl gold-border p-6">
        <h3 className="text-[15px] font-medium text-platinum mb-4">Theme Preference</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all cursor-pointer ${
              theme === "light" 
                ? "border-gold bg-gold/5 shadow-sm" 
                : "border-onyx-border bg-onyx-elevated/50 hover:border-gold/50"
            }`}
          >
            <Sun className={`w-8 h-8 mb-3 ${theme === "light" ? "text-gold" : "text-platinum-muted"}`} />
            <span className={`font-medium ${theme === "light" ? "text-gold" : "text-platinum"}`}>Light Mode</span>
            <span className="text-[11px] text-platinum-muted mt-1">Crisp, bright interface</span>
          </button>
          
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all cursor-pointer ${
              theme === "dark" 
                ? "border-gold bg-gold/5 shadow-sm" 
                : "border-onyx-border bg-onyx-elevated/50 hover:border-gold/50"
            }`}
          >
            <Moon className={`w-8 h-8 mb-3 ${theme === "dark" ? "text-gold" : "text-platinum-muted"}`} />
            <span className={`font-medium ${theme === "dark" ? "text-gold" : "text-platinum"}`}>Dark Mode</span>
            <span className="text-[11px] text-platinum-muted mt-1">Sleek, luxury onyx finish</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all cursor-pointer ${
              theme === "system" 
                ? "border-gold bg-gold/5 shadow-sm" 
                : "border-onyx-border bg-onyx-elevated/50 hover:border-gold/50"
            }`}
          >
            <Monitor className={`w-8 h-8 mb-3 ${theme === "system" ? "text-gold" : "text-platinum-muted"}`} />
            <span className={`font-medium ${theme === "system" ? "text-gold" : "text-platinum"}`}>System Default</span>
            <span className="text-[11px] text-platinum-muted mt-1">Syncs with OS preferences</span>
          </button>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-onyx-border">
        <button
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum hover:bg-onyx-surface transition-colors disabled:opacity-50 text-[14px] font-medium cursor-pointer"
        >
          {isSaving ? "Saving..." : "Save for this branch"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-gold text-onyx hover:bg-gold-light transition-colors disabled:opacity-50 text-[14px] font-medium cursor-pointer"
        >
          {isSaving ? "Saving..." : "Save for all branches"}
        </button>
      </div>
    </div>
  );
}
