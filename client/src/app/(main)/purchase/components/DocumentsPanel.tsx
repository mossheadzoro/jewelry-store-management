// client/src/app/(main)/purchase/components/DocumentsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconFileText,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconDownload,
  IconEye,
  IconX,
  IconCheck,
  IconBuildingStore,
} from "@tabler/icons-react";

interface DocumentsPanelProps {
  onRefreshOverview: () => void;
}

export default function DocumentsPanel({ onRefreshOverview }: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    supplierId: "",
    documentType: "INVOICE_SCAN",
    storageUrl: "https://res.cloudinary.com/moual-erp/raw/upload/v1/purchase/sample_invoice.pdf",
    originalFileName: "Supplier_Tax_Invoice.pdf",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (docTypeFilter !== "ALL") params.set("documentType", docTypeFilter);

      const [resDocs, resSuppliers] = await Promise.all([
        fetch(`/api/purchase/documents?${params.toString()}`),
        fetch(`/api/purchase/suppliers?isActive=true`),
      ]);

      if (resDocs.ok) {
        const json = await resDocs.json();
        if (json.success) setDocuments(json.data || []);
      }
      if (resSuppliers.ok) {
        const json = await resSuppliers.json();
        if (json.success) setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error("Fetch purchase documents error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [docTypeFilter]);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchase/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload document");
      }

      setIsUploadModalOpen(false);
      await fetchDocs();
      onRefreshOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-onyx-surface border border-onyx-border p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold"
          >
            <option value="ALL">All Document Types</option>
            <option value="INVOICE_SCAN">Supplier Invoice Scan</option>
            <option value="ASSAY_CERTIFICATE">Assay / Spectrometer Certificate</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="EWAY_BILL">E-Way Bill</option>
            <option value="WEIGHT_SLIP">Digital Scale Weight Slip</option>
          </select>

          <button
            onClick={fetchDocs}
            className="p-2 rounded-xl bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-gold" : ""}`} />
          </button>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-onyx font-bold text-xs hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
        >
          <IconPlus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-platinum-muted">
            Loading repository documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-platinum-muted space-y-2">
            <IconFileText className="w-10 h-10 mx-auto text-platinum-muted/50" />
            <p>No scanned purchase documents stored.</p>
          </div>
        ) : (
          documents.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-2xl bg-onyx-surface border border-onyx-border space-y-3 hover:border-gold/40 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-onyx-elevated text-gold">
                    <IconFileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gold font-bold">{d.documentNumber}</span>
                    <h4 className="text-xs font-bold text-platinum line-clamp-1">{d.originalFileName}</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/15 text-emerald-300">
                  {d.verificationStatus}
                </span>
              </div>

              <div className="text-[11px] text-platinum-muted space-y-1">
                <div>Supplier: {d.supplier?.businessName || "General Purchase"}</div>
                <div>Type: {d.documentType.replace("_", " ")}</div>
                <div>Uploaded: {new Date(d.createdAt).toLocaleDateString("en-IN")}</div>
              </div>

              <div className="pt-2 border-t border-onyx-border flex items-center justify-between">
                <span className="text-[10px] text-platinum-muted">OCR: {d.ocrStatus}</span>
                <a
                  href={d.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-gold hover:underline font-semibold"
                >
                  <IconEye className="w-3.5 h-3.5" />
                  <span>View Scan</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
              <h2 className="text-sm font-bold text-platinum">Attach Purchase Document / Scan</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Bullion Supplier
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                >
                  <option value="">-- Optional: Link to Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Document Category *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                >
                  <option value="INVOICE_SCAN">Supplier Tax Invoice Scan</option>
                  <option value="ASSAY_CERTIFICATE">Assay / Spectrometer Certificate</option>
                  <option value="PURCHASE_ORDER">Purchase Order Slip</option>
                  <option value="EWAY_BILL">E-Way Bill</option>
                  <option value="WEIGHT_SLIP">Digital Scale Print Slip</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.originalFileName}
                  onChange={(e) => setFormData({ ...formData, originalFileName: e.target.value })}
                  placeholder="e.g. MMTC_Invoice_9812.pdf"
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum block mb-1">
                  Storage / Cloud URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.storageUrl}
                  onChange={(e) => setFormData({ ...formData, storageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum font-mono text-[11px] outline-none focus:border-gold"
                />
              </div>

              <div className="pt-3 border-t border-onyx-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-onyx border border-onyx-border text-platinum hover:bg-onyx/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-onyx font-bold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
