"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  PackageMinus,
  AlertTriangle,
  Users,
  Award,
  Cake,
  Heart,
  CreditCard,
  FileSpreadsheet,
  Hammer,
  Phone,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export type ModalType =
  | "slowMoving"
  | "lowStock"
  | "outOfStock"
  | "newCustomers"
  | "vipCustomers"
  | "celebrations"
  | "advances"
  | "outstanding"
  | "workshop"
  | null;

interface DashboardModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  data: any;
}

export function DashboardModals({ activeModal, onClose, data }: DashboardModalsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [celebrationTab, setCelebrationTab] = useState<"birthdays" | "anniversaries">("birthdays");

  if (!activeModal || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-[#27272a] rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative text-platinum">
        {/* Header */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-gradient-to-r from-[#18181c] to-[#121215]">
          <div className="flex items-center gap-3">
            {activeModal === "slowMoving" && (
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <PackageMinus className="w-5 h-5" />
              </div>
            )}
            {(activeModal === "lowStock" || activeModal === "outOfStock") && (
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {activeModal === "newCustomers" && (
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            )}
            {activeModal === "vipCustomers" && (
              <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                <Award className="w-5 h-5" />
              </div>
            )}
            {activeModal === "celebrations" && (
              <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Cake className="w-5 h-5" />
              </div>
            )}
            {activeModal === "advances" && (
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
            )}
            {activeModal === "outstanding" && (
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            )}
            {activeModal === "workshop" && (
              <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                <Hammer className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {activeModal === "slowMoving" && "Slow-Moving Inventory Audit"}
                {activeModal === "lowStock" && "Low Stock Subcategories"}
                {activeModal === "outOfStock" && "Out of Stock Subcategories"}
                {activeModal === "newCustomers" && "Newly Registered Customers"}
                {activeModal === "vipCustomers" && "VIP & Top Customer Registry"}
                {activeModal === "celebrations" && "Today's Customer Celebrations"}
                {activeModal === "advances" && "Order & Booking Advances Ledger"}
                {activeModal === "outstanding" && "Outstanding & Unpaid Invoices"}
                {activeModal === "workshop" && "Workshop Jobs & Active Orders"}
              </h2>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                {activeModal === "slowMoving" && "Items with prolonged unsold duration in inventory"}
                {activeModal === "lowStock" && "Subcategories requiring immediate inventory replenishment"}
                {activeModal === "outOfStock" && "Subcategories with zero stock available"}
                {activeModal === "newCustomers" && "New clients acquired during the selected date range"}
                {activeModal === "vipCustomers" && "High-value and VIP tagged customer accounts"}
                {activeModal === "celebrations" && "Special greetings and engagement for birthdays & anniversaries"}
                {activeModal === "advances" && "Advances received from customer bookings and order tokens"}
                {activeModal === "outstanding" && "Invoices with pending receivable balances"}
                {activeModal === "workshop" && "Production status, assigned Karigars, and delivery deadlines"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1e1e24] hover:bg-[#2a2a32] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar / Filters */}
        <div className="px-6 py-3 border-b border-[#27272a]/60 bg-[#16161a] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, code, phone, or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#0e0e11] border border-[#27272a] rounded-xl text-[12px] text-platinum placeholder:text-zinc-600 focus:outline-none focus:border-gold/50"
            />
          </div>

          {activeModal === "celebrations" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCelebrationTab("birthdays")}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
                  celebrationTab === "birthdays"
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Cake className="w-3.5 h-3.5" /> Birthdays ({data?.customerInsights?.birthdayCustomers?.length || 0})
              </button>
              <button
                onClick={() => setCelebrationTab("anniversaries")}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
                  celebrationTab === "anniversaries"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Heart className="w-3.5 h-3.5" /> Anniversaries ({data?.customerInsights?.anniversaryCustomers?.length || 0})
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
          {/* 1. SLOW MOVING INVENTORY */}
          {activeModal === "slowMoving" && (
            <div className="space-y-3">
              {(() => {
                const items = (data?.productIntelligence?.allSlowMovingItems || []).filter((item: any) =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.subCategoryName?.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (items.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No slow-moving inventory items found matching your criteria.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[#18181c] border border-[#27272a] flex items-center gap-3.5 hover:border-gold/30 transition-all"
                      >
                        <div className="w-14 h-14 rounded-xl bg-[#222228] border border-[#33333d] overflow-hidden flex items-center justify-center shrink-0 relative">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-gold/40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-[13px] text-platinum truncate">{item.name}</h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider ${
                                item.daysUnsold >= 120
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : item.daysUnsold >= 90
                                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {item.daysUnsold} DAYS UNSOLD
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {item.categoryName} • {item.subCategoryName}
                          </p>

                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-300">
                            <span>Code: <strong className="text-platinum">{item.productCode}</strong></span>
                            <span>Weight: <strong className="text-gold">{item.gsWeight}g</strong></span>
                            <span>Stock: <strong className="text-emerald-400">{item.quantity}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 2. LOW STOCK & OUT OF STOCK SUBCATEGORIES */}
          {(activeModal === "lowStock" || activeModal === "outOfStock") && (
            <div className="space-y-4">
              {(() => {
                const subcategories = (
                  activeModal === "lowStock"
                    ? data?.inventoryHealth?.lowStockSubcategories || []
                    : data?.inventoryHealth?.outOfStockSubcategories || []
                ).filter((sub: any) =>
                  sub.subCategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sub.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (subcategories.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No subcategories currently flagged for this stock level.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {subcategories.map((sub: any) => (
                      <div
                        key={sub.subCategoryId}
                        className="p-4 rounded-2xl bg-[#18181c] border border-[#27272a] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">
                              {sub.categoryName}
                            </span>
                            <h4 className="font-bold text-[14px] text-platinum">{sub.subCategoryName}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                                activeModal === "outOfStock"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {activeModal === "outOfStock"
                                ? `${sub.outOfStockCount || 0} Items Out of Stock`
                                : `${sub.totalUnits} Units Total (${sub.lowStockCount} low stock items)`}
                            </span>
                            <Link
                              href="/inventory"
                              className="text-[11px] font-medium text-gold hover:underline flex items-center gap-1 ml-2"
                            >
                              <span>Restock</span> <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                        {sub.items && sub.items.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-[#27272a]/50">
                            {sub.items.map((prod: any) => (
                              <div
                                key={prod.id}
                                className="p-2 rounded-xl bg-[#111113] border border-[#222227] flex items-center justify-between text-[11px]"
                              >
                                <span className="font-medium text-zinc-300 truncate max-w-[140px]">{prod.name}</span>
                                <span className="font-bold text-amber-400">{prod.quantity} left</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 3. NEW CUSTOMERS */}
          {activeModal === "newCustomers" && (
            <div className="space-y-3">
              {(() => {
                const customers = (data?.customerInsights?.newCustomersList || []).filter((c: any) =>
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (customers.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No new customers registered in this period.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-[#27272a]/60 border border-[#27272a] rounded-2xl overflow-hidden bg-[#18181c]">
                    {customers.map((c: any) => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-[#1f1f25] transition-colors">
                        <div>
                          <h4 className="font-semibold text-[13px] text-platinum">{c.name}</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {c.mobile} • {c.city || "Store Customer"} • Joined {new Date(c.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/91${c.mobile.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={`tel:${c.mobile}`}
                            className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center transition-colors"
                            title="Call Customer"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 4. VIP CUSTOMERS */}
          {activeModal === "vipCustomers" && (
            <div className="space-y-3">
              {(() => {
                const customers = (data?.customerInsights?.vipCustomersList || []).filter((c: any) =>
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (customers.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No VIP customers found matching your criteria.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customers.map((c: any) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-[#18181c] border border-gold/20 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[13px] text-foreground">{c.name}</h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                              VIP
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {c.mobile} • {c.city || "Store City"}
                          </p>
                          <div className="text-[11px] text-zinc-300 mt-1">
                            Invoices: <strong className="text-platinum">{c._count?.invoices || 0}</strong> • Orders: <strong className="text-platinum">{c._count?.Order || 0}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/91${c.mobile.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 5. CELEBRATIONS */}
          {activeModal === "celebrations" && (
            <div className="space-y-3">
              {(() => {
                const list =
                  celebrationTab === "birthdays"
                    ? data?.customerInsights?.birthdayCustomers || []
                    : data?.customerInsights?.anniversaryCustomers || [];

                const filtered = list.filter((c: any) =>
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.mobile.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No customer {celebrationTab} recorded for today.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-[#27272a]/60 border border-[#27272a] rounded-2xl overflow-hidden bg-[#18181c]">
                    {filtered.map((c: any) => {
                      const msg =
                        celebrationTab === "birthdays"
                          ? `Happy Birthday ${c.name}! Wishing you a glittering year ahead from all of us at our jewellery store.`
                          : `Happy Anniversary ${c.name}! Wishing you love, prosperity and elegance from our jewellery store.`;

                      return (
                        <div key={c.id} className="p-4 flex items-center justify-between hover:bg-[#1f1f25] transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                celebrationTab === "birthdays"
                                  ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {celebrationTab === "birthdays" ? <Cake className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                            </div>

                            <div>
                              <h4 className="font-semibold text-[13px] text-platinum">{c.name}</h4>
                              <p className="text-[11px] text-zinc-400">
                                {c.mobile} • {c.city || "Customer"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/91${c.mobile.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Send Greetings</span>
                            </a>
                            <a
                              href={`tel:${c.mobile}`}
                              className="w-8 h-8 rounded-xl bg-[#222228] hover:bg-[#2d2d35] text-zinc-300 flex items-center justify-center transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. ADVANCES */}
          {activeModal === "advances" && (
            <div className="space-y-3">
              {(() => {
                const advances = (data?.finance?.advancesList || []).filter((a: any) =>
                  a.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.customerMobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.reference?.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (advances.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No advance payments recorded in this period.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-[#27272a]/60 border border-[#27272a] rounded-2xl overflow-hidden bg-[#18181c]">
                    {advances.map((a: any) => (
                      <div key={a.id} className="p-4 flex items-center justify-between hover:bg-[#1f1f25] transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-gold">{a.reference}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#25252b] text-zinc-400 font-medium">
                              {a.type === "BOOKING_ADVANCE" ? "Product Booking" : "Custom Order"}
                            </span>
                          </div>
                          <h4 className="font-semibold text-[13px] text-platinum mt-1">{a.customerName}</h4>
                          <p className="text-[11px] text-zinc-400">
                            {a.customerMobile} • Mode: <span className="uppercase text-zinc-300">{a.mode}</span> • {new Date(a.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-emerald-400">
                            ₹{a.amount.toLocaleString("en-IN")}
                          </span>
                          <p className="text-[10px] text-zinc-500">Advance Received</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 7. OUTSTANDING INVOICES */}
          {activeModal === "outstanding" && (
            <div className="space-y-3">
              {(() => {
                const invoices = (data?.finance?.outstandingInvoicesList || []).filter((inv: any) =>
                  inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  inv.customer?.mobile?.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (invoices.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No outstanding receivables found.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-[#27272a]/60 border border-[#27272a] rounded-2xl overflow-hidden bg-[#18181c]">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-[#1f1f25] transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-platinum">{inv.invoiceNumber}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/20">
                              DUE
                            </span>
                          </div>
                          <h4 className="font-semibold text-[13px] text-zinc-200 mt-1">{inv.customer?.name}</h4>
                          <p className="text-[11px] text-zinc-400">
                            {inv.customer?.mobile} • Total: ₹{inv.totalAmount.toLocaleString("en-IN")} • Paid: ₹{inv.paidAmount.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-rose-400">
                            ₹{inv.balanceAmount.toLocaleString("en-IN")}
                          </span>
                          <p className="text-[10px] text-zinc-500">Balance Pending</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 8. WORKSHOP & ORDERS */}
          {activeModal === "workshop" && (
            <div className="space-y-3">
              {(() => {
                const orders = (data?.workshopOrders?.workshopOrdersList || []).filter((o: any) =>
                  o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (o.karigar && o.karigar.name.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (orders.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-[13px]">
                      No active workshop orders found.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {orders.map((o: any) => (
                      <div key={o.id} className="p-4 rounded-2xl bg-[#18181c] border border-[#27272a] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-gold">{o.orderNumber}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                o.priority === "URGENT" || o.priority === "RUSH"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {o.priority}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">
                              {o.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-gold" />
                            <span>Due: <strong className="text-platinum">{new Date(o.deliveryDate).toLocaleDateString("en-IN")}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[12px] pt-1">
                          <div>
                            <span className="text-zinc-400">Customer:</span> <strong className="text-platinum">{o.customerName}</strong> ({o.customerMobile})
                          </div>
                          <div>
                            <span className="text-zinc-400">Karigar:</span> <strong className="text-gold">{o.karigar?.name || "Unassigned"}</strong>
                          </div>
                        </div>

                        {o.items && o.items.length > 0 && (
                          <div className="pt-2 border-t border-[#27272a]/50 text-[11px] text-zinc-400">
                            Items: {o.items.map((i: any) => `${i.category?.name || "Jewellery"} (${i.weight || 0}g)`).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#16161a] flex items-center justify-between text-[12px] text-zinc-500">
          <span>Enterprise Real-time Executive Insights</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-onyx-elevated hover:bg-[#25252b] text-platinum border border-[#27272a] font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
