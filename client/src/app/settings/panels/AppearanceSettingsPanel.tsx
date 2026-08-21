"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function AppearanceSettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const branchId = session?.user?.branchId;
  const [isSaving, setIsSaving] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial setting from DB removed to prevent overriding local unsaved changes on tab switch

  const handleSave = async (applyToAll: boolean) => {
    if (!branchId) return;
    setIsSaving(true);
    try {
      await axios.put("/api/settings/appearance", {
        branchId: parseInt(branchId),
        themeMode: theme,
        applyToAllBranches: applyToAll,
      });
      toast.success(`Theme mode saved ${applyToAll ? "for all branches" : "for this branch"}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save appearance settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return <div className="p-8 text-platinum">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-heading font-semibold text-platinum">Appearance</h2>
        <p className="text-[13px] text-platinum-muted mt-1">
          Customize how the application looks on your device.
        </p>
      </div>

      <div className="bg-onyx-surface rounded-xl gold-border p-6">
        <h3 className="text-[15px] font-medium text-platinum mb-4">Theme Preference</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
              theme === "light" 
                ? "border-gold bg-gold/5" 
                : "border-onyx-border bg-onyx-elevated/50 hover:border-gold/50"
            }`}
          >
            <Sun className={`w-8 h-8 mb-3 ${theme === "light" ? "text-gold" : "text-platinum-muted"}`} />
            <span className={`font-medium ${theme === "light" ? "text-gold" : "text-platinum"}`}>Light Mode</span>
          </button>
          
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
              theme === "dark" 
                ? "border-gold bg-gold/5" 
                : "border-onyx-border bg-onyx-elevated/50 hover:border-gold/50"
            }`}
          >
            <Moon className={`w-8 h-8 mb-3 ${theme === "dark" ? "text-gold" : "text-platinum-muted"}`} />
            <span className={`font-medium ${theme === "dark" ? "text-gold" : "text-platinum"}`}>Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
              theme === "system" 
                ? "border-gold bg-gold/5" 
                : "border-onyx-border bg-onyx-elevated/50 hover:border-gold/50"
            }`}
          >
            <Monitor className={`w-8 h-8 mb-3 ${theme === "system" ? "text-gold" : "text-platinum-muted"}`} />
            <span className={`font-medium ${theme === "system" ? "text-gold" : "text-platinum"}`}>System Default</span>
          </button>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-onyx-border">
        <button
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum hover:bg-onyx-surface transition-colors disabled:opacity-50 text-[14px] font-medium"
        >
          {isSaving ? "Saving..." : "Save for this branch"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-gold text-onyx hover:bg-gold-light transition-colors disabled:opacity-50 text-[14px] font-medium"
        >
          {isSaving ? "Saving..." : "Save for all branches"}
        </button>
      </div>
    </div>
  );
}
