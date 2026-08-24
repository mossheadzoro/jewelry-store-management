"use client";

import React, { useState } from "react";
import { X, Edit2, Check, Loader2 } from "lucide-react";
import { StaffMemberRow } from "./StaffTable";

interface EditStaffModalProps {
  open: boolean;
  user: StaffMemberRow;
  roles: any[];
  branches: any[];
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStaffModal({
  open,
  user,
  roles,
  branches,
  userRole,
  onClose,
  onSuccess,
}: EditStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "OWNER";

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    password: "",
    systemRole: user.systemRole || "SALESMAN",
    roleId: user.roleId ? String(user.roleId) : "",
    status: user.status || "ACTIVE",
    branches: user.userBranches?.map((ub) => String(ub.branchId)) || [],
    gender: user.gender || "MALE",
    phone: user.phone || "",
    address: user.address || "",
    department: user.department || "Sales",
    salary: user.salary ? String(user.salary) : "",
    panNumber: user.panNumber || "",
    aadharNumber: user.aadharNumber || "",
    bankAccount: user.bankAccount || "",
    ifscCode: user.ifscCode || "",
    emergencyContact: user.emergencyContact || "",
  });

  if (!open) return null;

  const handleBranchToggle = (branchId: string) => {
    setFormData((prev) => {
      const b = prev.branches;
      if (b.includes(branchId)) return { ...prev, branches: b.filter((id) => id !== branchId) };
      return { ...prev, branches: [...b, branchId] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: any = { ...formData, reason: reason.trim() || undefined };
      if (!body.password) delete body.password;

      const res = await fetch(`/api/settings/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update staff member");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-onyx-surface border border-onyx-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-onyx-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/30 flex items-center justify-center text-[#D4A843]">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-foreground">Edit Staff Profile</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/30">
                  {user.systemRole}
                </span>
              </div>
              <p className="text-[12px] text-[#777]">
                Modifications will be automatically diffed and recorded into the Staff Profile Change Ledger.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#666] hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          {/* Reason for Update (Audit Note) */}
          <div className="p-3.5 rounded-xl border border-[#D4A843]/25 bg-[#D4A843]/5">
            <label className="block text-[11px] font-bold text-[#D4A843] uppercase tracking-wider mb-1.5">
              Reason for Update (Audit Ledger Note)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Compensation revision and assigned to South Branch showroom"
              className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[12.5px] text-foreground placeholder:text-[#555]"
            />
          </div>

          {/* Account Details */}
          <div>
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
              Personal & Account Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  disabled={!isAdmin}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Phone Number *</label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#888] mb-1.5">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Tier & Governance (Manager/Admin only) */}
          {isManagerOrAdmin && (
            <div className="border-t border-onyx-border pt-5">
              <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
                System Tier, Custom Role & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] text-[#888] mb-1.5">System Tier</label>
                  <select
                    value={formData.systemRole}
                    disabled={!isAdmin && formData.systemRole === "ADMIN"}
                    onChange={(e) => setFormData({ ...formData, systemRole: e.target.value })}
                    className="w-full bg-onyx px-3 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground disabled:opacity-60"
                  >
                    {isAdmin && <option value="ADMIN">ADMIN</option>}
                    <option value="MANAGER">MANAGER</option>
                    <option value="SALESMAN">SALESMAN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#888] mb-1.5">Custom Role</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full bg-onyx px-3 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                  >
                    <option value="">-- Standard Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#888] mb-1.5">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-onyx px-3 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Branch Assignments (Manager/Admin only) */}
          {isManagerOrAdmin && (
            <div className="border-t border-onyx-border pt-5">
              <label className="block text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-2.5">
                Branch Assignments
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {branches.map((branch) => {
                  const isChecked = formData.branches.includes(String(branch.id));
                  return (
                    <label
                      key={branch.id}
                      onClick={() => handleBranchToggle(String(branch.id))}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked ? "border-[#D4A843] bg-[#D4A843]/5" : "border-onyx-border bg-onyx hover:border-[#D4A843]/30"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? "bg-[#D4A843] border-[#D4A843]" : "border-[#444]"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-black" />}
                      </div>
                      <span className="text-[12px] text-foreground truncate">{branch.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Financial Details */}
          <div className="border-t border-onyx-border pt-5">
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
              Tax, Compensation & Bank Identifiers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">PAN Number</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  disabled={!isManagerOrAdmin && !!formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground font-mono disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Aadhaar Number</label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  disabled={!isManagerOrAdmin && !!formData.aadharNumber}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground font-mono disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Monthly CTC Salary (₹)</label>
                <input
                  type="number"
                  disabled={!isManagerOrAdmin}
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Bank Account</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-onyx-border bg-onyx-elevated/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] text-[#888] bg-onyx border border-onyx-border hover:text-foreground cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#D4A843] text-foreground px-6 py-2 rounded-xl text-[13px] font-semibold hover:bg-[#e6bc5a] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
            {loading ? "Saving Changes..." : "Save Profile Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
