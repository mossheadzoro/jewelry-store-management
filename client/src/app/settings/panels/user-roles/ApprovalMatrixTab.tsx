"use client";

import React from "react";
import { FileCheck, AlertCircle } from "lucide-react";

const matrix = [
  { action: "Discount > 5%", minRole: "Manager", desc: "Requires managerial override to provide high discounts." },
  { action: "Discount > 10%", minRole: "Admin", desc: "Maximum discount threshold." },
  { action: "Change Gold Rate", minRole: "Admin", desc: "Global gold rate update." },
  { action: "Delete Order", minRole: "Admin", desc: "Soft-delete or cancel active orders." },
  { action: "Refund Invoice", minRole: "Admin", desc: "Process refunds back to customer wallet/cash." },
  { action: "Inventory Adjustment", minRole: "Manager", desc: "Correcting physical stock variances." },
  { action: "Cancel Saving Scheme", minRole: "Admin", desc: "Premature cancellation of active schemes." },
];

export default function ApprovalMatrixTab() {
  return (
    <div className="space-y-6">
      <div className="bg-onyx border border-onyx-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[13px] font-semibold text-platinum">How the Approval Matrix Works</h4>
          <p className="text-[12px] text-platinum-muted mt-1 leading-relaxed">
            When a user attempts an action that requires a higher role, a prompt will appear asking for a Manager or Admin PIN/Password to temporarily elevate privileges and authorize the transaction.
          </p>
        </div>
      </div>

      <div className="bg-onyx-surface rounded-xl border border-onyx-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-onyx-border bg-onyx-elevated/50 text-platinum-muted font-medium">
                <th className="px-6 py-4 text-left">Sensitive Action</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-left">Minimum Required Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border text-platinum">
              {matrix.map((item, i) => (
                <tr key={i} className="hover:bg-onyx/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-platinum-muted" />
                    {item.action}
                  </td>
                  <td className="px-6 py-4 text-platinum-muted text-[12px]">{item.desc}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="bg-onyx px-3 py-1.5 rounded border border-onyx-border text-[12px] text-platinum outline-none focus:border-gold w-32"
                      defaultValue={item.minRole}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Salesman">Salesman</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-onyx-border bg-onyx-elevated/50 flex justify-end">
          <button className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors">
            Save Matrix Rules
          </button>
        </div>
      </div>
    </div>
  );
}
