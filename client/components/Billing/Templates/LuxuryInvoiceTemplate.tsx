'use client';

import React from "react";
import { formatCustomerName, normalizeInvoice } from "@/lib/utils";
import { Sparkles, HandCoins, Coins, Repeat, Wallet, MapPin, Phone, Mail, Globe, User, CheckCircle2 } from "lucide-react";

export default function LuxuryInvoiceTemplate({ invoice: rawInvoice, regularPayments, cashOutPayment, cashToCustomerPayment, returnGoldPayment }: any) {
  const invoice = normalizeInvoice(rawInvoice);
  const settings = invoice.branch.settings;
  const brandColor = settings?.invoiceColor === "brand" ? "#C9943A" : "#333333";
  
  let rawCustomizations = invoice.branch.settings?.invoiceCustomizations;
  if (typeof rawCustomizations === 'string') {
    try { rawCustomizations = JSON.parse(rawCustomizations); } catch(e) { rawCustomizations = {}; }
  }
  const customizations = rawCustomizations?.luxury || {};
  
  const logoUrl = rawCustomizations?.companyLogoUrl || invoice.branch.settings?.logoUrl;
  const companySealUrl = rawCustomizations?.companySealUrl;
  const digitalSignatureUrl = rawCustomizations?.digitalSignatureUrl;
  const labels = customizations.labels || {};

  let exchangeGoldValue = 0;
  let exchangeGoldWeight = 0;
  const oldGoldRecord = (invoice.payments || []).find((p: any) => p.paymentRef?.includes("Old Gold Exchange Weight:"));
  if (oldGoldRecord) {
    const valMatch = oldGoldRecord.paymentRef?.match(/Value:\s*₹([\d.]+)/);
    if (valMatch) exchangeGoldValue = parseFloat(valMatch[1]);
    
    const wtMatch = oldGoldRecord.paymentRef?.match(/Old Gold Exchange Weight:\s*([\d.]+)/);
    if (wtMatch) exchangeGoldWeight = parseFloat(wtMatch[1]);
  }

  const metalVal = invoice.totalMetalAmount || 0;
  const netMakingVal = invoice.totalNetMakingAmount ?? (invoice.totalMakingAmount - invoice.totalDiscountAmount);
  
  // Total = Metal Value + Discounted Making Charge (Other Charges)
  const totalBeforeAdditional = metalVal + netMakingVal;

  const additionalVal = invoice.totalAdditionalAmount || invoice.totalStoneAmount || 0;
  const additionalReason = invoice.additionalChargeReason || "";

  // Net Taxable Subtotal = Total + Additional Charge
  const netTaxableBase = invoice.netTaxable || (totalBeforeAdditional + additionalVal);

  const hasDiscount = invoice.totalDiscountAmount > 0 || invoice.items.some((it: any) => ((it.discountPercent || 0) > 0));

  const cgst3 = invoice.cgst || (netTaxableBase * 0.015);
  const sgst3 = invoice.sgst || (netTaxableBase * 0.015);
  const subtotalWith3PctGst = netTaxableBase + cgst3 + sgst3;

  const hallmarkCharge = invoice.hallmarkingCharge || 0;
  const hallmarkTotalTax = invoice.taxOnHallmarking || (hallmarkCharge > 0 ? hallmarkCharge * 0.18 : 0);
  const hallmarkCgst = hallmarkTotalTax / 2;
  const hallmarkSgst = hallmarkTotalTax / 2;

  const hasProductImages = invoice.items.some((it: any) => (it.product?.image || it.image));
  const totalItemMetalValue = invoice.items.reduce((sum: number, item: any) => sum + (item.ntWeight * item.metalRate), 0);
  const wasMetalValueReduced = totalItemMetalValue - metalVal > 1; // 1 rupee tolerance for rounding

  const showExchangeInTaxation = exchangeGoldValue > 0 && wasMetalValueReduced;
  const showExchangeInPayments = exchangeGoldValue > 0 && !wasMetalValueReduced;

  return (
    <div className="relative max-w-[1000px] mx-auto bg-white my-8 shadow-2xl printable-page-container font-sans text-gray-800" style={{ border: `1px solid ${brandColor}` }}>
      {companySealUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img src={companySealUrl} alt="Company Seal" className="w-[60%] object-contain opacity-[0.08]" />
        </div>
      )}
      
      {/* Decorative Top Border */}
      <div className="h-2 w-full" style={{ backgroundColor: brandColor }}></div>

      <div className="p-10">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center mb-6">
          {/* Logo */}
          <div className="w-32 h-24 flex items-center justify-center border p-2 overflow-hidden" style={{ borderColor: brandColor }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-serif text-2xl font-bold" style={{ color: brandColor }}>{settings?.shopName?.substring(0, 3).toUpperCase() || "SML"}</span>
            )}
          </div>

          {/* Center Brand Name */}
          <div className="text-center flex-1 px-4">
            <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-wide mb-1">
              {settings?.shopName || invoice.branch.name}
            </h1>
            <p className="text-sm tracking-widest uppercase font-semibold text-gray-700 mb-3">
              {invoice.branch.name}
            </p>
            <div className="inline-block px-6 py-1.5 border" style={{ borderColor: brandColor, color: brandColor }}>
              <span className="text-sm font-semibold tracking-widest uppercase">
                ◆ {settings?.documentTitle || settings?.invoiceHeaderText || "LUXURY GST TAX INVOICE"} ◆
              </span>
            </div>
          </div>

          {/* Right Info */}
          <div className="w-48 text-right text-sm">
            <p className="text-gray-600 uppercase tracking-wider mb-1">{labels.invoiceNo || "Invoice No."}</p>
            <p className="font-bold text-base mb-3" style={{ color: brandColor }}>{invoice.invoiceNumber}</p>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-gray-600">{labels.date || "Date"}</span>
              <span className="font-medium text-gray-900">{new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              
              <span className="text-gray-600">{labels.time || "Time"}</span>
              <span className="font-medium text-gray-900">{new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              
              <span className="text-gray-600">{labels.branch || "Branch"}</span>
              <span className="font-medium text-gray-900">{invoice.branch.name}</span>
            </div>
          </div>
        </div>

        {/* Address Bar */}
        <div className="text-sm flex flex-wrap justify-center items-center gap-4 py-2 border-y border-gray-200 mb-8 text-gray-600">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-black shrink-0" /> {settings?.address || invoice.branch.address}, {invoice.branch.city}</span>
          {settings?.gstNumber && <span><strong className="text-gray-800">GSTIN:</strong> {settings.gstNumber.toUpperCase()}</span>}
          {settings?.pan && <span><strong className="text-gray-800">PAN:</strong> {settings.pan.toUpperCase()}</span>}
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-black shrink-0" /> {settings?.phoneNumbers || invoice.branch.phone}</span>
          {settings?.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-black shrink-0" /> {settings.email}</span>}
          {settings?.website && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-black shrink-0" /> {settings.website}</span>}
        </div>

        {/* BILLED TO & INVOICE DETAILS CARDS */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          {/* Billed To Box */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">{labels.billedTo || "Billed To"}</h3>
            <div className="space-y-1.5">
              <p className="font-bold text-lg text-gray-900">{formatCustomerName(invoice.customer)}</p>
              <p className="text-gray-600 font-mono text-xs mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-black shrink-0" />
                <span>Customer ID: CUST-{invoice.customer.id.toString().padStart(5, '0')}</span>
              </p>
              
              {invoice.customer.mobile && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>+91 {invoice.customer.mobile}</span>
                </div>
              )}
              {invoice.customer.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>{invoice.customer.email}</span>
                </div>
              )}
              {invoice.customer.address && (
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                  <span className="leading-snug">{invoice.customer.address}, {invoice.customer.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="border border-gray-200 rounded p-5 relative bg-[#fafafa]">
            <h3 className="absolute -top-3 left-4 bg-[#fafafa] px-2 text-xs font-bold text-gray-600 tracking-widest uppercase">
              {labels.invoiceDetails || "Invoice Details"}
            </h3>
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm mt-2">
              <span className="text-gray-600">{labels.invoiceNo || "Invoice No."}</span>
              <span className="font-bold" style={{ color: brandColor }}>{invoice.invoiceNumber}</span>
              
              <span className="text-gray-600">{labels.salesExecutive || "Sales Executive"}</span>
              <span className="font-medium text-gray-800">{invoice.salesperson || "Admin"}</span>
              
              <span className="text-gray-600">{labels.paymentStatus || "Payment Status"}</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {invoice.balanceAmount <= 0 ? "PAID" : "PARTIAL"}
              </span>
            </div>
          </div>
        </div>

        {/* JEWELLERY ITEMS TABLE */}
        <div className="mb-8 border border-gray-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f0f0f0] border-b border-gray-200 text-gray-600 uppercase">
                  <th className="py-3 px-2 font-bold text-center w-10">#</th>
                  <th className="py-3 px-2 font-bold">Product Description</th>
                  <th className="py-3 px-2 font-bold font-mono">HSN Code</th>
                  <th className="py-3 px-2 font-bold font-mono">HUID</th>
                  <th className="py-3 px-2 font-bold text-center">Purity</th>
                  <th className="py-3 px-2 font-bold text-right">Nt.Wt</th>
                  <th className="py-3 px-2 font-bold text-right">Metal Rate</th>
                  <th className="py-3 px-2 font-bold text-right">Metal Value</th>
                  <th className="py-3 px-2 font-bold text-right">Other Charges</th>
                  <th className="py-3 px-2 font-bold text-right">Total</th>
                  {hasDiscount && <th className="py-3 px-2 font-bold text-right">Other Charge Discount</th>}
                  {hasDiscount && <th className="py-3 px-2 font-bold text-right">Discount Total Price</th>}
                  <th className="py-3 px-2 font-bold text-right">Final Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item: any, i: number) => {
                  const hsnCodeStr = item.product?.hsnCode || item.hsnCode || "711319";
                  const rawHuid = item.huidNumber || item.product?.huidNumber || item.huid || "";
                  const huidUpper = rawHuid ? rawHuid.toUpperCase() : "—";

                  const making = item.makingAmount ?? item.makingCharge ?? 0;
                  const addCharge = item.additionalCharge || 0;
                  const itemMetalRate = item.metalRate || (item.ntWeight > 0 ? (item.metalValue || (item.totalBeforeTax - making - addCharge)) / item.ntWeight : 0);
                  const itemMetalVal = item.metalValue || (itemMetalRate * item.ntWeight);
                  const itemSubtotal = item.subtotalWithoutDisc || (itemMetalVal + making);
                  const discPct = item.discountPercent || item.discountOnMaking || 0;
                  const discTotalPrice = item.discountTotalPrice || (itemSubtotal - (item.discountAmount || 0));

                  return (
                    <tr key={item.id} className="text-gray-800 hover:bg-gray-50">
                      <td className="py-3 px-2 font-bold text-center">{i + 1}</td>
                      <td className="py-3 px-2 font-medium">
                        <div className="break-words whitespace-normal leading-snug">
                          <span className="font-semibold block text-gray-900">{item.product?.name || item.name}</span>
                          {(item.barcode || item.product?.barcode) && (
                            <span className="text-[10px] text-gray-600 font-mono block mt-0.5">
                              BARCD: {item.barcode || item.product?.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-gray-600">{hsnCodeStr}</td>
                      <td className="py-3 px-2 font-mono text-gray-900 font-bold tracking-wider">{huidUpper}</td>
                      <td className="py-3 px-2 text-center">{item.product?.purity || "—"}K</td>
                      <td className="py-3 px-2 text-right font-medium tabular-nums">{item.ntWeight.toFixed(3)}g</td>
                      <td className="py-3 px-2 text-right tabular-nums">₹{Math.round(itemMetalRate).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold text-gray-900">₹{Math.round(itemMetalVal).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2 text-right tabular-nums">₹{Math.round(making).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold text-gray-900">₹{Math.round(itemSubtotal).toLocaleString('en-IN')}</td>
                      {hasDiscount && <td className="py-3 px-2 text-right tabular-nums text-red-600 font-medium">{discPct > 0 ? `-${discPct}%` : "—"}</td>}
                      {hasDiscount && <td className="py-3 px-2 text-right tabular-nums font-medium">₹{Math.round(discTotalPrice).toLocaleString('en-IN')}</td>}
                      <td className="py-3 px-2 text-right tabular-nums font-bold text-gray-900">₹{(discTotalPrice + addCharge).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. GST TAX DETAILS & PAYMENT SUMMARY BOXES */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
          {/* PAYMENTS */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">Payment Summary</h3>
            <ul className="space-y-2">
              {regularPayments.filter((p: any) => p.amount > 0).map((p: any, i: number) => (
                <li key={i} className="flex justify-between text-gray-700">
                  <span>{p.method}</span>
                  <span className="font-semibold tabular-nums">₹{p.amount.toFixed(2)}</span>
                </li>
              ))}

              {showExchangeInPayments && (
                <li className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between font-bold text-blue-800 items-center">
                    <span className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Old Gold Exchange (Non-Tax Deductible)
                    </span>
                    <span>₹{exchangeGoldValue.toFixed(2)}</span>
                  </div>
                </li>
              )}

              {cashOutPayment && (
                <li className="pt-2 border-t border-amber-200">
                  <div className="flex justify-between font-bold text-amber-800 items-center">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Old Gold Cashed Out
                    </span>
                    <span>₹{cashOutPayment.amount.toFixed(2)}</span>
                  </div>
                </li>
              )}

              {cashToCustomerPayment && (
                <li className="flex justify-between bg-amber-50 p-1.5 rounded font-bold text-amber-900 items-center">
                  <span className="flex items-center gap-1.5">
                    <HandCoins className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    Cash Refund to Customer
                  </span>
                  <span>₹{Math.abs(cashToCustomerPayment.amount).toFixed(2)}</span>
                </li>
              )}

              <li className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 text-sm items-center">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                  Balance Due
                </span>
                <span className={invoice.balanceAmount > 0 ? "text-red-600" : "text-emerald-600"}>
                  ₹{invoice.balanceAmount.toFixed(2)}
                </span>
              </li>
            </ul>
          </div>

          {/* TAXATION SUMMARY */}
          <div className="border border-gray-200 rounded p-4 bg-[#fafafa] space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-200 pb-1">Taxation & Final Calculation</h3>
            
            {showExchangeInTaxation ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Gross Metal Value</span>
                  <span className="tabular-nums font-medium">₹{totalItemMetalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Old Gold Exchange (Adjusted)</span>
                  <span className="tabular-nums">-₹{(totalItemMetalValue - metalVal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-800 font-semibold border-t border-gray-100 pt-1">
                  <span>Net Taxable Metal Value</span>
                  <span className="tabular-nums font-medium">₹{metalVal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-gray-600">
                <span>Metal Value</span>
                <span className="tabular-nums font-medium">₹{metalVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Other Charges</span>
              <span className="tabular-nums font-medium">₹{netMakingVal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-1">
              <span>Total</span>
              <span className="tabular-nums">₹{totalBeforeAdditional.toFixed(2)}</span>
            </div>

            {additionalVal !== 0 && (
              <div className="flex justify-between text-gray-700 font-medium">
                <span>{additionalReason ? `Additional Charge/Discount (${additionalReason})` : additionalVal < 0 ? "Discount / Adjustment" : "Additional Charge"}</span>
                <span className="tabular-nums font-semibold">₹{additionalVal.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1">
              <span>Net Taxable Subtotal</span>
              <span className="tabular-nums">₹{netTaxableBase.toFixed(2)}</span>
            </div>

            {/* TAX SECTION */}
            {invoice.taxOnGold > 0 || invoice.taxOnMaking > 0 ? (
              <div className="border-t border-gray-200 pt-1.5 space-y-1">
                {invoice.taxOnGold > 0 && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Metal CGST (1.5%)</span>
                      <span className="tabular-nums font-medium">₹{(invoice.taxOnGold / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Metal SGST (1.5%)</span>
                      <span className="tabular-nums font-medium">₹{(invoice.taxOnGold / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}
                {invoice.taxOnMaking > 0 && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Making CGST (2.5%)</span>
                      <span className="tabular-nums font-medium">₹{(invoice.taxOnMaking / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Making SGST (2.5%)</span>
                      <span className="tabular-nums font-medium">₹{(invoice.taxOnMaking / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-gray-800 font-semibold pt-1 border-t border-gray-200">
                  <span>Subtotal (with taxes)</span>
                  <span className="tabular-nums">₹{(netTaxableBase + invoice.taxOnGold + invoice.taxOnMaking).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-1.5 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>CGST (1.5%)</span>
                  <span className="tabular-nums font-medium">₹{cgst3.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST (1.5%)</span>
                  <span className="tabular-nums font-medium">₹{sgst3.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-800 font-semibold pt-1 border-t border-gray-200">
                  <span>Subtotal (with 3% GST)</span>
                  <span className="tabular-nums">₹{subtotalWith3PctGst.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* HALLMARK CHARGE & HALLMARK TAX SECTION */}
            {hallmarkCharge > 0 && (
              <div className="border-t border-gray-200 pt-1.5 space-y-1">
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Hallmark Charge</span>
                  <span className="tabular-nums">₹{hallmarkCharge.toFixed(2)}</span>
                </div>
                {hallmarkTotalTax > 0 && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Hallmark CGST (9%)</span>
                      <span className="tabular-nums font-medium">₹{hallmarkCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Hallmark SGST (9%)</span>
                      <span className="tabular-nums font-medium">₹{hallmarkSgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-gray-900 border-t-2 border-black pt-2 mt-2">
              <span>Grand Total (Payable)</span>
              <span className="tabular-nums" style={{ color: brandColor }}>₹{invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* PRODUCT IMAGES SECTION (BEFORE TERMS & CONDITIONS) */}
        {hasProductImages && (
          <div className="mb-6 border-t border-gray-200 pt-4">
            <h3 className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">Product Images</h3>
            <div className="flex flex-wrap gap-4">
              {invoice.items.map((item: any, i: number) => {
                const img = item.product?.image || item.image;
                if (!img) return null;
                return (
                  <div key={item.id || i} className="border border-gray-200 rounded p-2 text-center bg-[#fafafa] flex flex-col items-center">
                    <div className="w-24 h-24 overflow-hidden rounded border border-gray-200 flex items-center justify-center bg-white mb-2">
                      <img src={img} alt={item.product?.name || item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <p className="font-bold text-xs text-gray-900">Item No: {i + 1}</p>
                    <p className="text-[10px] text-gray-600 truncate max-w-[100px] mt-0.5">{item.product?.name || item.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. TERMS & CONDITIONS */}
        <div className="pt-4 border-t border-gray-200 text-xs text-gray-600 mb-6">
          <p className="font-bold text-gray-800 mb-1">Terms & Conditions:</p>
          <p className="max-w-[700px] leading-relaxed">
            {settings?.termsAndConditions || "Goods once sold cannot be returned. All disputes subject to local jurisdiction."}
          </p>
        </div>

        {/* 3. SIGNATURE COLUMN */}
        <div className="flex justify-between items-end pt-6 mb-6 text-xs text-gray-800">
          <div className="text-center">
            <div className="h-12"></div>
            <p className="border-t border-gray-400 px-6 pt-1 font-semibold">Customer Signature</p>
          </div>
          <div className="text-center">
            <div className="h-12 flex items-end justify-center">
            {digitalSignatureUrl && (
              <img src={digitalSignatureUrl} alt="Signature" className="h-10 object-contain mb-1" />
            )}
          </div>
          <p className="border-t border-gray-400 px-6 pt-1 font-semibold">Authorized Signatory</p>
          </div>
        </div>

        {/* 4. THANK YOU MESSAGE AT THE VERY BOTTOM */}
        <div className="text-center border-t border-gray-200 pt-4 text-xs font-semibold text-gray-600 tracking-wider uppercase flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Thank you for shopping with us! Please visit again.</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        </div>

      </div>
    </div>
  );
}
