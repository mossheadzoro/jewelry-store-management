"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      className="bg-[#d4a843] hover:bg-[#b8912e] text-[#111] font-semibold px-4 py-2 rounded flex items-center gap-2 transition-colors shadow-sm"
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4" /> Print Invoice
    </button>
  );
}
