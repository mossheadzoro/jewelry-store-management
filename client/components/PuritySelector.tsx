import React, { useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useProductSettingsStore } from "@/lib/store/useProductSettingsStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Purity {
  carat: string;
  purityPercent: number;
}

interface PuritySelectorProps {
  metalName?: string;
  value?: string | number;
  onChange: (value: { carat: string; purityPercent: number }) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PuritySelector({
  metalName,
  value,
  onChange,
  disabled = false,
  placeholder = "Select Purity",
  className,
}: PuritySelectorProps) {
  const { selectedBranch } = useBranchStore();
  const { globalSettings, loading, fetchGlobalSettings } = useProductSettingsStore();
  const [purities, setPurities] = useState<Purity[]>([]);

  useEffect(() => {
    if (selectedBranch?.id && !globalSettings) {
      fetchGlobalSettings(selectedBranch.id);
    }
  }, [selectedBranch?.id, globalSettings, fetchGlobalSettings]);

  useEffect(() => {
    if (globalSettings?.metalConfig?.metals) {
      const metals = globalSettings.metalConfig.metals;
      let targetPurities: Purity[] = [];
      
      if (metalName) {
        const metal = metals.find((m: any) => m.name.toLowerCase() === metalName.toLowerCase());
        if (metal && metal.purities) {
          targetPurities = metal.purities;
        }
      } else {
        // If no metal specified, combine all purities
        metals.forEach((m: any) => {
          if (m.purities) {
            targetPurities = [...targetPurities, ...m.purities];
          }
        });
      }
      
      // Ensure the old format (strings) is gracefully handled
      const formattedPurities = targetPurities.map((p: any) => {
        if (typeof p === "string") {
          return { carat: p, purityPercent: 0 };
        }
        return p;
      });
      
      setPurities(formattedPurities);
    }
  }, [globalSettings, metalName]);

  const handleValueChange = (selectedValue: string) => {
    const selected = purities.find(p => p.carat === selectedValue);
    if (selected) {
      onChange(selected);
    }
  };

  // Convert `value` to string representation for Select value matching
  const displayValue = typeof value === "object" ? (value as any).carat : value?.toString();

  if (loading && !purities.length) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-platinum-muted h-10 px-3 bg-onyx-surface border border-onyx-border rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading purities...
      </div>
    );
  }

  return (
    <Select
      disabled={disabled || purities.length === 0}
      value={displayValue}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={`w-full bg-onyx-surface border border-onyx-border text-[13px] text-platinum h-10 ${className || ''}`}>
        <SelectValue placeholder={purities.length === 0 ? "No purities found" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {purities.map((p, idx) => (
          <SelectItem key={`${p.carat}-${idx}`} value={p.carat}>
            {p.carat} {p.purityPercent > 0 ? `(${p.purityPercent}%)` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
