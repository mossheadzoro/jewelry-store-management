"use client";

import React from "react";
import { FileCheck, AlertCircle, Shield } from "lucide-react";

const matrix = [
  { action: "Discount > 5%", minRole: "Manager", desc: "Requires managerial override to provide high discounts on invoices." },
  { action: "Discount > 10%", minRole: "Admin", desc: "Maximum discount threshold requiring executive administration signoff." },
  { action: "Change Gold Rate", minRole: "Admin", desc: "Global store gold rate and board rate updates." },
  { action: "Delete Custom Order", minRole: "Admin", desc: "Soft-delete or cancel active bespoke jewellery orders." },
  { action: "Refund Invoice / Wallet", minRole: "Admin", desc: "Process monetary refunds back to customer wallet or cash drawer." },
  { action: "Inventory Stock Variance Adjustment", minRole: "Manager", desc: "Correcting physical barcode and RFID stock audit variances." },
  { action: "Cancel Saving Scheme", minRole: "Admin", desc: "Premature cancellation and closure of active customer gold schemes." },
  { action: "Verify Staff KYC Documents", minRole: "Manager", desc: "Inspection and official verification of staff identity proofs." },
  { action: "Delete Staff Profile", minRole: "Admin", desc: "Permanent deactivation and deletion of personnel records." },
];

export default function StaffApprovalMatrixTab() {
  return (
    <div className="space-y-6">
      <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-5 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-foreground">Role Elevation & Approval Matrix Governance</h4>
          <p className="text-[12.5px] text-[#888] mt-1 leading-relaxed">
            When a Salesman attempts an operational action exceeding their authority threshold, an authorization prompt appears requesting a Store Manager or Admin override credentials to authorize the sensitive transaction.
          </p>
        </div>
      </div>

      <div className="bg-onyx-surface rounded-2xl border border-onyx-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-onyx-border bg-[#111] text-platinum-muted font-medium">
                <th className="px-6 py-3.5 text-left">Sensitive Transaction / Action</th>
                <th className="px-6 py-3.5 text-left">Operational Description</th>
                <th className="px-6 py-3.5 text-left">Minimum Authorized Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border text-platinum">
              {matrix.map((item, i) => (
                <tr key={i} className="hover:bg-onyx-elevated/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground">{item.action}</td>
                  <td className="px-6 py-4 text-[#888]">{item.desc}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        item.minRole === "Admin"
                          ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                          : "bg-gold/15 text-gold border-gold/30"
                      }`}
                    >
                      {item.minRole}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
