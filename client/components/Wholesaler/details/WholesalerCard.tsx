import React from "react";

export function WholesalerCard({ title, value, balance }: { title: string; value: string; balance?: number }) {
  // Green = positive (extra metal left with wholesaler / good)
  // Red = negative (wholesaler has due / owes us)
  const colorClass = balance !== undefined
    ? balance > 0 ? "text-green-400" : balance < 0 ? "text-red-400" : "text-gray-300"
    : "text-white";
    
  return (
    <div className="bg-[#111827] rounded-2xl p-6 border border-[#1F2937]">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <h2 className={`text-xl font-semibold ${colorClass}`}>{value}</h2>
    </div>
  );
}
