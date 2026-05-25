"use client";

import React from "react";
import InvoiceTableRow, { type InvoiceData } from "./InvoiceTableRow";

interface InvoiceTableProps {
  invoices: InvoiceData[];
  isLoading: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#222]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 bg-[#222] rounded animate-pulse"
            style={{ width: i === 2 ? "140px" : i === 6 ? "60px" : "90px" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function InvoiceTable({
  invoices,
  isLoading,
}: InvoiceTableProps) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2a2a2a] bg-[#0d0d0d]">
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
              Invoice No.
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
              Date
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
              Customer
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
              Total Amount
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
              GST
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
              Status
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold text-[#888] uppercase tracking-wider">
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
                colSpan={7}
                className="px-5 py-16 text-center text-sm text-[#666]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-[#444]"
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
                  <span>No invoices found</span>
                  <span className="text-xs text-[#555]">
                    Try adjusting your search or date filters
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <InvoiceTableRow key={invoice.id} invoice={invoice} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
