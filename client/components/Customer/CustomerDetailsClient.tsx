"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Edit2, Plus, MessageSquare, Download, ShoppingBag, Eye, MapPin, Mail, Phone, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditCustomerModal from "./EditCustomerModal";
import DirectCommunicationModal from "./DirectCommunicationModal";
import OrderDetailsModal from "./OrderDetailsModal";

interface CustomerDetailsClientProps {
  customerId: number;
}

export default function CustomerDetailsClient({ customerId }: CustomerDetailsClientProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  
  const [activeTab, setActiveTab] = useState<"ledger" | "orders" | "journey" | "wishlist">("ledger");

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomer(data.customer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const refreshDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        return data.customer;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, [customerId]);

  useEffect(() => {
    // Evaluate system tags first, then fetch details
    fetch(`/api/customer/tags/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    })
      .catch((err) => console.error("Error evaluating customer tags:", err))
      .finally(() => {
        fetchDetails();
      });
  }, [customerId, fetchDetails]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <p className="text-white text-lg">Customer not found</p>
        <Link href="/customer" className="text-[#D4A843] hover:underline mt-4">Back to Customers</Link>
      </div>
    );
  }

  const initials = customer.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  
  // Calculate LTV and Due from invoices
  let lifetimeValue = 0;
  let currentDue = 0;
  
  const invoices = customer.invoices || [];
  invoices.forEach((inv: any) => {
    lifetimeValue += inv.paidAmount || (inv.totalAmount - inv.balanceAmount) || 0;
    currentDue += inv.balanceAmount || 0;
  });

  const handleInvoiceClick = (invId: number) => {
    router.push(`/billing/invoice/${invId}`); // Assuming this route exists
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
  };

  const orders = customer.Order || [];

  // Filter orders by search query
  const filteredOrders = orders.filter((order: any) => {
    const q = orderSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesNo = order.orderNumber?.toLowerCase().includes(q);
    const matchesStatus = order.status?.toLowerCase().includes(q);
    const matchesItem = order.items?.some((item: any) => 
      item.category?.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
    return matchesNo || matchesStatus || matchesItem;
  });

  return (
    <main className="flex-1 min-h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link href="/customer" className="inline-flex items-center gap-2 text-[13px] text-[#888] hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Atelier Clients
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[36px] font-bold text-white tracking-tight leading-tight">{customer.name}</h1>
              <p className="text-[14px] text-[#777] mt-1.5 flex items-center gap-2">
                Client ID: <span className="text-[#D4A843] font-medium">#{customer.customerCode || `AT-${customer.id.toString().padStart(4, '0')}-V`}</span>
                <span>•</span>
                <span>Member since {new Date(customer.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowEditModal(true)}
                className="h-10 px-5 rounded-full border border-[#333] text-[#ccc] text-[13px] font-medium flex items-center gap-2 hover:bg-[#1a1a1a] hover:text-white hover:border-[#444] transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
              <button 
                onClick={() => setShowCommModal(true)}
                className="h-10 w-10 rounded-full border border-[#333] text-[#ccc] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-[#D4A843] hover:border-[#D4A843]/50 transition-all"
                title="Message Customer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button 
                onClick={() => router.push(`/billing/create?customerId=${customer.id}`)}
                className="h-10 px-5 rounded-full bg-[#D4A843] text-black text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all"
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_2.2fr] gap-6">
          
          {/* Left Column - Profile & Stats */}
          <div className="space-y-6">
            
            {/* Profile Card */}
            <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[22px] font-bold text-[#D4A843] flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] text-[#999]">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" /> +91 {customer.mobile}
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-[13px] text-[#999] mt-1.5">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-[13px] text-[#999] mt-1.5 leading-normal">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{customer.address}, {customer.city}, {customer.state} - {customer.pincode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details (DOB, Anniversary, PAN, Aadhar, GSTIN) */}
              <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] mb-5 space-y-3">
                <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest border-b border-[#161616] pb-1.5">Patron Info</p>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                  <div>
                    <span className="text-[#555] block text-[10px] uppercase font-semibold">Date of Birth</span>
                    <span className="text-[#ccc]">{customer.dob ? new Date(customer.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block text-[10px] uppercase font-semibold">Anniversary</span>
                    <span className="text-[#ccc]">{customer.anniversary ? new Date(customer.anniversary).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block text-[10px] uppercase font-semibold">Gender</span>
                    <span className="text-[#ccc] capitalize">{customer.gender ? customer.gender.toLowerCase() : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block text-[10px] uppercase font-semibold">PAN</span>
                    <span className="text-[#ccc] uppercase">{customer.pan || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#555] block text-[10px] uppercase font-semibold">Aadhar</span>
                    <span className="text-[#ccc] tracking-wider">{customer.aadhar || '—'}</span>
                  </div>
                  {customer.gstin && (
                    <div className="col-span-2">
                      <span className="text-[#555] block text-[10px] uppercase font-semibold">GSTIN</span>
                      <span className="text-[#ccc] uppercase">{customer.gstin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Tags Section */}
              <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Active Tags</p>
                  <button
                    onClick={() => setShowManageTagsModal(true)}
                    className="text-[11px] font-semibold text-[#D4A843] hover:text-[#e6bc5a] hover:underline cursor-pointer transition-colors"
                  >
                    Manage Tags
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customer.tags && customer.tags.length > 0 ? (
                    customer.tags.map((assignment: any) => {
                      const tag = assignment.tagDefinition;
                      const colorMap: Record<string, string> = {
                        gold: "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30",
                        red: "bg-red-500/10 text-red-400 border-red-500/25",
                        blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
                        gray: "bg-gray-500/10 text-gray-400 border-gray-500/25",
                        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                        orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
                        purple: "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/25",
                      };
                      const colorClass = colorMap[tag.color.toLowerCase()] || "bg-gray-500/10 text-gray-400 border-gray-500/25";
                      return (
                        <span
                          key={assignment.id}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${colorClass}`}
                          title={`${tag.type === "SYSTEM" ? "System-generated" : "Manually-assigned"}: ${tag.description || ''}`}
                        >
                          {tag.label}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[12px] text-[#444] italic">No active tags</span>
                  )}
                </div>
              </div>

              {/* Visit Stats */}
              <div className="flex border-t border-[#222] pt-5">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Last Visited</p>
                  <p className="text-[14px] text-white font-medium">
                    {invoices.length > 0 ? new Date(invoices[0].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div className="w-px bg-[#222] mx-4"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Loyalty Points</p>
                  <p className="text-[16px] text-[#D4A843] font-bold">{Math.floor(lifetimeValue / 100)}</p>
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-[#777]" />
                  <p className="text-[10px] font-bold text-[#777] uppercase tracking-widest">Current Due</p>
                </div>
                <p className="text-[24px] font-bold text-white">₹{currentDue.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#D4A843] text-sm">💎</span>
                  <p className="text-[10px] font-bold text-[#777] uppercase tracking-widest">Lifetime Value</p>
                </div>
                <p className="text-[24px] font-bold text-[#D4A843]">₹{lifetimeValue.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Concierge Notes */}
            <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Concierge Notes</p>
                <Edit2 className="w-3.5 h-3.5 text-[#D4A843]" />
              </div>
              <div className="p-4 rounded-xl border border-[#D4A843]/20 border-l-2 border-l-[#D4A843] bg-[#D4A843]/5">
                <p className="text-[13px] text-[#ccc] italic leading-relaxed">
                  "Prefers private viewings after 5 PM. Celebrating anniversary next year, looking for a statement piece. Averse to heavy settings."
                </p>
              </div>
            </div>

          </div>

          {/* Right Column - Ledger & Tabs */}
          <div>
            
            {/* Tabs Header */}
            <div className="flex items-center gap-8 border-b border-[#222] mb-6">
              {[
                { id: "ledger", label: "Transaction Ledger", icon: "🧾" },
                { id: "orders", label: "Commissioned Orders", icon: "💎" },
                { id: "journey", label: "Purchase Journey", icon: "📈" },
                { id: "wishlist", label: "Wishlist & Try-ons", icon: "❤️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 text-[13px] font-semibold transition-all border-b-2 ${
                    activeTab === tab.id 
                    ? "text-[#D4A843] border-[#D4A843]" 
                    : "text-[#666] border-transparent hover:text-[#999]"
                  }`}
                >
                  <span className="text-[14px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "ledger" && (
              <div className="space-y-4">
                
                {/* Ledger Summary */}
                <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 flex items-center justify-between mb-2">
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Total Bills</p>
                      <p className="text-[20px] font-bold text-white">{invoices.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Avg. Order Value</p>
                      <p className="text-[20px] font-bold text-white">
                        ₹{invoices.length > 0 ? Math.round(lifetimeValue / invoices.length).toLocaleString("en-IN") : 0}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 text-[12px] text-[#aaa] hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                    Export Statement
                  </button>
                </div>

                {/* Invoices List */}
                {invoices.length === 0 ? (
                  <div className="bg-[#141414] border border-[#222] rounded-2xl py-12 flex flex-col items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-[#333] mb-3" />
                    <p className="text-[#888] text-[14px]">No transactions found for this customer.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((inv: any) => {
                      // Get primary item name
                      const mainItem = inv.items?.[0]?.product?.name || "Bespoke Creation";
                      const itemDesc = inv.items?.[0]?.product?.subCategory?.name || "Jewellery";
                      
                      return (
                        <div 
                          key={inv.id} 
                          onClick={() => handleInvoiceClick(inv.id)}
                          className="bg-[#141414] border border-[#222] rounded-2xl p-5 flex items-center justify-between hover:border-[#333] hover:bg-[#1a1a1a] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-5">
                            {/* Icon/Image Placeholder */}
                            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center text-[#D4A843] group-hover:scale-105 transition-transform">
                               💎
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/billing/edit/${inv.id}`);
                                  }}
                                  className="text-[15px] font-bold text-[#D4A843] hover:text-[#e6bc5a] hover:underline cursor-pointer transition-colors"
                                >
                                  {inv.invoiceNumber}
                                </h4>
                                <span className="text-[12px] text-[#666]">• {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <p className="text-[13px] text-[#999] mt-1">{mainItem}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-10">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Total</p>
                              <p className="text-[16px] font-bold text-white">₹{inv.totalAmount.toLocaleString("en-IN")}</p>
                            </div>
                            
                            <div className={`px-3 py-1 rounded-full border text-[11px] font-bold tracking-wider ${
                              inv.isFullyPaid 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            }`}>
                              {inv.isFullyPaid ? "• PAID" : "• PENDING"}
                            </div>
                            
                            <ArrowLeft className="w-4 h-4 text-[#444] group-hover:text-white transition-colors rotate-180" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {invoices.length > 0 && (
                  <button className="w-full py-4 rounded-full border border-[#222] text-[#888] text-[12px] font-bold uppercase tracking-widest hover:text-white hover:border-[#333] transition-colors mt-4">
                    Load Previous Years
                  </button>
                )}
              </div>
            )}

            {/* Orders Tab Content */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                
                {/* Search Bar for Orders */}
                {orders.length > 0 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search orders by number, category, or status..."
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#D4A843]/40 transition-colors"
                    />
                  </div>
                )}

                {orders.length === 0 ? (
                  <div className="bg-[#141414] border border-[#222] rounded-2xl py-12 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-3">📋</span>
                    <p className="text-[#888] text-[14px]">No active or past orders found for this customer.</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-[#141414] border border-[#222] rounded-2xl py-12 flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-[#333] mb-3" />
                    <p className="text-[#888] text-[14px]">No orders matching your search query.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order: any) => {
                      const mainItem = order.items?.[0]?.category?.name || "Bespoke Creation";
                      
                      return (
                        <div 
                          key={order.id} 
                          onClick={() => handleOrderClick(order)}
                          className="bg-[#141414] border border-[#222] rounded-2xl p-5 flex items-center justify-between hover:border-[#333] hover:bg-[#1a1a1a] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center text-[#D4A843] group-hover:scale-105 transition-transform">
                               ✨
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-[15px] font-bold text-white">#{order.orderNumber}</h4>
                                <span className="text-[12px] text-[#666]">• {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <p className="text-[13px] text-[#999] mt-1">{mainItem} {order.advance?.advanceReceiptNumber ? `(Slip: ${order.advance.advanceReceiptNumber})` : ""}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-10">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Status</p>
                              <p className="text-[14px] font-bold text-white">{order.status.replace("_", " ")}</p>
                            </div>
                            
                            <ArrowLeft className="w-4 h-4 text-[#444] group-hover:text-white transition-colors rotate-180" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Placeholders for other tabs */}
            {activeTab !== "ledger" && activeTab !== "orders" && (
              <div className="bg-[#141414] border border-[#222] rounded-2xl py-20 flex flex-col items-center justify-center text-center px-4">
                <span className="text-4xl mb-4">{activeTab === "journey" ? "📈" : "❤️"}</span>
                <h3 className="text-white font-semibold text-lg mb-2">Module in Development</h3>
                <p className="text-[#777] text-sm max-w-sm">This section is currently being designed for the next iteration of the Atelier ERP.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      <EditCustomerModal
        open={showEditModal}
        customerId={customer.id}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => fetchDetails()}
      />

      <DirectCommunicationModal
        open={showCommModal}
        customer={customer}
        onClose={() => setShowCommModal(false)}
      />

      <OrderDetailsModal
        open={!!selectedOrder}
        order={selectedOrder}
        customerName={customer.name}
        customerMobile={customer.mobile}
        onClose={() => setSelectedOrder(null)}
        onSuccess={async () => {
          const updatedCustomer = await refreshDetails();
          if (selectedOrder && updatedCustomer) {
            const updatedOrder = updatedCustomer.Order?.find((o: any) => o.id === selectedOrder.id);
            if (updatedOrder) {
              setSelectedOrder(updatedOrder);
            } else {
              setSelectedOrder(null);
            }
          }
        }}
      />

      <ManageTagsModal
        open={showManageTagsModal}
        onClose={() => setShowManageTagsModal(false)}
        customerId={customer.id}
        currentTags={customer.tags || []}
        onSuccess={() => fetchDetails()}
      />

    </main>
  );
}

interface ManageTagsModalProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
  currentTags: any[];
  onSuccess: () => void;
}

function ManageTagsModal({ open, onClose, customerId, currentTags, onSuccess }: ManageTagsModalProps) {
  const [manualTags, setManualTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Custom tag creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("gray");
  const [creating, setCreating] = useState(false);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/tags/definitions");
      if (res.ok) {
        const data = await res.json();
        // filter to manual tags
        const manuals = data.definitions.filter((d: any) => d.type === "MANUAL");
        setManualTags(manuals);
      }
    } catch (err) {
      console.error("Failed to fetch definitions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchDefinitions();
      // Initialize selectedTagIds with customer's current manual tags
      const currentManualIds = currentTags
        .filter((t: any) => t.tagDefinition.type === "MANUAL")
        .map((t: any) => t.tagDefinitionId);
      setSelectedTagIds(currentManualIds);
    }
  }, [open, currentTags, fetchDefinitions]);

  if (!open) return null;

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/customer/tags/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, tagIds: selectedTagIds }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save tag assignments");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const name = newName.trim() || newLabel.trim().toUpperCase().replace(/\s+/g, "_");
      const res = await fetch("/api/customer/tags/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          label: newLabel.trim(),
          description: newDesc.trim() || undefined,
          color: newColor,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdDef = data.definition;
        setManualTags((prev) => [...prev, createdDef]);
        setSelectedTagIds((prev) => [...prev, createdDef.id]);
        
        // Reset form
        setNewLabel("");
        setNewName("");
        setNewDesc("");
        setNewColor("gray");
        setShowCreateForm(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create tag definition");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred while creating tag");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl z-50 max-h-[85vh] overflow-y-auto flex flex-col">
        <h3 className="text-[18px] font-bold text-white mb-1">Manage Customer Tags</h3>
        <p className="text-[13px] text-[#666] mb-5">Assign or remove manual tags. System tags are evaluated automatically.</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#555] uppercase tracking-widest block">Manual Tags</label>
              {manualTags.length === 0 ? (
                <p className="text-[13px] text-[#555] italic">No manual tags defined yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {manualTags.map((tag) => {
                    const isChecked = selectedTagIds.includes(tag.id);
                    const colorMap: Record<string, string> = {
                      gold: "border-[#D4A843]/30 text-[#D4A843] bg-[#D4A843]/10",
                      red: "border-red-500/30 text-red-400 bg-red-500/10",
                      blue: "border-blue-500/30 text-blue-400 bg-blue-500/10",
                      gray: "border-gray-500/30 text-gray-400 bg-gray-500/10",
                      green: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                      orange: "border-orange-500/30 text-orange-400 bg-orange-500/10",
                      purple: "border-purple-500/30 text-purple-400 bg-purple-500/10",
                    };
                    const activeColorClass = colorMap[tag.color.toLowerCase()] || "border-gray-500/30 text-gray-400 bg-gray-500/10";
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-[13px] text-left transition-all ${
                          isChecked
                            ? `${activeColorClass} font-semibold`
                            : "border-[#222] bg-[#161616] text-[#888] hover:border-[#333] hover:text-[#ccc]"
                        }`}
                      >
                        <span>{tag.label}</span>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked ? "border-current text-current" : "border-[#444]"
                        }`}>
                          {isChecked && "✓"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Tag Creation */}
            <div className="border-t border-[#222] pt-4">
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full h-9 rounded-xl border border-dashed border-[#333] text-[13px] text-[#888] hover:text-white hover:border-[#444] transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Custom Tag Definition
                </button>
              ) : (
                <form onSubmit={handleCreateTag} className="space-y-3 p-3.5 bg-[#161616] border border-[#222] rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#D4A843] uppercase tracking-wider">New Tag Definition</span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-[11px] text-[#666] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">Label</label>
                    <input
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Friends & Family"
                      className="w-full h-8 px-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white outline-none focus:border-[#D4A843]/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">System Code (Opt)</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                        placeholder="FRIENDS_FAMILY"
                        className="w-full h-8 px-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[11px] text-white outline-none focus:border-[#D4A843]/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">Color</label>
                      <select
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white outline-none focus:border-[#D4A843]/40 appearance-none cursor-pointer"
                      >
                        <option value="gray">Gray</option>
                        <option value="gold">Gold</option>
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">Description</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Tag description..."
                      className="w-full h-8 px-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[12px] text-white outline-none focus:border-[#D4A843]/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full h-8 rounded-lg bg-[#D4A843] text-black text-[12px] font-semibold hover:bg-[#e6bc5a] transition-all disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Save Tag Definition"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#222]">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[13px] text-[#999] bg-[#1a1a1a] border border-[#252525] hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-[#D4A843] text-black hover:bg-[#e6bc5a] transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
