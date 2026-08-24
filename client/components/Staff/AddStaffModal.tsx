"use client";

import React, { useState } from "react";
import { X, Briefcase, Check, Loader2 } from "lucide-react";

interface AddStaffModalProps {
  open: boolean;
  roles: any[];
  branches: any[];
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStaffModal({
  open,
  roles,
  branches,
  userRole,
  onClose,
  onSuccess,
}: AddStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    systemRole: "SALESMAN",
    roleId: "",
    status: "ACTIVE",
    branches: [] as string[],
    gender: "MALE",
    phone: "",
    address: "",
    department: "Sales",
    salary: "",
    panNumber: "",
    aadharNumber: "",
    bankAccount: "",
    ifscCode: "",
    emergencyContact: "",
    creationReason: "New staff member onboarding",
  });

  // Optional Initial KYC File
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycDocType, setKycDocType] = useState("AADHAR");
  const [kycNotes, setKycNotes] = useState("");

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
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create staff member");
        setLoading(false);
        return;
      }

      const createdUser = await res.json();

      // If initial KYC file selected, upload it
      if (kycFile && createdUser.id) {
        try {
          const kycForm = new FormData();
          kycForm.append("file", kycFile);
          kycForm.append("documentType", kycDocType);
          kycForm.append("notes", kycNotes || "Uploaded during staff profile creation");
          await fetch(`/api/settings/users/${createdUser.id}/kyc/upload`, {
            method: "POST",
            body: kycForm,
          });
        } catch (err) {
          console.error("Failed to upload staff initial KYC document:", err);
        }
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
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-foreground">Add Staff Member</h2>
              <p className="text-[12px] text-[#777]">
                Create new employee profile with role permissions & KYC identity credentials
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

          {/* 1. Account & Personal Details */}
          <div>
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
              1. Account Credentials & Contacts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh Verma"
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
                  placeholder="e.g. ramesh@atelier.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Phone Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Temporary Password *</label>
                <input
                  required
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#888] mb-1.5">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. 14, MG Road, Mumbai"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
            </div>
          </div>

          {/* 2. System Tier & Role Governance */}
          <div className="border-t border-onyx-border pt-5">
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
              2. System Tier & Role Governance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">System Tier *</label>
                <select
                  value={formData.systemRole}
                  onChange={(e) => setFormData({ ...formData, systemRole: e.target.value })}
                  className="w-full bg-onyx px-3 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                >
                  {userRole === "ADMIN" && <option value="ADMIN">ADMIN (Full Governance)</option>}
                  <option value="MANAGER">MANAGER (Branch Supervision)</option>
                  <option value="SALESMAN">SALESMAN (POS & Front Desk)</option>
                  <option value="VIEWER">VIEWER (Read Only)</option>
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
                <label className="block text-[12px] text-[#888] mb-1.5">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-onyx px-3 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                >
                  <option value="Sales">Sales & Showroom</option>
                  <option value="Inventory">Inventory & Vault</option>
                  <option value="Billing">Billing & Cashier</option>
                  <option value="Management">Store Management</option>
                  <option value="Accounts">Accounts & Finance</option>
                  <option value="Workshop">Karigar / Workshop</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Branch Assignments */}
          <div className="border-t border-onyx-border pt-5">
            <label className="block text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-2.5">
              3. Branch Assignments
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

          {/* 4. Tax & Financial Identifiers */}
          <div className="border-t border-onyx-border pt-5">
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
              4. Tax, Compensation & Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">PAN Card Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Aadhaar Number</label>
                <input
                  type="text"
                  placeholder="12 digit Aadhaar"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Monthly CTC Salary (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Bank Account No.</label>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Bank IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="Name & Contact phone"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full bg-onyx px-3.5 py-2 rounded-xl border border-onyx-border focus:border-[#D4A843] outline-none text-[13px] text-foreground"
                />
              </div>
            </div>
          </div>

          {/* 5. Optional Initial KYC Attachment */}
          <div className="p-4 rounded-xl border border-onyx-border bg-onyx/50">
            <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-1">
              5. Initial KYC Document Attachment (Optional)
            </h3>
            <p className="text-[11px] text-[#777] mb-3">
              Attach verified Aadhaar, PAN, or employment contract for immediate encrypted vault storage.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#888] mb-1">Doc Type</label>
                <select
                  value={kycDocType}
                  onChange={(e) => setKycDocType(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-onyx border border-onyx-border text-[12px] text-foreground outline-none focus:border-[#D4A843] cursor-pointer"
                >
                  <option value="AADHAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="DEGREE_CERTIFICATE">Degree / Certificate</option>
                  <option value="BANK_PROOF">Bank Passbook / Cheque</option>
                  <option value="POLICE_VERIFICATION">Police Verification</option>
                  <option value="OTHER">Other Proof</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#888] mb-1">Select File (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setKycFile(e.target.files[0]);
                    }
                  }}
                  className="w-full h-9 px-2.5 py-1 rounded-lg bg-onyx border border-onyx-border text-[11px] text-[#aaa] file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-onyx-elevated file:text-foreground"
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
            {loading ? "Registering Staff..." : "Save Staff Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
