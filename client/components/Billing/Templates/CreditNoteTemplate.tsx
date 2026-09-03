'use client';

import React from "react";
import { formatCustomerName } from "@/lib/utils";
import { Sparkles, FileText, CheckCircle2, ShieldCheck, User, MapPin, Phone, Mail, Globe } from "lucide-react";

export default function CreditNoteTemplate({ taxDocument }: { taxDocument: any }) {
  const branch = taxDocument.branch || {};
  const settings = branch.settings || {};
  const supplier = taxDocument.supplierSnapshot || {};
  const recipient = taxDocument.recipientSnapshot || {};
  const originalInvoice = taxDocument.originalInvoice || {};
  const items = taxDocument.transaction?.items || originalInvoice.items || [];

  const brandColor = settings.invoiceColor === "brand" ? "#C9943A" : "#111827";
  const logoUrl = settings.logoUrl;
  const companySealUrl = settings.invoiceCustomizations?.companySealUrl;
  const digitalSignatureUrl = settings.invoiceCustomizations?.digitalSignatureUrl;

  return (
    <div className="relative max-w-[1000px] mx-auto bg-white my-8 shadow-2xl printable-page-container font-sans text-gray-800 border-2 border-gray-100 pb-10">
      {/* Background Seal Watermark */}
      {companySealUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img src={companySealUrl} alt="Company Seal" className="w-[60%] object-contain opacity-[0.06]" />
        </div>
      )}

      {/* Decorative Brand Top Stripe */}
      <div className="h-2 w-full mb-6" style={{ backgroundColor: brandColor }}></div>

      <div className="px-10">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6 gap-4">
          <div className="flex-1">
            {logoUrl && (
              <div className="h-16 max-w-[200px] flex items-center justify-start mb-3 overflow-hidden">
                <img src={logoUrl} alt="Shop Logo" className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight mb-1 uppercase text-gray-900">
              {supplier.shopName || branch.name}
            </h1>
            <p className="text-sm font-semibold text-gray-700 mb-1">{branch.name}</p>
            <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{supplier.address || branch.address}, {supplier.city || branch.city}, {supplier.state || branch.state} {supplier.pincode || branch.pincode}</span>
            </p>
            <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{supplier.phone || branch.phone}</span>
              </span>
              {supplier.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>{supplier.email}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-800 mt-1.5 font-bold">
              <span>GSTIN: {(supplier.gstin || "UNREGISTERED").toUpperCase()}</span>
              {supplier.pan && <span className="ml-4 font-normal text-gray-600">PAN: {supplier.pan.toUpperCase()}</span>}
            </p>
          </div>

          <div className="text-right flex-shrink-0 flex flex-col items-end">
            <div className="inline-block px-4 py-1 border-2 border-black mb-3">
              <span className="text-sm font-bold tracking-widest uppercase">GST CREDIT NOTE</span>
            </div>
            <p className="text-[11px] text-gray-500 italic mb-2">(Issued under Section 34 of CGST Act, 2017)</p>
            <h3 className="font-bold text-gray-900 text-base">Credit Note #: {taxDocument.documentNumber}</h3>
            <p className="text-xs font-medium text-gray-600">Date: {new Date(taxDocument.issueDate).toLocaleDateString('en-GB')}</p>
            <p className="text-xs font-medium text-gray-600">Time: {new Date(taxDocument.issueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-right text-xs">
              <p className="font-bold text-gray-800">Original Invoice Ref:</p>
              <p className="font-mono text-blue-800 font-bold">{taxDocument.originalInvoiceNumber}</p>
              <p className="text-gray-600">Dated: {new Date(taxDocument.originalInvoiceDate).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>

        {/* RECIPIENT & PLACE OF SUPPLY */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div className="border border-gray-300 rounded p-4">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-200 pb-1">CREDITED TO (RECIPIENT)</h3>
            <p className="text-sm font-bold text-gray-900 mb-1">{recipient.name || formatCustomerName(taxDocument.customer)}</p>
            <p className="text-gray-600 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-black shrink-0" />
              <span>+91 {recipient.mobile}</span>
            </p>
            <p className="text-gray-600 flex items-start gap-1.5 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
              <span>{recipient.address}, {recipient.city}, {recipient.state} {recipient.pincode}</span>
            </p>
            <p className="text-gray-800 font-semibold mt-2 pt-1 border-t border-gray-200">
              Recipient GSTIN: <span className="font-bold">{recipient.gstin || "Unregistered / Consumer"}</span>
            </p>
          </div>

          <div className="border border-gray-300 rounded p-4 bg-gray-50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-200 pb-1">STATUTORY SUPPLY DETAILS</h3>
              <div className="space-y-1.5 text-xs text-gray-700">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-600">Place of Supply:</span>
                  <span className="font-bold">{taxDocument.placeOfSupply}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-gray-600">Reason for Note:</span>
                  <span className="font-semibold text-amber-900">{taxDocument.reason || "Return of Goods"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-gray-600">Document Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {taxDocument.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 italic mt-2">
              Note: The corresponding output tax liability is reduced proportionally under GST rules.
            </div>
          </div>
        </div>

        {/* RETURNED ITEMS TABLE */}
        <div className="mb-6 overflow-hidden rounded border border-gray-300">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-100 text-gray-900 text-[11px] font-bold border-b border-gray-300">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Item Description</th>
                <th className="px-2 py-2.5">HSN</th>
                <th className="px-2 py-2.5">HUID / Barcode</th>
                <th className="px-2 py-2.5 text-center">Purity</th>
                <th className="px-2 py-2.5 text-right">Net Wt</th>
                <th className="px-3 py-2.5 text-right">Taxable Value</th>
                <th className="px-2 py-2.5 text-right">CGST (1.5%)</th>
                <th className="px-2 py-2.5 text-right">SGST (1.5%)</th>
                <th className="px-3 py-2.5 text-right">Total Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((it: any, idx: number) => {
                const snap = it.originalValuesSnapshot || it;
                const prod = it.originalProductItem || it.product || {};
                const name = prod.name || it.productName || `Jewellery Item #${idx + 1}`;
                const hsn = prod.hsnCode || "7113";
                const huid = snap.huid || prod.huidNumber || "—";
                const purity = snap.purity || prod.purity || 22;
                const ntWt = snap.ntWeight || it.ntWeight || 0;
                const taxable = snap.taxableValue || it.totalBeforeTax || 0;
                const cgst = snap.cgst || it.cgst || 0;
                const sgst = snap.sgst || it.sgst || 0;
                const total = snap.totalAfterTax || it.totalAfterTax || (taxable + cgst + sgst);

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-semibold text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{name}</td>
                    <td className="px-2 py-2.5 font-mono text-gray-600">{hsn}</td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-gray-800">{huid}</td>
                    <td className="px-2 py-2.5 text-center">{purity}K</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{ntWt.toFixed(3)}g</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">₹{taxable.toFixed(2)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-gray-600">₹{cgst.toFixed(2)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-gray-600">₹{sgst.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold text-gray-900">₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TAXATION & TOTAL SUMMARY BOX */}
        <div className="flex justify-end mb-8">
          <div className="w-80 bg-gray-50 p-4 rounded border border-gray-300 space-y-2 text-xs">
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">Total Taxable Value Reversal:</span>
              <span className="font-bold tabular-nums">₹{taxDocument.taxableValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>CGST Reversal (1.5%):</span>
              <span className="tabular-nums">₹{taxDocument.cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SGST Reversal (1.5%):</span>
              <span className="tabular-nums">₹{taxDocument.sgstAmount.toFixed(2)}</span>
            </div>
            {taxDocument.igstAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>IGST Reversal (3%):</span>
                <span className="tabular-nums">₹{taxDocument.igstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t-2 border-black pt-2 mt-2">
              <span>Total Credit Amount:</span>
              <span className="tabular-nums" style={{ color: brandColor }}>₹{taxDocument.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* SIGNATURE SECTION */}
        <div className="flex justify-between items-end pt-6 border-t border-gray-300 text-xs text-gray-800 mb-6">
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
            <p className="border-t border-gray-400 px-6 pt-1 font-semibold">Authorised Signatory</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center border-t border-gray-200 pt-4 text-[11px] text-gray-500 flex items-center justify-center gap-2 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>This is a computer-generated GST Credit Note referencing original invoice {taxDocument.originalInvoiceNumber}.</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        </div>
      </div>
    </div>
  );
}
