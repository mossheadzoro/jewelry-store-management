"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const TXN_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PURCHASE_IN: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Purchase In" },
  SALE_OUT: { bg: "bg-red-500/10", text: "text-red-400", label: "Sale Out" },
  TRANSFER_OUT: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Transfer Out" },
  TRANSFER_IN: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Transfer In" },
  KARIGAR_ISSUE_OUT: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Karigar Issue" },
  KARIGAR_RECEIVE_IN: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Karigar Receive" },
  ADJUSTMENT_IN: { bg: "bg-lime-500/10", text: "text-lime-400", label: "Adjust In" },
  ADJUSTMENT_OUT: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Adjust Out" },
  OPENING: { bg: "bg-white/10", text: "text-white", label: "Opening" },
  MANUFACTURE_IN: { bg: "bg-teal-500/10", text: "text-teal-400", label: "Manufacture" },
  DAMAGE_OUT: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Damage" },
  RESERVE_OUT: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Reserved" },
  UNRESERVE_IN: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Unreserved" },
};

const TXN_TYPES = ["ALL", "PURCHASE_IN", "SALE_OUT", "TRANSFER_OUT", "TRANSFER_IN", "KARIGAR_ISSUE_OUT", "KARIGAR_RECEIVE_IN", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"];

export default function InventoryLedgerClient() {
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [txnFilter, setTxnFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLedger = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "30" });
      if (txnFilter !== "ALL") params.set("txnType", txnFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/inventory/ledger?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [txnFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLedger(1); }, [fetchLedger]);

  const filtered = search
    ? entries.filter((e) => e.product?.name?.toLowerCase().includes(search.toLowerCase()) || e.product?.productCode?.toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <main className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-white tracking-tight">Inventory Ledger</h1>
            <p className="text-[14px] text-[#777] mt-1">Complete audit trail of every stock movement.</p>
          </div>
          <button onClick={() => fetchLedger(pagination.page)} className="h-10 px-5 rounded-full border border-[#333] text-[#ccc] text-[13px] font-medium flex items-center gap-2 hover:bg-[#1a1a1a] hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Stock In (Qty)", value: summary.totalQtyIn, icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />, color: "text-emerald-400" },
              { label: "Stock Out (Qty)", value: summary.totalQtyOut, icon: <ArrowUpRight className="w-5 h-5 text-red-400" />, color: "text-red-400" },
              { label: "Net Weight In (g)", value: (summary.totalNetWtIn || 0).toFixed(2), icon: <ArrowDownLeft className="w-5 h-5 text-[#D4A843]" />, color: "text-[#D4A843]" },
              { label: "Net Weight Out (g)", value: (summary.totalNetWtOut || 0).toFixed(2), icon: <ArrowUpRight className="w-5 h-5 text-orange-400" />, color: "text-orange-400" },
            ].map((card, i) => (
              <div key={i} className="bg-[#141414] border border-[#222] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">{card.icon}<p className="text-[10px] font-bold text-[#777] uppercase tracking-widest">{card.label}</p></div>
                <p className={`text-[24px] font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product..." className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#252525] text-white text-[13px] placeholder:text-[#555] outline-none focus:border-[#D4A843]/50 transition-colors" />
          </div>
          <select value={txnFilter} onChange={(e) => setTxnFilter(e.target.value)} className="h-10 px-4 rounded-xl bg-[#141414] border border-[#252525] text-[#ccc] text-[13px] outline-none cursor-pointer">
            {TXN_TYPES.map((t) => <option key={t} value={t}>{t === "ALL" ? "All Types" : (TXN_COLORS[t]?.label || t)}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 px-3 rounded-xl bg-[#141414] border border-[#252525] text-[#ccc] text-[13px] outline-none" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 px-3 rounded-xl bg-[#141414] border border-[#252525] text-[#ccc] text-[13px] outline-none" />
        </div>

        {/* Table */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_120px_80px_80px_100px_100px_80px_140px] gap-4 px-6 py-3 border-b border-[#1f1f1f] text-[10px] font-bold text-[#555] uppercase tracking-widest">
            <span>Product</span><span>Type</span><span>Qty In</span><span>Qty Out</span><span>Wt In (g)</span><span>Wt Out (g)</span><span>Balance</span><span>Date</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20"><p className="text-[#666] text-[14px]">No ledger entries found.</p></div>
          ) : (
            filtered.map((entry: any) => {
              const style = TXN_COLORS[entry.txnType] || { bg: "bg-white/5", text: "text-[#999]", label: entry.txnType };
              return (
                <div key={entry.id} className="grid grid-cols-[1fr_120px_80px_80px_100px_100px_80px_140px] gap-4 px-6 py-3.5 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors text-[13px]">
                  <div>
                    <p className="text-white font-medium truncate">{entry.product?.name || "—"}</p>
                    <p className="text-[11px] text-[#666] mt-0.5">{entry.product?.productCode || ""}</p>
                  </div>
                  <div><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${style.bg} ${style.text}`}>{style.label}</span></div>
                  <p className={entry.qtyIn > 0 ? "text-emerald-400 font-semibold" : "text-[#444]"}>{entry.qtyIn > 0 ? `+${entry.qtyIn}` : "—"}</p>
                  <p className={entry.qtyOut > 0 ? "text-red-400 font-semibold" : "text-[#444]"}>{entry.qtyOut > 0 ? `-${entry.qtyOut}` : "—"}</p>
                  <p className="text-[#ccc]">{entry.netWeightIn > 0 ? `+${entry.netWeightIn.toFixed(2)}` : "—"}</p>
                  <p className="text-[#ccc]">{entry.netWeightOut > 0 ? `-${entry.netWeightOut.toFixed(2)}` : "—"}</p>
                  <p className="text-white font-bold">{entry.balanceQty}</p>
                  <p className="text-[#888] text-[12px]">{new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-[12px] text-[#666]">Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)</p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchLedger(pagination.page - 1)} className="h-9 w-9 rounded-lg border border-[#333] flex items-center justify-center text-[#ccc] hover:bg-[#1a1a1a] disabled:opacity-30 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLedger(pagination.page + 1)} className="h-9 w-9 rounded-lg border border-[#333] flex items-center justify-center text-[#ccc] hover:bg-[#1a1a1a] disabled:opacity-30 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
