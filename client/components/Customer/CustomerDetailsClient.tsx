"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Edit2,
  Plus,
  MessageSquare,
  Download,
  ShoppingBag,
  Eye,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Search,
  Shield,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Upload,
  PiggyBank,
  X,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Send,
  Lock,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import EditCustomerModal from "./EditCustomerModal";
import DirectCommunicationModal from "./DirectCommunicationModal";
import OrderDetailsModal from "./OrderDetailsModal";

interface CustomerDetailsClientProps {
  customerId: number;
}

export default function CustomerDetailsClient({ customerId }: CustomerDetailsClientProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role || "SALESMAN";
  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Tabs: ledger, orders, journey, kyc, profileLedger
  const [activeTab, setActiveTab] = useState<
    "ledger" | "orders" | "journey" | "kyc" | "profileLedger"
  >("ledger");

  // KYC State
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [uploadTokenLoading, setUploadTokenLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // KYC Verification / Rejection Modal State
  const [verifyModalDoc, setVerifyModalDoc] = useState<any>(null);
  const [verifyAction, setVerifyAction] = useState<"VERIFY" | "REJECT">("VERIFY");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Manual upload form state
  const [manualDocType, setManualDocType] = useState("AADHAR");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  const [manualUploading, setManualUploading] = useState(false);
  const [manualError, setManualError] = useState("");

  // Unified Transaction Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Profile Change Ledger (Audit Trail) State
  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [profileLogsLoading, setProfileLogsLoading] = useState(false);
  const [profileLogActionFilter, setProfileLogActionFilter] = useState("");
  const [profileLogRoleFilter, setProfileLogRoleFilter] = useState("");
  const [profileLogSearch, setProfileLogSearch] = useState("");

  // Scheme Edit State
  const [editingScheme, setEditingScheme] = useState<any>(null);
  const [editingCardNumber, setEditingCardNumber] = useState("");
  const [editingDuration, setEditingDuration] = useState("");
  const [schemeUpdating, setSchemeUpdating] = useState(false);

  const handleUpdateScheme = async () => {
    if (!editingScheme) return;
    setSchemeUpdating(true);
    try {
      if (editingCardNumber !== editingScheme.physicalCardNumber) {
        await fetch(`/api/schemes/${editingScheme.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UPDATE_CARD",
            physicalCardNumber: editingCardNumber,
          }),
        });
      }

      const newDuration = parseInt(editingDuration, 10);
      if (!isNaN(newDuration) && newDuration > editingScheme.maxDurationMonths) {
        await fetch(`/api/schemes/${editingScheme.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "EXTEND",
            maxDurationMonths: newDuration,
          }),
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

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}/ledger`);
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data.ledger || []);
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  }, [customerId]);

  const fetchProfileLedger = useCallback(async () => {
    setProfileLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (profileLogActionFilter) params.set("action", profileLogActionFilter);
      if (profileLogRoleFilter) params.set("role", profileLogRoleFilter);
      if (profileLogSearch.trim()) params.set("search", profileLogSearch.trim());

      const res = await fetch(`/api/customer/${customerId}/profile-ledger?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProfileLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching profile change ledger:", err);
    } finally {
      setProfileLogsLoading(false);
    }
  }, [customerId, profileLogActionFilter, profileLogRoleFilter, profileLogSearch]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomer(data.customer);
      await Promise.all([fetchDocs(), fetchLedger(), fetchProfileLedger()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [customerId, fetchDocs, fetchLedger, fetchProfileLedger]);

  const refreshDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        await Promise.all([fetchDocs(), fetchLedger(), fetchProfileLedger()]);
        return data.customer;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, [customerId, fetchDocs, fetchLedger, fetchProfileLedger]);

  useEffect(() => {
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

  // When activeTab changes to profileLedger, refetch profile change ledger
  useEffect(() => {
    if (activeTab === "profileLedger") {
      fetchProfileLedger();
    }
  }, [activeTab, fetchProfileLedger]);

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
        await fetchProfileLedger();
      }
    } catch (err) {
      console.error(err);
      setManualError("Unexpected error occurred during upload");
    } finally {
      setManualUploading(false);
    }
  };

  const handleDocDelete = async (docId: string) => {
    if (!isManagerOrAdmin) {
      alert("Permission Denied: Only Managers can delete documents from the vault.");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to delete this document? This will remove the file from secure storage and be logged permanently in the audit ledger."
      )
    )
      return;
    try {
      const res = await fetch(`/api/customer/${customerId}/kyc/download/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDocs();
        await fetchProfileLedger();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting document");
    }
  };

  const handleOpenVerifyModal = (doc: any, action: "VERIFY" | "REJECT") => {
    if (!isManagerOrAdmin) {
      alert("Permission Denied: KYC document verification and approval requires Manager or Admin authority.");
      return;
    }
    setVerifyModalDoc(doc);
    setVerifyAction(action);
    setVerifyNotes("");
  };

  const handleConfirmVerification = async () => {
    if (!verifyModalDoc) return;
    setVerifyLoading(true);
    try {
      const res = await fetch(
        `/api/customer/${customerId}/kyc/verify/${verifyModalDoc.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: verifyAction,
            notes: verifyAction === "VERIFY" ? verifyNotes : undefined,
            reason: verifyAction === "REJECT" ? verifyNotes : undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Verification update failed.");
      } else {
        setVerifyModalDoc(null);
        await fetchDocs();
        await fetchProfileLedger();
      }
    } catch (err) {
      console.error(err);
      alert("Network error during verification.");
    } finally {
      setVerifyLoading(false);
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
        await fetchProfileLedger();
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
      <div className="flex-1 min-h-screen bg-onyx flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 min-h-screen bg-onyx flex flex-col items-center justify-center">
        <p className="text-foreground text-lg">Customer not found</p>
        <Link href="/customer" className="text-[#D4A843] hover:underline mt-4">
          Back to Customers
        </Link>
      </div>
    );
  }

  const initials = customer.name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  let lifetimeValue = 0;
  let currentDue = 0;

  const invoices = customer.invoices || [];
  invoices.forEach((inv: any) => {
    lifetimeValue += inv.paidAmount || inv.totalAmount - inv.balanceAmount || 0;
    currentDue += inv.balanceAmount || 0;
  });

  const wallet = customer?.CustomerWallet;
  const computedCashBalance = wallet?.cashBalance || 0;
  const computed24KBalance = wallet?.metal24KBalance || 0;
  const computed22KBalance = wallet?.metal22KBalance || 0;
  const hasWalletActivity = computedCashBalance > 0 || computed24KBalance > 0 || computed22KBalance > 0 || !!wallet;

  // Dynamic KYC Compliance logic
  const customerTags = customer.tags || [];
  const isHighValue =
    customerTags.some(
      (t: any) =>
        t.tagDefinition?.name === "VIP" || t.tagDefinition?.name === "HIGH_VALUE"
    ) || invoices.some((inv: any) => inv.totalAmount > 200000);
  const isCorporate =
    customerTags.some(
      (t: any) =>
        t.tagDefinition?.name === "CORPORATE" ||
        t.tagDefinition?.name === "WHOLESALE"
    ) || !!customer.gstin;
  const requiresKyc = isHighValue || isCorporate;

  const hasPanDoc = documents.some((d: any) => d.documentType === "PAN" && d.verified);
  const hasAadharDoc = documents.some((d: any) => d.documentType === "AADHAR" && d.verified);
  const hasGstDoc = documents.some((d: any) => d.documentType === "GST_CERTIFICATE" && d.verified);
  const hasAnyVerifiedDoc = documents.some((d: any) => d.verified);

  let isCompliant = true;
  let missingReason = "";
  if (isCorporate) {
    isCompliant = hasGstDoc || hasPanDoc;
    if (!isCompliant)
      missingReason =
        "Corporate / B2B client requires verified GST Certificate or PAN Document.";
  } else if (isHighValue) {
    isCompliant = hasPanDoc || hasAadharDoc || hasAnyVerifiedDoc;
    if (!isCompliant)
      missingReason =
        "High-value retail client (> ₹2,00,000) requires verified PAN or Aadhaar document under PML Act regulations.";
  }

  const handleInvoiceClick = (invId: number) => {
    router.push(`/billing/invoice/${invId}`);
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
  };

  const orders = customer.Order || [];
  const filteredOrders = orders.filter((order: any) => {
    const q = orderSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesNo = order.orderNumber?.toLowerCase().includes(q);
    const matchesStatus = order.status?.toLowerCase().includes(q);
    const matchesItem = order.items?.some(
      (item: any) =>
        item.category?.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
    return matchesNo || matchesStatus || matchesItem;
  });

  return (
    <main className="flex-1 min-h-screen bg-onyx overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        
        {/* Navigation & Role Context */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/customer"
              className="inline-flex items-center gap-2 text-[13px] text-[#888] hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Atelier Clients
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                  isManagerOrAdmin
                    ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                    : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                }`}
              >
                {isManagerOrAdmin ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                {userRole} Responsibility Level
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[36px] font-bold text-foreground tracking-tight leading-tight">
                {customer.name}
              </h1>
              <p className="text-[14px] text-[#777] mt-1.5 flex items-center gap-2">
                Client ID:{" "}
                <span className="text-[#D4A843] font-medium">
                  #{customer.customerCode || `AT-${customer.id.toString().padStart(4, "0")}`}
                </span>
                <span>•</span>
                <span>
                  Member since{" "}
                  {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="h-10 px-5 rounded-full border border-border text-[#ccc] text-[13px] font-medium flex items-center gap-2 hover:bg-onyx-elevated hover:text-foreground hover:border-[#444] transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
              <button
                onClick={() => setShowCommModal(true)}
                className="h-10 w-10 rounded-full border border-border text-[#ccc] flex items-center justify-center hover:bg-onyx-elevated hover:text-[#D4A843] hover:border-[#D4A843]/50 transition-all cursor-pointer"
                title="Message Customer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/billing/create?customerId=${customer.id}`)}
                className="h-10 px-5 rounded-full bg-[#D4A843] text-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                New Invoice
              </button>
            </div>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-[380px_1fr] gap-8">
          {/* Left Column: Dossier Card */}
          <div className="space-y-6">
            <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#D4A843]/15 border border-[#D4A843]/30 flex items-center justify-center text-[22px] font-bold text-[#D4A843] flex-shrink-0 shadow-lg">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-bold text-foreground truncate">{customer.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-bold text-[#D4A843] px-2 py-0.5 rounded-full bg-[#D4A843]/10 border border-[#D4A843]/20 uppercase tracking-wide">
                      {customerTags.some((t: any) => t.tagDefinition?.name === "VIP")
                        ? "VIP Patron"
                        : "Atelier Client"}
                    </span>
                    {customer.gender && (
                      <span className="text-[11px] text-[#777] font-medium uppercase tracking-wide">
                        • {customer.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#555] uppercase tracking-wider">
                    Assigned Tags
                  </span>
                  <button
                    onClick={() => setShowManageTagsModal(true)}
                    className="text-[11px] text-[#D4A843] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus className="w-3 h-3" /> Manage
                  </button>
                </div>
                {customer.tags && customer.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags.map((t: any) => {
                      const colorMap: Record<string, string> = {
                        gold: "border-[#D4A843]/30 text-[#D4A843] bg-[#D4A843]/10",
                        red: "border-red-500/30 text-red-400 bg-red-500/10",
                        blue: "border-blue-500/30 text-blue-400 bg-blue-500/10",
                        gray: "border-gray-500/30 text-muted-foreground bg-gray-500/10",
                        green: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                        orange: "border-orange-500/30 text-orange-400 bg-orange-500/10",
                        purple: "border-purple-500/30 text-purple-400 bg-purple-500/10",
                      };
                      const activeColor =
                        colorMap[t.tagDefinition.color?.toLowerCase()] ||
                        "border-gray-500/30 text-muted-foreground bg-gray-500/10";
                      return (
                        <span
                          key={t.id}
                          className={`text-[11px] font-semibold px-2.5 py-0.8 rounded-lg border ${activeColor}`}
                        >
                          {t.tagDefinition.label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#555] italic">No active tags</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3.5 border-t border-[#222] pt-5">
                <div className="flex items-center gap-3 text-[13px]">
                  <Phone className="w-4 h-4 text-[#D4A843] flex-shrink-0" />
                  <span className="text-[#ccc]">+91 {customer.mobile}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 text-[13px]">
                    <Mail className="w-4 h-4 text-[#D4A843] flex-shrink-0" />
                    <span className="text-[#ccc] truncate">{customer.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-[13px]">
                  <MapPin className="w-4 h-4 text-[#D4A843] flex-shrink-0 mt-0.5" />
                  <span className="text-[#999] leading-relaxed">
                    {customer.address ? `${customer.address}, ` : ""}
                    {customer.city}, {customer.state} - {customer.pincode}
                  </span>
                </div>
              </div>

              {/* Tax & Financial Identifiers */}
              <div className="border-t border-[#222] pt-4 mt-4 space-y-2 text-[12px]">
                <div className="flex items-center justify-between text-[#888]">
                  <span>PAN:</span>
                  <span className="text-foreground font-mono font-medium">
                    {customer.pan || "Not Provided"}
                  </span>
                </div>
                {customer.gstin && (
                  <div className="flex items-center justify-between text-[#888]">
                    <span>GSTIN:</span>
                    <span className="text-foreground font-mono font-medium">{customer.gstin}</span>
                  </div>
                )}
                {customer.aadhar && (
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Aadhaar:</span>
                    <span className="text-foreground font-mono font-medium">
                      XXXX-XXXX-{customer.aadhar.slice(-4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Wallet Summary */}
              {hasWalletActivity && (
                <div className="border-t border-[#222] pt-4 mt-4">
                  <span className="text-[11px] font-bold text-[#555] uppercase tracking-wider block mb-2">
                    Client Wallet
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-onyx p-2.5 rounded-xl border border-[#222] text-center">
                      <p className="text-[10px] text-[#777]">Cash</p>
                      <p className="text-[13px] font-bold text-foreground">₹{computedCashBalance.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-onyx p-2.5 rounded-xl border border-[#222] text-center">
                      <p className="text-[10px] text-[#D4A843]">24K Gold</p>
                      <p className="text-[13px] font-bold text-[#D4A843]">{computed24KBalance}g</p>
                    </div>
                    <div className="bg-onyx p-2.5 rounded-xl border border-[#222] text-center">
                      <p className="text-[10px] text-amber-500">22K Gold</p>
                      <p className="text-[13px] font-bold text-amber-500">{computed22KBalance}g</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tabs & Main Content */}
          <div>
            {/* Tab Header Navigation */}
            <div className="flex items-center gap-6 border-b border-[#222] mb-6 overflow-x-auto">
              {[
                { id: "ledger", label: "Transaction Ledger", icon: "🧾" },
                { id: "orders", label: "Commissioned Orders", icon: "💎" },
                { id: "journey", label: "Purchase Journey", icon: "📈" },
                { id: "kyc", label: "KYC & Compliance", icon: "🔒" },
                { id: "profileLedger", label: "Profile Change Ledger", icon: "🛡️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3.5 text-[13px] font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "text-[#D4A843] border-[#D4A843]"
                      : "text-[#666] border-transparent hover:text-[#999]"
                  }`}
                >
                  <span className="text-[14px]">{tab.icon}</span>
                  {tab.label}
                  {tab.id === "kyc" && documents.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#222] text-[#aaa]">
                      {documents.length}
                    </span>
                  )}
                  {tab.id === "profileLedger" && profileLogs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#D4A843]/15 text-[#D4A843]">
                      {profileLogs.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB 1: Transaction Ledger */}
            {activeTab === "ledger" && (
              <div className="space-y-4">
                <div className="bg-onyx-surface border border-[#222] rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">
                        Total Transactions
                      </p>
                      <p className="text-[20px] font-bold text-foreground">{ledgerEntries.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">
                        Total Invoices
                      </p>
                      <p className="text-[20px] font-bold text-foreground">{invoices.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">
                        Lifetime Value
                      </p>
                      <p className="text-[20px] font-bold text-foreground">
                        ₹{lifetimeValue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 text-[12px] text-[#aaa] hover:text-foreground transition-colors cursor-pointer">
                    <Download className="w-4 h-4" /> Export Ledger
                  </button>
                </div>

                {ledgerLoading ? (
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin mb-3" />
                    <p className="text-[#888] text-[14px]">Loading transactions...</p>
                  </div>
                ) : ledgerEntries.length === 0 ? (
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
                    <FileText className="w-8 h-8 text-[#444] mb-3" />
                    <p className="text-[#888] text-[14px]">No financial transactions recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ledgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-onyx-surface border border-[#222] rounded-xl p-4 flex items-center justify-between hover:border-[#D4A843]/20 transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-onyx flex items-center justify-center text-[#D4A843] border border-[#222]">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-foreground">
                                {entry.title}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-[#888] uppercase">
                                {entry.type}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#666] mt-0.5">{entry.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {entry.amount !== null && (
                            <p className="text-[14px] font-bold text-foreground">
                              ₹{entry.amount.toLocaleString("en-IN")}
                            </p>
                          )}
                          {entry.metalWeight !== null && (
                            <p className="text-[13px] font-bold text-[#D4A843]">
                              {entry.metalWeight}g Fine Gold
                            </p>
                          )}
                          <p className="text-[11px] text-[#555] mt-0.5">
                            {new Date(entry.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Commissioned Orders */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search orders..."
                    className="w-[280px] h-9 px-3.5 rounded-xl bg-onyx-surface border border-[#222] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40"
                  />
                  <button
                    onClick={() => router.push(`/orderBook?customerMobile=${customer.mobile}`)}
                    className="h-9 px-4 rounded-xl bg-[#D4A843] text-foreground text-[12px] font-bold hover:bg-[#e6bc5a] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Bespoke Order
                  </button>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="w-8 h-8 text-[#444] mb-3" />
                    <p className="text-[#888] text-[14px]">No active bespoke orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((ord: any) => (
                      <div
                        key={ord.id}
                        onClick={() => handleOrderClick(ord)}
                        className="bg-onyx-surface border border-[#222] rounded-xl p-4 flex items-center justify-between hover:border-[#D4A843]/30 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-foreground">
                              Order #{ord.orderNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4A843]/15 text-[#D4A843] font-bold uppercase">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#666] mt-0.5">
                            {ord.items?.length || 1} item(s) • Target Delivery:{" "}
                            {ord.deliveryDate
                              ? new Date(ord.deliveryDate).toLocaleDateString("en-IN")
                              : "Standard"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[12px] text-[#D4A843] flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View Slip
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Purchase Journey */}
            {activeTab === "journey" && (
              <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-onyx p-4 rounded-xl border border-[#222]">
                    <p className="text-[11px] text-[#777] uppercase tracking-wider mb-1">
                      Total Invoices
                    </p>
                    <p className="text-[22px] font-bold text-foreground">{invoices.length}</p>
                  </div>
                  <div className="bg-onyx p-4 rounded-xl border border-[#222]">
                    <p className="text-[11px] text-[#777] uppercase tracking-wider mb-1">
                      Lifetime Spend
                    </p>
                    <p className="text-[22px] font-bold text-[#D4A843]">
                      ₹{lifetimeValue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-onyx p-4 rounded-xl border border-[#222]">
                    <p className="text-[11px] text-[#777] uppercase tracking-wider mb-1">
                      Current Outstanding
                    </p>
                    <p className="text-[22px] font-bold text-red-400">
                      ₹{currentDue.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#222] pt-6">
                  <h3 className="text-[14px] font-bold text-foreground mb-4">Invoice Milestones</h3>
                  {invoices.length === 0 ? (
                    <p className="text-[13px] text-[#666] italic">No purchases recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {invoices.map((inv: any) => (
                        <div
                          key={inv.id}
                          className="bg-onyx border border-[#222] rounded-xl p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-foreground">
                              Invoice #{inv.invoiceNumber}
                            </p>
                            <p className="text-[12px] text-[#666]">
                              {new Date(inv.createdAt).toLocaleDateString("en-IN")} • Paid: ₹
                              {inv.paidAmount?.toLocaleString("en-IN") || 0}
                            </p>
                          </div>
                          <p className="text-[14px] font-bold text-foreground">
                            ₹{inv.totalAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: KYC & Vault Documents */}
            {activeTab === "kyc" && (
              <div className="space-y-6">
                {/* Compliance Assessment Banner */}
                {requiresKyc ? (
                  isCompliant ? (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-foreground mb-0.5">
                          Regulatory PML Compliance Met
                        </h4>
                        <p className="text-[12.5px] text-emerald-400/80 leading-normal">
                          Client dossier satisfies regulatory AML/PML verification guidelines. Verified identity proofs are secured in the encrypted vault.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 flex-shrink-0">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-foreground mb-0.5">
                          KYC Verification Required
                        </h4>
                        <p className="text-[12.5px] text-red-400/85 leading-normal">
                          {missingReason} High-value transactions require verified identity documents before high-tier transactions can be finalized.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-[#999] flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#999]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-foreground mb-0.5">
                        Standard Client KYC Status
                      </h4>
                      <p className="text-[12.5px] text-[#888] leading-normal">
                        This client's current spending is below the ₹2,00,000 regulatory compliance limit. Identity document upload is optional.
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary KYC Grid */}
                <div className="grid grid-cols-[1.3fr_1fr] gap-6">
                  {/* Left: Document Vault List */}
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-[15px] font-bold text-foreground mb-0.5">
                          Secure Vault Documents
                        </h3>
                        <p className="text-[12px] text-[#666]">
                          AES-256 encrypted client identity proofs
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateLink}
                        disabled={uploadTokenLoading}
                        className="h-9 px-4 rounded-xl border border-[#D4A843]/30 text-[#D4A843] text-[12px] font-bold hover:bg-[#D4A843]/10 hover:border-[#D4A843] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {uploadTokenLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Share Upload Link
                      </button>
                    </div>

                    {docsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
                        <p className="text-[12px] text-[#555]">Querying vault registry...</p>
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-[#222] rounded-xl bg-onyx">
                        <FileText className="w-8 h-8 text-[#444] mx-auto mb-3" />
                        <p className="text-[13px] text-[#555] italic">
                          No KYC documents stored in secure vault
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc: any) => {
                          const docLabels: Record<string, string> = {
                            AADHAR: "Aadhaar Card",
                            PAN: "PAN Card",
                            GST_CERTIFICATE: "GST Certificate",
                            PASSPORT: "Passport",
                            DRIVING_LICENSE: "Driving License",
                            VOTER_ID: "Voter ID",
                            OTHER: "Other Proof",
                          };
                          const isVerified = !!doc.verified;
                          const isRejected = doc.notes?.startsWith("[REJECTED]");

                          return (
                            <div
                              key={doc.id}
                              className="bg-onyx border border-[#1a1a1a] rounded-xl p-4 flex items-center justify-between hover:border-[#D4A843]/20 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                                    isVerified
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                      : isRejected
                                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                                      : "bg-[#D4A843]/10 border-[#D4A843]/20 text-[#D4A843]"
                                  }`}
                                >
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-foreground">
                                      {docLabels[doc.documentType] || doc.documentType}
                                    </span>
                                    {isVerified ? (
                                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                      </span>
                                    ) : isRejected ? (
                                      <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <XCircle className="w-2.5 h-2.5" /> Rejected
                                      </span>
                                    ) : (
                                      <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> Pending Review
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[12px] text-[#666] truncate max-w-[260px] mt-0.5">
                                    {doc.fileName}
                                  </p>
                                  {doc.notes && (
                                    <p className="text-[11px] text-[#444] mt-0.5 italic">
                                      "{doc.notes}"
                                    </p>
                                  )}
                                  {doc.verifiedAt && (
                                    <p className="text-[10px] text-[#555] mt-0.5">
                                      Verified on {new Date(doc.verifiedAt).toLocaleDateString("en-IN")}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {isManagerOrAdmin ? (
                                  <>
                                    {!isVerified && (
                                      <button
                                        onClick={() => handleOpenVerifyModal(doc, "VERIFY")}
                                        className="h-8 px-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                        title="Approve & Verify KYC Document"
                                      >
                                        <Check className="w-3 h-3" /> Approve
                                      </button>
                                    )}
                                    {isVerified && (
                                      <button
                                        onClick={() => handleOpenVerifyModal(doc, "REJECT")}
                                        className="h-8 px-2 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                                        title="Revoke Verification"
                                      >
                                        <X className="w-3 h-3" /> Revoke
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] text-[#555] px-2 py-1 bg-secondary rounded border border-border">
                                    Manager Review Required
                                  </span>
                                )}

                                <a
                                  href={`/api/customer/${customerId}/kyc/download/${doc.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 w-8 rounded-lg border border-[#222] text-[#888] hover:text-[#D4A843] hover:border-[#D4A843]/30 flex items-center justify-center transition-all"
                                  title="Download / View Decrypted Document"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>

                                {isManagerOrAdmin && (
                                  <button
                                    onClick={() => handleDocDelete(doc.id)}
                                    className="h-8 w-8 rounded-lg border border-[#222] text-[#888] hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Manual KYC Uploader */}
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl p-6">
                    <h3 className="text-[15px] font-bold text-foreground mb-1.5">
                      Vault Document Upload
                    </h3>
                    <p className="text-[12px] text-[#666] mb-5">
                      Directly encrypt and store client credentials
                    </p>

                    <form onSubmit={handleManualUpload} className="space-y-4">
                      {manualError && (
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-[12px] text-red-400 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{manualError}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">
                          Document Type
                        </label>
                        <select
                          value={manualDocType}
                          onChange={(e) => setManualDocType(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-[#222] bg-onyx text-foreground text-[12.5px] font-medium outline-none focus:border-[#D4A843] transition-all cursor-pointer"
                        >
                          <option value="AADHAR">Aadhaar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="GST_CERTIFICATE">GST Certificate</option>
                          <option value="PASSPORT">Passport</option>
                          <option value="DRIVING_LICENSE">Driving License</option>
                          <option value="VOTER_ID">Voter ID</option>
                          <option value="OTHER">Other Identification Proof</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">
                          Select File
                        </label>
                        <div className="border border-dashed border-[#222] rounded-xl p-5 bg-onyx text-center relative hover:border-[#D4A843]/20 transition-all cursor-pointer flex flex-col items-center justify-center">
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
                              <p className="text-[12px] font-semibold text-[#D4A843] truncate max-w-[200px]">
                                {manualFile.name}
                              </p>
                              <p className="text-[10px] text-[#555]">
                                {(manualFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[12px] text-[#888] font-medium">
                                Select PDF or Image
                              </p>
                              <p className="text-[10px] text-[#555] mt-0.5">Maximum size 10MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">
                          Notes / Identification Notes
                        </label>
                        <textarea
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="e.g. Original physical PAN verified at counter by Salesman"
                          rows={2}
                          className="w-full p-2.5 rounded-xl border border-[#222] bg-onyx text-foreground text-[12px] outline-none focus:border-[#D4A843] transition-all resize-none placeholder-[#333]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!manualFile || manualUploading}
                        className={`w-full h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          manualFile && !manualUploading
                            ? "bg-[#D4A843] text-foreground hover:bg-[#e6bc5a] cursor-pointer"
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

            {/* TAB 5: Profile Change Ledger (Audit Trail) */}
            {activeTab === "profileLedger" && (
              <div className="space-y-5">
                {/* Ledger Header & Search/Filter Bar */}
                <div className="bg-onyx-surface border border-[#222] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#D4A843]" />
                        <h3 className="text-[15px] font-bold text-foreground">
                          Customer Profile Change Ledger
                        </h3>
                      </div>
                      <p className="text-[12px] text-[#666] mt-0.5">
                        Immutable audit trail of profile registrations, attribute updates, KYC approvals & tag modifications
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="h-8 px-3 rounded-lg border border-[#222] text-[#aaa] hover:text-foreground text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export / Print Ledger
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    {/* Search in audit */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                      <input
                        type="text"
                        value={profileLogSearch}
                        onChange={(e) => setProfileLogSearch(e.target.value)}
                        placeholder="Search changes by keyword, field, or staff name..."
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-onyx border border-[#222] text-[12px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/40"
                      />
                    </div>

                    {/* Action Filter */}
                    <select
                      value={profileLogActionFilter}
                      onChange={(e) => setProfileLogActionFilter(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-onyx border border-[#222] text-[12px] text-foreground outline-none focus:border-[#D4A843]/40 cursor-pointer"
                    >
                      <option value="">All Actions</option>
                      <option value="CUSTOMER.CREATED">Profile Created</option>
                      <option value="CUSTOMER.UPDATED">Profile Updated</option>
                      <option value="KYC.DOCUMENT_UPLOADED">KYC Uploaded</option>
                      <option value="KYC.DOCUMENT_VERIFIED">KYC Verified</option>
                      <option value="KYC.DOCUMENT_REJECTED">KYC Rejected</option>
                      <option value="KYC.DOCUMENT_DELETED">KYC Deleted</option>
                      <option value="KYC.LINK_GENERATED">KYC Link Generated</option>
                    </select>

                    {/* Role Filter */}
                    <select
                      value={profileLogRoleFilter}
                      onChange={(e) => setProfileLogRoleFilter(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-onyx border border-[#222] text-[12px] text-foreground outline-none focus:border-[#D4A843]/40 cursor-pointer"
                    >
                      <option value="">All Roles</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SALESMAN">Salesman</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Timeline Cards */}
                {profileLogsLoading ? (
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl py-16 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin mb-3" />
                    <p className="text-[#888] text-[14px]">Querying profile audit ledger...</p>
                  </div>
                ) : profileLogs.length === 0 ? (
                  <div className="bg-onyx-surface border border-[#222] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
                    <History className="w-8 h-8 text-[#444] mb-3" />
                    <p className="text-[#888] text-[14px]">No profile modification logs found matching filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileLogs.map((log: any) => {
                      const isCreated = log.action?.includes("CREATED");
                      const isUpdated = log.action?.includes("UPDATED");
                      const isKycVerified = log.action?.includes("KYC.DOCUMENT_VERIFIED");
                      const isKycRejected = log.action?.includes("KYC.DOCUMENT_REJECTED");
                      const isKycUploaded = log.action?.includes("KYC.DOCUMENT_UPLOADED");

                      return (
                        <div
                          key={log.id}
                          className="bg-onyx-surface border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-all space-y-3.5"
                        >
                          {/* Log Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                                  isCreated || isKycVerified
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                    : isKycRejected
                                    ? "bg-red-500/10 border-red-500/25 text-red-400"
                                    : isUpdated
                                    ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                                    : "bg-[#D4A843]/10 border-[#D4A843]/25 text-[#D4A843]"
                                }`}
                              >
                                {isKycVerified || isCreated ? (
                                  <CheckCircle2 className="w-4.5 h-4.5" />
                                ) : isKycRejected ? (
                                  <XCircle className="w-4.5 h-4.5" />
                                ) : (
                                  <Edit2 className="w-4.5 h-4.5" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-bold text-foreground">
                                    {log.humanAction}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#555]">
                                    ({log.action})
                                  </span>
                                </div>
                                <p className="text-[12px] text-[#888] mt-0.5">{log.description}</p>
                              </div>
                            </div>

                            {/* Actor Details */}
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-[12px] font-semibold text-foreground">
                                  {log.performer?.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                    log.performer?.role === "MANAGER" || log.performer?.role === "ADMIN"
                                      ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                                      : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                  }`}
                                >
                                  {log.performer?.role || "SALESMAN"}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#555] mt-0.5">
                                {new Date(log.createdAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Reason Pill */}
                          {log.reason && (
                            <div className="p-2.5 rounded-xl bg-onyx border border-[#1f1f1f] text-[12px] text-[#aaa] flex items-start gap-2">
                              <span className="text-[#D4A843] font-semibold text-[11px] uppercase">
                                Note / Reason:
                              </span>
                              <span>{log.reason}</span>
                            </div>
                          )}

                          {/* Visual Diff Viewer for Updates */}
                          {isUpdated && log.before && log.after && (
                            <div className="bg-onyx rounded-xl p-3.5 border border-[#1a1a1a] space-y-2">
                              <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block">
                                Field Modifications Diff
                              </span>
                              <div className="space-y-1.5">
                                {Object.keys(log.after)
                                  .filter(
                                    (key) =>
                                      log.before[key] !== log.after[key] &&
                                      log.after[key] !== undefined
                                  )
                                  .map((key) => (
                                    <div
                                      key={key}
                                      className="grid grid-cols-[140px_1fr_auto_1fr] items-center gap-3 text-[12px] py-1 border-b border-[#161616] last:border-none"
                                    >
                                      <span className="font-semibold text-[#888] capitalize">
                                        {key.replace(/([A-Z])/g, " $1")}:
                                      </span>
                                      <span className="text-red-400/80 line-through truncate font-mono bg-red-950/20 px-2 py-0.5 rounded border border-red-500/20">
                                        {log.before[key] === null || log.before[key] === undefined
                                          ? "(none)"
                                          : String(log.before[key])}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-[#555]" />
                                      <span className="text-emerald-400 font-mono font-medium truncate bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {String(log.after[key])}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* KYC Verification transition details */}
                          {(isKycVerified || isKycRejected) && log.metadata && (
                            <div className="bg-onyx rounded-xl p-3 border border-[#1a1a1a] flex items-center justify-between text-[11px] text-[#888]">
                              <span>
                                Document: <strong className="text-foreground">{log.metadata.documentType}</strong> ({log.metadata.fileName})
                              </span>
                              <span>
                                Resolution:{" "}
                                <strong
                                  className={isKycVerified ? "text-emerald-400" : "text-red-400"}
                                >
                                  {log.metadata.action}
                                </strong>
                              </span>
                            </div>
                          )}

                          {/* Technical Context Bar */}
                          <div className="flex items-center justify-between text-[10px] text-[#444] pt-1">
                            <span>Audit ID: #{log.id.slice(-8)}</span>
                            <span>IP Address: {log.ipAddress || "127.0.0.1"} • Device: {log.deviceInfo || "Web Console"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Upload Link Modal */}
      {showShareLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowShareLinkModal(false)}
          />
          <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl z-50">
            <h3 className="text-[17px] font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-[#D4A843]" />
              Client Self-Service KYC Portal Link
            </h3>
            <p className="text-[12.5px] text-[#666] mb-5 leading-normal">
              Send this 24-hour secure link to <strong className="text-foreground">{customer.name}</strong> via WhatsApp or SMS. It allows the customer to upload their Aadhaar/PAN/GST documents directly from their smartphone.
            </p>

            <div className="flex items-center gap-2 mb-5">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 h-10 px-3 rounded-xl border border-[#222] bg-onyx text-foreground text-[12px] outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="h-10 px-4 rounded-xl bg-[#D4A843] text-foreground text-[12px] font-bold hover:bg-[#e6bc5a] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#222]">
              <a
                href={`https://wa.me/91${customer.mobile}?text=${encodeURIComponent(
                  `Dear ${customer.name}, please complete your KYC document verification for Atelier Jewellers using this secure portal link: ${generatedLink}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-[12px] font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" /> WhatsApp to Client
              </a>

              <button
                onClick={() => setShowShareLinkModal(false)}
                className="h-9 px-4 rounded-lg text-[13px] text-foreground bg-onyx-elevated border border-[#252525] hover:bg-secondary transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Verification / Rejection Confirmation Modal (Manager Only) */}
      {verifyModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setVerifyModalDoc(null)}
          />
          <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  verifyAction === "VERIFY"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {verifyAction === "VERIFY" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground">
                  {verifyAction === "VERIFY" ? "Verify & Approve Document" : "Reject KYC Document"}
                </h3>
                <p className="text-[12px] text-[#666]">
                  {verifyModalDoc.fileName} ({verifyModalDoc.documentType})
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider">
                {verifyAction === "VERIFY"
                  ? "Manager Verification Notes (Optional)"
                  : "Reason for Rejection *"}
              </label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder={
                  verifyAction === "VERIFY"
                    ? "e.g. Scanned copy verified against original government database."
                    : "e.g. Blurry photo / Expired document / Name spelling mismatch."
                }
                rows={3}
                className="w-full p-3 rounded-xl bg-onyx border border-[#222] text-[12px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
              <button
                onClick={() => setVerifyModalDoc(null)}
                className="h-9 px-4 rounded-lg text-[13px] text-[#999] bg-onyx-elevated border border-[#252525] hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerification}
                disabled={verifyLoading || (verifyAction === "REJECT" && !verifyNotes.trim())}
                className={`h-9 px-5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                  verifyAction === "VERIFY"
                    ? "bg-emerald-500 text-foreground hover:bg-emerald-600"
                    : "bg-red-500 text-foreground hover:bg-red-600"
                }`}
              >
                {verifyLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : verifyAction === "VERIFY" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                {verifyAction === "VERIFY" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      <EditCustomerModal
        open={showEditModal}
        customerId={customer.id}
        userRole={userRole}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => fetchDetails()}
      />

      {/* Direct Communication Modal */}
      <DirectCommunicationModal
        open={showCommModal}
        customer={customer}
        onClose={() => setShowCommModal(false)}
      />

      {/* Order Details Modal */}
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

      {/* Manage Tags Modal */}
      <ManageTagsModal
        open={showManageTagsModal}
        onClose={() => setShowManageTagsModal(false)}
        customerId={customer.id}
        currentTags={customer.tags || []}
        onSuccess={fetchDetails}
      />

      {/* Edit Scheme Modal */}
      {editingScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setEditingScheme(null)}
          />
          <div className="relative w-full max-w-sm bg-[#0D0D0F] border border-[#1F1F24] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-[#F0EBE0]">Edit Scheme</h3>
                <p className="text-xs text-[#C9943A] mt-0.5">{editingScheme.schemeNumber}</p>
              </div>
              <button
                onClick={() => setEditingScheme(null)}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1D] text-[#6B6560] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-[#F0EBE0] mb-2 block">
                  Physical Card Number
                </label>
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
                  <label className="text-xs font-medium text-[#F0EBE0] mb-2 block">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={editingDuration}
                    onChange={(e) => setEditingDuration(e.target.value)}
                    placeholder="Extend duration"
                    min={editingScheme.maxDurationMonths}
                    className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-[#1F1F24] text-sm text-[#F0EBE0] focus:border-[#C9943A]/50 outline-none"
                  />
                  <p className="text-[10px] text-[#6B6560] mt-1">
                    Note: You can only extend the duration.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpdateScheme}
              disabled={schemeUpdating}
              className="w-full py-2.5 rounded-xl bg-[#C9943A] text-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {schemeUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
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

function ManageTagsModal({
  open,
  onClose,
  customerId,
  currentTags,
  onSuccess,
}: ManageTagsModalProps) {
  const [manualTags, setManualTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl z-50 max-h-[85vh] overflow-y-auto flex flex-col">
        <h3 className="text-[18px] font-bold text-foreground mb-1">Manage Customer Tags</h3>
        <p className="text-[13px] text-[#666] mb-5">
          Assign or remove manual tags. System tags are evaluated automatically.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#555] uppercase tracking-widest block">
                Manual Tags
              </label>
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
                      gray: "border-gray-500/30 text-muted-foreground bg-gray-500/10",
                      green: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                      orange: "border-orange-500/30 text-orange-400 bg-orange-500/10",
                      purple: "border-purple-500/30 text-purple-400 bg-purple-500/10",
                    };
                    const activeColorClass =
                      colorMap[tag.color.toLowerCase()] ||
                      "border-gray-500/30 text-muted-foreground bg-gray-500/10";
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-[13px] text-left transition-all ${
                          isChecked
                            ? `${activeColorClass} font-semibold`
                            : "border-[#222] bg-[#161616] text-[#888] hover:border-border hover:text-[#ccc]"
                        }`}
                      >
                        <span>{tag.label}</span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isChecked ? "border-current text-current" : "border-[#444]"
                          }`}
                        >
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
                  className="w-full h-9 rounded-xl border border-dashed border-border text-[13px] text-[#888] hover:text-foreground hover:border-[#444] transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Custom Tag Definition
                </button>
              ) : (
                <form
                  onSubmit={handleCreateTag}
                  className="space-y-3 p-3.5 bg-[#161616] border border-[#222] rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#D4A843] uppercase tracking-wider">
                      New Tag Definition
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-[11px] text-[#666] hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Friends & Family"
                      className="w-full h-8 px-2.5 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground outline-none focus:border-[#D4A843]/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">
                        System Code (Opt)
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) =>
                          setNewName(e.target.value.toUpperCase().replace(/\s+/g, "_"))
                        }
                        placeholder="FRIENDS_FAMILY"
                        className="w-full h-8 px-2.5 rounded-lg bg-onyx border border-onyx-border text-[11px] text-foreground outline-none focus:border-[#D4A843]/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">
                        Color
                      </label>
                      <select
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground outline-none focus:border-[#D4A843]/40 appearance-none cursor-pointer"
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
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Tag description..."
                      className="w-full h-8 px-2.5 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground outline-none focus:border-[#D4A843]/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full h-8 rounded-lg bg-[#D4A843] text-foreground text-[12px] font-semibold hover:bg-[#e6bc5a] transition-all disabled:opacity-50"
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
            className="h-9 px-4 rounded-lg text-[13px] text-[#999] bg-onyx-elevated border border-[#252525] hover:text-foreground transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-[#D4A843] text-foreground hover:bg-[#e6bc5a] transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
