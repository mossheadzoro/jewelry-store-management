import React, { useEffect, useState } from "react";
import { BaseModal } from "../../ui/BaseModal";

interface Props {
  wholesalerId: string;
  onClose: () => void;
}

export function StatsModal({ wholesalerId, onClose }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/wholesalers/${wholesalerId}/stats`);
        if (res.ok) {
          const json = await res.json();
          setStats(json);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [wholesalerId]);

  return (
    <BaseModal title="Production Stats" onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] pr-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading stats...</div>
        ) : stats ? (
          <>
            {/* Today's Snapshot */}
            <div className="bg-gradient-to-r from-secondary to-background border border-emerald-800/40 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold text-sm mb-3 uppercase tracking-wider">Today&apos;s Output</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.todayPieces}</p>
                  <p className="text-xs text-muted-foreground">Pieces</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.todayGoldWeight.toFixed(2)}g</p>
                  <p className="text-xs text-muted-foreground">Gold Wt</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground/80">{stats.todaySilverWeight.toFixed(2)}g</p>
                  <p className="text-xs text-muted-foreground">Silver Wt</p>
                </div>
              </div>
            </div>

            {/* Gold by Purity */}
            <div>
              <h3 className="text-yellow-400 font-semibold text-sm mb-2 uppercase tracking-wider">Gold Jewellery by Purity</h3>
              {Object.keys(stats.goldByPurity).length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-xs uppercase bg-secondary">
                        <th className="px-3 py-2 text-left">Purity</th>
                        <th className="px-3 py-2 text-right">Pcs</th>
                        <th className="px-3 py-2 text-right">Wt</th>
                        <th className="px-3 py-2 text-right">Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.goldByPurity).map(([purity, data]: [string, any]) => (
                        <tr key={purity} className="border-b border-border/50 hover:bg-secondary/20">
                          <td className="px-3 py-2 font-medium text-yellow-300">{purity}</td>
                          <td className="px-3 py-2 text-right text-foreground/80">{data.count}</td>
                          <td className="px-3 py-2 text-right text-foreground/80">{data.totalWeight.toFixed(3)}g</td>
                          <td className="px-3 py-2 text-right text-yellow-400 font-medium">{data.totalFine.toFixed(3)}g</td>
                        </tr>
                      ))}
                      <tr className="bg-secondary/50 border-t border-border">
                        <td className="px-3 py-2 font-semibold text-foreground">Total</td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">{stats.totalGoldPieces}</td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">{stats.totalGoldJewelleryWeight.toFixed(3)}g</td>
                        <td className="px-3 py-2 text-right font-semibold text-yellow-400">{stats.totalGoldFine.toFixed(3)}g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">No gold jewellery data.</p>
              )}
            </div>

            {/* Silver & Diamond Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">Silver Received</p>
                <p className="text-lg font-bold text-foreground/90">{stats.totalSilverPieces} pcs</p>
                <p className="text-xs text-muted-foreground">{stats.totalSilverJewelleryWeight.toFixed(3)}g gross</p>
                <p className="text-sm text-foreground/80 font-medium">{stats.totalSilverFine.toFixed(3)}g fine</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">Diamond Received</p>
                <p className="text-lg font-bold text-foreground/90">{stats.totalDiamondPieces} pcs</p>
                <p className="text-sm text-green-400 font-medium mt-1">₹{stats.totalDiamondCashAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Metal Issued */}
            <div className="bg-[#1a1410] border border-yellow-900/30 rounded-xl p-4">
              <h3 className="text-yellow-600 font-semibold text-sm mb-2 uppercase tracking-wider">Metal Issued Summary</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.issueCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Issues</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-yellow-500">{stats.totalGoldIssued.toFixed(3)}g</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Gold Issued</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground/80">{stats.totalSilverIssued.toFixed(3)}g</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Silver Issued</p>
                </div>
              </div>
            </div>

            {/* Cash Total */}
            {stats.totalCashAmount > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-900/10 border border-green-900/30 rounded-xl">
                <span className="text-muted-foreground text-sm">Total Cash Amount</span>
                <span className="font-bold text-green-400 text-lg">₹{stats.totalCashAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-6">Could not load stats data.</p>
        )}
      </div>
    </BaseModal>
  );
}
