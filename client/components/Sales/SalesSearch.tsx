"use client";

import React from "react";
import { Search } from "lucide-react";

interface SalesSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SalesSearch({
  value,
  onChange,
  placeholder = "Search invoices...",
}: SalesSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-[280px] pl-9 pr-4 py-2 rounded-lg
          bg-[#1a1a1a] border border-[#333]
          text-sm text-white placeholder-[#666]
          focus:outline-none focus:border-[#D4A843]/50 focus:ring-1 focus:ring-[#D4A843]/20
          transition-all duration-200
        "
      />
    </div>
  );
}
