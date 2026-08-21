"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Edit2, Save, Printer, Loader2, Calendar, AlertTriangle, FileText } from "lucide-react";

interface OrderDetailsModalProps {
  open: boolean;
  order: any;
  onClose: () => void;
  onSuccess: () => void;
  customerName: string;
  customerMobile: string;
}

export default function OrderDetailsModal({ open, order, onClose, onSuccess, customerName, customerMobile }: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [karigars, setKarigars] = useState<any[]>([]);
  const [loadingKarigars, setLoadingKarigars] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  
  // Form State
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [karigarId, setKarigarId] = useState("");

  const slipRef = useRef<HTMLDivElement>(null);

  // Initialize form state when order changes
  useEffect(() => {
    if (order) {
      setStatus(order.status || "CREATED");
      setPriority(order.priority || "STANDARD");
      setNotes(order.notes || "");
      setKarigarId(order.karigar?.id || "");
      if (order.deliveryDate) {
        setDeliveryDate(new Date(order.deliveryDate).toISOString().split("T")[0]);
      } else {
        setDeliveryDate("");
      }
      setShowCancelOptions(false);
      setIsEditing(false);
    }
  }, [order, open]);

  // Load available karigars when editing is toggled
  useEffect(() => {
    if (isEditing && karigars.length === 0) {
      const fetchKarigars = async () => {
        setLoadingKarigars(true);
        try {
          const res = await fetch("/api/karigar/available");
          if (res.ok) {
            const data = await res.json();
            setKarigars(data);
          }
        } catch (err) {
          console.error("Failed to load karigars", err);
        } finally {
          setLoadingKarigars(false);
        }
      };
      fetchKarigars();
    }
  }, [isEditing, karigars.length]);

  if (!open || !order) return null;

  const handleSave = async () => {
    if (!deliveryDate) {
      alert("Expected delivery date is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/order/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          notes,
          deliveryDate,
          karigarId: karigarId || null,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onSuccess();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update order");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async (type: "store" | "refund") => {
    setSaving(true);
    try {
      const cancelTag = type === "store" ? " [CANCEL_TYPE: STORE_ADVANCE]" : " [CANCEL_TYPE: REFUND_ADVANCE]";
      const newNotes = order.notes ? `${order.notes}${cancelTag}` : cancelTag.trim();

      const res = await fetch(`/api/order/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          notes: newNotes,
        }),
      });

      if (res.ok) {
        setShowCancelOptions(false);
        onSuccess();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to cancel order");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const printStandardSlip = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Order Slip - ${order.orderNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#fff; color:#000; padding:24px; }
        .slip { max-width:600px; margin:auto; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #D4A843; padding-bottom:16px; }
        .store-name { font-size:20px; font-weight:800; letter-spacing:2px; color:#1a1a1a; }
        .store-sub { font-size:10px; color:#888; letter-spacing:1px; margin-top:4px; }
        .date-box { text-align:right; }
        .date-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .date-val { font-size:14px; font-weight:700; margin-top:2px; }
        .section-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin:20px 0 10px; }
        .client-name { font-size:18px; font-weight:700; }
        .client-phone { font-size:12px; color:#666; margin-top:2px; }
        .ref-box { text-align:right; }
        .ref-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .ref-val { font-size:14px; font-weight:700; }
        table { width:100%; border-collapse:collapse; margin:12px 0; }
        th { font-size:9px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px; text-align:left; padding:8px 12px; border-bottom:1px solid #ddd; }
        td { font-size:12px; padding:10px 12px; border-bottom:1px solid #f0f0f0; }
        .advance-box { background:#fffaf0; border:1px solid #D4A843; border-radius:10px; padding:16px; margin:16px 0; }
        .advance-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
        .advance-row { display:flex; justify-content:space-between; font-size:12px; margin:6px 0; }
        .footer { text-align:center; margin-top:24px; font-size:9px; color:#aaa; letter-spacing:1px; }
        .status-badge { display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; margin-top:8px; border:1px solid #000; }
        @media print { button { display:none!important; } body { padding:0; } }
      </style></head><body>
        <div class="slip">
          <div class="header">
            <div>
              <div class="store-name" style="color: #D4A843;">THE CURATED ATELIER</div>
              <div class="store-sub">HERITAGE WING, NEW DELHI BRANCH</div>
              <div class="store-sub">GSTIN: 07AAAAA0000A1Z5</div>
            </div>
            <div class="date-box">
              <div class="date-label">Date of Issue</div>
              <div class="date-val">${new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div class="section-title">Client Details</div>
            <div class="client-name">${customerName || order.customerName || order.customer?.name || ""}</div>
            <div class="client-phone">+91 ${customerMobile || order.customerMobile || order.customer?.mobile || ""}</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px 14px;">
              <div class="date-label">Expected Delivery</div>
              <div style="font-size: 14px; font-weight: 700; color: #D4A843; margin-top: 2px;">
                ${new Date(order.deliveryDate).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div class="ref-box">
              <div class="ref-label">Order Reference</div>
              <div class="ref-val">#${order.orderNumber}</div>
              <div class="ref-label" style="margin-top: 8px;">Slip ID</div>
              <div class="ref-val" style="color: #D4A843; font-style: italic;">${order.advance?.advanceReceiptNumber || "—"}</div>
              <div class="ref-label" style="margin-top: 8px;">Status</div>
              <div class="status-badge">${order.status}</div>
            </div>
          </div>
          <div class="section-title">Commissioned Items</div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align: right;">Weight / Size</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map((item: any) => `
                <tr>
                  <td style="font-weight: 600; padding: 10px 12px; border-bottom: 1px solid #f0f0f0;">${item.category?.name || "—"}</td>
                  <td style="color: #555; padding: 10px 12px; border-bottom: 1px solid #f0f0f0;">${item.description || "—"}</td>
                  <td style="font-weight: 700; color: #D4A843; padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">
                    ${item.weight ? `${item.weight}g` : "—"}${item.measurement ? ` / ${item.measurement}` : ""}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="advance-box">
            <div class="advance-title">Advance Summary</div>
            <div class="advance-row">
              <span style="color: #555;">Cash Deposit</span>
              <span style="font-weight: 700;">₹ ${Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")}</span>
            </div>
            ${Number(order.advance?.metalWeight || 0) > 0 ? `
              <div class="advance-row">
                <span style="color: #555;">Exchange Metal (${order.advance?.metalPurity || "22K"})</span>
                <span style="font-weight: 700;">${Number(order.advance?.metalWeight || 0).toFixed(3)} g</span>
              </div>
            ` : ""}
          </div>
          <div class="footer">This is a digitally generated document by Atelier Ledger Vault System</div>
        </div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const printUpdatedSlip = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Advance Slip (Updated) - ${order.orderNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#fff; color:#000; padding:24px; }
        .slip { max-width:600px; margin:auto; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #D4A843; padding-bottom:16px; }
        .store-name { font-size:20px; font-weight:800; letter-spacing:2px; color:#1a1a1a; }
        .store-sub { font-size:10px; color:#888; letter-spacing:1px; margin-top:4px; }
        .date-box { text-align:right; }
        .date-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .date-val { font-size:14px; font-weight:700; margin-top:2px; }
        .section-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin:20px 0 10px; }
        .client-name { font-size:18px; font-weight:700; }
        .client-phone { font-size:12px; color:#666; margin-top:2px; }
        .ref-box { text-align:right; }
        .ref-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .ref-val { font-size:14px; font-weight:700; }
        .status-badge { display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; margin-top:8px; border:1px solid #000; }
        .advance-box { background:#fffaf0; border:1px solid #D4A843; border-radius:10px; padding:16px; margin:16px 0; }
        .advance-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
        .advance-row { display:flex; justify-content:space-between; font-size:12px; margin:6px 0; }
        .footer { text-align:center; margin-top:24px; font-size:9px; color:#aaa; letter-spacing:1px; }
        @media print { button { display:none!important; } body { padding:0; } }
      </style></head><body>
        <div class="slip">
          <div class="header">
            <div>
              <div class="store-name" style="color: #D4A843;">THE CURATED ATELIER</div>
              <div class="store-sub">HERITAGE WING, NEW DELHI BRANCH</div>
              <div class="store-sub">GSTIN: 07AAAAA0000A1Z5</div>
            </div>
            <div class="date-box">
              <div class="date-label">Date of Issue</div>
              <div class="date-val">${new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div class="section-title">Client Details</div>
            <div class="client-name">${customerName || order.customerName || order.customer?.name || ""}</div>
            <div class="client-phone">+91 ${customerMobile || order.customerMobile || order.customer?.mobile || ""}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div>
              <div class="date-label">Status</div>
              <div class="status-badge" style="background:#fff; color:#000; border-color:#000;">
                ${order.status === 'CANCELLED' ? 'CANCELLED (ADVANCE HELD)' : order.status}
              </div>
            </div>
            <div class="ref-box">
              <div class="ref-label">Order Reference</div>
              <div class="ref-val">#${order.orderNumber}</div>
              <div class="ref-label" style="margin-top: 8px;">Slip ID</div>
              <div class="ref-val" style="color: #D4A843; font-style: italic;">${order.advance?.advanceReceiptNumber || "—"}</div>
            </div>
          </div>

          <div class="advance-box">
            <div class="advance-title">Advance Held Summary</div>
            <div class="advance-row">
              <span style="color: #555;">Cash Deposit</span>
              <span style="font-weight: 700;">₹ ${Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")}</span>
            </div>
            ${Number(order.advance?.metalWeight || 0) > 0 ? `
              <div class="advance-row">
                <span style="color: #555;">Exchange Metal (${order.advance?.metalPurity || "22K"})</span>
                <span style="font-weight: 700;">${Number(order.advance?.metalWeight || 0).toFixed(3)} g</span>
              </div>
            ` : ""}
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px; font-size:10px; color:#777; line-height:1.5;">
            <h4>Deposit Notes:</h4>
            <p>This document verifies that the advance cash and metal deposit remains safely held as store credit. For cancelled orders, this credit is retained under the customer account for future redemptions.</p>
          </div>

          <div class="footer">This is a digitally generated document by Atelier Ledger Vault System</div>
        </div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const isCancelled = order.status === "CANCELLED";
  const isStoredAdvance = order.notes?.includes("[CANCEL_TYPE: STORE_ADVANCE]") || (isCancelled && !order.notes?.includes("[CANCEL_TYPE: REFUND_ADVANCE]"));
  const isRefundedAdvance = order.notes?.includes("[CANCEL_TYPE: REFUND_ADVANCE]");

  const isPrintOrderDisabled = isCancelled && isRefundedAdvance;
  const isPrintAdvanceDisabled = !(isCancelled && isStoredAdvance);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111] border border-[#222] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f] bg-onyx-surface">
          <div>
            <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
              Order #{order.orderNumber} Details
              {order.status === "CANCELLED" && (
                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Cancelled
                </span>
              )}
            </h2>
            <p className="text-[12px] text-[#555]">
              Receipt Date: {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-onyx-elevated border border-[#252525] flex items-center justify-center text-[#666] hover:text-foreground hover:border-border transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
          
          {/* Main Action Buttons */}
          <div className="flex items-center justify-between bg-[#161616] border border-[#222] rounded-xl p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={printStandardSlip}
                disabled={isPrintOrderDisabled}
                className={`h-9 px-4 rounded-lg border text-[12px] font-semibold flex items-center gap-2 transition-all ${
                  isPrintOrderDisabled 
                  ? "bg-[#181818] border-[#222] text-[#444] cursor-not-allowed" 
                  : "bg-secondary border-border hover:border-[#444] text-foreground cursor-pointer"
                }`}
                title={isPrintOrderDisabled ? "Print Order Slip is disabled because the advance was refunded" : "Print standard order slip with items"}
              >
                <Printer className="w-3.5 h-3.5" />
                Print Order Slip
              </button>
              <button
                onClick={printUpdatedSlip}
                disabled={isPrintAdvanceDisabled}
                className={`h-9 px-4 rounded-lg border text-[12px] font-semibold flex items-center gap-2 transition-all ${
                  isPrintAdvanceDisabled 
                  ? "bg-[#181818] border-[#222] text-[#444] cursor-not-allowed" 
                  : "bg-secondary border-border hover:border-[#444] text-[#D4A843] cursor-pointer"
                }`}
                title={isPrintAdvanceDisabled ? "Advance slip print is only active when Cancel & Store Advance is selected" : "Print updated advance slip (no items)"}
              >
                <FileText className="w-3.5 h-3.5" />
                Print Advance Slip
              </button>
            </div>

            {!isEditing && order.status !== "CANCELLED" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-4 rounded-lg bg-transparent border border-border text-[#ccc] text-[12px] font-semibold flex items-center gap-2 hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Order
                </button>
                <button
                  onClick={() => setShowCancelOptions(true)}
                  className="h-9 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-semibold hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>

          {/* Cancellation Drawer Overlay */}
          {showCancelOptions && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground text-[14px] font-bold">Choose Cancellation Option</h4>
                  <p className="text-[#888] text-[12px] mt-1">
                    Select how the system should settle this order's advance of ₹{Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")} and {Number(order.advance?.metalWeight || 0)}g metal.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <button
                  onClick={() => handleCancelOrder("store")}
                  disabled={saving}
                  className="py-3 px-4 rounded-xl bg-[#D4A843] text-foreground font-semibold text-[13px] hover:bg-[#e6bc5a] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cancel & Store Advance
                </button>
                <button
                  onClick={() => handleCancelOrder("refund")}
                  disabled={saving}
                  className="py-3 px-4 rounded-xl bg-red-500 text-foreground font-semibold text-[13px] hover:bg-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cancel & Refund Advance
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCancelOptions(false)}
                  className="text-[12px] text-[#888] hover:text-foreground transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Main Info Blocks */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* View/Edit Form Details */}
            <div className="bg-onyx-surface border border-[#222] rounded-xl p-5 space-y-4">
              <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-2 border-b border-[#222] pb-2">
                Order Properties
              </h3>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Status selection */}
                  <div>
                    <label className="block text-[11px] text-[#666] mb-1.5 font-medium uppercase">Order Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 appearance-none cursor-pointer"
                    >
                      {["CREATED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED", "RETURNED"].map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className="block text-[11px] text-[#666] mb-1.5 font-medium uppercase">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 appearance-none cursor-pointer"
                    >
                      {["STANDARD", "URGENT", "RUSH"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <label className="block text-[11px] text-[#666] mb-1.5 font-medium uppercase">Expected Delivery</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 [color-scheme:dark]"
                    />
                  </div>

                  {/* Karigar assignment */}
                  <div>
                    <label className="block text-[11px] text-[#666] mb-1.5 font-medium uppercase">Assign Karigar</label>
                    {loadingKarigars ? (
                      <div className="flex items-center gap-2 text-[12px] text-[#555]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading artisans...
                      </div>
                    ) : (
                      <select
                        value={karigarId}
                        onChange={(e) => setKarigarId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 appearance-none cursor-pointer"
                      >
                        <option value="">Not Assigned</option>
                        {karigars.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name} ({k.department})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#555]">Status</span>
                    <span className="font-semibold text-foreground uppercase">{order.status.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Priority</span>
                    <span className="font-semibold text-[#D4A843]">{order.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Expected Delivery</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#555]" />
                      {new Date(order.deliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Assigned To</span>
                    <span className="font-semibold text-foreground">
                      {order.karigar ? order.karigar.name : order.Wholesaler ? order.Wholesaler.name : "None"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Advance held details */}
            <div className="bg-onyx-surface border border-[#222] rounded-xl p-5 space-y-4">
              <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-2 border-b border-[#222] pb-2">
                Advance Ledger Deposit
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#555]">Advance Receipt ID</span>
                  <span className="font-mono text-foreground font-semibold">{order.advance?.advanceReceiptNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#555]">Cash Deposit</span>
                  <span className="text-foreground font-bold">
                    ₹ {Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {Number(order.advance?.metalWeight || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#555]">Exchange Metal</span>
                    <span className="text-[#D4A843] font-bold">
                      {Number(order.advance?.metalWeight || 0).toFixed(3)}g ({order.advance?.metalPurity || "22K"})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commissioned Items List */}
          <div className="bg-onyx-surface border border-[#222] rounded-xl p-5">
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-4 border-b border-[#222] pb-2">
              Commissioned Items List
            </h3>
            
            {/* Table layout for items */}
            <div className="space-y-3">
              {order.items?.length === 0 ? (
                <p className="text-[13px] text-[#555]">No items associated with this order.</p>
              ) : (
                <div className="divide-y divide-[#222]">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[14px] font-bold text-foreground">{item.category?.name || "Bespoke Custom"}</p>
                        <p className="text-[12px] text-[#666] mt-0.5">{item.description || "No description provided."}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-[#D4A843]">
                          {item.weight ? `${item.weight}g` : "—"}
                        </p>
                        {item.measurement && (
                          <p className="text-[11px] text-[#555] mt-0.5">Size: {item.measurement}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes section */}
          <div className="bg-onyx-surface border border-[#222] rounded-xl p-5">
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-2 border-b border-[#222] pb-2">
              Special Order Instructions / Notes
            </h3>
            {isEditing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter custom crafting notes, designer specifications, customer constraints..."
                className="w-full min-h-[80px] p-3 rounded-lg bg-[#0c0c0c] border border-[#1f1f1f] text-[13px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/40 resize-y"
              />
            ) : (
              <p className="text-[13px] text-[#888] leading-relaxed italic">
                {order.notes ? `"${order.notes}"` : "No custom instructions saved for this order."}
              </p>
            )}
          </div>
        </div>

        {/* Footer (only visible when editing) */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f1f1f] bg-onyx-surface">
            <button
              onClick={() => setIsEditing(false)}
              className="h-9 px-4 rounded-lg text-[13px] text-[#999] bg-onyx-elevated border border-[#252525] hover:text-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-[#D4A843] text-foreground hover:bg-[#e6bc5a] transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
