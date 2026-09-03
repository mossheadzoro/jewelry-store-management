// client/src/app/(main)/purchase/components/TransfersPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconTruckDelivery,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconHammer,
  IconGridGoldenratio,
  IconBuildingStore,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

interface TransfersPanelProps {
  onRefreshOverview: () => void;
}

export default function TransfersPanel({ onRefreshOverview }: TransfersPanelProps) {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [karigars, setKarigars] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [destTypeFilter, setDestTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [settleTransferData, setSettleTransferData] = useState<any | null>(null);

  // Issue Transfer State
  const [formData, setFormData] = useState({
    destinationType: "KARIGAR",
    karigarId: "",
    wholesalerId: "",
    destinationName: "",
    metalCategory: "GOLD_24K",
    purityPercent: 99.50,
    grossWeight: 50.0,
    purpose: "Jewellery Manufacturing Order",
    wastageAllowedPercent: 0.5,
    notes: "",
  });

  // Settle Transfer State
  const [settleForm, setSettleForm] = useState({
    metalReceivedBack: 0,
    metalConsumed: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (destTypeFilter !== "ALL") params.set("destinationType", destTypeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [resTransfers, resKarigars, resWholesalers] = await Promise.all([
        fetch(`/api/purchase/transfers?${params.toString()}`),
        fetch(`/api/karigars`),
        fetch(`/api/wholesalers`),
      ]);

      if (resTransfers.ok) {
        const json = await resTransfers.json();
        if (json.success) setTransfers(json.transfers || []);
      }
      if (resKarigars.ok) {
        const json = await resKarigars.json();
        setKarigars(json.karigars || json || []);
      }
      if (resWholesalers.ok) {
        const json = await resWholesalers.json();
        setWholesalers(json.wholesalers || json || []);
      }
    } catch (err) {
      console.error("Fetch transfers error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [destTypeFilter, statusFilter]);

  const handleIssueTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      let destName = formData.destinationName;
      if (formData.destinationType === "KARIGAR" && formData.karigarId) {
        const k = karigars.find((item) => item.id === formData.karigarId);
        if (k) destName = k.name;
      } else if (formData.destinationType === "WHOLESALER" && formData.wholesalerId) {
        const w = wholesalers.find((item) => item.id === formData.wholesalerId);
        if (w) destName = w.name;
      }

      const res = await fetch("/api/purchase/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, destinationName: destName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to issue metal transfer");
      }

      setIsIssueModalOpen(false);
      await fetchTransfers();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTransferData) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/transfers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferId: settleTransferData.id,
          metalReceivedBack: Number(settleForm.metalReceivedBack),
          metalConsumed: Number(settleForm.metalConsumed),
          notes: settleForm.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to settle metal transfer");
      }

      setSettleTransferData(null);
      await fetchTransfers();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transfer number, recipient, purpose..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum placeholder:text-platinum-muted/60 outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={fetchTransfers}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:text-gold hover:border-gold transition-colors"
          >
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={destTypeFilter}
            onChange={(e) => setDestTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Destination Types</option>
            <option value="KARIGAR">Karigar / Goldsmith</option>
            <option value="WHOLESALER">Wholesaler Partner</option>
            <option value="BRANCH">Inter-Branch Movement</option>
          </select>

          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
          >
            <IconPlus className="w-4 h-4" />
            <span>Issue Metal Transfer</span>
          </button>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx-elevated border-b border-onyx-border text-platinum-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Transfer No / Date</th>
                <th className="py-3.5 px-4">Recipient Type & Name</th>
                <th className="py-3.5 px-4">Metal & Purity</th>
                <th className="py-3.5 px-4">Gross Issued</th>
                <th className="py-3.5 px-4">Pure Fine Weight</th>
                <th className="py-3.5 px-4">Outstanding Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60 text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted">
                    Loading metal transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-platinum-muted space-y-1">
                    <IconTruckDelivery className="w-8 h-8 mx-auto text-platinum-muted/50" />
                    <p>No metal transfers recorded.</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-platinum font-mono">{t.transferNumber}</div>
                      <span className="text-[10px] text-platinum-muted">
                        {new Date(t.issueDate).toLocaleDateString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-platinum">{t.destinationName}</div>
                      <span className="text-[10px] text-gold font-mono uppercase">{t.destinationType}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-platinum font-semibold">{t.metalCategory.replace("_", " ")}</div>
                      <span className="text-[10px] text-platinum-muted">{t.purityPercent}%</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-platinum">
                      {t.grossWeight.toFixed(3)}g
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gold">
                      {t.fineWeight.toFixed(3)}g
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {t.metalBalance.toFixed(3)}g
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.status === "SETTLED" ? "bg-emerald-500/15 text-emerald-300" :
                        t.status === "ISSUED" ? "bg-amber-500/15 text-amber-300" : "bg-blue-500/15 text-blue-300"
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {t.status !== "SETTLED" ? (
                        <button
                          onClick={() => {
                            setSettleTransferData(t);
                            setSettleForm({
                              metalReceivedBack: t.metalBalance,
                              metalConsumed: 0,
                              notes: "",
                            });
                          }}
                          className="px-2.5 py-1 rounded bg-onyx-elevated border border-onyx-border text-gold hover:border-gold font-semibold text-[10px] transition-colors"
                        >
                          Settle / Return
                        </button>
                      ) : (
                        <span className="text-[10px] text-platinum-muted font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Metal Transfer Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/15 text-gold">
                  <IconTruckDelivery className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-platinum">Issue Raw Metal to Karigar / Wholesaler</h2>
                  <p className="text-[11px] text-platinum-muted">Workshop Job Issuance & Inventory Outflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueTransfer} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Destination Recipient Type *
                  </label>
                  <select
                    value={formData.destinationType}
                    onChange={(e) => setFormData({ ...formData, destinationType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="KARIGAR">Karigar (Goldsmith)</option>
                    <option value="WHOLESALER">Wholesaler Partner</option>
                    <option value="BRANCH">Another Showroom Branch</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Select Recipient *
                  </label>
                  {formData.destinationType === "KARIGAR" ? (
                    <select
                      value={formData.karigarId}
                      onChange={(e) => setFormData({ ...formData, karigarId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    >
                      <option value="">-- Choose Karigar --</option>
                      {karigars.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.phoneNumber || "No phone"})
                        </option>
                      ))}
                    </select>
                  ) : formData.destinationType === "WHOLESALER" ? (
                    <select
                      value={formData.wholesalerId}
                      onChange={(e) => setFormData({ ...formData, wholesalerId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    >
                      <option value="">-- Choose Wholesaler --</option>
                      {wholesalers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.city || ""})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.destinationName}
                      onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                      placeholder="Branch or Recipient Name"
                      className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Metal Category *
                  </label>
                  <select
                    value={formData.metalCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let purity = 99.50;
                      if (cat === "GOLD_22K") purity = 91.60;
                      if (cat === "GOLD_18K") purity = 75.00;
                      if (cat === "SILVER_999") purity = 99.90;
                      setFormData({ ...formData, metalCategory: cat, purityPercent: purity });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  >
                    <option value="GOLD_24K">Gold 24K (99.50% Standard Bullion)</option>
                    <option value="GOLD_22K">Gold 22K (91.60% 916)</option>
                    <option value="GOLD_18K">Gold 18K (75.00%)</option>
                    <option value="SILVER_999">Silver 999 Fine</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Gross Weight to Issue (g) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.grossWeight}
                    onChange={(e) => setFormData({ ...formData, grossWeight: Number(e.target.value) })}
                    placeholder="50.000"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Manufacturing Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g. 22K Bridal Necklace & Bangles"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-platinum block mb-1">
                    Allowed Wastage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wastageAllowedPercent}
                    onChange={(e) => setFormData({ ...formData, wastageAllowedPercent: Number(e.target.value) })}
                    placeholder="0.5"
                    className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-onyx-border flex items-center justify-end gap-3 -mx-6 -mb-6 bg-onyx-elevated">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Issuing..." : "Issue Metal Outflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Metal Transfer Modal */}
      {settleTransferData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <div>
                <h2 className="text-sm font-bold text-platinum">Settle Metal Return & Consumption</h2>
                <p className="text-[11px] text-platinum-muted">
                  {settleTransferData.transferNumber} - {settleTransferData.destinationName}
                </p>
              </div>
              <button
                onClick={() => setSettleTransferData(null)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleTransfer} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border flex justify-between">
                <div>
                  <span className="text-[10px] text-platinum-muted block">Originally Issued:</span>
                  <span className="font-bold text-platinum">{settleTransferData.grossWeight}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-platinum-muted block">Current Outstanding:</span>
                  <span className="font-bold text-amber-400">{settleTransferData.metalBalance}g</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Metal Received Back into Inventory (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={settleForm.metalReceivedBack}
                  onChange={(e) => setSettleForm({ ...formData, ...settleForm, metalReceivedBack: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Metal Consumed in Finished Ornaments (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={settleForm.metalConsumed}
                  onChange={(e) => setSettleForm({ ...formData, ...settleForm, metalConsumed: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono font-bold outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Settlement Remarks / Scrap Notes
                </label>
                <input
                  type="text"
                  value={settleForm.notes}
                  onChange={(e) => setSettleForm({ ...formData, ...settleForm, notes: e.target.value })}
                  placeholder="e.g. Received 10 rings weighing 48.5g, 1.5g scrap recovered"
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                />
              </div>

              <div className="pt-3 border-t border-onyx-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSettleTransferData(null)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Settling..." : "Confirm Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
