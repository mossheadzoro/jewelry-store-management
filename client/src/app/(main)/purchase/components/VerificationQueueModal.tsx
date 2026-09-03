// client/src/app/(main)/purchase/components/VerificationQueueModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  IconX,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconLock,
  IconRefresh,
  IconChevronRight,
  IconArrowUpRight,
} from "@tabler/icons-react";

interface VerificationQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecisionMade: () => void;
}

export default function VerificationQueueModal({
  isOpen,
  onClose,
  onDecisionMade,
}: VerificationQueueModalProps) {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase/verification");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setQueue(json.data || []);
          if (json.data?.length > 0 && !selectedRequest) {
            setSelectedRequest(json.data[0]);
          }
        }
      }
    } catch (err) {
      console.error("Fetch verification queue error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchQueue();
  }, [isOpen]);

  const handleDecision = async (decision: "APPROVED" | "REJECTED" | "ESCALATED") => {
    if (!selectedRequest) return;
    setErrorMsg(null);
    setProcessing(true);

    try {
      const res = await fetch("/api/purchase/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationRequestId: selectedRequest.id,
          decision,
          decisionNotes,
          pinVerified: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process verification decision");
      }

      setDecisionNotes("");
      setManagerPin("");
      await fetchQueue();
      onDecisionMade();
      if (queue.length <= 1) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit decision");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-onyx-surface border border-onyx-border rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border bg-onyx-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <IconShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-platinum">Purchase Verification & Approval Queue</h2>
              <p className="text-[11px] text-platinum-muted">
                Manager / Admin Authorization Matrix for Exceptions & Thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-onyx text-platinum-muted hover:text-platinum transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Split: List on left, Details on right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-onyx-border">
          {/* Left Column: Request List */}
          <div className="overflow-y-auto p-4 space-y-2 bg-onyx/40">
            <div className="flex items-center justify-between pb-2 border-b border-onyx-border/60 text-xs text-platinum-muted">
              <span className="font-semibold uppercase text-[10px]">Pending Items ({queue.length})</span>
              <button onClick={fetchQueue} className="hover:text-gold">
                <IconRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="py-12 text-center text-xs text-platinum-muted space-y-2">
                <IconCheck className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
                <p>No pending verification requests.</p>
              </div>
            ) : (
              queue.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-3 rounded-xl cursor-pointer border text-xs transition-all ${
                    selectedRequest?.id === req.id
                      ? "bg-onyx-elevated border-gold shadow-sm shadow-gold/10"
                      : "bg-onyx/60 border-onyx-border hover:border-gold/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-platinum">{req.requestNumber}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      req.riskLevel === "CRITICAL" ? "bg-rose-500/20 text-rose-300" :
                      req.riskLevel === "HIGH" ? "bg-amber-500/20 text-amber-300" :
                      "bg-blue-500/20 text-blue-300"
                    }`}>
                      {req.riskLevel}
                    </span>
                  </div>
                  <div className="font-medium text-platinum mt-1 line-clamp-1">{req.title}</div>
                  <div className="text-[10px] text-platinum-muted mt-1 flex items-center justify-between">
                    <span>{req.actionType}</span>
                    <span>{req.requestedBy?.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Selected Request Inspection Checklist & Decision */}
          <div className="md:col-span-2 overflow-y-auto p-6 space-y-5 bg-onyx-surface">
            {selectedRequest ? (
              <>
                {/* Header Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gold font-bold">{selectedRequest.requestNumber}</span>
                    <span className="text-[10px] text-platinum-muted">
                      Created: {new Date(selectedRequest.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-platinum">{selectedRequest.title}</h3>
                  <p className="text-xs text-platinum-muted">{selectedRequest.description}</p>
                </div>

                {/* Checklist / Comparison Table */}
                <div className="rounded-xl border border-onyx-border overflow-hidden bg-onyx-elevated/40">
                  <div className="px-4 py-2.5 bg-onyx-elevated border-b border-onyx-border text-xs font-bold text-platinum flex items-center gap-2">
                    <IconShieldCheck className="w-4 h-4 text-gold" />
                    Verification Checklist Items
                  </div>
                  <div className="divide-y divide-onyx-border/60 text-xs">
                    {selectedRequest.items?.map((item: any) => (
                      <div key={item.id} className="p-3 grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-platinum-muted uppercase block">{item.label}</span>
                          <span className="font-semibold text-platinum">{item.itemKey}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-platinum-muted uppercase block">Expected</span>
                          <span className="text-platinum-muted font-mono">{item.expectedValue}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-platinum-muted uppercase block">Actual</span>
                          <span className={`font-mono font-bold ${item.isFlagged ? "text-amber-400" : "text-emerald-400"}`}>
                            {item.actualValue}
                          </span>
                          {item.difference && (
                            <span className="text-[10px] block text-platinum-muted">({item.difference})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason Callout */}
                {selectedRequest.reason && (
                  <div className="p-3 rounded-lg bg-onyx-elevated border border-onyx-border text-xs">
                    <span className="text-[10px] uppercase font-bold text-platinum-muted block">Trigger Reason</span>
                    <p className="text-platinum mt-0.5">{selectedRequest.reason}</p>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <IconAlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Decision Notes & Action Buttons */}
                <div className="space-y-3 pt-2 border-t border-onyx-border">
                  <div>
                    <label className="text-[11px] font-semibold text-platinum block mb-1">
                      Manager Approval Notes / Justification:
                    </label>
                    <textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Enter verification comments or audit notes..."
                      className="w-full h-16 p-2.5 rounded-lg bg-onyx-elevated border border-onyx-border text-xs text-platinum outline-none focus:border-gold resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => handleDecision("REJECTED")}
                      disabled={processing}
                      className="px-4 py-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Reject & Cancel
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision("ESCALATED")}
                        disabled={processing}
                        className="px-4 py-2 rounded-lg bg-onyx-elevated border border-onyx-border text-platinum-muted hover:text-platinum text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Escalate to Admin
                      </button>

                      <button
                        onClick={() => handleDecision("APPROVED")}
                        disabled={processing}
                        className="px-5 py-2 rounded-lg bg-gold text-onyx hover:bg-gold/90 text-xs font-bold transition-all shadow-md shadow-gold/20 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <IconCheck className="w-4 h-4" />
                        {processing ? "Authorizing..." : "Authorize & Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-platinum-muted">
                Select a verification request from the list to review details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
