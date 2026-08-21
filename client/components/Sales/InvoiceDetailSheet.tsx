"use client";

import React, { useEffect, useState } from "react";
import { X, Printer, Download, User, Smartphone, Building, ShieldAlert, BadgeCheck } from "lucide-react";
import { formatINR, formatWeight, formatInvoiceDate } from "@/lib/sales-formatters";
import { toast } from "sonner";
import { downloadFile } from "@/lib/invoice-export";

interface InvoiceDetailSheetProps {
  invoiceId: string | number | null;
  onClose: () => void;
}

export default function InvoiceDetailSheet({
  invoiceId,
  onClose,
}: InvoiceDetailSheetProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;

    setIsLoading(true);
    fetch(`/api/billing/${invoiceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load invoice details");
        return res.json();
      })
      .then((d) => {
        setData(d);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load invoice detail");
        onClose();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [invoiceId, onClose]);

  if (!invoiceId) return null;

  const handlePrint = () => {
    if (!data) return;
    window.open(`/billing/invoice/${data.invoiceId}`, "_blank");
  };

  const handleDownload = async () => {
    if (!data) return;
    await downloadFile(`/api/billing/export?branchId=${data.branchId}&search=${data.invoiceNumber}&format=pdf`, `Invoice_${data.invoiceNumber}.pdf`);
  };

  const getKaratageLabel = (purity: number) => {
    if (!purity) return "22K";
    const val = purity > 1 ? purity / 100 : purity;
    if (Math.abs(val - 0.916) < 0.01) return "22K";
    if (Math.abs(val - 0.75) < 0.01) return "18K";
    if (Math.abs(val - 0.585) < 0.01) return "14K";
    return `${Math.round(val * 24)}K`;
  };

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex justify-end">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-out Drawer */}
      <div className="w-full max-w-[550px] bg-[#111113] border-l border-[#1F1F24] h-full flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-300">
        
        {/* Loader Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="w-10 h-10 border-2 border-t-[#C9943A] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-[#1F1F24] bg-[#0A0A0B]">
            <div>
              <span className="text-[10px] text-[#6B6560] font-semibold uppercase tracking-widest font-mono">Invoice Receipt</span>
              <h2 className="text-xl font-bold font-mono text-[#C9943A] mt-0.5">{data?.invoiceNumber || "INV-..."}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 bg-[#1A1A1E] text-[#F0EBE0] hover:text-[#C9943A] hover:bg-[#222228] border border-[#1F1F24] rounded-lg transition-colors cursor-pointer"
                title="Print Invoice"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-[#1A1A1E] text-[#F0EBE0] hover:text-[#C9943A] hover:bg-[#222228] border border-[#1F1F24] rounded-lg transition-colors cursor-pointer"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-[#1A1A1E] text-[#6B6560] hover:text-[#F0EBE0] border border-[#1F1F24] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details */}
          {data && (() => {
            const metalAmount = data.totalMetalAmount || data.products.reduce((s: number, p: any) => s + (p.metalValue || (p.metalRate * p.ntWeight)), 0);
            const makingAmount = data.totalMakingAmount || data.products.reduce((s: number, p: any) => s + (p.makingAmount || 0), 0);
            const stoneAmount = data.totalStoneAmount || data.products.reduce((s: number, p: any) => s + (p.stoneCharge || 0), 0);
            const hallmarkingAmount = data.hallmarkingCharge || 0;
            const subtotal = metalAmount + makingAmount + stoneAmount + hallmarkingAmount;

            const cgstAmount = data.cgst ?? data.products.reduce((s: number, p: any) => s + (p.cgst || 0), 0);
            const sgstAmount = data.sgst ?? data.products.reduce((s: number, p: any) => s + (p.sgst || 0), 0);
            const grandTotal = data.grandTotal || data.totalAmount || (subtotal + cgstAmount + sgstAmount);
            
            const totalPaid = data.payments ? data.payments.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0) : (data.paidAmount || 0);
            const balance = data.balanceAmount ?? Math.max(0, grandTotal - totalPaid);

            return (
              <div className="p-6 space-y-6">
                {/* Customer details */}
                <div className="rounded-xl border border-[#1F1F24] bg-[#1A1A1E] p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Customer Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-[#C9943A] shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B6560] leading-none">Name</p>
                        <p className="text-sm font-semibold text-[#F0EBE0] mt-0.5">{data.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-[#C9943A] shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#6B6560] leading-none">Mobile</p>
                        <p className="text-sm font-semibold text-[#F0EBE0] mt-0.5">{data.customer.mobile || "—"}</p>
                      </div>
                    </div>
                  </div>
                  {data.customer.gstin && (
                    <div className="pt-2 border-t border-[#1F1F24] flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[#C9943A]" />
                      <span className="text-xs text-[#6B6560]">GSTIN:</span>
                      <span className="text-xs font-mono text-[#F0EBE0] font-semibold">{data.customer.gstin}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider">Items summary</h4>
                  <div className="overflow-hidden rounded-xl border border-[#1F1F24] bg-[#1A1A1E]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#111113] border-b border-[#1F1F24] text-[#6B6560]">
                          <th className="px-4 py-2.5">Item</th>
                          <th className="px-3 py-2.5 text-center">Qty</th>
                          <th className="px-3 py-2.5 text-right">Net Wt</th>
                          <th className="px-3 py-2.5 text-center">Compliance</th>
                          <th className="px-4 py-2.5 text-right font-mono">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1F24] text-[#F0EBE0]">
                        {data.products.map((item: any, idx: number) => {
                          const karatage = getKaratageLabel(item.purity);
                          const itemAmount = item.totalAfterTax || item.totalBeforeTax || (item.metalValue ? item.metalValue + (item.makingAmount || 0) + (item.additionalCharge || 0) : (item.metalRate * item.ntWeight + (item.additionalCharge || 0)));
                          return (
                            <tr key={idx} className="hover:bg-[#222228] transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-semibold">{item.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[#6B6560] font-mono mt-0.5">
                                  <span>{item.productCode}</span>
                                  <span>•</span>
                                  <span>{karatage}</span>
                                  {item.makingAmount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[#9E988F]">Mk: {formatINR(item.makingAmount)}</span>
                                    </>
                                  )}
                                  {item.stoneCharge > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[#9E988F]">Stone: {formatINR(item.stoneCharge)}</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-semibold">{item.quantity || 1}</td>
                              <td className="px-3 py-3 text-right font-mono font-semibold text-[#C9943A]">{formatWeight(item.ntWeight)}</td>
                              <td className="px-3 py-3 text-center">
                                {item.barcode ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                                    <BadgeCheck className="w-3 h-3" /> Compliant
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                    <ShieldAlert className="w-3 h-3" /> No HUID
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold">{formatINR(itemAmount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Old Gold exchange / Excess Old Gold */}
                {data.exchangeGoldWeight > 0 && (
                  <div className="rounded-xl border border-[#3A2E18]/50 bg-[#1A1A1E] p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-[#C9943A] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9943A]" /> Excess Old Gold Exchange
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[#6B6560]">Exchange Weight</p>
                        <p className="font-bold text-[#F0EBE0] font-mono mt-0.5">{formatWeight(data.exchangeGoldWeight)}</p>
                      </div>
                      <div>
                        <p className="text-[#6B6560]">Settlement Mode</p>
                        <p className="font-bold text-[#F0EBE0] mt-0.5">{data.excessGoldMode || "DIRECT EXCHANGE"}</p>
                      </div>
                      {data.oldGoldCashedOut > 0 && (
                        <div>
                          <p className="text-[#6B6560]">Old Gold Cashed Out</p>
                          <p className="font-bold text-amber-400 font-mono mt-0.5">{formatINR(data.oldGoldCashedOut)}</p>
                        </div>
                      )}
                      {data.cashToCustomer > 0 && (
                        <div>
                          <p className="text-[#6B6560]">Cash Given to Customer</p>
                          <p className="font-bold text-green-400 font-mono mt-0.5">{formatINR(data.cashToCustomer)}</p>
                        </div>
                      )}
                      {data.excessGoldReturned > 0 && (
                        <div>
                          <p className="text-[#6B6560]">Gold Returned</p>
                          <p className="font-bold text-blue-400 font-mono mt-0.5">{formatWeight(data.excessGoldReturned)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Applied Schemes or Advances */}
                {((data.appliedSchemes && data.appliedSchemes.length > 0) || data.appliedAdvance) && (
                  <div className="rounded-xl border border-[#1F1F24] bg-[#1A1A1E] p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-[#C9943A] uppercase tracking-wider">Applied Savings & Advances</h4>
                    {data.appliedAdvance && (
                      <div className="flex justify-between text-xs py-1 border-b border-[#1F1F24] border-dashed">
                        <span className="text-[#6B6560]">Advance Receipt Applied</span>
                        <span className="font-mono font-semibold text-[#F0EBE0]">{formatINR(data.appliedAdvance.amount || 0)}</span>
                      </div>
                    )}
                    {data.appliedSchemes?.map((sch: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs py-1">
                        <span className="text-[#6B6560]">Scheme #{sch.schemeNumber || sch.id}</span>
                        <span className="font-mono font-semibold text-[#F0EBE0]">{formatINR(sch.amountUsed || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Calculation Summary / Detailed Charges Breakdown */}
                <div className="rounded-xl border border-[#1F1F24] bg-[#1A1A1E] p-4 space-y-2 text-xs">
                  <h4 className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider pb-1 border-b border-[#1F1F24]">Price Breakdown</h4>
                  
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Metal Rate (Standard / 24K)</span>
                    <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(data.metalRate)}/g</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Total Metal Amount</span>
                    <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(metalAmount)}</span>
                  </div>

                  {makingAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6B6560]">Making Charges</span>
                      <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(makingAmount)}</span>
                    </div>
                  )}

                  {stoneAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6B6560]">Stone Charges</span>
                      <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(stoneAmount)}</span>
                    </div>
                  )}

                  {hallmarkingAmount > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-[#6B6560]">BIS Hallmarking Charges</span>
                      <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(hallmarkingAmount)}</span>
                    </div>
                  ) : data.hallmarkCharge ? (
                    <div className="flex justify-between">
                      <span className="text-[#6B6560]">BIS Hallmarking Charges</span>
                      <span className="font-semibold font-mono text-green-400">Included</span>
                    </div>
                  ) : null}

                  {/* Taxable Subtotal */}
                  <div className="flex justify-between pt-2 border-t border-[#1F1F24] font-medium">
                    <span className="text-[#F0EBE0]">Subtotal (Taxable Value)</span>
                    <span className="font-mono text-[#F0EBE0]">{formatINR(subtotal)}</span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between pt-2 border-t border-[#1F1F24] border-dashed">
                    <span className="text-[#6B6560]">CGST (1.5%)</span>
                    <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">SGST (1.5%)</span>
                    <span className="font-semibold font-mono text-[#F0EBE0]">{formatINR(sgstAmount)}</span>
                  </div>
                </div>

                {/* Payments Breakdown */}
                {data.payments && data.payments.length > 0 && (
                  <div className="rounded-xl border border-[#1F1F24] bg-[#1A1A1E] p-4 space-y-2 text-xs">
                    <h4 className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider pb-1 border-b border-[#1F1F24]">Payment Mode Breakdown</h4>
                    {data.payments.map((p: any, idx: number) => {
                      if (!p.amount || parseFloat(p.amount) === 0) return null;
                      return (
                        <div key={idx} className="flex justify-between items-center py-1">
                          <span className="text-[#F0EBE0] font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9943A]" />
                            {p.method}
                            {p.narration && <span className="text-[10px] text-[#6B6560] font-mono">({p.narration})</span>}
                          </span>
                          <span className="font-mono font-semibold text-[#F0EBE0]">{formatINR(parseFloat(p.amount) || 0)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer Billing Total Section */}
        <div className="p-6 border-t border-[#1F1F24] bg-[#0A0A0B] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B6560] uppercase">Total Invoice Value</span>
            <span className="text-2xl font-bold font-mono text-[#C9943A]">
              {data ? formatINR(data.grandTotal || data.totalAmount || 0) : "₹0"}
            </span>
          </div>
          {data && (() => {
            const totalPaid = data.payments ? data.payments.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0) : (data.paidAmount || 0);
            const grandTotal = data.grandTotal || data.totalAmount || 0;
            const balance = data.balanceAmount ?? Math.max(0, grandTotal - totalPaid);

            return (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1F1F24] border-dashed text-xs">
                <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-2 flex justify-between items-center">
                  <span className="text-green-500 font-medium">Paid</span>
                  <span className="font-bold font-mono text-green-400">{formatINR(totalPaid)}</span>
                </div>
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2 flex justify-between items-center">
                  <span className="text-amber-500 font-medium">Balance</span>
                  <span className="font-bold font-mono text-amber-400">{formatINR(balance)}</span>
                </div>
              </div>
            );
          })()}
          <div className="flex justify-between items-center text-[10px] text-[#6B6560] mt-1 font-mono">
            <span>Operator: {data?.appliedAdvance ? "Vault Admin" : "Sales Terminal"}</span>
            <span>Date: {data ? formatInvoiceDate(data.createdAt || new Date()) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
