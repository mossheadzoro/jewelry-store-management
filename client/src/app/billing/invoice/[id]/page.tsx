
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "../../../../../libs/prisma";
import PrintButton from "./PrintButton";
import StandardInvoiceTemplate from "@/components/Billing/Templates/StandardInvoiceTemplate";
import LuxuryInvoiceTemplate from "@/components/Billing/Templates/LuxuryInvoiceTemplate";
import ModernInvoiceTemplate from "@/components/Billing/Templates/ModernInvoiceTemplate";
import PremiumInvoiceTemplate from "@/components/Billing/Templates/PremiumInvoiceTemplate";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoiceId = parseInt(resolvedParams.id);

  if (isNaN(invoiceId)) return notFound();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      branch: {
        include: { settings: true }
      },
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
      <div className="no-print bg-[#111] text-foreground p-4 flex justify-between items-center shadow-md">
        <Link href="/billing" className="text-[#888] hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <PrintButton />
      </div>

      <div className={`mx-auto bg-white my-8 ${invoice.branch.settings?.invoiceFormat === 'luxury' || invoice.branch.settings?.invoiceFormat === 'modern' || invoice.branch.settings?.invoiceFormat === 'premium' ? '' : 'p-12 shadow-2xl border border-gray-200'}`}>
        {invoice.branch.settings?.invoiceFormat === "premium" ? (
          <PremiumInvoiceTemplate 
            invoice={invoice} 
            regularPayments={regularPayments} 
            cashOutPayment={cashOutPayment} 
            cashToCustomerPayment={cashToCustomerPayment} 
            returnGoldPayment={returnGoldPayment} 
          />
        ) : invoice.branch.settings?.invoiceFormat === "modern" ? (
          <ModernInvoiceTemplate 
            invoice={invoice} 
            regularPayments={regularPayments} 
            cashOutPayment={cashOutPayment} 
            cashToCustomerPayment={cashToCustomerPayment} 
            returnGoldPayment={returnGoldPayment} 
          />
        ) : invoice.branch.settings?.invoiceFormat === "luxury" ? (
          <LuxuryInvoiceTemplate 
            invoice={invoice} 
            regularPayments={regularPayments} 
            cashOutPayment={cashOutPayment} 
            cashToCustomerPayment={cashToCustomerPayment} 
            returnGoldPayment={returnGoldPayment} 
          />
        ) : (
          <StandardInvoiceTemplate 
            invoice={invoice} 
            regularPayments={regularPayments} 
            cashOutPayment={cashOutPayment} 
            cashToCustomerPayment={cashToCustomerPayment} 
            returnGoldPayment={returnGoldPayment} 
          />
        )}
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
          .printable-page-container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: ${invoice.branch.settings?.invoicePageSize === 'A5' ? 'A5' : 'A4'};
            margin: 10mm;
          }
        }
      `}
      </style>
    </div>
  );
}
