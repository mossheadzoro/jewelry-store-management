"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PERMISSION_MODULES = [
  {
    name: "Dashboard",
    permissions: ["VIEW_DASHBOARD", "VIEW_SALES_ANALYTICS", "VIEW_REVENUE", "EXPORT_DASHBOARD"],
  },
  {
    name: "Customers",
    permissions: [
      "VIEW_CUSTOMER",
      "CREATE_CUSTOMER",
      "EDIT_CUSTOMER",
      "DELETE_CUSTOMER",
      "IMPORT_CUSTOMERS",
      "EXPORT_CUSTOMERS",
      "VIEW_CUSTOMER_WALLET",
    ],
  },
  {
    name: "Jewellery",
    permissions: [
      "ADD_JEWELLERY",
      "EDIT_JEWELLERY",
      "DELETE_JEWELLERY",
      "CHANGE_PRICE",
      "UPLOAD_IMAGES",
      "PRINT_BARCODE",
    ],
  },
  {
    name: "Inventory",
    permissions: [
      "VIEW_STOCK",
      "ADD_STOCK",
      "TRANSFER_STOCK",
      "STOCK_ADJUSTMENT",
      "DELETE_STOCK",
      "VIEW_PURCHASE_COST",
    ],
  },
  {
    name: "Orders",
    permissions: [
      "VIEW_ORDERS",
      "CREATE_ORDERS",
      "MODIFY_ORDERS",
      "CANCEL_ORDERS",
      "DELIVER_ORDERS",
      "APPROVE_ORDERS",
    ],
  },
  {
    name: "Gold Rate",
    permissions: ["VIEW_RATE", "UPDATE_GOLD_RATE", "LOCK_RATE", "EDIT_PAST_RATE"],
  },
  {
    name: "Saving Scheme",
    permissions: ["CREATE_SCHEME", "EDIT_SCHEME", "CLOSE_SCHEME", "REFUND_SCHEME", "APPROVE_BONUS"],
  },
  {
    name: "Coupons",
    permissions: ["CREATE_COUPON", "EDIT_COUPON", "DELETE_COUPON", "DISABLE_COUPON"],
  },
  {
    name: "Reports",
    permissions: ["VIEW_REPORTS", "EXPORT_PDF", "EXPORT_EXCEL", "PRINT_REPORTS"],
  },
  {
    name: "Finance",
    permissions: [
      "VIEW_PAYMENTS",
      "RECEIVE_PAYMENT",
      "REFUND_PAYMENT",
      "APPLY_DISCOUNT",
      "VIEW_PROFIT",
      "VIEW_COST_PRICE",
    ],
  },
  {
    name: "Settings",
    permissions: ["VIEW_SETTINGS", "EDIT_SETTINGS", "MANAGE_ROLES", "MANAGE_USERS", "BACKUP_DATABASE"],
  },
];

export default function StaffRolesTab() {
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
    setSelectedPermissions((prev) => {
      const modulePerms = prev[moduleName] || [];
      if (modulePerms.includes(perm)) {
        return { ...prev, [moduleName]: modulePerms.filter((p) => p !== perm) };
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
        body: JSON.stringify({
          name: roleName,
          description: roleDesc,
          permissions: selectedPermissions,
        }),
      });

      if (res.ok) {
        handleCloseModal();
        fetchRoles();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save role");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving the role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to delete this custom role? Users assigned to it will lose custom permissions."))
      return;
    try {
      const res = await fetch(`/api/settings/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRoles();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete role");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search custom roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-onyx pl-9 pr-4 py-2 rounded-lg border border-onyx-border text-[13px] text-platinum placeholder:text-platinum-muted focus:outline-none focus:border-gold"
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-onyx font-medium text-[13px] rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Custom Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-platinum-muted text-[13px]">
            Loading roles...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-platinum-muted text-[13px]">
            No roles found. Create your first custom role above.
          </div>
        ) : (
          filteredRoles.map((role) => {
            const permCount = Object.values(role.permissions || {}).reduce(
              (acc: number, curr: any) => acc + (Array.isArray(curr) ? curr.length : 0),
              0
            );

            return (
              <div
                key={role.id}
                className="bg-onyx-surface border border-onyx-border rounded-xl p-5 hover:border-onyx-muted transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-gold/10 text-gold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-platinum">{role.name}</h4>
                        <p className="text-[12px] text-platinum-muted mt-0.5">
                          {role.users?.length || 0} Staff assigned
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[12px] text-platinum-muted mt-4 line-clamp-2 leading-relaxed">
                    {role.description || "No description provided for this role."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-onyx-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gold bg-gold/5 px-2 py-0.5 rounded border border-gold/10">
                    {permCount} permissions
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(role)}
                      className="p-1.5 rounded-md hover:bg-onyx text-platinum-muted hover:text-platinum transition-colors"
                      title="Edit Role"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!["ADMIN", "MANAGER", "SALESMAN", "Super Admin"].includes(role.name) && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1.5 rounded-md hover:bg-onyx text-platinum-muted hover:text-red-400 transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-onyx-surface border border-onyx-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-onyx-border bg-onyx-elevated/50">
              <h3 className="text-[16px] font-semibold text-platinum">
                {editingRole ? "Edit Role & Granular Permissions" : "Create New Custom Role"}
              </h3>
              <button onClick={handleCloseModal} className="text-platinum-muted hover:text-platinum">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-platinum mb-1">
                    Role Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Senior Appraiser"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-platinum mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Authorized to value gold exchange and approve discounts"
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="border-t border-onyx-border pt-4">
                <h4 className="text-[13px] font-semibold text-platinum mb-3">Module Permissions</h4>
                <div className="space-y-4">
                  {PERMISSION_MODULES.map((module) => {
                    const currentModulePerms = selectedPermissions[module.name] || [];
                    const allSelected = module.permissions.every((p) =>
                      currentModulePerms.includes(p)
                    );

                    return (
                      <div
                        key={module.name}
                        className="bg-onyx rounded-lg border border-onyx-border p-4"
                      >
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-onyx-border">
                          <span className="text-[13px] font-medium text-platinum">
                            {module.name} Module
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPermissions((prev) => ({
                                ...prev,
                                [module.name]: allSelected ? [] : [...module.permissions],
                              }));
                            }}
                            className="text-[11px] text-gold hover:underline"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {module.permissions.map((perm) => {
                            const isChecked = currentModulePerms.includes(perm);
                            return (
                              <label
                                key={perm}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded border text-[12px] cursor-pointer transition-colors",
                                  isChecked
                                    ? "border-gold/30 bg-gold/5 text-platinum"
                                    : "border-onyx-border text-platinum-muted hover:border-onyx-muted"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(module.name, perm)}
                                  className="accent-gold"
                                />
                                <span>{perm.replace(/_/g, " ")}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-onyx-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-[13px] text-platinum-muted hover:text-platinum"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gold hover:bg-gold-light text-onyx font-medium text-[13px] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Role & Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
