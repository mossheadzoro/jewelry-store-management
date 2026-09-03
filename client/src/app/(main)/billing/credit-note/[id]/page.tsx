import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/app/(main)/billing/invoice/[id]/PrintButton";
import CreditNoteTemplate from "@/components/Billing/Templates/CreditNoteTemplate";

export default async function CreditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idOrNumber = decodeURIComponent(resolvedParams.id);

  const taxDocument = await prisma.taxDocument.findFirst({
    where: {
      OR: [
        { id: idOrNumber },
        { documentNumber: idOrNumber },
      ],
    },
    include: {
      branch: { include: { settings: true } },
      customer: true,
      originalInvoice: {
        include: {
          items: { include: { product: true } },
        },
      },
      transaction: {
        include: {
          items: {
            include: {
              originalInvoiceItem: { include: { product: true } },
              originalProductItem: true,
              photos: true,
            },
          },
        },
      },
    },
  });

  if (!taxDocument) return notFound();

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111] font-sans printable-page">
      {/* NO-PRINT HEADER NAVBAR */}
      <div className="no-print bg-[#111] text-foreground p-4 flex justify-between items-center shadow-md">
        <Link href="/returns" className="text-[#888] hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Returns & Exchanges
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto bg-white my-8">
        <CreditNoteTemplate taxDocument={taxDocument} />
      </div>

      <style>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .printable-page { 
            background: white !important; 
            padding: 0 !important; 
            margin: 0 !important;
            box-shadow: none !important;
          }
          .printable-page-container {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
