"use client";

import React, { useRef } from "react";
import { Order } from "../../types/order";
import { ArrowLeft, Printer } from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";

interface Props {
  order: Order;
  onClose: () => void;
}

export default function OrderSlipPreview({ order, onClose }: Props) {
  const slipRef = useRef<HTMLDivElement>(null);
  const { branchSettings } = useBranchStore();

  const shopName = branchSettings?.shopName || "Shop Name";
  const address = branchSettings?.address || "All Address";
  const gstin = branchSettings?.gstin || "GSTIN";

  const handlePrint = () => {
    const content = slipRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Order Slip - ${order.orderNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#fff; color:#000; padding:24px; }
        .slip { max-width:600px; margin:auto; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #D4A843; padding-bottom:16px; }
        .store-name { font-size:20px; font-weight:800; letter-spacing:2px; color:#1a1a1a; text-transform:uppercase; }
        .store-sub { font-size:10px; color:#555; letter-spacing:1px; margin-top:4px; text-transform:uppercase; }
        .date-box { text-align:right; }
        .date-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; }
        .date-val { font-size:14px; font-weight:700; color:#000; margin-top:2px; }
        .section-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin:20px 0 10px; }
        .client-name { font-size:18px; font-weight:700; color:#000; }
        .client-phone { font-size:12px; color:#333; margin-top:2px; }
        .info-row { display:flex; gap:20px; margin:12px 0; }
        .info-box { background:#f9f9f9; border:1px solid #eaeaea; border-radius:8px; padding:10px 14px; }
        .info-box-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; }
        .info-box-val { font-size:14px; font-weight:700; color:#D4A843; margin-top:2px; }
        .ref-row { display:flex; justify-content:flex-end; gap:24px; margin:12px 0; }
        .ref-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; }
        .ref-val { font-size:14px; font-weight:700; color:#000; }
        .ref-val.gold { color:#D4A843; }
        table { width:100%; border-collapse:collapse; margin:12px 0; }
        th { font-size:9px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:1px; text-align:left; padding:8px 12px; border-bottom:1px solid #ddd; }
        td { font-size:12px; padding:10px 12px; border-bottom:1px solid #f0f0f0; color:#000; }
        .advance-box { background:#fffaf0; border:1px solid #D4A843; border-radius:10px; padding:16px; margin:16px 0; }
        .advance-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
        .advance-row { display:flex; justify-content:space-between; font-size:12px; margin:6px 0; color:#333; }
        .advance-total { font-size:18px; font-weight:800; color:#D4A843; }
        .terms { margin-top:24px; border-top:1px solid #eee; padding-top:16px; }
        .terms h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; color:#000; }
        .terms li { font-size:10px; color:#555; margin:4px 0; }
        .footer { text-align:center; margin-top:24px; font-size:9px; color:#888; letter-spacing:1px; }
        @media print { button { display:none!important; } body { padding:0; } }
      </style></head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onClose} className="flex items-center gap-2 text-[13px] text-[#888] hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
          <h1 className="text-[28px] font-bold text-foreground">Order Preview</h1>
          <p className="text-[13px] text-[#666] mt-1">Review the generated advance slip before printing.</p>
        </div>
        <button onClick={handlePrint}
          className="h-10 px-5 rounded-full bg-[#D4A843] text-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all">
          <Printer className="w-4 h-4" /> Print Document
        </button>
      </div>

      {/* Slip Preview */}
      <div className="max-w-[650px] mx-auto bg-white border border-[#eaeaea] rounded-2xl p-8" ref={slipRef}>
        <div className="slip">
          {/* Header */}
          <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #D4A843", paddingBottom: 16, marginBottom: 24 }}>
            <div>
              <div className="store-name" style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "#1a1a1a", textTransform: "uppercase" }}>{shopName}</div>
              <div className="store-sub" style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>{address}</div>
              <div className="store-sub" style={{ fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>GSTIN: {gstin}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Date of Issue</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginTop: 2 }}>
                {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Client Details</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#000" }}>{order.customerName}</div>
            <div style={{ fontSize: 12, color: "#333", marginTop: 2 }}>+91 {order.customerMobile}</div>
          </div>

          {/* Expected Delivery & Reference */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ background: "#f9f9f9", border: "1px solid #eaeaea", borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Expected Delivery</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#D4A843", marginTop: 2 }}>
                {new Date(order.deliveryDate).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Order Reference</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>#{order.orderNumber}</div>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginTop: 8 }}>Slip ID</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#D4A843", fontStyle: "italic" }}>{order.advance?.advanceReceiptNumber || "—"}</div>
            </div>
          </div>

          {/* Commissioned Items */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, borderBottom: "1px solid #eaeaea", paddingBottom: 8 }}>
            Commissioned Items
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr>
                <th style={{ fontSize: 9, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #eaeaea" }}>Category</th>
                <th style={{ fontSize: 9, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #eaeaea" }}>Description</th>
                <th style={{ fontSize: 9, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, textAlign: "right", padding: "8px 12px", borderBottom: "1px solid #eaeaea" }}>Weight / Size</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: 13, fontWeight: 600, color: "#000", padding: "10px 12px", borderBottom: "1px solid #f0f0f0" }}>{item.category?.name || "—"}</td>
                  <td style={{ fontSize: 12, color: "#333", padding: "10px 12px", borderBottom: "1px solid #f0f0f0" }}>
                    <div>{item.description || "—"}</div>
                    {item.voiceUrl && (
                      <div className="print-hide" style={{ marginTop: "8px" }}>
                        <audio controls src={item.voiceUrl} style={{ height: "30px", width: "200px" }} />
                      </div>
                    )}
                    {item.images && item.images.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
                        {item.images.map((img, i) => (
                          <img key={i} src={img} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 700, color: "#D4A843", padding: "10px 12px", borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>
                    {item.weight ? `${item.weight}g` : "—"}{item.measurement ? ` / ${item.measurement}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Advance Summary */}
          <div style={{ background: "#fffaf0", border: "1px solid #D4A843", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Advance Summary</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: "#333" }}>Cash Deposit</span>
              <span style={{ color: "#000", fontWeight: 600 }}>₹ {Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")}</span>
            </div>
            {Number(order.advance?.metalWeight || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "#333" }}>Exchange Metal ({order.advance?.metalPurity || "22K"})</span>
                <span style={{ color: "#000", fontWeight: 600 }}>{Number(order.advance?.metalWeight || 0).toFixed(3)} g</span>
              </div>
            )}
          </div>

          {/* Terms */}
          <div style={{ borderTop: "1px solid #eaeaea", paddingTop: 16, marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#000", marginBottom: 8 }}>Terms & Conditions</div>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {["Orders once placed cannot be cancelled after 24 hours of confirmation.",
                "Delivery dates are estimates and may vary by +3 days based on artisanal complexity.",
                "Final billing will be based on the gold rate prevalent at the time of delivery.",
                "Jewellery must be collected within 15 days of the delivery notification."
              ].map((t, i) => (
                <li key={i} style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>• {t}</li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 9, color: "#888", letterSpacing: 1 }}>
            This is a digitally generated document by Atelier Ledger Vault System
          </div>
        </div>
      </div>
    </div>
  );
}
