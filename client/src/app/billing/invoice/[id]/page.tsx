
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "../../../../../libs/prisma";
import PrintButton from "./PrintButton";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoiceId = parseInt(resolvedParams.id);

  if (isNaN(invoiceId)) return notFound();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      branch: true,
      items: {
        include: { product: true }
      },
      payments: true,
    }
  });

  if (!invoice) return notFound();

  // Parse excess gold info from payment refs
  const cashOutPayment = invoice.payments.find(p => 
    p.paymentRef?.includes("OLD Gold Cashed Out")
  );
  const cashToCustomerPayment = invoice.payments.find(p => 
    p.paymentRef?.includes("Cash Given to Customer (Old Gold Excess Settlement)")
  );
  const returnGoldPayment = invoice.payments.find(p => 
    p.paymentRef?.includes("Excess Gold Returned to Customer")
  );

  // Regular payments (exclude excess gold settlement entries)
  const regularPayments = invoice.payments.filter(p => 
    !p.paymentRef?.includes("OLD Gold Cashed Out") &&
    !p.paymentRef?.includes("Cash Given to Customer (Old Gold Excess Settlement)") &&
    !p.paymentRef?.includes("Excess Gold Returned to Customer")
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111] font-sans printable-page">
      {/* NO-PRINT HEADER NAVBAR */}
      <div className="no-print bg-[#111] text-white p-4 flex justify-between items-center shadow-md">
        <Link href="/billing" className="text-[#888] hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <PrintButton />
      </div>

      <div className="max-w-[800px] mx-auto bg-white my-8 p-12 shadow-2xl border border-gray-200">

        {/* HEADER */}
        <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase text-black">TAX INVOICE</h1>
            <p className="font-semibold text-gray-700">{invoice.branch.name}</p>
            <p className="text-sm text-gray-500">{invoice.branch.address}, {invoice.branch.city}, {invoice.branch.state} {invoice.branch.pincode}</p>
            <p className="text-sm text-gray-500">Phone: {invoice.branch.phone} | Email: {invoice.branch.email}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-gray-800 text-lg">Invoice #: {invoice.invoiceNumber}</h3>
            <p className="text-sm font-medium text-gray-600">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p className="text-sm font-medium text-gray-600">Time: {new Date(invoice.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* CUSTOMER DETAILS */}
        <div className="mb-8">
          <h3 className="font-bold text-sm bg-gray-100 px-3 py-1.5 uppercase tracking-wide border-l-4 border-black mb-3">BILLED TO</h3>
          <div className="px-3">
            <p className="text-xl font-bold">{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.mobile}</p>
            {invoice.customer.email && <p className="text-gray-600">{invoice.customer.email}</p>}
            <p className="text-gray-600 max-w-[300px]">{invoice.customer.address}, {invoice.customer.city}, {invoice.customer.state} {invoice.customer.pincode}</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-8 overflow-hidden rounded-md border border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 font-semibold text-sm">#</th>
                <th className="px-4 py-2 font-semibold text-sm">Description</th>
                <th className="px-4 py-2 font-semibold text-sm text-right">Qty</th>
                <th className="px-4 py-2 font-semibold text-sm text-right">Net Wt</th>
                <th className="px-4 py-2 font-semibold text-sm text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, i) => (
                <tr key={item.id} className="text-sm">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold block">{item.product.name}</span>
                    <span className="text-gray-500 text-xs">Code: {item.product.productCode}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.ntWeight.toFixed(3)}g</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">₹{item.totalAfterTax.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS & TAX BOXES */}
        <div className="flex justify-between items-start pt-6 border-t border-gray-300">

          {/* PAYMENTS */}
          <div className="w-1/2 pr-8">
            <h3 className="font-bold text-sm bg-gray-100 px-3 py-1.5 uppercase tracking-wide border-l-4 border-gray-400 mb-3">PAYMENT INFO</h3>
            <ul className="text-sm divide-y divide-gray-100">
              {regularPayments.map((p, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span className="font-medium text-gray-700">{p.method}</span>
                  <span className="tabular-nums">₹{p.amount.toFixed(2)}</span>
                </li>
              ))}

              {/* OLD Gold Cashed Out */}
              {cashOutPayment && (
                <li className="py-3 border-t border-amber-200 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-700 text-xs uppercase tracking-wide">OLD Gold Cashed Out</span>
                    <span className="tabular-nums font-bold text-amber-700">₹{cashOutPayment.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic leading-tight">
                    Cash Settlement Rate Applied<br />
                    (after refining & handling adjustments)
                  </p>
                </li>
              )}

              {/* Cash Given to Customer */}
              {cashToCustomerPayment && (
                <li className="py-2 flex justify-between bg-amber-50 px-2 rounded">
                  <span className="font-bold text-amber-800 text-xs">💰 Cash Given to Customer</span>
                  <span className="tabular-nums font-bold text-amber-800">₹{Math.abs(cashToCustomerPayment.amount).toFixed(2)}</span>
                </li>
              )}

              {/* Excess Gold Returned */}
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

          {/* TOTALS */}
          <div className="w-1/2 bg-gray-50 p-6 rounded border border-gray-200">
            <div className="flex justify-between text-sm py-1 text-gray-600">
              <span>Metal Value</span>
              <span className="tabular-nums">₹{invoice.totalMetalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 text-gray-600">
              <span>Making Charges</span>
              <span className="tabular-nums">₹{invoice.totalMakingAmount.toFixed(2)}</span>
            </div>
            {(invoice.cgst > 0 || invoice.sgst > 0) && (
              <div className="flex justify-between text-sm py-1 text-gray-600 border-t border-gray-200 mt-2 pt-2">
                <span>Tax (CGST + SGST)</span>
                <span className="tabular-nums">₹{(invoice.cgst + invoice.sgst).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold bg-black text-white px-4 py-3 mt-4 rounded-sm shadow-md">
              <span>Grand Total</span>
              <span className="tabular-nums">₹{invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-16 text-center border-t border-gray-200 pt-8 text-gray-500 text-xs">
          <p>Thank you for your business.</p>
          <p>Terms and conditions clearly stated inside standard warranty policies.</p>
        </div>

      </div>

      <style>{`
        @media print {
          body { 
            background: white !important; 
          }
          .no-print { 
            display: none !important; 
          }
          .printable-page { 
            background: white; 
            padding: 0;
          }
          .max-w-[800px] {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}
      </style>
    </div>
  );
}
