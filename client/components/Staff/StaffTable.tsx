"use client";

import React, { useState } from "react";
import {
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Clock,
  XCircle,
  Building,
  FileText,
  Briefcase,
  UserCheck,
  Shield,
} from "lucide-react";

export interface StaffMemberRow {
  id: number;
  name: string;
  email: string;
  image?: string | null;
  systemRole: "ADMIN" | "MANAGER" | "SALESMAN" | "VIEWER" | string;
  roleId?: number | null;
  role?: { id: number; name: string } | null;
  status: "ACTIVE" | "SUSPENDED" | string;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  salary?: number | null;
  bankAccount?: string | null;
  ifscCode?: string | null;
  emergencyContact?: string | null;
  panNumber?: string | null;
  aadharNumber?: string | null;
  branchId?: number | null;
  branch?: { id: number; name: string } | null;
  userBranches?: Array<{ branchId: number; branch?: { name: string } }>;
  createdAt: string;
  kycStatus: "VERIFIED" | "PENDING_REVIEW" | "INCOMPLETE" | "REJECTED";
  kycDocsCount: number;
  hasPan: boolean;
  hasAadhar: boolean;
}

interface StaffTableProps {
  users: StaffMemberRow[];
  loading?: boolean;
  userRole?: string;
  currentUserId?: number;
  onView: (user: StaffMemberRow) => void;
  onEdit: (user: StaffMemberRow) => void;
  onDelete: (user: StaffMemberRow) => void;
}

export default function StaffTable({
  users,
  loading,
  userRole = "SALESMAN",
  currentUserId,
  onView,
  onEdit,
  onDelete,
}: StaffTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "OWNER";

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl bg-onyx-surface border border-onyx-border overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-[#1a1a1a] animate-pulse">
            <div className="w-11 h-11 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-secondary" />
              <div className="h-3 w-24 rounded bg-secondary" />
            </div>
            <div className="h-4 w-28 rounded bg-secondary" />
            <div className="h-4 w-32 rounded bg-secondary" />
            <div className="h-4 w-20 rounded bg-secondary" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-onyx-surface border border-onyx-border py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-onyx-elevated border border-[#222] flex items-center justify-center mb-4 text-2xl">
          👥
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No staff members found</h3>
        <p className="text-sm text-[#666]">
          Adjust your search query or filters to locate employee profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-onyx-surface border border-onyx-border overflow-visible">
      {/* Header */}
      <div className="grid grid-cols-[1.8fr_1.3fr_1.3fr_1.2fr_1fr_0.6fr] gap-4 px-6 py-3.5 border-b border-onyx-border bg-[#111]">
        <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Employee</span>
        <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">System Tier & Role</span>
        <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Branch & Dept</span>
        <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">KYC & Compliance</span>
        <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider text-center">Status</span>
        <span className="text-[11px] font-semibold text-[#555] uppercase tracking-wider text-center">Actions</span>
      </div>

      {/* Rows */}
      {users.map((user, idx) => {
        const initials = getInitials(user.name);
        const avatarColor = getAvatarColor(user.name);
        const isMenuOpen = openMenuId === user.id;

        return (
          <div
            key={user.id}
            className={`grid grid-cols-[1.8fr_1.3fr_1.3fr_1.2fr_1fr_0.6fr] gap-4 px-6 py-4 items-center transition-colors duration-150 hover:bg-onyx-elevated ${
              idx < users.length - 1 ? "border-b border-[#1a1a1a]" : ""
            }`}
          >
            {/* Employee Info */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: avatarColor + "22", color: avatarColor }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <button
                  onClick={() => onView(user)}
                  className="text-[14px] font-semibold text-foreground truncate hover:text-[#D4A843] transition-colors cursor-pointer text-left block"
                >
                  {user.name}
                </button>
                <div className="text-[12px] text-[#666] flex items-center gap-1.5 mt-0.5 truncate">
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <p className="text-[11px] text-[#555] mt-0.5">+91 {user.phone}</p>
                )}
              </div>
            </div>

            {/* System Tier & Role */}
            <div className="space-y-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block ${
                  user.systemRole === "ADMIN"
                    ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                    : user.systemRole === "MANAGER"
                    ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                    : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                }`}
              >
                {user.systemRole}
              </span>
              {user.role && (
                <p className="text-[11px] text-[#777]">
                  Role: <span className="text-foreground font-medium">{user.role.name}</span>
                </p>
              )}
            </div>

            {/* Branch & Dept */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap gap-1">
                {user.userBranches && user.userBranches.length > 0 ? (
                  user.userBranches.map((ub) => (
                    <span
                      key={ub.branchId}
                      className="bg-onyx px-2 py-0.5 rounded text-[11px] text-[#888] border border-onyx-border"
                    >
                      {ub.branch?.name || `Branch #${ub.branchId}`}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#666] italic">All Branches</span>
                )}
              </div>
              {user.department && (
                <p className="text-[11px] text-[#555]">
                  Dept: <span className="text-[#aaa]">{user.department}</span>
                </p>
              )}
            </div>

            {/* KYC & Compliance */}
            <div className="space-y-1">
              {user.kycStatus === "VERIFIED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KYC Verified</span>
                </span>
              ) : user.kycStatus === "PENDING_REVIEW" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pending Review ({user.kycDocsCount})</span>
                </span>
              ) : user.kycStatus === "REJECTED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Rejected Proofs</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary border border-border text-[#666] text-[11px] font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#555]" />
                  <span>Incomplete KYC</span>
                </span>
              )}
            </div>

            {/* Account Status */}
            <div className="text-center">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  user.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-red-500/10 text-red-400 border-red-500/25"
                }`}
              >
                {user.status}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-1.5 relative">
              <button
                onClick={() => onView(user)}
                className="w-8 h-8 rounded-lg bg-onyx-elevated border border-[#252525] flex items-center justify-center text-[#777] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all cursor-pointer"
                title="View Dossier, KYC & Profile Ledger"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(isMenuOpen ? null : user.id)}
                  className="w-8 h-8 rounded-lg bg-onyx-elevated border border-[#252525] flex items-center justify-center text-[#777] hover:text-foreground hover:border-border transition-all cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                    <div
                      className={`absolute right-0 w-48 bg-onyx-elevated border border-onyx-border rounded-xl shadow-2xl shadow-black/60 z-50 py-1 overflow-hidden ${
                        idx >= users.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                      }`}
                    >
                      <button
                        onClick={() => {
                          onView(user);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#ccc] hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Dossier
                      </button>
                      <button
                        onClick={() => {
                          onView(user);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#ccc] hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#D4A843]" />
                        KYC Identity Vault
                      </button>
                      {(isManagerOrAdmin || user.id === currentUserId) && (
                        <button
                          onClick={() => {
                            onEdit(user);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#ccc] hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Profile
                        </button>
                      )}
                      {isAdmin && user.id !== currentUserId && (
                        <button
                          onClick={() => {
                            onDelete(user);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border-t border-[#1f1f1f]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Staff
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "#D4A843", "#6366f1", "#0ea5e9", "#f43f5e",
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
