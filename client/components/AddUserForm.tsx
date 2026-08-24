"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  CreditCard,
  Fingerprint,
  IndianRupee,
  Landmark,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranchStore } from "@/lib/store/useBranchStore";

interface AddUserFormProps {
  branches: any[];
  creator?: "ADMIN" | "MANAGER";
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
}

export default function AddUserForm({
  branches = [],
  creator = "ADMIN",
  onSuccess,
  onCancel,
}: AddUserFormProps) {
  const { selectedBranch } = useBranchStore();
  const isManager = creator === "MANAGER";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    gender: "MALE",
    phone: "",
    address: "",
    aadharNumber: "",
    panNumber: "",
    salary: "",
    bankAccount: "",
    ifscCode: "",
    role: isManager ? "SALESMAN" : "MANAGER",
    branchId: selectedBranch?.id || branches?.[0]?.id || "",
  });

  useEffect(() => {
    if (selectedBranch?.id && !form.branchId) {
      setForm((prev) => ({ ...prev, branchId: selectedBranch.id }));
    }
  }, [selectedBranch?.id, form.branchId]);

  useEffect(() => {
    if (isManager) {
      setForm((prev) => ({ ...prev, role: "SALESMAN" }));
    }
  }, [isManager]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      gender: "MALE",
      phone: "",
      address: "",
      aadharNumber: "",
      panNumber: "",
      salary: "",
      bankAccount: "",
      ifscCode: "",
      role: isManager ? "SALESMAN" : "MANAGER",
      branchId: selectedBranch?.id || branches?.[0]?.id || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Name, email, and password are required.");
      return;
    }

    if (!form.branchId) {
      toast.error("Please assign a branch to this user.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${form.role === "MANAGER" ? "Branch Manager" : "Sales Personnel"} created successfully!`, {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        });

        handleReset();

        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        toast.error(data.message || data.error || "Failed to create user.");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("An unexpected error occurred while creating user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-1">
      {/* Section 1: Credentials & Role */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#d4a843] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Account Credentials & Role</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Full Name <span className="text-[#d4a843]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Vikramaditya Sharma"
                required
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Email Address <span className="text-[#d4a843]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. vikram@jewels.com"
                required
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Temporary Password <span className="text-[#d4a843]">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-10 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              System Role <span className="text-[#d4a843]">*</span>
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={isManager}
              className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl px-3.5 py-2.5 text-[13px] text-foreground transition-all outline-none disabled:opacity-50"
            >
              {!isManager && <option value="MANAGER">Store Manager</option>}
              <option value="SALESMAN">Sales Executive / Counter Staff</option>
            </select>
          </div>

          {!isManager && (
            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-platinum mb-1.5">
                Assign Branch Location <span className="text-[#d4a843]">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="branchId"
                  value={form.branchId}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground transition-all outline-none"
                >
                  <option value="" disabled>
                    Select Store Location
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city || "Primary"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Contact & Demographics */}
      <div className="space-y-3.5 pt-2 border-t border-[#27272a]/60">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#d4a843] uppercase tracking-wider">
          <Phone className="w-3.5 h-3.5" />
          <span>Personal & Contact Info</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl px-3.5 py-2.5 text-[13px] text-foreground transition-all outline-none"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium text-platinum mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 00000"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[12px] font-medium text-platinum mb-1.5">Residential Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House / Flat No, Street, City"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Compensation & Banking */}
      <div className="space-y-3.5 pt-2 border-t border-[#27272a]/60">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#d4a843] uppercase tracking-wider">
          <Landmark className="w-3.5 h-3.5" />
          <span>Compensation & Identity (KYC)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Monthly Base Salary (₹)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="e.g. 35000"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              PAN Number
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="panNumber"
                value={form.panNumber}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 uppercase transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Bank Account Number
            </label>
            <div className="relative">
              <Landmark className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="bankAccount"
                value={form.bankAccount}
                onChange={handleChange}
                placeholder="e.g. 109283746501"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-platinum mb-1.5">
              Bank IFSC Code
            </label>
            <div className="relative">
              <Landmark className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                placeholder="HDFC0001234"
                className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-zinc-600 uppercase transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#27272a] flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1f] text-[13px] px-3.5 h-9 rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>

        <div className="flex items-center gap-2.5">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-[#27272a] bg-[#121215] text-zinc-300 hover:bg-[#1a1a1f] text-[13px] h-9 px-4 rounded-xl"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#d4a843] to-[#b88628] hover:from-[#e0b853] hover:to-[#c79532] text-black font-semibold text-[13px] h-9 px-5 rounded-xl shadow-lg shadow-[#d4a843]/20 flex items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Registering User...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black fill-black" />
                <span>Create Staff Account</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
