'use client';

import React from "react";
import { formatCustomerName, normalizeInvoice } from "@/lib/utils";

export default function StandardInvoiceTemplate({ invoice: rawInvoice, regularPayments, cashOutPayment, cashToCustomerPayment, returnGoldPayment }: any) {
  const invoice = normalizeInvoice(rawInvoice);
  let rawCustomizations = invoice.branch.settings?.invoiceCustomizations;
  if (typeof rawCustomizations === 'string') {
    try { rawCustomizations = JSON.parse(rawCustomizations); } catch(e) { rawCustomizations = {}; }
  }
  const customizations = rawCustomizations?.standard || {};
  
  const logoUrl = rawCustomizations?.companyLogoUrl || logoUrl;
  const companySealUrl = rawCustomizations?.companySealUrl;
  const digitalSignatureUrl = rawCustomizations?.digitalSignatureUrl;

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
  const wasMetalValueReduced = totalItemMetalValue - metalVal > 1;

  const showExchangeInTaxation = exchangeGoldValue > 0 && wasMetalValueReduced;
  const showExchangeInPayments = exchangeGoldValue > 0 && !wasMetalValueReduced;

  return (
    <div className="relative max-w-[900px] mx-auto bg-white my-8 p-10 shadow-2xl border border-gray-200 printable-page-container font-sans text-gray-800">
      {companySealUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img src={companySealUrl} alt="Company Seal" className="w-[60%] object-contain opacity-[0.08]" />
        </div>
      )}
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6 gap-4">
        <div className="flex-1">
          {logoUrl && (
            <div className="h-20 max-w-[220px] flex items-center justify-start mb-4 overflow-hidden">
              <img src={logoUrl} alt="Shop Logo" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight mb-1 uppercase text-gray-900">
            {invoice.branch.settings?.documentTitle || invoice.branch.settings?.invoiceHeaderText || "TAX INVOICE"}
          </h1>
          <p className="font-bold text-gray-900 text-xl">{invoice.branch.settings?.shopName || invoice.branch.name}</p>
          <p className="text-sm font-semibold text-gray-700 mb-1">{invoice.branch.name}</p>
          <p className="text-xs text-gray-600">{invoice.branch.settings?.address || invoice.branch.address}, {invoice.branch.city}, {invoice.branch.state} {invoice.branch.pincode}</p>
          <p className="text-xs text-gray-600">Phone: {invoice.branch.settings?.phoneNumbers || invoice.branch.phone} | Email: {invoice.branch.settings?.email || invoice.branch.email}</p>
          {(invoice.branch.settings?.gstNumber || invoice.branch.settings?.pan) && (
            <p className="text-xs text-gray-600 mt-1 font-medium">
              {invoice.branch.settings?.gstNumber && <span className="mr-4">GSTIN: {invoice.branch.settings.gstNumber.toUpperCase()}</span>}
              {invoice.branch.settings?.pan && <span>PAN: {invoice.branch.settings.pan.toUpperCase()}</span>}
            </p>
          )}
          {invoice.branch.settings?.website && (
            <p className="text-xs text-gray-600">{invoice.branch.settings.website}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end">

          <h3 className="font-bold text-gray-800 text-base">Invoice #: {invoice.invoiceNumber}</h3>
          <p className="text-xs font-medium text-gray-600">Date: {new Date(invoice.createdAt).toLocaleDateString('en-GB')}</p>
          <p className="text-xs font-medium text-gray-600">Time: {new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-xs font-semibold text-gray-700 mt-1">Branch: {invoice.branch.name}</p>
        </div>
      </div>

      {/* CUSTOMER DETAILS */}
      <div className="mb-6">
        <h3 className="font-bold text-xs bg-gray-100 px-3 py-1.5 uppercase tracking-wide border-l-4 border-black mb-3">BILLED TO</h3>
        <div className="px-3">
          <p className="text-lg font-bold text-gray-900">{formatCustomerName(invoice.customer)}</p>
          <p className="text-xs text-gray-600">+91 {invoice.customer.mobile}</p>
          {invoice.customer.email && <p className="text-xs text-gray-600">{invoice.customer.email}</p>}
          <p className="text-xs text-gray-600 max-w-[350px] leading-relaxed mt-0.5">{invoice.customer.address}, {invoice.customer.city}, {invoice.customer.state} {invoice.customer.pincode}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-6 overflow-hidden rounded-md border border-gray-300">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white text-gray-900 text-[11px]">
            <tr>
              <th className="px-2 py-2 font-semibold">Item Number</th>
              <th className="px-2 py-2 font-semibold">Product Description</th>
              <th className="px-2 py-2 font-semibold">HSN Code</th>
              <th className="px-2 py-2 font-semibold">HUID</th>
              <th className="px-2 py-2 font-semibold text-center">Purity</th>
              <th className="px-2 py-2 font-semibold text-right">Nt.Wt</th>
              <th className="px-2 py-2 font-semibold text-right">Metal Rate</th>
              <th className="px-2 py-2 font-semibold text-right">Metal Value</th>
              <th className="px-2 py-2 font-semibold text-right">Other Charges</th>
              <th className="px-2 py-2 font-semibold text-right">Total</th>
              {hasDiscount && <th className="px-2 py-2 font-semibold text-right">Other Charge Discount</th>}
              {hasDiscount && <th className="px-2 py-2 font-semibold text-right">Discount Total Price</th>}
              <th className="px-2 py-2 font-semibold text-right">Final Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs">
            {invoice.items.map((item: any, i: number) => {
              const making = item.makingAmount ?? item.makingCharge ?? 0;
              const addCharge = item.additionalCharge || 0;
              const itemMetalRate = item.metalRate || (item.ntWeight > 0 ? (item.metalValue || (item.totalBeforeTax - making - addCharge)) / item.ntWeight : 0);
              const itemMetalVal = item.metalValue || (itemMetalRate * item.ntWeight);
              const itemSubtotal = item.subtotalWithoutDisc || (itemMetalVal + making);
              const discPct = item.discountPercent || item.discountOnMaking || 0;
              const discTotalPrice = item.discountTotalPrice || (itemSubtotal - (item.discountAmount || 0));

              return (
                <tr key={item.id} className="text-gray-800 hover:bg-gray-50">
                  <td className="px-2 py-2.5 font-bold text-center">{i + 1}</td>
                  <td className="px-2 py-2.5 max-w-[200px]">
                    <div className="break-words whitespace-normal leading-snug">
                      <span className="font-semibold block text-gray-900">{item.product?.name || item.name}</span>
                      {(item.barcode || item.product?.barcode) && (
                        <span className="text-[10px] text-gray-600 font-mono block mt-0.5">
                          BARCD: {item.barcode || item.product?.barcode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-gray-600 text-[11px]">{item.product?.hsnCode || item.hsnCode || "711319"}</td>
                  <td className="px-2 py-2.5 font-mono text-gray-800 text-[11px] font-bold tracking-wider">{(item.huidNumber || item.product?.huidNumber || item.huid || "—").toUpperCase()}</td>
                  <td className="px-2 py-2.5 text-center text-gray-700">{item.product?.purity || "—"}K</td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-medium">{item.ntWeight.toFixed(3)}g</td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-medium">₹{Math.round(itemMetalRate).toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-gray-900">₹{Math.round(itemMetalVal).toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-medium">₹{Math.round(making).toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-gray-900">₹{Math.round(itemSubtotal).toLocaleString('en-IN')}</td>
                  {hasDiscount && <td className="px-2 py-2.5 text-right tabular-nums text-red-600 font-medium">{discPct > 0 ? `-${discPct}%` : "—"}</td>}
                  {hasDiscount && <td className="px-2 py-2.5 text-right tabular-nums font-medium">₹{Math.round(discTotalPrice).toLocaleString('en-IN')}</td>}
                  <td className="px-2 py-2.5 text-right tabular-nums font-bold text-gray-900">₹{(discTotalPrice + addCharge).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 1. GST TAX DETAILS & SUMMARY BOX */}
      <div className="flex justify-between items-start mb-6 text-xs gap-6">

        {/* PAYMENTS */}
        <div className="w-1/2 pr-2">
          <h3 className="font-bold text-xs bg-gray-100 px-3 py-1.5 uppercase tracking-wide border-l-4 border-gray-400 mb-3">PAYMENT INFO</h3>
          <ul className="divide-y divide-gray-100">
            {regularPayments.filter((p: any) => p.amount > 0).map((p: any, i: number) => (
              <li key={i} className="py-2 flex justify-between">
                <span className="font-medium text-gray-700">{p.method}</span>
                <span className="tabular-nums font-semibold">₹{p.amount.toFixed(2)}</span>
              </li>
            ))}

            {showExchangeInPayments && (
              <li className="py-2 flex justify-between border-t border-gray-200 mt-2">
                <span className="font-medium text-blue-700">Old Gold Exchange (Non-Tax Deductible)</span>
                <span className="tabular-nums font-semibold text-blue-700">₹{exchangeGoldValue.toFixed(2)}</span>
              </li>
            )}

            {cashOutPayment && (
              <li className="py-3 border-t border-amber-200 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-700 text-xs uppercase tracking-wide">OLD Gold Cashed Out</span>
                  <span className="tabular-nums font-bold text-amber-700">₹{cashOutPayment.amount.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-600 italic leading-tight">
                  Cash Settlement Rate Applied (after refining adjustments)
                </p>
              </li>
            )}

            {cashToCustomerPayment && (
              <li className="py-2 flex justify-between bg-amber-50 px-2 rounded">
                <span className="font-bold text-amber-800 text-xs">💰 Cash Given to Customer</span>
                <span className="tabular-nums font-bold text-amber-800">₹{Math.abs(cashToCustomerPayment.amount).toFixed(2)}</span>
              </li>
            )}

            {returnGoldPayment && (
              <li className="py-3 border-t border-blue-200 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-700 text-xs uppercase tracking-wide">Excess Gold Returned</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{returnGoldPayment.paymentRef}</p>
              </li>
            )}

            <li className="py-2 flex justify-between font-bold border-t border-gray-200 mt-2 text-gray-900">
              <span>Balance Due</span>
              <span className={`${invoice.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{invoice.balanceAmount.toFixed(2)}
              </span>
            </li>
          </ul>
        </div>

        {/* TAXATION & FINAL CALCULATION BOX */}
        <div className="w-1/2 bg-gray-50 p-5 rounded border border-gray-200 space-y-1.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-200 pb-1">Taxation & Final Calculation</h3>
          
          {showExchangeInTaxation ? (
            <>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Gross Metal Value</span>
                <span className="tabular-nums font-medium">₹{totalItemMetalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-red-600 font-medium">
                <span>Old Gold Exchange (Adjusted)</span>
                <span className="tabular-nums">-₹{(totalItemMetalValue - metalVal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-800 font-semibold border-t border-gray-100 pt-1">
                <span>Net Taxable Metal Value</span>
                <span className="tabular-nums font-medium">₹{metalVal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-xs text-gray-600">
              <span>Metal Value</span>
              <span className="tabular-nums font-medium">₹{metalVal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-gray-600">
            <span>Other Charges</span>
            <span className="tabular-nums font-medium">₹{netMakingVal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs font-semibold text-gray-800 border-t border-gray-200 pt-1">
            <span>Total</span>
            <span className="tabular-nums">₹{totalBeforeAdditional.toFixed(2)}</span>
          </div>

          {additionalVal > 0 && (
            <div className="flex justify-between text-xs text-gray-700 font-medium">
              <span>{additionalReason ? `Additional Charge (${additionalReason})` : "Additional Charge"}</span>
              <span className="tabular-nums font-semibold">₹{additionalVal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-200 pt-1">
            <span>Net Taxable Subtotal</span>
            <span className="tabular-nums">₹{netTaxableBase.toFixed(2)}</span>
          </div>

          {/* TAX SECTION */}
          {invoice.taxOnGold > 0 || invoice.taxOnMaking > 0 ? (
            <div className="border-t border-gray-200 pt-1.5 space-y-1">
              {invoice.taxOnGold > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Metal CGST (1.5%)</span>
                    <span className="tabular-nums font-medium">₹{(invoice.taxOnGold / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Metal SGST (1.5%)</span>
                    <span className="tabular-nums font-medium">₹{(invoice.taxOnGold / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              {invoice.taxOnMaking > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Making CGST (2.5%)</span>
                    <span className="tabular-nums font-medium">₹{(invoice.taxOnMaking / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Making SGST (2.5%)</span>
                    <span className="tabular-nums font-medium">₹{(invoice.taxOnMaking / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xs font-semibold text-gray-800 pt-1 border-t border-gray-200">
                <span>Subtotal (with taxes)</span>
                <span className="tabular-nums">₹{(netTaxableBase + invoice.taxOnGold + invoice.taxOnMaking).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-1.5 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>CGST (1.5%)</span>
                <span className="tabular-nums font-medium">₹{cgst3.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>SGST (1.5%)</span>
                <span className="tabular-nums font-medium">₹{sgst3.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-800 pt-1 border-t border-gray-200">
                <span>Subtotal (with 3% GST)</span>
                <span className="tabular-nums">₹{subtotalWith3PctGst.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* HALLMARK CHARGE & HALLMARK TAX SECTION */}
          {hallmarkCharge > 0 && (
            <div className="border-t border-gray-200 pt-1.5 space-y-1">
              <div className="flex justify-between text-xs text-gray-700 font-medium">
                <span>Hallmark Charge</span>
                <span className="tabular-nums">₹{hallmarkCharge.toFixed(2)}</span>
              </div>
              {hallmarkTotalTax > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Hallmark CGST (9%)</span>
                    <span className="tabular-nums font-medium">₹{hallmarkCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Hallmark SGST (9%)</span>
                    <span className="tabular-nums font-medium">₹{hallmarkSgst.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm py-2 text-gray-900 font-bold border-t-2 border-black mt-2 pt-2">
            <span>Grand Total (Payable)</span>
            <span className="tabular-nums text-base">₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* PRODUCT IMAGES SECTION (BEFORE TERMS & CONDITIONS) */}
      {hasProductImages && (
        <div className="mb-6 border-t border-gray-200 pt-4">
          <h3 className="font-bold text-xs bg-gray-100 px-3 py-1.5 uppercase tracking-wide border-l-4 border-black mb-3">PRODUCT IMAGES</h3>
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
      <div className="pt-4 border-t border-gray-200 text-xs text-gray-600 mb-6">
        <p className="font-bold text-gray-800 mb-1">Terms & Conditions:</p>
        <p className="max-w-[700px] leading-relaxed">
          {invoice.branch.settings?.termsAndConditions || "Goods once sold cannot be returned. All disputes subject to local jurisdiction."}
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
      <div className="text-center border-t border-gray-200 pt-4 text-xs font-semibold text-gray-600 tracking-wider uppercase">
        ✨ Thank you for shopping with us! Please visit again. ✨
      </div>

    </div>
  );
}
