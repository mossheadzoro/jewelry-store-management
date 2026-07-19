"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PERMISSION_MODULES = [
  {
    name: "Dashboard",
    permissions: ["VIEW_DASHBOARD", "VIEW_SALES_ANALYTICS", "VIEW_REVENUE", "EXPORT_DASHBOARD"]
  },
  {
    name: "Customers",
    permissions: ["VIEW_CUSTOMER", "CREATE_CUSTOMER", "EDIT_CUSTOMER", "DELETE_CUSTOMER", "IMPORT_CUSTOMERS", "EXPORT_CUSTOMERS", "VIEW_CUSTOMER_WALLET"]
  },
  {
    name: "Jewellery",
    permissions: ["ADD_JEWELLERY", "EDIT_JEWELLERY", "DELETE_JEWELLERY", "CHANGE_PRICE", "UPLOAD_IMAGES", "PRINT_BARCODE"]
  },
  {
    name: "Inventory",
    permissions: ["VIEW_STOCK", "ADD_STOCK", "TRANSFER_STOCK", "STOCK_ADJUSTMENT", "DELETE_STOCK", "VIEW_PURCHASE_COST"]
  },
  {
    name: "Orders",
    permissions: ["VIEW_ORDERS", "CREATE_ORDERS", "MODIFY_ORDERS", "CANCEL_ORDERS", "DELIVER_ORDERS", "APPROVE_ORDERS"]
  },
  {
    name: "Gold Rate",
    permissions: ["VIEW_RATE", "UPDATE_GOLD_RATE", "LOCK_RATE", "EDIT_PAST_RATE"]
  },
  {
    name: "Saving Scheme",
    permissions: ["CREATE_SCHEME", "EDIT_SCHEME", "CLOSE_SCHEME", "REFUND_SCHEME", "APPROVE_BONUS"]
  },
  {
    name: "Coupons",
    permissions: ["CREATE_COUPON", "EDIT_COUPON", "DELETE_COUPON", "DISABLE_COUPON"]
  },
  {
    name: "Reports",
    permissions: ["VIEW_REPORTS", "EXPORT_PDF", "EXPORT_EXCEL", "PRINT_REPORTS"]
  },
  {
    name: "Finance",
    permissions: ["VIEW_PAYMENTS", "RECEIVE_PAYMENT", "REFUND_PAYMENT", "APPLY_DISCOUNT", "VIEW_PROFIT", "VIEW_COST_PRICE"]
  },
  {
    name: "Settings",
    permissions: ["VIEW_SETTINGS", "EDIT_SETTINGS", "MANAGE_ROLES", "MANAGE_USERS", "BACKUP_DATABASE"]
  }
];

export default function RolesTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Form State
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/roles");
      if (res.ok) setRoles(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description || "");
      setSelectedPermissions(role.permissions || {});
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleDesc("");
      setSelectedPermissions({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const togglePermission = (moduleName: string, perm: string) => {
    setSelectedPermissions(prev => {
      const modulePerms = prev[moduleName] || [];
      if (modulePerms.includes(perm)) {
        return { ...prev, [moduleName]: modulePerms.filter(p => p !== perm) };
      } else {
        return { ...prev, [moduleName]: [...modulePerms, perm] };
      }
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingRole ? `/api/settings/roles/${editingRole.id}` : "/api/settings/roles";
      const method = editingRole ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, description: roleDesc, permissions: selectedPermissions })
      });
      if (res.ok) {
        handleCloseModal();
        fetchRoles();
      } else {
        alert("Failed to save role");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      await fetch(`/api/settings/roles/${id}`, { method: "DELETE" });
      fetchRoles();
    }
  };

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
          <input 
            type="text" 
            placeholder="Search roles..." 
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
          Create Custom Role
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-onyx rounded-xl"></div>
          <div className="h-24 bg-onyx rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map(role => (
            <div key={role.id} className="bg-onyx-surface border border-onyx-border rounded-xl p-5 hover:border-gold/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-platinum">{role.name}</h4>
                    {role.isSystem && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full mt-1 inline-block">System Role</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(role)} className="text-platinum-muted hover:text-gold transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => handleDelete(role.id)} className="text-platinum-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[12px] text-platinum-muted mb-4 line-clamp-2">{role.description || "No description provided."}</p>
              <div className="text-[11px] text-platinum-muted bg-onyx px-3 py-1.5 rounded-lg inline-block">
                {Object.values(role.permissions || {}).flat().length} Permissions Assigned
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Config Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-onyx-surface border border-onyx-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-onyx-border">
              <h2 className="text-[18px] font-semibold text-platinum">{editingRole ? "Edit Role" : "Create New Role"}</h2>
              <button onClick={handleCloseModal} className="text-platinum-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRole} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-[14px] font-medium text-platinum border-b border-onyx-border pb-2">Role Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] text-platinum-muted mb-1.5">Role Name</label>
                      <input 
                        required
                        type="text" 
                        value={roleName}
                        onChange={e => setRoleName(e.target.value)}
                        disabled={editingRole?.isSystem}
                        className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum disabled:opacity-50"
                        placeholder="e.g. Inventory Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-platinum-muted mb-1.5">Description (Optional)</label>
                      <input 
                        type="text" 
                        value={roleDesc}
                        onChange={e => setRoleDesc(e.target.value)}
                        className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum"
                        placeholder="Manages stock and transfers"
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-onyx-border pb-2">
                    <h3 className="text-[14px] font-medium text-platinum">Module Permissions</h3>
                    <button 
                      type="button" 
                      onClick={() => setSelectedPermissions({})}
                      className="text-[12px] text-gold hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PERMISSION_MODULES.map(module => (
                      <div key={module.name} className="bg-onyx rounded-xl border border-onyx-border p-4">
                        <h4 className="text-[13px] font-semibold text-platinum mb-3 pb-2 border-b border-onyx-border/50">{module.name}</h4>
                        <div className="space-y-2">
                          {module.permissions.map(perm => {
                            const isChecked = (selectedPermissions[module.name] || []).includes(perm);
                            return (
                              <label 
                                key={perm} 
                                onClick={() => togglePermission(module.name, perm)}
                                className="flex items-center gap-2 cursor-pointer group"
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                  isChecked ? "bg-gold border-gold" : "border-onyx-muted group-hover:border-gold/50"
                                )}>
                                  {isChecked && <svg className="w-3 h-3 text-onyx" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="text-[12px] text-platinum-muted group-hover:text-platinum transition-colors">
                                  {perm.replace(/_/g, ' ')}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-onyx-border bg-onyx-elevated/50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-platinum hover:bg-onyx transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold text-onyx px-6 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
