"use client";

import { useState, useEffect } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";

export default function AddUserForm({
  branches,
  creator = "ADMIN",
}: {
  branches: any[];
  creator?: "ADMIN" | "MANAGER";
}) {
  const { selectedBranch } = useBranchStore();
  const isManager = creator === "MANAGER";

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
    if (selectedBranch?.id) {
      setForm((prev) => ({ ...prev, branchId: selectedBranch.id }));
    }
  }, [selectedBranch?.id]);

  useEffect(() => {
    if (isManager) {
      setForm((prev) => ({ ...prev, role: "SALESMAN" }));
    }
  }, [isManager]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/users/create", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ ${form.role} created successfully`);
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
    } else {
      alert(`❌ ${data.message}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4   p-4 rounded-md shadow-md"
    >
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 w-full"
        required
      />
      <select
        value={form.gender}
        onChange={(e) => setForm({ ...form, gender: e.target.value })}
        className="border p-2 w-full"
      >
        <option value="MALE">MALE</option>
        <option value="FEMALE">FEMALE</option>
        <option value="OTHER">OTHER</option>
      </select>

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border p-2 w-full"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border p-2 w-full"
        required
      />
      <input
        type="number"
        placeholder="Phone Number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="number"
        placeholder="Aadhar Number"
        value={form.aadharNumber}
        onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="PAN Number"
        value={form.panNumber}
        onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="number"
        placeholder="Salary"
        value={form.salary}
        onChange={(e) => setForm({ ...form, salary: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Bank Account Number"
        value={form.bankAccount}
        onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="IFSC Code"
        value={form.ifscCode}
        onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
        className="border p-2 w-full"
      />
      
      {!isManager && (
        <select
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          className="border p-2 w-full"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}

      <select
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        className="border p-2 w-full"
      >
        {!isManager && <option value="MANAGER">Manager</option>}
        <option value="SALESMAN">Salesman</option>
      </select>

      <button
        type="submit"
        className="bg-gray-300 text-gray-950 w-full py-3 rounded disabled:opacity-50"
      >
        Create User
      </button>
    </form>
  );
}
