// client/src/app/(main)/purchase/components/CashMovementDrawer.tsx
"use client";

import React from "react";
import { IconX, IconWallet, IconArrowUpRight, IconArrowDownLeft, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

interface CashMovementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  liquidityData: any;
}

export default function CashMovementDrawer({
  isOpen,
  onClose,
  liquidityData,
}: CashMovementDrawerProps) {
  if (!isOpen || !liquidityData) return null;

  const {
    openingCash = 0,
    confirmedSalesCollections = 0,
    confirmedOtherReceipts = 0,
    purchasePayments = 0,
    approvedCashOutflows = 0,
    otherCommittedObligations = 0,
    availableCash = 0,
    outstandingPurchaseCommitments = 0,
    netCashLeftToBook = 0,
    breakdown = [],
  } = liquidityData;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-onyx-surface border-l border-onyx-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gold/15 text-gold">
              <IconWallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-platinum">Cash Liquidity & Movement Breakdown</h2>
              <p className="text-[11px] text-platinum-muted">Formula-Driven Procurement Planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-onyx-elevated text-platinum-muted hover:text-platinum transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Main Formula Card */}
          <div className="rounded-xl bg-onyx-elevated border border-gold/40 p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase text-gold tracking-wider">
              Procurement Liquidity Formula
            </div>
            <div className="text-[11px] text-platinum-muted leading-relaxed font-mono bg-onyx/60 p-2.5 rounded-lg border border-onyx-border">
              Available Cash = Opening Cash + Sales Collections + Receipts - Purchase Payments - Approved Outflows - Committed Obligations
              <br />
              <strong className="text-gold">Net Cash Left to Book = Available Cash - Outstanding Purchase Commitments</strong>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-onyx-border">
              <span className="text-platinum-muted">Calculated Net Cash to Book:</span>
              <span className={`text-lg font-bold ${netCashLeftToBook >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ₹{netCashLeftToBook.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Detailed Ledger Components Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-platinum uppercase tracking-wider">
              Cash Flow Components
            </h3>

            <div className="space-y-2">
              {/* Opening Cash */}
              <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-platinum">Opening Cash Reserves</div>
                  <div className="text-[10px] text-platinum-muted">Base showroom float & vaults</div>
                </div>
                <div className="text-emerald-400 font-bold">+₹{openingCash.toLocaleString("en-IN")}</div>
              </div>

              {/* Confirmed Sales Collections */}
              <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-platinum">Confirmed Sales Collections</div>
                  <div className="text-[10px] text-platinum-muted">Customer invoice payments realized</div>
                </div>
                <div className="text-emerald-400 font-bold">+₹{confirmedSalesCollections.toLocaleString("en-IN")}</div>
              </div>

              {/* Confirmed Other Receipts */}
              <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-platinum">Customer Booking Advances</div>
                  <div className="text-[10px] text-platinum-muted">Product orders & saving scheme deposits</div>
                </div>
                <div className="text-emerald-400 font-bold">+₹{confirmedOtherReceipts.toLocaleString("en-IN")}</div>
              </div>

              {/* Purchase Payments Disbursed */}
              <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-platinum">Disbursed Purchase Payments</div>
                  <div className="text-[10px] text-platinum-muted">Payments made to bullion suppliers</div>
                </div>
                <div className="text-rose-400 font-bold">-₹{purchasePayments.toLocaleString("en-IN")}</div>
              </div>

              {/* Approved Cash Outflows */}
              <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-platinum">Approved Operating Outflows</div>
                  <div className="text-[10px] text-platinum-muted">Branch operational & workshop expenses</div>
                </div>
                <div className="text-rose-400 font-bold">-₹{approvedCashOutflows.toLocaleString("en-IN")}</div>
              </div>

              {/* Subtotal: Available Cash */}
              <div className="p-3.5 rounded-lg bg-onyx border border-gold/30 flex items-center justify-between">
                <span className="font-bold text-platinum">Subtotal: Total Available Cash</span>
                <span className="font-bold text-gold text-sm">₹{availableCash.toLocaleString("en-IN")}</span>
              </div>

              {/* Outstanding Purchase Commitments */}
              <div className="p-3 rounded-lg bg-onyx-elevated border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-rose-300">Outstanding Purchase Commitments</div>
                  <div className="text-[10px] text-platinum-muted">Unpaid bookings & pending invoices</div>
                </div>
                <div className="text-rose-400 font-bold">-₹{outstandingPurchaseCommitments.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          {/* Solvency Status Alert */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            netCashLeftToBook >= 0
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}>
            {netCashLeftToBook >= 0 ? (
              <IconCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <IconAlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            )}
            <div>
              <div className="font-bold text-xs">
                {netCashLeftToBook >= 0 ? "Solvent for Procurement" : "Liquidity Warning: Over-Committed"}
              </div>
              <p className="text-[11px] opacity-90 mt-1">
                {netCashLeftToBook >= 0
                  ? `You have ₹${netCashLeftToBook.toLocaleString("en-IN")} available in uncommitted liquidity to book additional bullion.`
                  : `Current commitments exceed available liquidity by ₹${Math.abs(netCashLeftToBook).toLocaleString("en-IN")}. Prioritize collections before new bookings.`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-onyx-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-xs text-platinum hover:bg-onyx hover:border-gold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
