"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Printer, Calendar, Play } from "lucide-react";
import { formatINR, formatWeight } from "@/lib/sales-formatters";
import { toast } from "sonner";
import { useBranchStore } from "@/lib/store/useBranchStore";

export default function RoznamaSection() {
  const { selectedBranch } = useBranchStore();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedBranch) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch.id.toString(),
        date: new Date(date).toISOString(),
      });
      const res = await fetch(`/api/billing/roznama?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate Roznama");
      setData(json);
      toast.success("Roznama generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to calculate daily report");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    
    // Simple printable window
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Closing Report - Roznama</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #000; background: #fff; line-height: 1.5; }
            .container { max-width: 600px; margin: 0 auto; border: 1px double #000; padding: 20px; }
            h2 { text-align: center; margin-bottom: 5px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .bold { font-weight: bold; }
            .total { font-size: 16px; margin-top: 20px; }
            @media print {
              body { padding: 0; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>DAILY CLOSING REPORT (ROZNAMA)</h2>
            <div class="header-info">
              <span>Branch: ${data.branch}</span>
              <span>Date: ${new Date(data.date).toLocaleDateString("en-IN")}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="row">
              <span>Opening Stock Value</span>
              <span class="bold">${formatINR(data.openingStockValue)}</span>
            </div>
            <div class="row">
              <span>Opening Stock Weight (Approx)</span>
              <span class="bold">${formatWeight(data.openingGrossWeight || 0)} (Fine: ${formatWeight(data.openingFineWeight || 0)})</span>
            </div>
            <div class="row">
              <span>Closing Stock Value</span>
              <span class="bold">${formatINR(data.closingStockValue)}</span>
            </div>
            <div class="row">
              <span>Closing Stock Weight</span>
              <span class="bold">${formatWeight(data.closingGrossWeight || 0)} (Fine: ${formatWeight(data.closingFineWeight || 0)})</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="row">
              <span>Invoices Raised: ${data.invoicesRaised}</span>
              <span>Items Sold: ${data.itemsSold} pcs</span>
            </div>
            <div class="row">
              <span>Total Weight Sold: ${formatWeight(data.totalWeightSold)}</span>
              <span>Fine Metal Weight: ${formatWeight(data.fineWeightSold)}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="row">
              <span>Cash Collection</span>
              <span>${formatINR(data.cashCollected)}</span>
            </div>
            <div class="row">
              <span>UPI / QR Scan</span>
              <span>${formatINR(data.upiCollected)}</span>
            </div>
            <div class="row">
              <span>Card Collection</span>
              <span>${formatINR(data.cardCollected)}</span>
            </div>
            <div class="row">
              <span>Credit Sales (Dues)</span>
              <span>${formatINR(data.creditCollected)}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="row total bold">
              <span>TOTAL CASH / BANK RECEIPTS</span>
              <span>${formatINR(data.totalCollected)}</span>
            </div>
            
            ${data.topProduct ? `
              <div class="divider"></div>
              <div class="row">
                <span class="bold">Top Product Today</span>
                <span>${data.topProduct.name} (${data.topProduct.qty} pcs - ${formatINR(data.topProduct.revenue)})</span>
              </div>
            ` : ""}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="rounded-xl border border-[#1F1F24] bg-[#111113] overflow-hidden">
      {/* Header collapsible bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-[#0A0A0B] text-left cursor-pointer hover:bg-[#1A1A1E] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="text-base font-bold text-[#F0EBE0] font-serif">Daily Closing Report — Roznama</h3>
            <p className="text-xs text-[#6B6560]">Calculate weights, stock valuations, and collections</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-[#6B6560]" /> : <ChevronDown className="w-5 h-5 text-[#6B6560]" />}
      </button>

      {isOpen && (
        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-[#1A1A1E] p-4 rounded-xl border border-[#1F1F24]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9943A]" />
              <span className="text-xs font-semibold text-[#6B6560] uppercase">Select Date:</span>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#111113] border border-[#1F1F24] text-xs text-[#F0EBE0] focus:outline-none focus:border-[#C9943A]/50 [color-scheme:dark]"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#C9943A] hover:bg-[#E8B84B] text-foreground text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-t-black border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Generate Report
            </button>
            {data && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#3A2E18] hover:border-[#C9943A] text-[#C9943A] text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Card
              </button>
            )}
          </div>

          {/* Report Card result */}
          {data ? (
            <div className="max-w-[600px] mx-auto border border-[#3A2E18] bg-[#0A0A0B] rounded-xl p-6 shadow-xl relative overflow-hidden font-mono text-[#F0EBE0]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9943A]/5 rounded-bl-full flex items-center justify-center pointer-events-none">
                <span className="text-2xl text-[#C9943A] opacity-20">₹</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-[#3A2E18] border-dashed">
                <div>
                  <h4 className="text-xs text-[#6B6560] font-semibold uppercase">Daily Closing (Roznama)</h4>
                  <p className="text-sm font-bold text-[#C9943A]">{data.branch}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B6560]">Date Statement</p>
                  <p className="text-sm font-bold text-[#F0EBE0]">{new Date(data.date).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              <div className="py-4 space-y-3">
                {/* Stock valuation & Weights */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#111113] p-3 rounded-lg border border-[#1F1F24]">
                  <div>
                    <span className="text-[#6B6560]">Opening Stock Value</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatINR(data.openingStockValue)}</p>
                    <span className="text-[10px] text-[#8E8A85]">
                      Gross: {formatWeight(data.openingGrossWeight || 0)} | Fine: {formatWeight(data.openingFineWeight || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6560]">Closing Stock Value</span>
                    <p className="font-semibold text-[#C9943A] mt-0.5">{formatINR(data.closingStockValue)}</p>
                    <span className="text-[10px] text-[#8E8A85]">
                      Gross: {formatWeight(data.closingGrossWeight || 0)} | Fine: {formatWeight(data.closingFineWeight || 0)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#1F1F24] border-dashed my-2" />

                {/* Valuations / volumes */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#6B6560]">Invoices Raised</span>
                    <p className="text-base font-bold text-foreground mt-1">{data.invoicesRaised}</p>
                  </div>
                  <div>
                    <span className="text-[#6B6560]">Items Sold</span>
                    <p className="text-base font-bold text-foreground mt-1">{data.itemsSold} pcs</p>
                  </div>
                  <div>
                    <span className="text-[#6B6560]">Total Weight Sold</span>
                    <p className="text-base font-bold text-[#C9943A] mt-1">{formatWeight(data.totalWeightSold)}</p>
                  </div>
                  <div>
                    <span className="text-[#6B6560]">Fine Metal Weight</span>
                    <p className="text-base font-bold text-[#C9943A] mt-1">{formatWeight(data.fineWeightSold)}</p>
                  </div>
                </div>

                <div className="border-t border-[#1F1F24] border-dashed my-2" />

                {/* Collections Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Cash Collected</span>
                    <span>{formatINR(data.cashCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">UPI / QR scan</span>
                    <span>{formatINR(data.upiCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Card Collected</span>
                    <span>{formatINR(data.cardCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Credit Booked (Outstanding)</span>
                    <span>{formatINR(data.creditCollected)}</span>
                  </div>
                </div>
              </div>

              {/* TotalCollected footer row */}
              <div className="pt-4 border-t border-[#3A2E18] flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6560] uppercase">Total Cash/Bank Collected</span>
                <span className="text-lg font-bold text-[#C9943A]">{formatINR(data.totalCollected)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-[#1F1F24] rounded-xl bg-[#1A1A1E]">
              <span className="text-3xl">📄</span>
              <p className="text-sm font-semibold text-[#6B6560] mt-2">No closing statement calculated yet.</p>
              <p className="text-xs text-[#555] mt-1">Select a date and click Generate Report above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
