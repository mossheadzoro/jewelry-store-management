'use client';

import React from "react";
import { formatCustomerName, normalizeInvoice } from "@/lib/utils";
import { Sparkles, HandCoins, Coins, Wallet, MapPin, Phone, Mail, User } from "lucide-react";

export default function PremiumInvoiceTemplate({ invoice: rawInvoice, regularPayments, cashOutPayment, cashToCustomerPayment, returnGoldPayment }: any) {
  const invoice = normalizeInvoice(rawInvoice);
  const settings = invoice.branch.settings;
  const brandColor = settings?.invoiceColor === "brand" ? "#C9943A" : "#333333";
  
  let rawCustomizations = settings?.invoiceCustomizations;
  if (typeof rawCustomizations === 'string') {
    try { rawCustomizations = JSON.parse(rawCustomizations); } catch(e) { rawCustomizations = {}; }
  }
  const customizations = rawCustomizations?.premium || {};
  
  const logoUrl = rawCustomizations?.companyLogoUrl || invoice.branch.settings?.logoUrl;
  const companySealUrl = rawCustomizations?.companySealUrl;
  const digitalSignatureUrl = rawCustomizations?.digitalSignatureUrl;
  
  const content = settings?.content || {
    showHUID: true,
    showPurity: true,
    showCustomerPAN: true,
    showCustomerGST: true,
    showTerms: true,
    showSignature: true,
    showFooter: true,
    showAmountInWords: true
  };

  const hideProductCode = !content.showHUID;
  const hidePurity = !content.showPurity;
  const hideCustomerPAN = !content.showCustomerPAN;
  const hideCustomerGST = !content.showCustomerGST;
  const hideTerms = !content.showTerms;
  const hideSignature = !content.showSignature;
  const hideFooter = !content.showFooter;

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

  const exchangeRates = [
    { type: "DIAMOND", exchange: "100%", cashBack: "90%" },
    { type: "PLATINUM", exchange: "100%", cashBack: "99%" },
  ];

  return (
    <div className="max-w-[1000px] mx-auto bg-white my-8 shadow-2xl printable-page-container font-sans text-gray-800 border-2 border-gray-100 relative pb-10">
      {companySealUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img src={companySealUrl} alt="Company Seal" className="w-[60%] object-contain opacity-[0.08]" />
        </div>
      )}
      
      {/* Top Gold Border */}
      <div className="h-2 w-full mb-4" style={{ backgroundColor: brandColor }}></div>

      <div className="px-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="border border-black p-2 text-center w-40 h-20 flex flex-col justify-center items-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <p className="text-[14px] font-bold tracking-widest leading-tight font-serif uppercase">{settings?.shopName?.substring(0, 3) || "JEWEL"}</p>
            )}
          </div>
          
          <div className="text-center flex-1 px-4">
            <h1 className="text-3xl font-serif font-bold tracking-[0.2em] uppercase mb-1">
              {settings?.shopName || invoice.branch.name}
            </h1>
            <p className="text-[13px] tracking-[0.25em] text-gray-700 font-bold uppercase">{invoice.branch.name}</p>
          </div>
          
          <div className="border border-black px-4 py-2 text-center w-40">
            <p className="text-[12px] font-bold tracking-widest leading-tight">100%<br/><span className="text-[12px]">BIS HALLMARK JEWELLERY</span></p>
          </div>
        </div>

        <div className="border-t border-b border-gray-300 py-3 mb-6 flex justify-between items-center">
          <div className="flex items-end gap-3">
            <h2 className="text-2xl font-bold italic tracking-wide">{settings?.documentTitle || "TAX INVOICE"}</h2>
            <span className="text-[13px] text-gray-600 mb-1">(See Section 31 & Rule 46 of CGST Rules, 2017)</span>
          </div>
          
          <table className="text-[12px] border-collapse border border-gray-300 text-center w-48">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 py-1"></th>
                <th className="border border-gray-300 py-1 font-bold text-blue-800">EXCHANGE</th>
                <th className="border border-gray-300 py-1 font-bold text-blue-800">CASH BACK</th>
              </tr>
            </thead>
            <tbody>
              {exchangeRates.map((rate, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 py-1 font-bold text-blue-800">{rate.type}</td>
                  <td className="border border-gray-300 py-1">{rate.exchange}</td>
                  <td className="border border-gray-300 py-1">{rate.cashBack}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customer & Invoice Details */}
        <div className="flex gap-4 mb-6">
          {/* Billed To */}
          <div className="flex-1 border border-gray-300 p-4">
            <h3 className="text-[12px] text-gray-600 uppercase tracking-widest mb-3">BILLED TO</h3>
            <p className="font-bold text-sm mb-1 uppercase">{formatCustomerName(invoice.customer)}</p>
            {invoice.customer.id && (
              <p className="text-[11px] text-gray-600 flex items-center gap-1.5 font-mono mb-2">
                <User className="w-3.5 h-3.5 text-black shrink-0" />
                <span>Customer ID: CUST-{invoice.customer.id.toString().padStart(5, '0')}</span>
              </p>
            )}
            <p className="text-[12px] text-gray-600 mb-3 leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
              <span>
                {invoice.customer.address}, {invoice.customer.city}<br/>
                {invoice.customer.state || "Telangana"}, India
              </span>
            </p>
            
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-[12px] pt-2 border-t border-gray-200">
              <span className="font-bold flex items-center gap-1">
                <Phone className="w-3 h-3 text-black" /> Mobile:
              </span>
              <span>+91 {invoice.customer.mobile.replace(/(\d{5})(\d{5})/, "$1 $2")}</span>
              
              {invoice.customer.email && (
                <>
                  <span className="font-bold flex items-center gap-1">
                    <Mail className="w-3 h-3 text-black" /> Email:
                  </span>
                  <span>{invoice.customer.email}</span>
                </>
              )}

              {!hideCustomerGST && (
                <>
                  <span className="font-bold">GSTIN:</span>
                  <span>{invoice.customer.gstin || "Unregistered"}</span>
                </>
              )}
              
              {!hideCustomerPAN && (
                <>
                  <span className="font-bold">PAN:</span>
                  <span>{invoice.customer.pan || "—"}</span>
                </>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="flex-1 border border-gray-300 p-4">
            <h3 className="text-[12px] text-gray-600 uppercase tracking-widest mb-3">INVOICE DETAILS</h3>
            <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[12px]">
              <span className="font-bold">Invoice No:</span>
              <span>{invoice.invoiceNumber}</span>
              
              <span className="font-bold">Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString('en-GB')} {new Date(invoice.createdAt).toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit'})}</span>
              
              <span className="font-bold">Branch:</span>
              <span className="font-semibold text-gray-800">{invoice.branch.name}</span>
              
              <span className="font-bold">Supplier GSTIN:</span>
              <span>{settings?.gstNumber || "Unregistered"}</span>
              
              <span className="font-bold">Place of Supply:</span>
              <span>{invoice.branch.state || "Telangana"} ({invoice.branch.city})</span>
              
              <span className="font-bold">Supply Type:</span>
              <span>B2C</span>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-6">
          <table className="w-full text-[9px] text-center border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 font-bold border-b border-gray-300">
                <th className="border-r border-gray-300 py-1.5 px-1">Item Number</th>
                <th className="border-r border-gray-300 py-1.5 px-2 text-left">Description</th>
                <th className="border-r border-gray-300 py-1.5 px-1">HSN/SAC</th>
                {!hidePurity && <th className="border-r border-gray-300 py-1.5 px-1">Purity</th>}
                <th className="border-r border-gray-300 py-1.5 px-1">Fineness</th>
                {!hideProductCode && <th className="border-r border-gray-300 py-1.5 px-1">HUID</th>}
                <th className="border-r border-gray-300 py-1.5 px-1">Pcs</th>
                <th className="border-r border-gray-300 py-1.5 px-1">N.Wt</th>
                <th className="border-r border-gray-300 py-1.5 px-1">Metal Rate</th>
                <th className="border-r border-gray-300 py-1.5 px-1">Metal Value</th>
                <th className="border-r border-gray-300 py-1.5 px-1">Other Charges</th>
                <th className="border-r border-gray-300 py-1.5 px-1">Total</th>
                {hasDiscount && <th className="border-r border-gray-300 py-1.5 px-1">Other Charge Discount</th>}
                {hasDiscount && <th className="border-r border-gray-300 py-1.5 px-1">Discount Total Price</th>}
                <th className="py-1.5 px-1">Final Amount</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="border-r border-gray-300 py-2 text-[10px] font-bold">{i + 1}</td>
                    <td className="border-r border-gray-300 py-2 px-2 text-left max-w-[180px]">
                      <div className="break-words whitespace-normal leading-snug text-left">
                        <span className="font-bold text-gray-900 block">{item.product?.name || item.name}</span>
                        {(item.barcode || item.product?.barcode) && (
                          <span className="text-[9px] text-gray-600 font-mono block mt-0.5">
                            BARCD: {item.barcode || item.product?.barcode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border-r border-gray-300 py-2 text-[10px] font-mono">{hsnCodeStr}</td>
                    {!hidePurity && <td className="border-r border-gray-300 py-2 text-[10px]">{item.product?.purity || "—"}K</td>}
                    <td className="border-r border-gray-300 py-2 text-[10px]">75.0</td>
                    {!hideProductCode && (
                      <td className="border-r border-gray-300 py-2 font-mono font-bold tracking-wider text-[10px] text-gray-900">
                        {huidUpper}
                      </td>
                    )}
                    <td className="border-r border-gray-300 py-2 text-[10px]">{item.quantity}</td>
                    <td className="border-r border-gray-300 py-2 text-[10px] font-medium">{item.ntWeight.toFixed(3)}g</td>
                    <td className="border-r border-gray-300 py-2 text-[10px]">₹{Math.round(itemMetalRate).toLocaleString('en-IN')}</td>
                    <td className="border-r border-gray-300 py-2 text-[10px] font-semibold">₹{Math.round(itemMetalVal).toLocaleString('en-IN')}</td>
                    <td className="border-r border-gray-300 py-2 text-[10px] font-medium">₹{making.toFixed(0)}</td>
                    <td className="border-r border-gray-300 py-2 text-[10px] font-semibold">₹{Math.round(itemSubtotal).toLocaleString('en-IN')}</td>
                    {hasDiscount && <td className="border-r border-gray-300 py-2 text-[10px] text-red-600 font-medium">{discPct > 0 ? `-${discPct}%` : "—"}</td>}
                    {hasDiscount && <td className="border-r border-gray-300 py-2 text-[10px] font-medium">₹{Math.round(discTotalPrice).toLocaleString('en-IN')}</td>}
                    <td className="py-2 text-right px-1 font-bold text-[10px] tabular-nums">₹{(discTotalPrice + addCharge).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 1. GST TAX DETAILS & PAYMENT SUMMARY */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
          {/* PAYMENTS */}
          <div className="border border-gray-300 p-4">
            <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-3">PAYMENT INFORMATION</h3>
            <ul className="space-y-1.5">
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
                <li className="flex justify-between bg-amber-50 p-1 rounded font-bold text-amber-900 items-center">
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

          {/* DETAILED TAXATION & FINAL CALCULATION SUMMARY */}
          <div className="border border-gray-300 p-4 bg-gray-50 space-y-1.5">
            <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">TAX & TOTAL CALCULATIONS</h3>
            
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
          <div className="mb-6 border-t border-gray-300 pt-4">
            <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-3">PRODUCT IMAGES</h3>
            <div className="flex flex-wrap gap-4">
              {invoice.items.map((item: any, i: number) => {
                const img = item.product?.image || item.image;
                if (!img) return null;
                return (
                  <div key={item.id || i} className="border border-gray-300 rounded p-2 text-center bg-gray-50 flex flex-col items-center">
                    <div className="w-24 h-24 overflow-hidden rounded border border-gray-300 flex items-center justify-center bg-white mb-2">
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
        <div className="pt-4 border-t border-gray-300 text-xs text-gray-600 mb-6">
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
