'use client';

import React from "react";
import { formatCustomerName, normalizeInvoice } from "@/lib/utils";
import { Sparkles, HandCoins, Coins, Wallet, MapPin, Phone, User, Mail } from "lucide-react";

export default function ModernInvoiceTemplate({ invoice: rawInvoice, regularPayments, cashOutPayment, cashToCustomerPayment, returnGoldPayment }: any) {
  const invoice = normalizeInvoice(rawInvoice);
  const settings = invoice.branch.settings;
  const brandColor = settings?.invoiceColor === "brand" ? "#d4af37" : "#000000";
  
  let rawCustomizations = invoice.branch.settings?.invoiceCustomizations;
  if (typeof rawCustomizations === 'string') {
    try { rawCustomizations = JSON.parse(rawCustomizations); } catch(e) { rawCustomizations = {}; }
  }
  const customizations = rawCustomizations?.modern || {};
  
  const logoUrl = rawCustomizations?.companyLogoUrl || invoice.branch.settings?.logoUrl;
  const companySealUrl = rawCustomizations?.companySealUrl;
  const digitalSignatureUrl = rawCustomizations?.digitalSignatureUrl;
  const labels = customizations.labels || {};

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

  return (
    <div className="relative max-w-[1000px] mx-auto bg-white my-8 shadow-2xl printable-page-container font-sans text-gray-800 border border-gray-200">
      {companySealUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img src={companySealUrl} alt="Company Seal" className="w-[60%] object-contain opacity-[0.08]" />
        </div>
      )}
      <div className="p-8">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start mb-6">
          {/* Logo */}
          <div className="w-28 h-20 bg-white flex items-center justify-center rounded overflow-hidden p-1">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-1" />
            ) : (
              <span className="font-serif text-2xl font-bold" style={{ color: brandColor }}>
                {settings?.shopName?.substring(0, 3).toUpperCase() || "AJ"}
              </span>
            )}
          </div>

          {/* Center Brand Name */}
          <div className="text-center flex-1 px-4 mt-1">
            <h1 className="text-4xl font-sans font-bold text-gray-900 tracking-widest uppercase mb-1">
              {settings?.shopName || invoice.branch.name}
            </h1>
            <p className="text-sm tracking-[0.2em] uppercase font-bold text-gray-700 mb-2">
              {invoice.branch.name}
            </p>
            <div className="inline-block mt-1">
              <span className="text-xs font-bold tracking-[0.3em] uppercase border-y-2 border-black py-1 px-4">
                {settings?.documentTitle || settings?.invoiceHeaderText || "GST TAX INVOICE"}
              </span>
            </div>
          </div>

          {/* Right Info */}
          <div className="w-48 text-right text-xs">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center">
              <span className="text-gray-600 tracking-wider">{labels.invoiceNo || "INVOICE NO"}</span>
              <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
              
              <span className="text-gray-600 tracking-wider">{labels.date || "DATE"}</span>
              <span className="font-bold text-gray-900">
                {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
              
              <span className="text-gray-600 tracking-wider">{labels.time || "TIME"}</span>
              <span className="font-bold text-gray-900">
                {new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              
              <span className="text-gray-600 tracking-wider">{labels.branch || "BRANCH"}</span>
              <span className="font-bold text-gray-900">{invoice.branch.name}</span>
            </div>
          </div>
        </div>

        {/* Address Ribbon */}
        <div className="w-full flex items-center justify-between text-[11px] py-2 px-4 bg-gray-50 border-y" style={{ borderColor: brandColor }}>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
            <span>{settings?.address || invoice.branch.address}, {invoice.branch.city} - {invoice.branch.pincode}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            {settings?.gstNumber && <span><strong className="text-gray-900">GSTIN:</strong> {settings.gstNumber.toUpperCase()}</span>}
            {settings?.pan && <span><strong className="text-gray-900">PAN:</strong> {settings.pan.toUpperCase()}</span>}
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-black shrink-0" />
              <strong className="text-gray-900">PH:</strong> +91 {settings?.phoneNumbers || invoice.branch.phone}
            </span>
          </div>
        </div>

        {/* BILLING INFO */}
        <div className="flex gap-6 mt-6 mb-6">
          {/* Billed To Box */}
          <div className="w-[45%] border rounded p-4 relative" style={{ borderColor: brandColor }}>
            <div className="absolute -top-3 right-4 px-3 py-1 text-[10px] font-bold text-gray-900 tracking-widest rounded" style={{ backgroundColor: brandColor }}>
              {labels.billTo || "BILL TO"}
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">{formatCustomerName(invoice.customer)}</h2>
            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                <span>+91 {invoice.customer.mobile}</span>
              </div>
              {invoice.customer.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                  <span>{invoice.customer.email}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                <span>{invoice.customer.address}, {invoice.customer.city}, {invoice.customer.state || "Maharashtra"}</span>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                <span>Customer ID: CUST-{invoice.customer.id.toString().padStart(5, '0')}</span>
              </div>
            </div>
          </div>

          {/* Sales Info Box */}
          <div className="flex-1 border border-gray-200 rounded p-4 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div>
                <p className="text-gray-600 uppercase tracking-wider mb-1">{labels.salesExecutive || "SALES EXECUTIVE"}</p>
                <p className="font-bold text-gray-900">{invoice.salesperson || "Admin"}</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wider mb-1">{labels.status || "STATUS"}</p>
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                  • {invoice.balanceAmount <= 0 ? "PAID" : "PARTIAL"}
                </span>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wider mb-1">{labels.paymentMethod || "PAYMENT METHOD"}</p>
                <p className="font-bold text-gray-900">
                  {regularPayments.length > 0 ? regularPayments.map((p:any) => p.method).join(" + ") : "Cash"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wider mb-1">{labels.branch || "BRANCH"}</p>
                <p className="font-bold text-gray-900">{invoice.branch.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-6">
          <table className="w-full text-[10px] text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-900">
                <th className="py-3 px-2 font-bold uppercase" style={{ color: brandColor }}>ITEM NUMBER</th>
                <th className="py-3 px-2 font-bold uppercase" style={{ color: brandColor }}>ITEM / DESCRIPTION</th>
                <th className="py-3 px-2 font-bold uppercase" style={{ color: brandColor }}>HSN CODE</th>
                <th className="py-3 px-2 font-bold uppercase" style={{ color: brandColor }}>HUID</th>
                <th className="py-3 px-2 font-bold uppercase text-center" style={{ color: brandColor }}>PURITY</th>
                <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>NET (g)</th>
                <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>METAL RATE</th>
                <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>METAL VALUE</th>
                <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>OTHER CHARGES</th>
                <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>TOTAL</th>
                {hasDiscount && <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>OTHER CHARGE DISCOUNT</th>}
                {hasDiscount && <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>DISCOUNT TOTAL PRICE</th>}
                <th className="py-3 px-2 font-bold uppercase text-right" style={{ color: brandColor }}>FINAL AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-b border-gray-200">
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
                  <tr key={item.id} className="text-gray-900">
                    <td className="py-4 px-2 font-bold text-center">{i + 1}</td>
                    <td className="py-4 px-2 max-w-[200px]">
                      <div className="break-words whitespace-normal leading-normal">
                        <p className="font-bold text-[11px] text-gray-900">{item.product?.name || item.name}</p>
                        {(item.barcode || item.product?.barcode) && (
                          <p className="text-[9px] text-gray-600 font-mono mt-0.5">
                            BARCD: {item.barcode || item.product?.barcode}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-gray-600 font-mono text-[11px]">{hsnCodeStr}</td>
                    <td className="py-4 px-2 text-gray-900 font-mono font-bold tracking-wider text-[11px]">{huidUpper}</td>
                    <td className="py-4 px-2 text-center text-gray-700">{item.product?.purity || "—"}K</td>
                    <td className="py-4 px-2 text-right">{item.ntWeight.toFixed(3)}g</td>
                    <td className="py-4 px-2 text-right font-medium">₹{Math.round(itemMetalRate).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-2 text-right font-semibold text-gray-900">₹{Math.round(itemMetalVal).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-2 text-right font-medium">₹{Math.round(making).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-2 text-right font-semibold text-gray-900">₹{Math.round(itemSubtotal).toLocaleString('en-IN')}</td>
                    {hasDiscount && <td className="py-4 px-2 text-right text-red-600 font-medium">{discPct > 0 ? `-${discPct}%` : "—"}</td>}
                    {hasDiscount && <td className="py-4 px-2 text-right font-medium">₹{Math.round(discTotalPrice).toLocaleString('en-IN')}</td>}
                    <td className="py-4 px-2 text-right font-bold text-gray-900">₹{(discTotalPrice + addCharge).toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 1. GST TAX DETAILS & PAYMENT SUMMARY */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
          {/* PAYMENTS */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">Payment Info</h3>
            <ul className="space-y-2">
              {regularPayments.map((p: any, i: number) => (
                <li key={i} className="flex justify-between text-gray-700">
                  <span>{p.method}</span>
                  <span className="font-semibold tabular-nums">₹{p.amount.toFixed(2)}</span>
                </li>
              ))}

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

          {/* DETAILED TAXATION */}
          <div className="border border-gray-200 rounded p-4 bg-[#fafafa] space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-200 pb-1">Taxation & Final Calculation</h3>
            
            <div className="flex justify-between text-gray-600">
              <span>Metal Value</span>
              <span className="tabular-nums font-medium">₹{metalVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Other Charges</span>
              <span className="tabular-nums font-medium">₹{netMakingVal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-1">
              <span>Total</span>
              <span className="tabular-nums">₹{totalBeforeAdditional.toFixed(2)}</span>
            </div>

            {additionalVal > 0 && (
              <div className="flex justify-between text-gray-700 font-medium">
                <span>{additionalReason ? `Additional Charge (${additionalReason})` : "Additional Charge"}</span>
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">PRODUCT IMAGES</h3>
            <div className="flex flex-wrap gap-4">
              {invoice.items.map((item: any, i: number) => {
                const img = item.product?.image || item.image;
                if (!img) return null;
                return (
                  <div key={item.id || i} className="border border-gray-200 rounded p-2 text-center bg-gray-50 flex flex-col items-center">
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
