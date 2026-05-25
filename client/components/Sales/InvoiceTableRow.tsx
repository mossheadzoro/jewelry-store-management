"use client";

import React from "react";
import { Eye, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  cgst: number;
  sgst: number;
  isFullyPaid: boolean;
  balanceAmount: number;
  customer: {
    id: number;
    name: string;
    mobile: string;
    email: string | null;
  };
}

interface InvoiceTableRowProps {
  invoice: InvoiceData;
}

// Deterministic color from name initials
const avatarColors = [
  "#D4A843",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function InvoiceTableRow({ invoice }: InvoiceTableRowProps) {
  const router = useRouter();

  const initials = getInitials(invoice.customer.name);
  const avatarBg = getAvatarColor(invoice.customer.name);
  const gstTotal = invoice.cgst + invoice.sgst;
  const isPaid = invoice.isFullyPaid;

  const formattedDate = new Date(invoice.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <tr className="border-b border-[#222] hover:bg-[#1a1a1a]/60 transition-colors duration-150 group">
      {/* Invoice Number */}
      <td className="px-5 py-4">
        <button
          onClick={() => router.push(`/billing/edit/${invoice.id}`)}
          className="font-mono text-sm text-[#ccc] hover:text-[#D4A843] hover:underline font-medium transition-colors cursor-pointer text-left focus:outline-none"
        >
          {invoice.invoiceNumber}
        </button>
      </td>

      {/* Date */}
      <td className="px-5 py-4">
        <span className="text-sm text-[#888]">{formattedDate}</span>
      </td>

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: avatarBg }}
          >
            {initials}
          </div>
          <span className="text-sm text-white font-medium">
            {invoice.customer.name}
          </span>
        </div>
      </td>

      {/* Total Amount */}
      <td className="px-5 py-4">
        <span className="text-sm font-semibold text-[#D4A843] tabular-nums">
          {formatCurrency(invoice.totalAmount)}
        </span>
      </td>

      {/* GST */}
      <td className="px-5 py-4">
        <span className="text-sm text-[#888] tabular-nums">
          {formatCurrency(gstTotal)}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            PAID
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
            PENDING
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => router.push(`/billing/invoice/${invoice.id}`)}
            className="p-2 rounded-lg hover:bg-[#333] text-[#888] hover:text-white transition-colors cursor-pointer"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              window.open(`/billing/invoice/${invoice.id}`, "_blank");
            }}
            className="p-2 rounded-lg hover:bg-[#333] text-[#888] hover:text-white transition-colors cursor-pointer"
            title="Print Invoice"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export type { InvoiceData };
