import React from "react";

export function WholesalerCard({ title, value, balance }: { title: string; value: string; balance?: number }) {
  // Green = positive (extra metal left with wholesaler / good)
  // Red = negative (wholesaler has due / owes us)
  const colorClass = balance !== undefined
    ? balance > 0 ? "text-green-400" : balance < 0 ? "text-red-400" : "text-foreground/80"
    : "text-foreground";
    
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <p className="text-muted-foreground text-sm mb-2">{title}</p>
      <h2 className={`text-xl font-semibold ${colorClass}`}>{value}</h2>
    </div>
  );
}
