"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    systemRole: "SALESMAN",
    roleId: "",
    status: "ACTIVE",
    branches: [] as string[],
    phone: "",
    department: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, bRes] = await Promise.all([
        fetch("/api/settings/users"),
        fetch("/api/settings/roles"),
        fetch("/api/branch/fetch")
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
      if (bRes.ok) setBranches(await bRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        systemRole: user.systemRole,
        roleId: user.roleId ? String(user.roleId) : "",
        status: user.status,
        branches: user.userBranches?.map((ub: any) => String(ub.branchId)) || [],
        phone: user.phone || "",
        department: user.department || "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        systemRole: "SALESMAN",
        roleId: "",
        status: "ACTIVE",
        branches: [],
        phone: "",
        department: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => {
      const b = prev.branches;
      if (b.includes(branchId)) return { ...prev, branches: b.filter(id => id !== branchId) };
      return { ...prev, branches: [...b, branchId] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingUser ? `/api/settings/users/${editingUser.id}` : "/api/settings/users";
      const method = editingUser ? "PUT" : "POST";
      const body = { ...formData };
      if (!body.password) delete (body as any).password;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        handleCloseModal();
        fetchData();
      } else {
        alert("Failed to save user");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await fetch(`/api/settings/users/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-onyx pl-9 pr-4 py-2 rounded-lg border border-onyx-border focus:border-gold focus:ring-1 focus:ring-gold outline-none text-[13px] text-platinum"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-onyx-surface rounded-xl border border-onyx-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-onyx-border bg-onyx-elevated/50 text-platinum-muted font-medium">
                <th className="px-6 py-4 text-left">Employee</th>
                <th className="px-6 py-4 text-left">System Tier</th>
                <th className="px-6 py-4 text-left">Custom Role</th>
                <th className="px-6 py-4 text-left">Assigned Branches</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border text-platinum">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-platinum-muted">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-platinum-muted">No users found</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-onyx/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-onyx-border flex items-center justify-center overflow-hidden shrink-0">
                          {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-platinum-muted" />}
                        </div>
                        <div>
                          <div className="font-medium text-platinum">{user.name}</div>
                          <div className="text-[11px] text-platinum-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.systemRole}</td>
                    <td className="px-6 py-4">
                      {user.role ? (
                        <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-full text-[11px]">{user.role.name}</span>
                      ) : (
                        <span className="text-platinum-muted text-[11px] italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.userBranches?.map((ub: any) => (
                          <span key={ub.branchId} className="bg-onyx px-2 py-0.5 rounded text-[10px] text-platinum-muted border border-onyx-border">
                            {ub.branch?.name || `ID: ${ub.branchId}`}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px]", user.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(user)} className="p-1.5 text-platinum-muted hover:text-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 text-platinum-muted hover:text-red-400 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-onyx-surface border border-onyx-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-onyx-border">
              <h2 className="text-[18px] font-semibold text-platinum">{editingUser ? "Edit User" : "Add User"}</h2>
              <button onClick={handleCloseModal} className="text-platinum-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">Full Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">Email Address *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">Phone Number</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">Password {editingUser && "(Leave blank to keep)"}</label>
                    <input type={editingUser ? "password" : "text"} required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
                  </div>
                </div>

                <div className="border-t border-onyx-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">System Tier *</label>
                    <select value={formData.systemRole} onChange={e => setFormData({...formData, systemRole: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                      <option value="ADMIN">ADMIN (Full Access)</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="SALESMAN">SALESMAN</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">Custom Role</label>
                    <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                      <option value="">-- None --</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-platinum-muted mb-1.5">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-onyx-border pt-4">
                  <label className="block text-[13px] font-medium text-platinum mb-3">Branch Assignments</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {branches.map(branch => {
                      const isChecked = formData.branches.includes(String(branch.id));
                      return (
                        <label 
                          key={branch.id} 
                          onClick={() => handleBranchToggle(String(branch.id))}
                          className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors", isChecked ? "border-gold bg-gold/5" : "border-onyx-border bg-onyx hover:border-gold/30")}
                        >
                          <div className={cn("w-4 h-4 rounded flex items-center justify-center border", isChecked ? "bg-gold border-gold" : "border-onyx-muted")}>
                            {isChecked && <svg className="w-3 h-3 text-onyx" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-[12px] text-platinum truncate">{branch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-onyx-border bg-onyx-elevated/50 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-lg text-[13px] font-medium text-platinum hover:bg-onyx transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-gold text-onyx px-6 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
