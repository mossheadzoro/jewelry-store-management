"use client";

import React from "react";
import { Eye, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatINR, formatWeight } from "@/lib/sales-formatters";

interface InvoiceTableRowProps {
  invoice: {
    id: string | number;
    invoiceNo: string;
    date: string;
    customer: {
      name: string;
      phone: string;
      gstin?: string | null;
    };
    items: any[];
    itemCount: number;
    totalNetWt: number;
    totalAmount: number;
    gst: number;
    paymentMethod: string;
    status: string;
    salesperson: { name: string };
  };
  onClick: () => void;
}

const avatarColors = [
  "#C9943A",
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

export default function InvoiceTableRow({ invoice, onClick }: InvoiceTableRowProps) {
  const router = useRouter();

  const initials = getInitials(invoice.customer.name);
  const avatarBg = getAvatarColor(invoice.customer.name);

  const formattedDate = new Date(invoice.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "PARTIAL":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-red-500/10 text-red-400 border-red-500/20";
    }
  };

  const getPaymentBadgeClass = (method: string) => {
    switch (method) {
      case "CASH":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "UPI":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "CARD":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent sheet open on actions button click
    const target = e.target as HTMLElement;
    if (target.closest(".action-btn-container") || target.closest(".edit-link")) {
      return;
    }
    onClick();
  };

  return (
    <tr
      onClick={handleRowClick}
      className="border-b border-[#1F1F24] hover:bg-[#1A1A1E] transition-colors duration-150 group cursor-pointer"
    >
      {/* Invoice Number */}
      <td className="px-5 py-4">
        <button
          onClick={() => router.push(`/billing/edit/${invoice.id}`)}
          className="edit-link font-mono text-sm text-[#F0EBE0] hover:text-[#C9943A] hover:underline font-semibold transition-colors cursor-pointer text-left focus:outline-none"
        >
          {invoice.invoiceNo}
        </button>
      </td>

      {/* Date */}
      <td className="px-5 py-4">
        <span className="text-sm text-[#6B6560]">{formattedDate}</span>
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
          <span className="text-sm text-[#F0EBE0] font-medium">
            {invoice.customer.name}
          </span>
        </div>
      </td>

      {/* Items qty */}
      <td className="px-5 py-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1A1A1E] border border-[#1F1F24] text-[11px] font-medium text-[#F0EBE0]">
          {invoice.itemCount} item{invoice.itemCount !== 1 ? "s" : ""}
        </span>
      </td>

      {/* Net Wt */}
      <td className="px-5 py-4">
        <span className="text-sm font-mono font-semibold text-[#C9943A] tabular-nums">
          {formatWeight(invoice.totalNetWt)}
        </span>
      </td>

      {/* Total Amount */}
      <td className="px-5 py-4">
        <span className="text-sm font-semibold font-mono text-[#F0EBE0] tabular-nums">
          {formatINR(invoice.totalAmount)}
        </span>
      </td>

      {/* GST */}
      <td className="px-5 py-4">
        <span className="text-sm text-[#6B6560] font-mono tabular-nums">
          {formatINR(invoice.gst)}
        </span>
      </td>

      {/* Payment method */}
      <td className="px-5 py-4">
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getPaymentBadgeClass(invoice.paymentMethod)}`}>
          {invoice.paymentMethod}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusBadgeClass(invoice.status)}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {invoice.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-right">
        <div className="action-btn-container flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onClick()}
            className="p-2 rounded-lg hover:bg-[#222228] text-[#6B6560] hover:text-white transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              window.open(`/billing/invoice/${invoice.id}`, "_blank");
            }}
            className="p-2 rounded-lg hover:bg-[#222228] text-[#6B6560] hover:text-white transition-colors cursor-pointer"
            title="Print Invoice"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
