"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, CheckCircle2, Scale, User, MapPin, Phone, FileText, ShieldCheck, Hash } from "lucide-react";
import { roundFineGold } from "@/lib/fineGold";
import { useBranchStore } from "@/src/lib/store/useBranchStore";

interface OldGoldSlipModalProps {
  open: boolean;
  onClose: () => void;
  item: any;
  session?: any;
  branchName?: string;
}

export default function OldGoldSlipModal({
  open,
  onClose,
  item,
  session,
  branchName: passedBranchName,
}: OldGoldSlipModalProps) {
  const [activeTab, setActiveTab] = useState<"customer" | "shop">("customer");
  const { selectedBranch, branchSettings, fetchBranchSettings } = useBranchStore();
  const [fullCustomer, setFullCustomer] = useState<any | null>(item?.customer || null);

  useEffect(() => {
    if (selectedBranch?.id && !branchSettings) {
      fetchBranchSettings(selectedBranch.id);
    }
  }, [selectedBranch, branchSettings, fetchBranchSettings]);

  useEffect(() => {
    const custId = item?.customerId || item?.customer?.id;
    if (custId) {
      fetch(`/api/customer/${custId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setFullCustomer(data);
          }
        })
        .catch((err) => console.error("Error loading customer for slip:", err));
    }
  }, [item?.customerId, item?.customer?.id]);

  if (!item) return null;

  const shopName = branchSettings?.shopName || selectedBranch?.name || passedBranchName || "Jwellery Management Atelier";
  const shopLogo = branchSettings?.logoUrl || "";
  const shopAddress = branchSettings?.address || selectedBranch?.address || "";
  const shopPhone = branchSettings?.phoneNumbers || "";

  const queueId = item.queueId || item.id || "Q-001";
  const sessionNo = session?.sessionNumber || item.session?.sessionNumber || "SESSION";
  const slipNumber = `OGS-${sessionNo}-${queueId}`;

  const slipDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
  const slipTime = item.createdAt ? new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });

  const custName = fullCustomer?.name || item.customerName || item.customer?.name || "Valued Client";
  const custPhone = fullCustomer?.mobile || item.customerPhone || item.customer?.mobile || "N/A";

  const addressParts = [];
  const addr = fullCustomer?.address || item.customerAddress || item.customer?.address;
  const city = fullCustomer?.city || item.customerCity || item.customer?.city;
  const state = fullCustomer?.state || item.customerState || item.customer?.state;
  const pin = fullCustomer?.pincode || item.customerPincode || item.customer?.pincode;

  if (addr) addressParts.push(addr);
  if (city) addressParts.push(city);
  if (state) addressParts.push(state);
  if (pin) addressParts.push(pin);

  const custAddress = addressParts.length > 0 ? addressParts.join(", ") : "Main City / Atelier Address";

  const kycParts = [];
  const pan = fullCustomer?.pan || item.customerPan || item.customer?.pan;
  const aadhar = fullCustomer?.aadhar || item.customerAadhar || item.customer?.aadhar;
  const gstin = fullCustomer?.gstin || item.customerGstin || item.customer?.gstin;

  if (pan) kycParts.push(`PAN: ${pan}`);
  if (aadhar) kycParts.push(`Aadhaar: ${aadhar}`);
  if (gstin) kycParts.push(`GSTIN: ${gstin}`);

  const isKycVerified = kycParts.length > 0;
  const custKyc = isKycVerified ? kycParts.join(" | ") : "Unverified KYC";

  const fineGoldVal = item.fine != null ? roundFineGold(item.fine) : (item.fineGold != null ? roundFineGold(item.fineGold) : 0);

  const handlePrint2Pages = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const renderPageHtml = (copyTitle: string) => `
      <div class="page">
        <div class="header">
          ${shopLogo ? `<img src="${shopLogo}" alt="Shop Logo" class="shop-logo" />` : ''}
          <h2 class="shop-name font-serif">${shopName}</h2>
          ${shopAddress ? `<p class="address-text">${shopAddress} ${shopPhone ? `• Tel: ${shopPhone}` : ''}</p>` : ''}
          <p class="subtitle">Old Gold Exchange Division</p>
        </div>

        <div class="badge-row">
          <span class="copy-badge">${copyTitle}</span>
          <span class="status-badge">FINALIZED (TONCHED)</span>
        </div>

        <div class="divider"></div>

        <div class="grid-3">
          <div>
            <p class="label">SLIP NUMBER</p>
            <p class="value bold">${slipNumber}</p>
          </div>
          <div class="text-center">
            <p class="label">QUEUE ID</p>
            <p class="value bold text-highlight">${queueId}</p>
          </div>
          <div class="text-right">
            <p class="label">DATE & TIME</p>
            <p class="value">${slipDate} ${slipTime}</p>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-title">CUSTOMER & KYC DETAILS</div>
        <div class="grid-2">
          <div>
            <p class="label">Customer Name</p>
            <p class="value bold">${custName}</p>
          </div>
          <div>
            <p class="label">Mobile Number</p>
            <p class="value">${custPhone}</p>
          </div>
          <div style="grid-column: span 2;">
            <p class="label">Address / Location</p>
            <p class="value">${custAddress}</p>
          </div>
          <div style="grid-column: span 2;">
            <p class="label">KYC Details</p>
            <p class="value bold ${isKycVerified ? 'text-emerald' : 'text-danger'}">${custKyc}</p>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-title">ITEM & TESTING BREAKDOWN</div>
        <table>
          <thead>
            <tr>
              <th>Queue ID</th>
              <th>Description</th>
              <th class="text-center">Metal</th>
              <th class="text-right">Gross Wt (Before)</th>
              <th class="text-right">Net Wt (After)</th>
              <th class="text-right">Loss Wt</th>
              <th class="text-right">Purity %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bold">${queueId}</td>
              <td class="bold">${item.description || "Old Metal Scrap / Ornaments"}</td>
              <td class="text-center">${item.metalType || "GOLD"}</td>
              <td class="text-right">${(item.before || item.weightBefore || 0).toFixed(3)}g</td>
              <td class="text-right">${(item.after || item.weightAfter || 0).toFixed(3)}g</td>
              <td class="text-right">${(item.remaining || item.lossWeight || 0).toFixed(3)}g</td>
              <td class="text-right bold">${(item.purity || item.purityPercent || 0)}%</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="grid-2 highlight-box">
          <div>
            <p class="label gold-text font-bold">ACCUMULATED FINE METAL (CREDITED)</p>
            <p class="large-val gold-text">${fineGoldVal.toFixed(3)} g</p>
          </div>
          <div class="text-right">
            <p class="label">CUSTOMER WALLET STATUS</p>
            <p class="value bold text-emerald">✓ Credited to Customer Metal Wallet</p>
          </div>
        </div>

        <div class="divider"></div>

        <div class="signatures font-mono">
          <div class="sig-box">
            <div class="line"></div>
            <p>Customer Signature</p>
          </div>
          <div class="sig-box text-right">
            <div class="line"></div>
            <p>Authorized Atelier Representative</p>
          </div>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Old Gold Slip - ${slipNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: monospace, sans-serif; color: #000; background: #fff; padding: 0; margin: 0; line-height: 1.4; font-size: 12px; }
            .page { padding: 25px; border: 2px double #000; margin-bottom: 20px; box-sizing: border-box; }
            .page-break { page-break-after: always; break-after: page; }
            .header { text-align: center; margin-bottom: 12px; }
            .shop-logo { max-height: 55px; max-width: 170px; object-fit: contain; margin-bottom: 6px; }
            .shop-name { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; }
            .address-text { font-size: 10px; margin: 2px 0 0 0; color: #333; }
            .subtitle { font-size: 11px; margin: 4px 0 0 0; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge-row { display: flex; justify-content: space-between; margin-top: 10px; }
            .copy-badge { font-weight: bold; border: 1px solid #000; padding: 2px 8px; font-size: 11px; }
            .status-badge { font-weight: bold; background: #000; color: #fff; padding: 2px 8px; font-size: 11px; }
            .divider { border-top: 1px dashed #000; margin: 12px 0; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .label { font-size: 10px; color: #555; text-transform: uppercase; margin: 0; }
            .value { font-size: 12px; margin: 2px 0 0 0; }
            .bold { font-weight: bold; }
            .text-highlight { font-size: 13px; text-decoration: underline; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th { border-bottom: 1px solid #000; text-align: left; padding: 4px; font-size: 10px; text-transform: uppercase; }
            td { padding: 6px 4px; border-bottom: 1px border-dashed #ccc; font-size: 11px; }
            .highlight-box { border: 1px solid #000; padding: 10px; background: #f9f9f9; }
            .large-val { font-size: 20px; font-weight: bold; margin: 4px 0 0 0; }
            .gold-text { color: #000; }
            .text-emerald { color: #15803d; }
            .text-danger { color: #dc2626; font-weight: bold; }
            .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
            .sig-box { width: 45%; }
            .line { border-top: 1px solid #000; margin-bottom: 5px; margin-top: 35px; }
          </style>
        </head>
        <body>
          ${renderPageHtml("PAGE 1: CUSTOMER COPY")}
          <div class="page-break"></div>
          ${renderPageHtml("PAGE 2: STORE / SHOP COPY")}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#111113] border-[#2A2A30] text-[#F0EBE0] p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#1F1F24] flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#C9943A]" />
            <div>
              <DialogTitle className="text-lg font-bold text-[#F0EBE0] font-serif">
                Old Gold Slip
              </DialogTitle>
              <p className="text-xs text-[#8E8A85]">
                Ref: {slipNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("customer")}
              className={`text-xs ${activeTab === "customer" ? "bg-[#C9943A] text-foreground font-bold border-[#C9943A]" : "border-[#2A2A30] text-[#8E8A85]"}`}
            >
              Customer Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("shop")}
              className={`text-xs ${activeTab === "shop" ? "bg-[#C9943A] text-foreground font-bold border-[#C9943A]" : "border-[#2A2A30] text-[#8E8A85]"}`}
            >
              Shop Copy
            </Button>
          </div>
        </DialogHeader>

        {/* SLIP PREVIEW CARD */}
        <div className="my-3 p-5 rounded-xl bg-[#0A0A0B] border border-[#2A2A30] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
            <div className="flex items-center gap-3">
              {shopLogo && (
                <img src={shopLogo} alt="Logo" className="h-10 w-auto object-contain rounded bg-white/5 p-1" />
              )}
              <div>
                <h3 className="text-sm font-bold text-[#F0EBE0] uppercase tracking-wider">{shopName}</h3>
                {shopAddress && <p className="text-[10px] text-[#8E8A85]">{shopAddress}</p>}
                <p className="text-[11px] text-[#C9943A] font-semibold">Old Gold Exchange Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-[#C9943A]/20 text-[#C9943A] border-[#C9943A]/40 mb-1">
                {activeTab === "customer" ? "CUSTOMER COPY" : "SHOP COPY"}
              </Badge>
              <p className="text-[10px] text-[#8E8A85]">{slipDate} {slipTime}</p>
            </div>
          </div>

          {/* SLIP NUMBER & QUEUE ID ROW */}
          <div className="grid grid-cols-2 gap-3 bg-[#141417] p-3 rounded-lg border border-[#1F1F24]">
            <div>
              <span className="text-[#8E8A85] flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#C9943A]" /> Slip Number
              </span>
              <p className="font-bold text-foreground mt-0.5">{slipNumber}</p>
            </div>
            <div>
              <span className="text-[#8E8A85] flex items-center gap-1">
                <Hash className="w-3 h-3 text-[#C9943A]" /> Queue ID
              </span>
              <p className="font-bold text-[#C9943A] mt-0.5">{queueId}</p>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="space-y-2">
            <span className="text-[#C9943A] font-semibold text-[11px] uppercase tracking-wider block">
              Customer & KYC Info
            </span>
            <div className="grid grid-cols-2 gap-3 bg-[#141417] p-3 rounded-lg border border-[#1F1F24]">
              <div>
                <span className="text-[#8E8A85] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#C9943A]" /> Customer
                </span>
                <p className="font-bold text-foreground mt-0.5">{custName}</p>
              </div>
              <div>
                <span className="text-[#8E8A85] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#C9943A]" /> Mobile
                </span>
                <p className="font-semibold text-foreground mt-0.5">{custPhone}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#8E8A85]">Address</span>
                <p className="font-medium text-foreground mt-0.5">{custAddress}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#8E8A85]">KYC Details</span>
                <p className={`font-semibold mt-0.5 ${isKycVerified ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>{custKyc}</p>
              </div>
            </div>
          </div>

          {/* ITEM WEIGHT & PURITY TABLE */}
          <div className="space-y-2">
            <span className="text-[#C9943A] font-semibold text-[11px] uppercase tracking-wider block">
              Testing & Purity Breakdown
            </span>
            <div className="grid grid-cols-3 gap-2 bg-[#141417] p-3 rounded-lg border border-[#1F1F24]">
              <div>
                <span className="text-[#8E8A85]">Metal Type</span>
                <p className="font-bold text-foreground mt-0.5">{item.metalType || "GOLD"}</p>
              </div>
              <div>
                <span className="text-[#8E8A85]">Gross Wt (Before)</span>
                <p className="font-semibold text-foreground mt-0.5">{(item.before || item.weightBefore || 0).toFixed(3)} g</p>
              </div>
              <div>
                <span className="text-[#8E8A85]">Net Wt (After)</span>
                <p className="font-semibold text-foreground mt-0.5">{(item.after || item.weightAfter || 0).toFixed(3)} g</p>
              </div>
              <div>
                <span className="text-[#8E8A85]">Weight Loss</span>
                <p className="font-semibold text-orange-400 mt-0.5">{(item.remaining || item.lossWeight || 0).toFixed(3)} g</p>
              </div>
              <div>
                <span className="text-[#8E8A85]">Purity %</span>
                <p className="font-bold text-foreground mt-0.5">{(item.purity || item.purityPercent || 0)}%</p>
              </div>
              <div>
                <span className="text-[#8E8A85]">Status</span>
                <p className="font-bold text-emerald-400 mt-0.5">TONCHED</p>
              </div>
            </div>
          </div>

          {/* ACCUMULATED FINE METAL & WALLET STATUS */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-secondary to-background border border-[#C9943A]/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#E8B84B] tracking-wider">Accumulated Fine Metal</span>
              <p className="text-xl font-black text-foreground mt-0.5">
                {fineGoldVal.toFixed(3)} <span className="text-xs font-normal text-[#E8B84B]">g</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> Wallet Credited
              </span>
              <p className="text-[10px] text-[#8E8A85] mt-0.5">Added to Customer Balance</p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-[#1F1F24] flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2A2A30] text-xs text-[#E0D8CC]"
          >
            Close
          </Button>
          <Button
            onClick={handlePrint2Pages}
            className="bg-[#C9943A] hover:bg-[#E8B84B] text-foreground font-bold text-xs gap-2 px-5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print 2-Page Old Gold Slip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
