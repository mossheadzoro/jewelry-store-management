"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Edit2, Plus, MessageSquare, Download, ShoppingBag, Eye, MapPin, Mail, Phone, Loader2, Search, Shield, Trash2, Copy, Check, AlertTriangle, FileText, Upload, PiggyBank, X } from "lucide-react";
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
  
  // KYC State
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [uploadTokenLoading, setUploadTokenLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Manual upload form state
  const [manualDocType, setManualDocType] = useState("AADHAR");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  const [manualUploading, setManualUploading] = useState(false);
  const [manualError, setManualError] = useState("");
  
  const [activeTab, setActiveTab] = useState<"ledger" | "orders" | "journey" | "kyc">("ledger");
  
  // Scheme Edit State
  const [editingScheme, setEditingScheme] = useState<any>(null);
  const [editingCardNumber, setEditingCardNumber] = useState("");
  const [editingDuration, setEditingDuration] = useState("");
  const [schemeUpdating, setSchemeUpdating] = useState(false);

  const handleUpdateScheme = async () => {
    if (!editingScheme) return;
    setSchemeUpdating(true);
    try {
      // If we are updating card number
      if (editingCardNumber !== editingScheme.physicalCardNumber) {
        await fetch(`/api/schemes/${editingScheme.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "UPDATE_CARD", physicalCardNumber: editingCardNumber })
        });
      }
      
      // If we are updating maxDurationMonths
      const newDuration = parseInt(editingDuration, 10);
      if (!isNaN(newDuration) && newDuration > editingScheme.maxDurationMonths) {
        await fetch(`/api/schemes/${editingScheme.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "EXTEND", maxDurationMonths: newDuration })
        });
      }

      setEditingScheme(null);
      await fetchDetails();
    } catch (e) {
      alert("Failed to update scheme details.");
    }
    setSchemeUpdating(false);
  };

  const fetchDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}/kyc/list`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setDocsLoading(false);
    }
  }, [customerId]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomer(data.customer);
      await fetchDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [customerId, fetchDocs]);

  const refreshDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        await fetchDocs();
        return data.customer;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, [customerId, fetchDocs]);

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

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFile) return;
    setManualUploading(true);
    setManualError("");
    try {
      const formData = new FormData();
      formData.append("file", manualFile);
      formData.append("documentType", manualDocType);
      formData.append("notes", manualNotes);

      const res = await fetch(`/api/customer/${customerId}/kyc/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setManualError(data.error || "Failed to upload document");
      } else {
        setManualFile(null);
        setManualNotes("");
        setManualError("");
        await fetchDocs();
      }
    } catch (err) {
      console.error(err);
      setManualError("Unexpected error occurred during upload");
    } finally {
      setManualUploading(false);
    }
  };

  const handleDocDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action is permanent and cannot be undone.")) return;
    try {
      const res = await fetch(`/api/customer/${customerId}/kyc/download/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDocs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting document");
    }
  };

  const handleGenerateLink = async () => {
    setUploadTokenLoading(true);
    setCopiedLink(false);
    try {
      const res = await fetch(`/api/customer/${customerId}/kyc/generate-link`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const link = `${window.location.origin}/public/kyc-upload?token=${data.token}`;
        setGeneratedLink(link);
        setShowShareLinkModal(true);
      } else {
        alert(data.error || "Failed to generate upload link");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating upload link");
    } finally {
      setUploadTokenLoading(false);
    }
  };

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

  // Dynamic KYC Compliance logic
  const customerTags = customer.tags || [];
  const isHighValue = customerTags.some((t: any) => t.tagDefinition?.name === "VIP" || t.tagDefinition?.name === "HIGH_VALUE") || 
                      invoices.some((inv: any) => inv.totalAmount > 200000);
  const isCorporate = customerTags.some((t: any) => t.tagDefinition?.name === "CORPORATE" || t.tagDefinition?.name === "WHOLESALE") || 
                      !!customer.gstin;
  const requiresKyc = isHighValue || isCorporate;

  const hasPan = documents.some((d: any) => d.documentType === "PAN");
  const hasAadhar = documents.some((d: any) => d.documentType === "AADHAR");
  const hasGst = documents.some((d: any) => d.documentType === "GST_CERTIFICATE");

  let isCompliant = true;
  let missingReason = "";
  if (isCorporate) {
    isCompliant = hasGst || hasPan;
    if (!isCompliant) missingReason = "B2B/Corporate customer requires a GST Certificate or PAN Document.";
  } else if (isHighValue) {
    isCompliant = hasPan || hasAadhar;
    if (!isCompliant) missingReason = "High-value individual requires a PAN or Aadhar Document (PML Act transaction limit compliance).";
  }

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
                  {requiresKyc && (
                    <div className="mt-3">
                      {isCompliant ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Shield className="w-3 h-3 text-emerald-400" /> PML Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" title={missingReason}>
                          <AlertTriangle className="w-3 h-3 text-red-400" /> KYC Missing
                        </span>
                      )}
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

            {/* Wallet Balances */}
            {customer.CustomerWallet && (
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
                <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-4">Customer Wallet</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#888] mb-1">Cash Balance</span>
                    <span className="text-[20px] font-bold text-white">₹{customer.CustomerWallet.cashBalance?.toLocaleString("en-IN") || "0"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#888] mb-1">24K Metal Balance</span>
                    <span className="text-[20px] font-bold text-[#D4A843]">{customer.CustomerWallet.metal24KBalance?.toFixed(3) || "0.000"} g</span>
                  </div>
                </div>
              </div>
            )}

            {/* Saving Schemes */}
            {customer.savingSchemes && customer.savingSchemes.length > 0 && (
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <PiggyBank className="w-4 h-4 text-[#D4A843]" />
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Saving Schemes</p>
                </div>
                <div className="space-y-3">
                  {customer.savingSchemes.map((scheme: any) => {
                    const isActive = scheme.status === "ACTIVE";
                    const isMatured = scheme.status === "MATURED";
                    
                    return (
                      <div key={scheme.id} className="p-3 border border-[#222] bg-[#0a0a0a] rounded-xl flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-[#D4A843]">{scheme.schemeNumber}</span>
                             {isActive && <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-500 font-bold uppercase">Active</span>}
                             {isMatured && <span className="px-2 py-0.5 rounded text-[9px] bg-[#C9943A]/10 text-[#C9943A] font-bold uppercase">Matured</span>}
                           </div>
                           <p className="text-xs text-[#888] mt-1 flex items-center gap-2">
                             <span>{scheme.type.replace('_', ' ')}</span>
                             {scheme.physicalCardNumber && (
                               <span className="flex items-center gap-1 text-[10px] text-[#555]">
                                 Card: {scheme.physicalCardNumber}
                               </span>
                             )}
                           </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setEditingCardNumber(scheme.physicalCardNumber || "");
                            setEditingDuration(scheme.maxDurationMonths?.toString() || "");
                            setEditingScheme(scheme);
                          }} className="p-2 rounded-lg bg-[#141414] border border-[#222] text-[#888] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                { id: "kyc", label: "KYC & Documents", icon: "🔒" },
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

            {/* Journey Tab */}
            {activeTab === "journey" && (() => {
              // 1. Calculate Preferences from Invoice Items
              const invoicesList = customer.invoices || [];
              
              const categoryCounts: Record<string, number> = {};
              const subCategoryCounts: Record<string, number> = {};
              const karatageCounts: Record<string, number> = {};
              let totalSpentAmount = 0;
              let itemTotalCount = 0;
              let visitCount = invoicesList.length;

              invoicesList.forEach((inv: any) => {
                totalSpentAmount += inv.totalAmount;
                
                const items = inv.items || [];
                items.forEach((item: any) => {
                  const prod = item.product || {};
                  const qty = item.quantity || 1;
                  itemTotalCount += qty;
                  
                  // Category
                  const catName = prod.subCategory?.category?.name;
                  if (catName) {
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + qty;
                  }
                  
                  // Sub-category
                  const subCatName = prod.subCategory?.name;
                  if (subCatName) {
                    subCategoryCounts[subCatName] = (subCategoryCounts[subCatName] || 0) + qty;
                  }
                  
                  // Karatage
                  let karat = "Other";
                  const purityVal = prod.purity;
                  if (purityVal) {
                    if (purityVal >= 90 || purityVal === 22) karat = "22K";
                    else if (purityVal >= 70 || purityVal === 18) karat = "18K";
                    else if (purityVal >= 50 || purityVal === 14) karat = "14K";
                    else if (purityVal >= 35 || purityVal === 9) karat = "9K";
                  }
                  karatageCounts[karat] = (karatageCounts[karat] || 0) + qty;
                });
              });

              // Sort helper
              const getTopPreference = (counts: Record<string, number>) => {
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                return sorted.length > 0 ? sorted[0][0] : null;
              };

              const preferredCategory = getTopPreference(categoryCounts);
              const preferredSubCategory = getTopPreference(subCategoryCounts);
              const preferredKaratage = getTopPreference(karatageCounts);
              const avgSpendPerVisit = visitCount > 0 ? Math.round(totalSpentAmount / visitCount) : 0;

              // Recommendations Generator
              const getRecommendations = () => {
                const recs = [];
                if (preferredCategory) {
                  if (preferredCategory.toUpperCase().includes("GOLD")) {
                    recs.push({
                      title: "22K Bridal Heritage Collection",
                      desc: "Curate a private viewing of our upcoming heavy antique necklace and bangle sets, featuring traditional kundan settings.",
                      affinity: "High Gold Affinity",
                    });
                  } else if (preferredCategory.toUpperCase().includes("DIAMOND")) {
                    recs.push({
                      title: "Solitaire Gala Preview",
                      desc: "Provide exclusive salon access to preview our certified VVS solitaire rings and drop earrings before launch.",
                      affinity: "Solitaire Affinity",
                    });
                  } else if (preferredCategory.toUpperCase().includes("PLATINUM")) {
                    recs.push({
                      title: "Modern Minimalist Platinum Bands",
                      desc: "Highlight our custom-engraved unisex platinum bands, catering to contemporary aesthetics.",
                      affinity: "Platinum Affinity",
                    });
                  }
                }

                if (preferredSubCategory) {
                  recs.push({
                    title: `Elite Custom ${preferredSubCategory} Designing`,
                    desc: `Our master designer is available to sketch personalized variations of ${preferredSubCategory.toLowerCase()} matching their taste.`,
                    affinity: `${preferredSubCategory} Preference`,
                  });
                }

                // Default recommendation if no purchases
                if (recs.length === 0) {
                  recs.push({
                    title: "Welcome Consult & Starter Curation",
                    desc: "Arrange a concierge walkthrough of the showroom category wings to establish initial style preferences.",
                    affinity: "General Discovery",
                  });
                }

                return recs;
              };

              const recommendations = getRecommendations();

              return (
                <div className="space-y-6">
                  {/* Preferences Profile Header */}
                  <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
                    <h3 className="text-[16px] font-bold text-white mb-1.5 flex items-center gap-2">
                      <span>✨</span> Client Taste Profile
                    </h3>
                    <p className="text-[13px] text-[#666] mb-6">
                      Automatically calculated from historical invoice logs to drive personalization and elite concierge actions.
                    </p>

                    {visitCount === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-[#555] text-[14px] italic">No transaction history found to compute preferences yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4">
                        {/* Preferred Category Card */}
                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4.5">
                          <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-2">Preferred Category</span>
                          <span className="text-[20px] font-bold text-white block capitalize">{preferredCategory || "None"}</span>
                          <span className="text-[11px] text-[#D4A843] block mt-1.5 font-medium">
                            {categoryCounts[preferredCategory || ''] || 0} items purchased
                          </span>
                        </div>

                        {/* Preferred Karatage Card */}
                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4.5">
                          <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-2">Preferred Karatage</span>
                          <span className="text-[20px] font-bold text-white block">{preferredKaratage || "None"}</span>
                          <span className="text-[11px] text-[#555] block mt-1.5">
                            {karatageCounts[preferredKaratage || ''] || 0} items with this purity
                          </span>
                        </div>

                        {/* Preferred Articles Card */}
                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4.5">
                          <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-2">Preferred Articles</span>
                          <span className="text-[20px] font-bold text-white block capitalize">{preferredSubCategory || "None"}</span>
                          <span className="text-[11px] text-[#D4A843] block mt-1.5 font-medium">
                            {subCategoryCounts[preferredSubCategory || ''] || 0} items purchased
                          </span>
                        </div>

                        {/* Typical Spend Card */}
                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4.5">
                          <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-2">Typical Spend / Visit</span>
                          <span className="text-[20px] font-bold text-white block">₹ {avgSpendPerVisit.toLocaleString("en-IN")}</span>
                          <span className="text-[11px] text-[#555] block mt-1.5">
                            Across {visitCount} invoice{visitCount > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {visitCount > 0 && (
                    <div className="grid grid-cols-[1.2fr_1fr] gap-6">
                      {/* Left: Preferences breakdown list */}
                      <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 space-y-6">
                        <div>
                          <h4 className="text-[14px] font-bold text-white mb-4 uppercase tracking-wider text-[#D4A843]">Metal & Category Share</h4>
                          <div className="space-y-3.5">
                            {Object.entries(categoryCounts).map(([cat, count]) => {
                              const percent = Math.round((count / itemTotalCount) * 100);
                              return (
                                <div key={cat} className="space-y-1.5">
                                  <div className="flex justify-between text-[13px]">
                                    <span className="text-white capitalize">{cat}</span>
                                    <span className="text-[#888] font-medium">{percent}% ({count} pcs)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden border border-[#222]">
                                    <div className="h-full bg-[#D4A843] rounded-full" style={{ width: `${percent}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="border-t border-[#222] pt-6">
                          <h4 className="text-[14px] font-bold text-white mb-4 uppercase tracking-wider text-[#D4A843]">Sub-category Share</h4>
                          <div className="space-y-3.5">
                            {Object.entries(subCategoryCounts).map(([sub, count]) => {
                              const percent = Math.round((count / itemTotalCount) * 100);
                              return (
                                <div key={sub} className="space-y-1.5">
                                  <div className="flex justify-between text-[13px]">
                                    <span className="text-white capitalize">{sub}</span>
                                    <span className="text-[#888] font-medium">{percent}% ({count} pcs)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden border border-[#222]">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Curated Recommendations */}
                      <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
                        <h4 className="text-[14px] font-bold text-white mb-1.5 uppercase tracking-wider text-[#D4A843]">Concierge Recommendations</h4>
                        <p className="text-[12px] text-[#555] mb-5">Generated recommendations to personalize client relationship touchpoints.</p>
                        
                        <div className="space-y-4">
                          {recommendations.map((rec, index) => (
                            <div key={index} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4.5 relative overflow-hidden group hover:border-[#D4A843]/30 transition-all duration-200">
                              <span className="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-[#D4A843]/10 text-[#D4A843] text-[9px] font-bold uppercase tracking-wider">
                                {rec.affinity}
                              </span>
                              <h5 className="text-[14px] font-bold text-white mb-1.5">{rec.title}</h5>
                              <p className="text-[12px] text-[#888] leading-relaxed">{rec.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* KYC Tab */}
            {activeTab === "kyc" && (
              <div className="space-y-6">
                {/* Compliance Banner */}
                {requiresKyc ? (
                  isCompliant ? (
                    <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-white mb-0.5">PML Compliance Met</h4>
                        <p className="text-[12.5px] text-emerald-400/80 leading-normal">
                          This customer is marked as compliant. The required verification documents are present in their encrypted profile store.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-950/15 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-white mb-0.5">KYC Compliance Missing</h4>
                        <p className="text-[12.5px] text-red-400/85 leading-normal">
                          {missingReason} Transactions above ₹2,00,000 require valid KYC documents under the Prevention of Money Laundering (PML) Act.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#999] flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#999]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-white mb-0.5">KYC Check (Optional)</h4>
                      <p className="text-[12.5px] text-[#888] leading-normal">
                        This client's current spending threshold is below the ₹2,00,000 regulatory compliance limit. Uploading KYC documents is currently optional.
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary KYC Grid */}
                <div className="grid grid-cols-[1.3fr_1fr] gap-6">
                  {/* Left: Document List */}
                  <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-[15px] font-bold text-white mb-0.5">Secure Vault Documents</h3>
                        <p className="text-[12px] text-[#666]">End-to-end encrypted storage nodes</p>
                      </div>
                      <button
                        onClick={handleGenerateLink}
                        disabled={uploadTokenLoading}
                        className="h-9 px-4 rounded-xl border border-[#D4A843]/30 text-[#D4A843] text-[12px] font-bold hover:bg-[#D4A843]/10 hover:border-[#D4A843] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 animate-fade-in"
                      >
                        {uploadTokenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Share Upload Link
                      </button>
                    </div>

                    {docsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
                        <p className="text-[12px] text-[#555]">Querying vault registry...</p>
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-[#222] rounded-xl bg-[#0a0a0a]">
                        <FileText className="w-8 h-8 text-[#444] mx-auto mb-3" />
                        <p className="text-[13px] text-[#555] italic">No KYC documents stored in secure vault</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc: any) => {
                          const docLabels: Record<string, string> = {
                            AADHAR: "Aadhar Card",
                            PAN: "PAN Card",
                            GST_CERTIFICATE: "GST Certificate",
                            OTHER: "Other Proof",
                          };
                          return (
                            <div key={doc.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 flex items-center justify-between hover:border-[#D4A843]/20 transition-all duration-200">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-[#D4A843]/5 border border-[#D4A843]/15 flex items-center justify-center text-[#D4A843]">
                                  <FileText className="w-5 h-5 text-[#D4A843]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-white">{docLabels[doc.documentType] || doc.documentType}</span>
                                    {doc.verified && (
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[12px] text-[#666] truncate max-w-[280px] mt-0.5">{doc.fileName}</p>
                                  {doc.notes && <p className="text-[11px] text-[#444] mt-1 italic">"{doc.notes}"</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/customer/${customerId}/kyc/download/${doc.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 w-8 rounded-lg border border-[#222] text-[#888] hover:text-[#D4A843] hover:border-[#D4A843]/30 flex items-center justify-center transition-all"
                                  title="Download / View Decrypted File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDocDelete(doc.id)}
                                  className="h-8 w-8 rounded-lg border border-[#222] text-[#888] hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Manual Uploader */}
                  <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
                    <h3 className="text-[15px] font-bold text-white mb-1.5">Manual Vault Upload</h3>
                    <p className="text-[12px] text-[#666] mb-5">Manually encrypt and append documents</p>

                    <form onSubmit={handleManualUpload} className="space-y-4">
                      {manualError && (
                        <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-3 text-[12px] text-red-400 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{manualError}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">Document Type</label>
                        <select
                          value={manualDocType}
                          onChange={(e) => setManualDocType(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-[#222] bg-[#0a0a0a] text-white text-[12.5px] font-medium outline-none focus:border-[#D4A843] transition-all cursor-pointer"
                        >
                          <option value="AADHAR">Aadhar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="GST_CERTIFICATE">GST Certificate</option>
                          <option value="OTHER">Other Identification Proof</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">Select File</label>
                        <div className="border border-dashed border-[#222] rounded-xl p-5 bg-[#0a0a0a] text-center relative hover:border-[#D4A843]/20 transition-all cursor-pointer flex flex-col items-center justify-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setManualFile(e.target.files[0]);
                              }
                            }}
                            accept=".pdf,image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Upload className="w-5 h-5 text-[#444] mb-2" />
                          {manualFile ? (
                            <div>
                              <p className="text-[12px] font-semibold text-[#D4A843] truncate max-w-[200px]">{manualFile.name}</p>
                              <p className="text-[10px] text-[#555]">{(manualFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[12px] text-[#888] font-medium">Select PDF or Image</p>
                              <p className="text-[10px] text-[#555] mt-0.5">Maximum size 10MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">Notes</label>
                        <textarea
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="e.g. Scanned copy of original PAN card"
                          rows={2}
                          className="w-full p-2.5 rounded-xl border border-[#222] bg-[#0a0a0a] text-white text-[12px] outline-none focus:border-[#D4A843] transition-all resize-none placeholder-[#333]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!manualFile || manualUploading}
                        className={`w-full h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          manualFile && !manualUploading
                            ? "bg-[#D4A843] text-black hover:bg-[#e6bc5a] cursor-pointer"
                            : "bg-[#1f1f1f] text-[#555] cursor-not-allowed"
                        }`}
                      >
                        {manualUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Encrypting...
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            Encrypt & Upload
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholders for other tabs */}
            {activeTab !== "ledger" && activeTab !== "orders" && activeTab !== "journey" && activeTab !== "kyc" && (
              <div className="bg-[#141414] border border-[#222] rounded-2xl py-20 flex flex-col items-center justify-center text-center px-4">
                <span className="text-4xl mb-4">❤️</span>
                <h3 className="text-white font-semibold text-lg mb-2">Module in Development</h3>
                <p className="text-[#777] text-sm max-w-sm">This section is currently being designed for the next iteration of the Atelier ERP.</p>
              </div>
            )}
          </div>

        </div>
      </div>


      {/* Share Upload Link Modal */}
      {showShareLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowShareLinkModal(false)} />
          <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl z-50 animate-scale-up">
            <h3 className="text-[17px] font-bold text-white mb-1.5 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-[#D4A843]" />
              Secure Self-Upload Link
            </h3>
            <p className="text-[12.5px] text-[#666] mb-5 leading-normal">
              Copy and send this unique single-use link to the customer. It enables uploading KYC documents securely to Atelier vaults and expires in 24 hours.
            </p>

            <div className="flex items-center gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 h-10 px-3 rounded-xl border border-[#222] bg-[#0a0a0a] text-white text-[12px] outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="h-10 px-4 rounded-xl bg-[#D4A843] text-black text-[12px] font-bold hover:bg-[#e6bc5a] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222]">
              <button
                onClick={() => setShowShareLinkModal(false)}
                className="h-9 px-4 rounded-lg text-[13px] text-white bg-[#1a1a1a] border border-[#252525] hover:bg-[#222] transition-all cursor-pointer"
              >
                Close Portal Link
              </button>
            </div>
          </div>
        </div>
      )}

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
        onOrderUpdated={fetchDetails}
      />

      {/* Edit Scheme Modal */}
      {editingScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingScheme(null)} />
          <div className="relative w-full max-w-sm bg-[#0D0D0F] border border-[#1F1F24] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-[#F0EBE0]">Edit Scheme</h3>
                <p className="text-xs text-[#C9943A] mt-0.5">{editingScheme.schemeNumber}</p>
              </div>
              <button onClick={() => setEditingScheme(null)} className="p-1.5 rounded-lg hover:bg-[#1A1A1D] text-[#6B6560] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-[#F0EBE0] mb-2 block">Physical Card Number</label>
                <input
                  type="text"
                  value={editingCardNumber}
                  onChange={(e) => setEditingCardNumber(e.target.value)}
                  placeholder="Enter card number"
                  className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:border-[#C9943A]/50 outline-none"
                />
              </div>

              {editingScheme.type !== "ANONYMOUS_DEPOSIT" && (
                <div>
                  <label className="text-xs font-medium text-[#F0EBE0] mb-2 block">Duration (Months)</label>
                  <input
                    type="number"
                    value={editingDuration}
                    onChange={(e) => setEditingDuration(e.target.value)}
                    placeholder="Extend duration"
                    min={editingScheme.maxDurationMonths}
                    className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:border-[#C9943A]/50 outline-none"
                  />
                  <p className="text-[10px] text-[#6B6560] mt-1">Note: You can only extend the duration.</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpdateScheme}
              disabled={schemeUpdating}
              className="w-full py-2.5 rounded-xl bg-[#C9943A] text-black text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {schemeUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      )}

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
