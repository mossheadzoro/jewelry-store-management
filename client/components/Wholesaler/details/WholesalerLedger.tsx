import React from "react";

export interface LedgerEntry {
  id: string;
  entryType: string;
  metalAmount: number;
  cashAmount: number;
  description: string;
  createdAt: string;
}

interface LedgerProps {
  entries?: LedgerEntry[];
}

export function WholesalerLedger({ entries = [] }: LedgerProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-semibold mb-4 text-foreground/90">Recent Activity Ledger</h2>
      {entries && entries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-foreground/80">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Metal Amt</th>
                <th className="px-4 py-3 rounded-tr-lg">Cash Amt</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isCredit = entry.entryType.includes("_CREDIT");
                const isDebit = entry.entryType.includes("_DEBIT");
                return (
                  <tr key={entry.id} className="border-b border-border hover:bg-[#1a2333] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className={`px-4 py-3 font-medium ${entry.metalAmount > 0 ? (isDebit ? "text-red-400" : "text-green-400") : ""}`}>
                      {entry.metalAmount > 0 ? `${isDebit ? "-" : "+"}${entry.metalAmount.toFixed(3)} gm` : "-"}
                    </td>
                    <td className={`px-4 py-3 font-medium ${entry.cashAmount > 0 ? (isDebit ? "text-red-400" : "text-green-400") : ""}`}>
                      {entry.cashAmount > 0 ? `${isDebit ? "-" : "+"}₹${entry.cashAmount.toLocaleString("en-IN")}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground">No transactions recorded yet.</p>
      )}
    </div>
  );
}
