"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Shield,
  UserCheck,
  Briefcase,
  Users,
  Lock,
  History,
  FileCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import StaffSummaryCards from "./StaffSummaryCards";
import StaffTable, { StaffMemberRow } from "./StaffTable";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import StaffRolesTab from "./StaffRolesTab";
import StaffSecurityTab from "./StaffSecurityTab";
import StaffActivityLogsTab from "./StaffActivityLogsTab";
import StaffApprovalMatrixTab from "./StaffApprovalMatrixTab";
import { cn } from "@/lib/utils";

const staffSectionTabs = [
  { id: "staff", label: "Staff Roster", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "security", label: "Login Security", icon: Lock },
  { id: "activity", label: "Activity Logs", icon: History },
  { id: "approval", label: "Approval Matrix", icon: FileCheck },
];

export default function StaffPageClient() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const userRole = (session?.user?.role || "SALESMAN").toUpperCase();
  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";
  const isAdmin =
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";
  const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/staff");
    } else if (status === "authenticated" && !isManagerOrAdmin) {
      router.replace("/unauthorized?reason=staff");
    }
  }, [status, isManagerOrAdmin, router]);

  const [activeSectionTab, setActiveSectionTab] = useState<string>("staff");

  const [users, setUsers] = useState<StaffMemberRow[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedKycStatus, setSelectedKycStatus] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffMemberRow | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<StaffMemberRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedRole) params.set("role", selectedRole);
      if (selectedKycStatus) params.set("kycStatus", selectedKycStatus);
      if (selectedBranch) params.set("branchId", selectedBranch);

      const [uRes, rRes, bRes] = await Promise.all([
        fetch(`/api/settings/users?${params}`),
        fetch("/api/settings/roles"),
        fetch("/api/branch/fetch"),
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
      if (bRes.ok) setBranches(await bRes.json());
    } catch (e) {
      console.error("Error fetching staff:", e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedKycStatus, selectedBranch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/settings/users/${deleteConfirmUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmUser(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete staff member");
      }
    } catch (e) {
      console.error(e);
      alert("Network error occurred.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleView = (user: StaffMemberRow) => {
    router.push(`/staff/${user.id}`);
  };

  // Metrics
  const stats = {
    totalStaff: users.length,
    managersCount: users.filter((u) => u.systemRole === "MANAGER").length,
    salesCount: users.filter((u) => u.systemRole === "SALESMAN").length,
    verifiedKycCount: users.filter((u) => u.kycStatus === "VERIFIED").length,
    pendingKycCount: users.filter((u) => u.kycStatus === "PENDING_REVIEW").length,
  };

  if (status === "loading" || !isManagerOrAdmin) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-platinum-muted">
        Verifying security clearances...
      </div>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-onyx overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Role & Permissions Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-onyx-surface border border-onyx-border flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isAdmin
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  : isManagerOrAdmin
                  ? "bg-[#D4A843]/10 border-[#D4A843]/30 text-[#D4A843]"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}
            >
              {isAdmin ? (
                <Shield className="w-5 h-5" />
              ) : isManagerOrAdmin ? (
                <Briefcase className="w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-foreground">
                  Active Session: {session?.user?.name || "Staff Member"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isAdmin
                      ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                      : isManagerOrAdmin
                      ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                      : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {userRole} Mode
                </span>
              </div>
              <p className="text-[12px] text-[#777] mt-0.5">
                {isAdmin
                  ? "Full Governance: Manage workforce, configure granular custom roles & permissions, adjust authentication security policies, and verify staff KYC."
                  : isManagerOrAdmin
                  ? "Manager Supervision: Supervise store sales personnel, manage branch assignments, inspect KYC identity vaults, and track profile ledgers."
                  : "Salesman Access: View employee dossier, update contact details with justification notes, and submit KYC documents for manager review."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#888] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Audit Ledger Active
          </div>
        </div>

        {/* Top Label & Header */}
        <p className="text-[13px] font-semibold text-[#D4A843] uppercase tracking-widest mb-1">
          Human Capital & Governance
        </p>

        <div className="flex items-start justify-between gap-8 mb-6">
          <div>
            <h1 className="text-[32px] font-bold text-foreground tracking-tight leading-tight">
              Staff & User Management
            </h1>
            <p className="text-[14px] text-[#666] mt-1 max-w-lg leading-relaxed">
              Curate and govern the enterprise workforce. Manage employee tiers, custom roles,
              branch permissions, identity KYC verifications, security policies, and profile change ledgers.
            </p>
          </div>
        </div>

        {/* Unified Tabs Bar */}
        <div className="flex space-x-2 border-b border-onyx-border mb-8 overflow-x-auto">
          {staffSectionTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSectionTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSectionTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[13.5px] font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "border-[#D4A843] text-[#D4A843]"
                    : "border-transparent text-[#777] hover:text-foreground hover:border-[#333]"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Staff Roster */}
        {activeSectionTab === "staff" && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search staff name, email..."
                    className="w-[240px] h-10 pl-10 pr-4 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground placeholder:text-[#444] outline-none focus:border-[#D4A843]/40 transition-colors"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-10 pl-3 pr-8 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer min-w-[130px]"
                  >
                    <option value="">All Tiers & Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SALESMAN">Salesman</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-[10px]">
                    ▼
                  </div>
                </div>

                {/* KYC Filter */}
                <div className="relative">
                  <select
                    value={selectedKycStatus}
                    onChange={(e) => setSelectedKycStatus(e.target.value)}
                    className="h-10 pl-3 pr-8 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer min-w-[140px]"
                  >
                    <option value="">All KYC Status</option>
                    <option value="VERIFIED">KYC Verified</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="INCOMPLETE">Incomplete KYC</option>
                    <option value="REJECTED">Rejected Proofs</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-[10px]">
                    ▼
                  </div>
                </div>

                {/* Branch Filter */}
                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="h-10 pl-3 pr-8 rounded-xl bg-[#111] border border-[#1f1f1f] text-[13px] text-foreground outline-none focus:border-[#D4A843]/40 transition-colors appearance-none cursor-pointer min-w-[130px]"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Add Staff Button */}
              {isManagerOrAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="h-10 px-5 rounded-xl bg-[#D4A843] text-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Staff Member
                </button>
              )}
            </div>

            {/* Staff Summary Cards */}
            <StaffSummaryCards stats={stats} loading={loading && users.length === 0} />

            {/* Staff Table */}
            <StaffTable
              users={users}
              loading={loading && users.length === 0}
              userRole={userRole}
              currentUserId={currentUserId}
              onView={handleView}
              onEdit={(u) => setEditingUser(u)}
              onDelete={(u) => setDeleteConfirmUser(u)}
            />
          </div>
        )}

        {/* TAB 2: Custom Roles & Granular Permissions */}
        {activeSectionTab === "roles" && <StaffRolesTab />}

        {/* TAB 3: Login Security & Policies */}
        {activeSectionTab === "security" && <StaffSecurityTab />}

        {/* TAB 4: Staff Activity Logs */}
        {activeSectionTab === "activity" && <StaffActivityLogsTab />}

        {/* TAB 5: Role Elevation & Approval Matrix */}
        {activeSectionTab === "approval" && <StaffApprovalMatrixTab />}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          open={showAddModal}
          roles={roles}
          branches={branches}
          userRole={userRole}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}

      {/* Edit Staff Modal */}
      {editingUser && (
        <EditStaffModal
          open={!!editingUser}
          user={editingUser}
          roles={roles}
          branches={branches}
          userRole={userRole}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirmUser(null)}
          />
          <div className="relative bg-[#111] border border-[#222] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Delete Staff Member?</h3>
            <p className="text-[13px] text-[#666] mb-5">
              Are you sure you want to delete employee{" "}
              <span className="text-foreground font-medium">{deleteConfirmUser.name}</span>?
              This action cannot be undone and will be permanently recorded in the system audit log.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="h-9 px-4 rounded-lg text-[13px] text-[#999] bg-onyx-elevated border border-[#252525] hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-red-500 text-foreground hover:bg-red-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
