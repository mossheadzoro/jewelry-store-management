"use client";

import React from "react";

export type DatePreset = "today" | "this_month" | "last_quarter";

interface DateFilterChipsProps {
  active: DatePreset;
  onChange: (preset: DatePreset) => void;
}

const presets: { label: string; value: DatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "This Month", value: "this_month" },
  { label: "Last Quarter", value: "last_quarter" },
];

export default function DateFilterChips({
  active,
  onChange,
}: DateFilterChipsProps) {
  return (
    <div className="flex items-center gap-2">
      {presets.map((preset) => {
        const isActive = active === preset.value;
        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 
              border cursor-pointer
              ${
                isActive
                  ? "border-[#D4A843] text-[#D4A843] bg-[#D4A843]/10"
                  : "border-border text-[#999] bg-transparent hover:border-[#555] hover:text-[#ccc]"
              }
            `}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
