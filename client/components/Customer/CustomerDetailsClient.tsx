"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Edit2, Plus, MessageSquare, Download, ShoppingBag, Eye, MapPin, Mail, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditCustomerModal from "./EditCustomerModal";
import DirectCommunicationModal from "./DirectCommunicationModal";

interface CustomerDetailsClientProps {
  customerId: number;
}

export default function CustomerDetailsClient({ customerId }: CustomerDetailsClientProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  
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

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

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

  const handleOrderClick = (orderId: string) => {
    window.open(`/orderBook/print/${orderId}`, "_blank");
  };

  const orders = customer.Order || [];

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
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[22px] font-bold text-[#D4A843]">
                  {initials}
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20 mb-1">
                    {customer.tier || "PLATINUM"} TIER
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#999] mt-1.5">
                    <Phone className="w-3.5 h-3.5" /> +91 {customer.mobile}
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-[13px] text-[#999] mt-1">
                      <Mail className="w-3.5 h-3.5" /> <span className="truncate max-w-[150px]">{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferences Mock (As it's not in DB) */}
              <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] mb-5">
                <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {["Bespoke Rings", "Rose Gold", "Diamonds"].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[#ccc] text-[12px]">{tag}</span>
                  ))}
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
                {orders.length === 0 ? (
                  <div className="bg-[#141414] border border-[#222] rounded-2xl py-12 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-3">📋</span>
                    <p className="text-[#888] text-[14px]">No active or past orders found for this customer.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => {
                      const mainItem = order.items?.[0]?.category?.name || "Bespoke Creation";
                      
                      return (
                        <div 
                          key={order.id} 
                          onClick={() => handleOrderClick(order.id)}
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

    </main>
  );
}
