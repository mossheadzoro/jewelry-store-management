"use client";

import { useState } from "react";

export default function AddUserForm({
  branches,
  creator = "ADMIN",
}: {
  branches: any[];
  creator?: "ADMIN" | "MANAGER";
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: creator === "MANAGER" ? "SALESMAN" : "MANAGER",
    branchId: branches?.[0]?.id || "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/users/create", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ ${form.role} created successfully`);
      setForm({ name: "", email: "", password: "", role: "MANAGER", branchId: "" });
    } else {
      alert(`❌ ${data.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4  p-4 rounded-md shadow-md">
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border p-2 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border p-2 w-full"
      />
      <select
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        className="border p-2 w-full"
      >
        <option value="MANAGER">Manager</option>
        <option value="SALESMAN">Salesman</option>
      </select>
      
      
        
     
     
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Create User
      </button>
    </form>
  );
}
