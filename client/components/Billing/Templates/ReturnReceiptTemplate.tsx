'use client';

import React from "react";
import { formatCustomerName } from "@/lib/utils";
import { Sparkles, ShieldCheck, MapPin, Phone, Mail, User, CheckCircle2 } from "lucide-react";

export default function ReturnReceiptTemplate({ transaction }: { transaction: any }) {
  const branch = transaction.branch || {};
  const settings = branch.settings || {};
  const customer = transaction.customer || {};
  const originalInvoice = transaction.originalInvoice || {};
  const items = transaction.items || [];
  const financial = transaction.financialSnapshot || {};
  const summary = financial.summary || {};
  const refund = (transaction.refundTransactions || [])[0];

  const brandColor = settings.invoiceColor === "brand" ? "#C9943A" : "#111827";
  const logoUrl = settings.logoUrl;
  const companySealUrl = settings.invoiceCustomizations?.companySealUrl;

  return (
    <div className="relative max-w-[900px] mx-auto bg-white my-8 shadow-2xl printable-page-container font-sans text-gray-800 border-2 border-gray-100 pb-10">
      {companySealUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img src={companySealUrl} alt="Company Seal" className="w-[50%] object-contain opacity-[0.05]" />
        </div>
      )}

      {/* Decorative stripe */}
      <div className="h-2 w-full mb-6" style={{ backgroundColor: brandColor }}></div>

      <div className="px-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-5 mb-5 gap-4">
          <div className="flex-1">
            {logoUrl && (
              <div className="h-14 max-w-[180px] flex items-center justify-start mb-2 overflow-hidden">
                <img src={logoUrl} alt="Shop Logo" className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <h1 className="text-2xl font-bold uppercase text-gray-900">{settings.shopName || branch.name}</h1>
            <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{settings.address || branch.address}, {branch.city}, {branch.state} {branch.pincode}</span>
            </p>
            <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-black shrink-0" />
              <span>+91 {settings.phoneNumbers || branch.phone}</span>
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="inline-block px-3 py-1 border border-black mb-2">
              <span className="text-xs font-bold tracking-widest uppercase">RETURN ACKNOWLEDGEMENT</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Receipt #: {transaction.transactionNumber}</h3>
            <p className="text-xs text-gray-600">Date: {new Date(transaction.createdAt).toLocaleDateString('en-GB')}</p>
            <p className="text-xs text-gray-600">Original Inv: <span className="font-bold text-gray-800">{originalInvoice.invoiceNumber}</span></p>
          </div>
        </div>

        {/* Customer & Return Info */}
        <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
          <div className="border border-gray-300 rounded p-3">
            <h3 className="font-bold uppercase text-gray-700 mb-1 border-b pb-1">CUSTOMER INFORMATION</h3>
            <p className="text-sm font-bold text-gray-900">{formatCustomerName(customer)}</p>
            <p className="text-gray-600">Mobile: +91 {customer.mobile}</p>
            <p className="text-gray-600">{customer.address}, {customer.city}</p>
          </div>

          <div className="border border-gray-300 rounded p-3 bg-gray-50">
            <h3 className="font-bold uppercase text-gray-700 mb-1 border-b pb-1">TRANSACTION DETAILS</h3>
            <p className="flex justify-between">
              <span className="text-gray-600">Action Type:</span>
              <span className="font-bold">{transaction.transactionType}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-bold text-emerald-700">{transaction.status}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Reason:</span>
              <span className="font-medium text-gray-800">{transaction.reason || "Customer Return"}</span>
            </p>
          </div>
        </div>

        {/* Physical Item Breakdown */}
        <div className="mb-5 border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-100 font-bold border-b border-gray-300">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-2 py-2">Barcode</th>
                <th className="px-2 py-2">HUID</th>
                <th className="px-2 py-2 text-right">Meas. Gross</th>
                <th className="px-2 py-2 text-right">Meas. Net</th>
                <th className="px-2 py-2">Condition</th>
                <th className="px-3 py-2 text-right">Refund Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((it: any, i: number) => {
                const snap = it.originalValuesSnapshot || {};
                const retVal = it.returnedValues || {};
                const prod = it.originalProductItem || {};
                return (
                  <tr key={i}>
                    <td className="px-3 py-2 font-semibold">{i + 1}</td>
                    <td className="px-3 py-2 font-bold">{prod.name || `Item #${i + 1}`}</td>
                    <td className="px-2 py-2 font-mono text-[11px]">{prod.barcode}</td>
                    <td className="px-2 py-2 font-mono text-[11px]">{prod.huidNumber || "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{(retVal.measuredGrossWeight || snap.gsWeight || 0).toFixed(3)}g</td>
                    <td className="px-2 py-2 text-right tabular-nums">{(retVal.measuredNetWeight || snap.ntWeight || 0).toFixed(3)}g</td>
                    <td className="px-2 py-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-[10px]">
                        {it.condition || "GOOD"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">₹{(retVal.netRefundAmount || snap.totalAfterTax || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Settlement Breakdown */}
        <div className="flex justify-end mb-6">
          <div className="w-72 bg-gray-50 border border-gray-300 p-3 rounded text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Gross Return Value:</span>
              <span className="font-semibold tabular-nums">₹{(summary.creditNoteTotalAmount || 0).toFixed(2)}</span>
            </div>
            {summary.totalCommercialDeductions > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Commercial Deductions:</span>
                <span className="tabular-nums">-₹{summary.totalCommercialDeductions.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-1">
              <span>Net Refund Settled:</span>
              <span className="tabular-nums" style={{ color: brandColor }}>₹{(summary.netRefundPayable || 0).toFixed(2)}</span>
            </div>
            {refund && (
              <div className="text-[11px] text-gray-600 pt-1 border-t flex justify-between">
                <span>Settlement Method:</span>
                <span className="font-bold">{refund.method}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-5 border-t border-gray-300 text-xs text-gray-800 mb-4">
          <div className="text-center">
            <div className="h-10"></div>
            <p className="border-t border-gray-400 px-6 pt-1 font-semibold">Customer Signature</p>
          </div>
          <div className="text-center">
            <div className="h-10"></div>
            <p className="border-t border-gray-400 px-6 pt-1 font-semibold">Received by Staff</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-3 text-[10px] text-gray-500 uppercase tracking-wider">
          Thank you for visiting us. For any queries, please quote receipt #{transaction.transactionNumber}.
        </div>
      </div>
    </div>
  );
}
