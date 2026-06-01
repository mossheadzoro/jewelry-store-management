"use client";

import React from "react";
import InvoiceTableRow from "./InvoiceTableRow";

interface InvoiceTableProps {
  invoices: any[];
  isLoading: boolean;
  onRowClick: (id: string | number) => void;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#1F1F24]">
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 bg-[#1A1A1E] rounded animate-pulse"
            style={{ width: i === 2 ? "120px" : i === 9 ? "60px" : "80px" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function InvoiceTable({
  invoices,
  isLoading,
  onRowClick,
}: InvoiceTableProps) {
  return (
    <div className="rounded-xl border border-[#1F1F24] bg-[#111113] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1F1F24] bg-[#0A0A0B]">
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Invoice No.
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Customer
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Items
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Net Wt
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                GST
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Payment
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-[#6B6560] uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            ) : invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-5 py-16 text-center text-sm text-[#6B6560]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#1A1A1E] flex items-center justify-center mb-2 border border-[#1F1F24]">
                      <svg
                        className="w-6 h-6 text-[#6B6560]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-[#F0EBE0]">No invoices found</span>
                    <span className="text-xs text-[#6B6560]">
                      Try adjusting your search or filter options
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <InvoiceTableRow
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => onRowClick(invoice.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
