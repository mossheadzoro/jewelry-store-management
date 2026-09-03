"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
  Eye,
  Printer,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Plus,
  Coins,
  Wallet,
  Building,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  DollarSign,
  User,
  Phone,
  MapPin,
  Camera,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function ReturnsExchangesPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "credit_notes" | "overrides">("transactions");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    pendingApprovalCount: 0,
    todayReturnsCount: 0,
    todayExchangesCount: 0,
    totalCreditNotesCount: 0,
    policyOverridesCount: 0,
    totalTransactions: 0,
  });

  // Modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTxForReview, setSelectedTxForReview] = useState<any | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [invoiceLookupData, setInvoiceLookupData] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Wizard item selections & inspection
  const [selectedItems, setSelectedItems] = useState<Record<number, {
    requestedAction: "RETURN" | "EXCHANGE";
    returnReason: string;
    condition: string;
    measuredGrossWeight: number;
    measuredNetWeight: number;
    measuredPurity: number;
    photos: Array<{ category: string; storageUrl: string; sizeBytes?: number; sha256Hash?: string }>;
    deductionOptions: {
      makingChargePolicy: "FULL" | "PARTIAL" | "NON_REFUNDABLE";
      makingChargeDeductionPercent: number;
      stoneChargePolicy: "FULL" | "PARTIAL" | "NON_REFUNDABLE";
      damageDeductionAmount: number;
    };
  }>>({});

  const [overrideReason, setOverrideReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<string>("STORE_CREDIT");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Policy Settings state
  const [policySettings, setPolicySettings] = useState<any>({
    returnWindowDays: 3,
    exchangeWindowDays: 7,
    minimumReturnPhotoCount: 2,
    maximumReturnPhotoCount: 5,
    weightToleranceGrams: 0.010,
    highValueApprovalThreshold: 100000,
    allowPolicyOverride: true,
    requireStepUpAuthAboveThreshold: true,
    makingChargeReturnPolicy: "FULL",
    stoneChargeReturnPolicy: "FULL",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch metrics & reports
      const repRes = await fetch("/api/returns/reports");
      if (repRes.ok) {
        const repData = await repRes.json();
        setMetrics(repData.metrics || {});
      }

      // 2. Fetch transactions
      const txRes = await fetch(`/api/returns?status=${statusFilter}&type=${typeFilter}&search=${encodeURIComponent(searchQuery)}`);
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }

      // 3. Fetch branch settings
      const setRes = await fetch("/api/returns/settings");
      if (setRes.ok) {
        const setData = await setRes.json();
        setPolicySettings(setData);
      }
    } catch (err) {
      console.error("Error fetching returns data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, searchQuery]);

  // Invoice Search Handler
  const handleLookupInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInvoiceNumber.trim()) return;

    setIsSearchingInvoice(true);
    setLookupError(null);
    setInvoiceLookupData(null);
    setSelectedItems({});

    try {
      const res = await fetch(`/api/returns/invoices/${encodeURIComponent(searchInvoiceNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invoice lookup failed.");
      }

      setInvoiceLookupData(data);
      setWizardStep(2); // Advance to Item selection
    } catch (err: any) {
      setLookupError(err.message);
    } finally {
      setIsSearchingInvoice(false);
    }
  };

  // Toggle item selection
  const handleToggleItemAction = (item: any, action: "RETURN" | "EXCHANGE") => {
    setSelectedItems((prev) => {
      const current = prev[item.invoiceItemId];
      if (current && current.requestedAction === action) {
        const updated = { ...prev };
        delete updated[item.invoiceItemId];
        return updated;
      }

      return {
        ...prev,
        [item.invoiceItemId]: {
          requestedAction: action,
          returnReason: "Customer Change of Mind",
          condition: "GOOD",
          measuredGrossWeight: item.grossWeight,
          measuredNetWeight: item.netWeight,
          measuredPurity: item.purity,
          photos: [],
          deductionOptions: {
            makingChargePolicy: "FULL",
            makingChargeDeductionPercent: 0,
            stoneChargePolicy: "FULL",
            damageDeductionAmount: 0,
          },
        },
      };
    });
  };

  // Photo upload handler
  const handlePhotoUpload = async (invoiceItemId: number, file: File, category: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      const res = await fetch("/api/returns/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Photo upload failed");
      const uploadResult = await res.json();

      setSelectedItems((prev) => {
        const it = prev[invoiceItemId];
        if (!it) return prev;
        return {
          ...prev,
          [invoiceItemId]: {
            ...it,
            photos: [...it.photos, uploadResult],
          },
        };
      });
    } catch (err: any) {
      alert(`Photo upload error: ${err.message}`);
    }
  };

  // Remove photo
  const handleRemovePhoto = (invoiceItemId: number, photoIndex: number) => {
    setSelectedItems((prev) => {
      const it = prev[invoiceItemId];
      if (!it) return prev;
      const updatedPhotos = it.photos.filter((_, idx) => idx !== photoIndex);
      return {
        ...prev,
        [invoiceItemId]: {
          ...it,
          photos: updatedPhotos,
        },
      };
    });
  };

  // Submit Return / Exchange Request
  const handleSubmitReturnTransaction = async () => {
    if (!invoiceLookupData) return;
    const selectedItemIds = Object.keys(selectedItems).map(Number);
    if (selectedItemIds.length === 0) {
      alert("Please select at least one item to return or exchange.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadItems = selectedItemIds.map((itemId) => {
        const itemConfig = selectedItems[itemId];
        return {
          invoiceItemId: itemId,
          requestedAction: itemConfig.requestedAction,
          returnReason: itemConfig.returnReason,
          condition: itemConfig.condition,
          measuredGrossWeight: itemConfig.measuredGrossWeight,
          measuredNetWeight: itemConfig.measuredNetWeight,
          measuredPurity: itemConfig.measuredPurity,
          photos: itemConfig.photos,
          deductionOptions: itemConfig.deductionOptions,
        };
      });

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceLookupData.invoiceNumber,
          branchId: invoiceLookupData.branchId,
          transactionType: payloadItems[0]?.requestedAction || "RETURN",
          items: payloadItems,
          policyOverride: !!overrideReason.trim(),
          overrideReason: overrideReason.trim() || undefined,
          refundMethod,
          paymentReference,
          autoApprove: true, // Attempt auto-approve if manager
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create return transaction.");
      }

      setSubmissionResult(data);
      setWizardStep(5); // Completion step
      fetchData();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/returns/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policySettings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      alert("Branch Return & Exchange policy settings updated successfully!");
      setIsSettingsOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Manager Approve from List
  const handleApproveFromModal = async (txId: string) => {
    try {
      const res = await fetch(`/api/returns/${txId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundMethod: "STORE_CREDIT" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed.");
      alert("Return approved successfully!");
      setSelectedTxForReview(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Manager Reject from List
  const handleRejectFromModal = async (txId: string) => {
    const reason = prompt("Enter mandatory rejection reason:");
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/returns/${txId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed.");
      alert("Return rejected.");
      setSelectedTxForReview(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Calculate live return summary for selected items in wizard
  const selectedItemIds = Object.keys(selectedItems).map(Number);
  const selectedItemsData = invoiceLookupData?.items.filter((it: any) => selectedItemIds.includes(it.invoiceItemId)) || [];
  const totalTaxableReversal = selectedItemsData.reduce((acc: number, it: any) => acc + (it.taxableValue || 0), 0);
  const totalCgstReversal = selectedItemsData.reduce((acc: number, it: any) => acc + (it.cgst || 0), 0);
  const totalSgstReversal = selectedItemsData.reduce((acc: number, it: any) => acc + (it.sgst || 0), 0);
  const totalEstimatedCredit = selectedItemsData.reduce((acc: number, it: any) => acc + (it.totalAfterTax || 0), 0);

  const isAnyItemExpired = selectedItemsData.some((it: any) => it.isOverrideRequired);

  return (
    <div className="min-h-screen flex-1 w-full bg-onyx p-6 space-y-6">
      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-onyx-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-gold" />
            Enterprise Return & Exchange Engine
          </h1>
          <p className="text-xs text-platinum-muted mt-1">
            Transaction-safe, GST Credit Note compliant product return and exchange management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-onyx-surface border border-onyx-border text-foreground hover:bg-onyx-elevated rounded-lg text-xs font-medium transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-platinum-muted" />
            Policy Settings
          </button>
          
          <button
            onClick={() => {
              setWizardStep(1);
              setSearchInvoiceNumber("");
              setInvoiceLookupData(null);
              setSelectedItems({});
              setSubmissionResult(null);
              setOverrideReason("");
              setIsWizardOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-onyx font-semibold hover:bg-gold/90 rounded-lg text-xs transition-colors shadow-lg shadow-gold/10"
          >
            <Plus className="w-4 h-4" />
            New Return / Exchange
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-platinum-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{metrics.pendingApprovalCount || 0}</p>
          <span className="text-[10px] text-platinum-muted mt-1">Requires Manager review</span>
        </div>

        <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-platinum-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Returns</span>
            <RotateCcw className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{metrics.todayReturnsCount || 0}</p>
          <span className="text-[10px] text-platinum-muted mt-1">Completed returns</span>
        </div>

        <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-platinum-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Exchanges</span>
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{metrics.todayExchangesCount || 0}</p>
          <span className="text-[10px] text-platinum-muted mt-1">New invoice generated</span>
        </div>

        <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-platinum-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Credit Notes</span>
            <FileText className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold text-gold mt-2">{metrics.totalCreditNotesCount || 0}</p>
          <span className="text-[10px] text-platinum-muted mt-1">GST Credit Notes issued</span>
        </div>

        <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-platinum-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Policy Overrides</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-2">{metrics.policyOverridesCount || 0}</p>
          <span className="text-[10px] text-platinum-muted mt-1">Manager authorized</span>
        </div>

        <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-platinum-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Handled</span>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{metrics.totalTransactions || 0}</p>
          <span className="text-[10px] text-platinum-muted mt-1">Lifetime transactions</span>
        </div>
      </div>

      {/* 3. MAIN TABLE & REGISTERS CONTAINER */}
      <div className="bg-onyx-surface border border-onyx-border rounded-xl p-5 space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex bg-onyx p-1 rounded-lg border border-onyx-border">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${statusFilter === "ALL" ? "bg-onyx-elevated text-foreground" : "text-platinum-muted"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("PENDING_APPROVAL")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${statusFilter === "PENDING_APPROVAL" ? "bg-amber-500/20 text-amber-400" : "text-platinum-muted"}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${statusFilter === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : "text-platinum-muted"}`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${statusFilter === "REJECTED" ? "bg-red-500/20 text-red-400" : "text-platinum-muted"}`}
              >
                Rejected
              </button>
            </div>

            <div className="flex bg-onyx p-1 rounded-lg border border-onyx-border">
              <button
                onClick={() => setTypeFilter("ALL")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${typeFilter === "ALL" ? "bg-onyx-elevated text-foreground" : "text-platinum-muted"}`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter("RETURN")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${typeFilter === "RETURN" ? "bg-blue-500/20 text-blue-400" : "text-platinum-muted"}`}
              >
                Returns
              </button>
              <button
                onClick={() => setTypeFilter("EXCHANGE")}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${typeFilter === "EXCHANGE" ? "bg-gold/20 text-gold" : "text-platinum-muted"}`}
              >
                Exchanges
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-platinum-muted" />
            <input
              type="text"
              placeholder="Search #, invoice, customer..."
              className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-gold/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-onyx-border rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-onyx text-platinum-muted uppercase text-[10px] font-semibold tracking-wider border-b border-onyx-border">
              <tr>
                <th className="py-3 px-3">Transaction #</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Original Invoice</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Refund / Credit</th>
                <th className="py-3 px-3">Credit Note #</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/50 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-platinum-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gold" />
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-platinum-muted">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-platinum-muted/40" />
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const financial = tx.financialSnapshot || {};
                  const refundAmount = financial?.summary?.netRefundPayable || 0;
                  const creditNote = (tx.taxDocuments || [])[0];

                  return (
                    <tr key={tx.id} className="hover:bg-onyx/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gold">
                        {tx.transactionNumber}
                        {tx.policyOverride && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded font-bold">
                            OVERRIDE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.transactionType === "RETURN" ? "bg-blue-500/10 text-blue-400" : "bg-gold/10 text-gold"
                        }`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-platinum-muted">
                        <Link href={`/billing/invoice/${tx.originalInvoiceId}`} className="hover:text-foreground underline">
                          {tx.originalInvoice?.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">{tx.customer?.name}</div>
                        <div className="text-[10px] text-platinum-muted">{tx.customer?.mobile}</div>
                      </td>
                      <td className="py-3 px-3 text-platinum-muted">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-bold tabular-nums">
                        ₹{refundAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {creditNote ? (
                          <Link
                            href={`/billing/credit-note/${creditNote.id}`}
                            target="_blank"
                            className="text-gold hover:underline flex items-center gap-1 font-semibold"
                          >
                            <FileText className="w-3 h-3" />
                            {creditNote.documentNumber}
                          </Link>
                        ) : (
                          <span className="text-platinum-muted/50">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : tx.status === "PENDING_APPROVAL"
                            ? "bg-amber-500/20 text-amber-400"
                            : tx.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-onyx-elevated text-platinum-muted"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/billing/return-receipt/${tx.id}`}
                            target="_blank"
                            className="p-1.5 bg-onyx border border-onyx-border rounded hover:bg-onyx-elevated text-platinum-muted hover:text-foreground"
                            title="Print Return Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>
                          {tx.status === "PENDING_APPROVAL" && (
                            <button
                              onClick={() => setSelectedTxForReview(tx)}
                              className="px-2 py-1 bg-gold/20 text-gold hover:bg-gold/30 rounded text-[10px] font-bold"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MULTI-STEP RETURN & EXCHANGE WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-onyx-surface border border-onyx-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-onyx-border bg-onyx/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 text-gold rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {wizardStep === 1 && "Step 1: Search Finalized Invoice"}
                    {wizardStep === 2 && "Step 2: Select Items for Return or Exchange"}
                    {wizardStep === 3 && "Step 3: Physical Inspection & Photographs"}
                    {wizardStep === 4 && "Step 4: Financial Review & Settlement"}
                    {wizardStep === 5 && "Step 5: Transaction Finalized"}
                  </h2>
                  <p className="text-[11px] text-platinum-muted">
                    Original invoice remains immutable • GST Credit Note is automatically calculated
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-platinum-muted hover:text-foreground p-1 rounded-lg hover:bg-onyx"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* STEP 1: SEARCH INVOICE */}
              {wizardStep === 1 && (
                <div className="max-w-md mx-auto py-8 space-y-4 text-center">
                  <div className="w-12 h-12 bg-onyx-elevated border border-onyx-border rounded-full flex items-center justify-center mx-auto text-gold">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Enter Invoice Number to Begin</h3>
                  <p className="text-xs text-platinum-muted">
                    Type the exact invoice number (e.g. INV/26-27/000001 or INV-1001) to load items and verify policy eligibility.
                  </p>

                  <form onSubmit={handleLookupInvoice} className="space-y-3 pt-2">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. INV/26-27/000001"
                        className="w-full bg-onyx border border-onyx-border text-foreground font-mono rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                        value={searchInvoiceNumber}
                        onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                      />
                    </div>

                    {lookupError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-left flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{lookupError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSearchingInvoice || !searchInvoiceNumber.trim()}
                      className="w-full py-2.5 bg-gold text-onyx font-bold rounded-lg text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSearchingInvoice ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      Verify & Fetch Invoice Items
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: SELECT ITEMS */}
              {wizardStep === 2 && invoiceLookupData && (
                <div className="space-y-5">
                  {/* Invoice & Customer Info Summary Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-onyx rounded-xl border border-onyx-border text-xs">
                    <div>
                      <span className="text-platinum-muted uppercase text-[10px] font-bold">Invoice Details</span>
                      <p className="font-mono font-bold text-foreground text-sm mt-0.5">{invoiceLookupData.invoiceNumber}</p>
                      <p className="text-platinum-muted">{new Date(invoiceLookupData.invoiceDate).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div>
                      <span className="text-platinum-muted uppercase text-[10px] font-bold">Customer</span>
                      <p className="font-bold text-foreground text-sm mt-0.5">{invoiceLookupData.customerName}</p>
                      <p className="text-platinum-muted">+91 {invoiceLookupData.customerMobile}</p>
                    </div>
                    <div>
                      <span className="text-platinum-muted uppercase text-[10px] font-bold">Policy Windows</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-onyx-elevated border border-onyx-border rounded text-[11px] font-bold text-foreground">
                          {invoiceLookupData.elapsedDays} Days Elapsed
                        </span>
                        <span className="text-platinum-muted">Return: {invoiceLookupData.policy.returnWindowDays}d | Exch: {invoiceLookupData.policy.exchangeWindowDays}d</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-platinum-muted">
                      Select Items for Return or Exchange ({invoiceLookupData.items.length} items in invoice)
                    </h4>

                    <div className="space-y-2.5">
                      {invoiceLookupData.items.map((it: any) => {
                        const isSelected = !!selectedItems[it.invoiceItemId];
                        const selectedAction = selectedItems[it.invoiceItemId]?.requestedAction;

                        return (
                          <div
                            key={it.invoiceItemId}
                            className={`p-4 rounded-xl border transition-all ${
                              isSelected
                                ? "bg-onyx border-gold/40 shadow-md shadow-gold/5"
                                : "bg-onyx/40 border-onyx-border hover:border-onyx-border/80"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-foreground text-sm">{it.productName}</h5>
                                  <span className="text-xs font-mono text-platinum-muted">({it.barcode})</span>
                                  {it.huidNumber && (
                                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] rounded border border-emerald-500/20">
                                      HUID: {it.huidNumber}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-platinum-muted flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                  <span>Purity: <strong className="text-foreground">{it.purity}K</strong></span>
                                  <span>Nt.Wt: <strong className="text-foreground">{it.netWeight}g</strong></span>
                                  <span>Taxable: <strong className="text-foreground">₹{it.taxableValue?.toFixed(2)}</strong></span>
                                  <span>GST: <strong className="text-foreground">₹{(it.cgst + it.sgst)?.toFixed(2)}</strong></span>
                                  <span>Total: <strong className="text-gold font-bold">₹{it.totalAfterTax?.toFixed(2)}</strong></span>
                                </div>

                                <div className="mt-2 text-[11px]">
                                  {it.isAlreadyReturned && (
                                    <span className="text-red-400 font-semibold">⚠️ Item already returned</span>
                                  )}
                                  {it.isAlreadyExchanged && (
                                    <span className="text-red-400 font-semibold">⚠️ Item already exchanged</span>
                                  )}
                                  {it.hasActiveRequest && (
                                    <span className="text-amber-400 font-semibold">⏳ In progress request ({it.activeTransactionNumber})</span>
                                  )}
                                  {!it.isAlreadyReturned && !it.isAlreadyExchanged && !it.hasActiveRequest && (
                                    <span className={it.returnAllowed ? "text-emerald-400" : it.exchangeAllowed ? "text-amber-400" : "text-purple-400"}>
                                      {it.message}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {!it.isAlreadyReturned && !it.isAlreadyExchanged && !it.hasActiveRequest && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleItemAction(it, "RETURN")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      selectedAction === "RETURN"
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                        : "bg-onyx-surface border border-onyx-border text-platinum-muted hover:text-foreground"
                                    }`}
                                  >
                                    Return
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleItemAction(it, "EXCHANGE")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      selectedAction === "EXCHANGE"
                                        ? "bg-gold text-onyx shadow-md shadow-gold/30"
                                        : "bg-onyx-surface border border-onyx-border text-platinum-muted hover:text-foreground"
                                    }`}
                                  >
                                    Exchange
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PHYSICAL INSPECTION & PHOTOS */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-xs flex items-center gap-2">
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Upload 2–5 physical inspection photographs and verify item measurements before final approval.</span>
                  </div>

                  {selectedItemIds.map((itemId) => {
                    const itemData = invoiceLookupData?.items.find((it: any) => it.invoiceItemId === itemId);
                    const itemConfig = selectedItems[itemId];
                    if (!itemData || !itemConfig) return null;

                    return (
                      <div key={itemId} className="p-5 bg-onyx rounded-xl border border-onyx-border space-y-4">
                        <div className="flex justify-between items-center border-b border-onyx-border pb-3">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{itemData.productName}</h4>
                            <p className="text-xs text-platinum-muted font-mono">{itemData.barcode}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            itemConfig.requestedAction === "RETURN" ? "bg-blue-500/20 text-blue-400" : "bg-gold/20 text-gold"
                          }`}>
                            {itemConfig.requestedAction}
                          </span>
                        </div>

                        {/* Measurements & Conditions */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="text-platinum-muted font-medium mb-1 block">Measured Gross Wt (g)</label>
                            <input
                              type="number"
                              step="0.001"
                              className="w-full bg-onyx-surface border border-onyx-border text-foreground rounded-lg px-3 py-1.5 font-mono"
                              value={itemConfig.measuredGrossWeight}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...prev[itemId], measuredGrossWeight: val },
                                }));
                              }}
                            />
                            <span className="text-[10px] text-platinum-muted">Orig: {itemData.grossWeight}g</span>
                          </div>

                          <div>
                            <label className="text-platinum-muted font-medium mb-1 block">Measured Net Wt (g)</label>
                            <input
                              type="number"
                              step="0.001"
                              className="w-full bg-onyx-surface border border-onyx-border text-foreground rounded-lg px-3 py-1.5 font-mono"
                              value={itemConfig.measuredNetWeight}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...prev[itemId], measuredNetWeight: val },
                                }));
                              }}
                            />
                            <span className="text-[10px] text-platinum-muted">Orig: {itemData.netWeight}g</span>
                          </div>

                          <div>
                            <label className="text-platinum-muted font-medium mb-1 block">Condition</label>
                            <select
                              className="w-full bg-onyx-surface border border-onyx-border text-foreground rounded-lg px-2.5 py-1.5"
                              value={itemConfig.condition}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...prev[itemId], condition: val },
                                }));
                              }}
                            >
                              <option value="GOOD">Good / Resellable</option>
                              <option value="MINOR_DAMAGE">Minor Damage (Needs Polish)</option>
                              <option value="MAJOR_DAMAGE">Major Damage (Needs Repair)</option>
                              <option value="ALTERED">Altered / Resized</option>
                              <option value="MISSING_STONE">Missing Stone</option>
                              <option value="MISSING_TAG">Missing Tag</option>
                              <option value="OTHER">Other Issue</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-platinum-muted font-medium mb-1 block">Reason for Return</label>
                            <select
                              className="w-full bg-onyx-surface border border-onyx-border text-foreground rounded-lg px-2.5 py-1.5"
                              value={itemConfig.returnReason}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...prev[itemId], returnReason: val },
                                }));
                              }}
                            >
                              <option value="Customer Change of Mind">Customer Change of Mind</option>
                              <option value="Size Issue">Size Issue</option>
                              <option value="Product Defect">Product Defect</option>
                              <option value="Wrong Product Given">Wrong Product Given</option>
                              <option value="Stone Issue">Stone Issue</option>
                              <option value="Quality Issue">Quality Issue</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-bold text-platinum-muted uppercase tracking-wider block">
                            Product Photographs ({itemConfig.photos.length} uploaded)
                          </label>

                          <div className="flex flex-wrap items-center gap-3">
                            {itemConfig.photos.map((ph, pIdx) => (
                              <div key={pIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-onyx-border bg-onyx-elevated group">
                                <img src={ph.storageUrl} alt="Inspection" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(itemId, pIdx)}
                                  className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 uppercase">
                                  {ph.category}
                                </span>
                              </div>
                            ))}

                            {itemConfig.photos.length < 5 && (
                              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-onyx-border hover:border-gold/50 flex flex-col items-center justify-center text-platinum-muted hover:text-gold cursor-pointer transition-colors">
                                <Upload className="w-4 h-4 mb-1" />
                                <span className="text-[9px] font-semibold">Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handlePhotoUpload(itemId, f, "DETAIL");
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 4: FINANCIAL REVIEW & SETTLEMENT */}
              {wizardStep === 4 && (
                <div className="space-y-6">
                  {/* Financial Breakdown Card */}
                  <div className="p-5 bg-onyx rounded-xl border border-onyx-border space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gold" />
                      Financial Reversal Breakdown
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-onyx-surface rounded-lg border border-onyx-border">
                        <span className="text-platinum-muted">Taxable Supply Reversal</span>
                        <p className="text-base font-bold text-foreground mt-1 tabular-nums">₹{totalTaxableReversal.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-onyx-surface rounded-lg border border-onyx-border">
                        <span className="text-platinum-muted">CGST Reversal (1.5%)</span>
                        <p className="text-base font-bold text-foreground mt-1 tabular-nums">₹{totalCgstReversal.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-onyx-surface rounded-lg border border-onyx-border">
                        <span className="text-platinum-muted">SGST Reversal (1.5%)</span>
                        <p className="text-base font-bold text-foreground mt-1 tabular-nums">₹{totalSgstReversal.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                        <span className="text-gold font-semibold">Total Credit Note Value</span>
                        <p className="text-base font-bold text-gold mt-1 tabular-nums">₹{totalEstimatedCredit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Policy Override Justification if expired */}
                  {isAnyItemExpired && (
                    <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Manager Policy Override Required</span>
                      </div>
                      <p className="text-xs text-platinum-muted">
                        One or more selected items are outside the standard business policy window. A manager justification reason must be recorded.
                      </p>
                      <textarea
                        required
                        rows={2}
                        placeholder="Mandatory Manager override reason (e.g. Special customer loyalty exception authorized by Store Manager)..."
                        className="w-full bg-onyx border border-purple-500/30 text-foreground rounded-lg p-3 text-xs focus:outline-none focus:border-purple-400"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Refund & Settlement Preference */}
                  <div className="p-5 bg-onyx rounded-xl border border-onyx-border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-platinum-muted">
                      Refund & Settlement Mode
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        { id: "STORE_CREDIT", label: "Store Credit", icon: Coins },
                        { id: "CUSTOMER_WALLET", label: "Customer Wallet", icon: Wallet },
                        { id: "UPI", label: "UPI / Bank Refund", icon: DollarSign },
                        { id: "CASH", label: "Cash Refund", icon: DollarSign },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSel = refundMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setRefundMethod(m.id)}
                            className={`p-3 rounded-lg border flex flex-col items-center text-center gap-1.5 transition-all ${
                              isSel ? "bg-gold/10 border-gold text-gold font-bold" : "bg-onyx-surface border-onyx-border text-platinum-muted hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {(refundMethod === "UPI" || refundMethod === "CASH") && (
                      <div className="pt-2">
                        <label className="text-[11px] text-platinum-muted block mb-1">Payment Reference / UTR #</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI Ref # / Voucher #"
                          className="w-full bg-onyx-surface border border-onyx-border text-foreground rounded-lg px-3 py-1.5 text-xs font-mono"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: COMPLETION */}
              {wizardStep === 5 && submissionResult && (
                <div className="text-center py-8 space-y-5 max-w-md mx-auto">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Transaction Finalized Successfully!</h3>
                    <p className="text-xs text-platinum-muted mt-1">
                      Transaction <strong className="text-gold font-mono">{submissionResult.transaction?.transactionNumber}</strong> has been processed.
                    </p>
                  </div>

                  <div className="p-4 bg-onyx rounded-xl border border-onyx-border text-xs text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-platinum-muted">Status:</span>
                      <span className="font-bold text-emerald-400">{submissionResult.transaction?.status}</span>
                    </div>
                    {submissionResult.creditNote && (
                      <div className="flex justify-between">
                        <span className="text-platinum-muted">GST Credit Note:</span>
                        <span className="font-mono font-bold text-gold">{submissionResult.creditNote.documentNumber}</span>
                      </div>
                    )}
                    {submissionResult.refund && (
                      <div className="flex justify-between">
                        <span className="text-platinum-muted">Refund Voucher:</span>
                        <span className="font-mono font-bold">{submissionResult.refund.refundNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Print Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {submissionResult.creditNote && (
                      <Link
                        href={`/billing/credit-note/${submissionResult.creditNote.id}`}
                        target="_blank"
                        className="flex-1 py-2.5 bg-gold text-onyx font-bold rounded-lg text-xs hover:bg-gold/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        Print GST Credit Note
                      </Link>
                    )}
                    <Link
                      href={`/billing/return-receipt/${submissionResult.transaction.id}`}
                      target="_blank"
                      className="flex-1 py-2.5 bg-onyx-surface border border-onyx-border text-foreground font-bold rounded-lg text-xs hover:bg-onyx-elevated transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      Print Return Receipt
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-onyx-border bg-onyx/50 flex justify-between items-center">
              {wizardStep > 1 && wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 text-xs font-medium text-platinum-muted hover:text-foreground transition-colors"
                >
                  Back
                </button>
              ) : <div></div>}

              {wizardStep === 2 && (
                <button
                  type="button"
                  disabled={selectedItemIds.length === 0}
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gold text-onyx font-bold rounded-lg text-xs hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  Continue to Inspection ({selectedItemIds.length} items)
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {wizardStep === 3 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gold text-onyx font-bold rounded-lg text-xs hover:bg-gold/90 transition-colors"
                >
                  Review Financial Settlement
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {wizardStep === 4 && (
                <button
                  type="button"
                  disabled={isSubmitting || (isAnyItemExpired && !overrideReason.trim())}
                  onClick={handleSubmitReturnTransaction}
                  className="flex items-center gap-2 px-6 py-2 bg-gold text-onyx font-bold rounded-lg text-xs hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-lg shadow-gold/10"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm & Finalize Return
                </button>
              )}

              {wizardStep === 5 && (
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-5 py-2 bg-onyx-surface border border-onyx-border text-foreground font-bold rounded-lg text-xs hover:bg-onyx-elevated"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. POLICY SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-onyx-surface border border-onyx-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-onyx-border">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold" />
                Branch Return & Exchange Policies
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-platinum-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-platinum-muted font-medium block mb-1">Return Window (Days)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={90}
                    className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-1.5"
                    value={policySettings.returnWindowDays}
                    onChange={(e) => setPolicySettings({ ...policySettings, returnWindowDays: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-[10px] text-platinum-muted">Default: 3 days</span>
                </div>

                <div>
                  <label className="text-platinum-muted font-medium block mb-1">Exchange Window (Days)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={90}
                    className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-1.5"
                    value={policySettings.exchangeWindowDays}
                    onChange={(e) => setPolicySettings({ ...policySettings, exchangeWindowDays: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-[10px] text-platinum-muted">Default: 7 days</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-platinum-muted font-medium block mb-1">Weight Tolerance (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-1.5"
                    value={policySettings.weightToleranceGrams}
                    onChange={(e) => setPolicySettings({ ...policySettings, weightToleranceGrams: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="text-platinum-muted font-medium block mb-1">High-Value Approval (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg px-3 py-1.5"
                    value={policySettings.highValueApprovalThreshold}
                    onChange={(e) => setPolicySettings({ ...policySettings, highValueApprovalThreshold: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-onyx-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policySettings.requirePhotoVerification}
                    onChange={(e) => setPolicySettings({ ...policySettings, requirePhotoVerification: e.target.checked })}
                    className="rounded bg-onyx border-onyx-border text-gold focus:ring-gold"
                  />
                  <span className="text-foreground">Require physical photographs (2–5 photos)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policySettings.allowPolicyOverride}
                    onChange={(e) => setPolicySettings({ ...policySettings, allowPolicyOverride: e.target.checked })}
                    className="rounded bg-onyx border-onyx-border text-gold focus:ring-gold"
                  />
                  <span className="text-foreground">Allow Manager Policy Override with audit logging</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policySettings.requireStepUpAuthAboveThreshold}
                    onChange={(e) => setPolicySettings({ ...policySettings, requireStepUpAuthAboveThreshold: e.target.checked })}
                    className="rounded bg-onyx border-onyx-border text-gold focus:ring-gold"
                  />
                  <span className="text-foreground">Require Step-Up PIN for high-value returns</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-onyx-border">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-platinum-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 bg-gold text-onyx font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50"
                >
                  {isSavingSettings ? "Saving..." : "Save Policies"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MANAGER REVIEW MODAL FOR PENDING TRANSACTIONS */}
      {selectedTxForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-onyx-surface border border-onyx-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-onyx-border">
              <h3 className="font-bold text-foreground text-sm">Review Return: {selectedTxForReview.transactionNumber}</h3>
              <button onClick={() => setSelectedTxForReview(null)} className="text-platinum-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-onyx rounded-lg border border-onyx-border space-y-1.5">
                <p className="flex justify-between"><span className="text-platinum-muted">Customer:</span> <strong className="text-foreground">{selectedTxForReview.customer?.name}</strong></p>
                <p className="flex justify-between"><span className="text-platinum-muted">Original Invoice:</span> <span className="font-mono">{selectedTxForReview.originalInvoice?.invoiceNumber}</span></p>
                <p className="flex justify-between"><span className="text-platinum-muted">Net Refund Payable:</span> <strong className="text-gold font-bold">₹{selectedTxForReview.financialSnapshot?.summary?.netRefundPayable?.toFixed(2)}</strong></p>
                <p className="flex justify-between"><span className="text-platinum-muted">Reason:</span> <span>{selectedTxForReview.reason}</span></p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRejectFromModal(selectedTxForReview.id)}
                  className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveFromModal(selectedTxForReview.id)}
                  className="flex-1 py-2.5 bg-gold text-onyx font-bold rounded-lg hover:bg-gold/90 transition-colors shadow-lg shadow-gold/10"
                >
                  Approve & Issue CN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
