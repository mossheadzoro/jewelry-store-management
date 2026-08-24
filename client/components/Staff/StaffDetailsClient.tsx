"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Edit2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Download,
  Trash2,
  Building,
  Check,
  X,
  Loader2,
  Search,
  History,
  ArrowRight,
  Briefcase,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import EditStaffModal from "./EditStaffModal";

interface StaffDetailsClientProps {
  userId: number;
}

export default function StaffDetailsClient({ userId }: StaffDetailsClientProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role || "SALESMAN";
  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "OWNER";

  const [activeTab, setActiveTab] = useState<"profile" | "kyc" | "ledger">("profile");
  const [userData, setUserData] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  // KYC Verification Modal state
  const [verifyModalDoc, setVerifyModalDoc] = useState<any>(null);
  const [verifyAction, setVerifyAction] = useState<"VERIFY" | "REJECT">("VERIFY");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Direct KYC upload state
  const [uploadDocType, setUploadDocType] = useState("AADHAR");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  // Profile Change Ledger state
  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logRoleFilter, setLogRoleFilter] = useState("");
  const [logSearch, setLogSearch] = useState("");

  const fetchStaffDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes, bRes] = await Promise.all([
        fetch(`/api/settings/users/${userId}`),
        fetch("/api/settings/roles"),
        fetch("/api/branch/fetch"),
      ]);

      if (uRes.ok) {
        const data = await uRes.json();
        setUserData(data.user);
      }
      if (rRes.ok) setRoles(await rRes.json());
      if (bRes.ok) setBranches(await bRes.json());
    } catch (e) {
      console.error("Error fetching staff details:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchProfileLedger = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (logActionFilter) params.set("action", logActionFilter);
      if (logRoleFilter) params.set("role", logRoleFilter);
      if (logSearch.trim()) params.set("search", logSearch.trim());

      const res = await fetch(`/api/settings/users/${userId}/profile-ledger?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProfileLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Error fetching staff profile change ledger:", e);
    } finally {
      setLogsLoading(false);
    }
  }, [userId, logActionFilter, logRoleFilter, logSearch]);

  useEffect(() => {
    fetchStaffDetails();
    fetchProfileLedger();
  }, [fetchStaffDetails, fetchProfileLedger]);

  useEffect(() => {
    if (activeTab === "ledger") {
      fetchProfileLedger();
    }
  }, [activeTab, fetchProfileLedger]);

  const handleUploadKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("documentType", uploadDocType);
      formData.append("notes", uploadNotes);

      const res = await fetch(`/api/settings/users/${userId}/kyc/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadFile(null);
        setUploadNotes("");
        await fetchStaffDetails();
        await fetchProfileLedger();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to upload KYC document");
      }
    } catch (e) {
      console.error(e);
      alert("Network error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!verifyModalDoc) return;
    setVerifyLoading(true);
    try {
      const res = await fetch(
        `/api/settings/users/${userId}/kyc/verify/${verifyModalDoc.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: verifyAction,
            notes: verifyNotes,
          }),
        }
      );

      if (res.ok) {
        setVerifyModalDoc(null);
        await fetchStaffDetails();
        await fetchProfileLedger();
      } else {
        const data = await res.json();
        alert(data.error || "Verification failed");
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDeleteKycDoc = async (docId: string) => {
    if (!isManagerOrAdmin) return;
    if (!confirm("Are you sure you want to permanently delete this KYC document from the vault?"))
      return;

    try {
      const res = await fetch(`/api/settings/users/${userId}/kyc/download/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchStaffDetails();
        await fetchProfileLedger();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete document");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !userData) {
    return (
      <div className="flex-1 min-h-screen bg-onyx flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex-1 min-h-screen bg-onyx flex flex-col items-center justify-center">
        <p className="text-foreground text-lg">Staff profile not found</p>
        <Link href="/staff" className="text-[#D4A843] hover:underline mt-4">
          Back to Staff Roster
        </Link>
      </div>
    );
  }

  const initials = userData.name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="flex-1 min-h-screen bg-onyx overflow-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/staff"
              className="inline-flex items-center gap-2 text-[13px] text-[#888] hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Staff Roster
            </Link>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                isAdmin
                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                  : isManagerOrAdmin
                  ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                  : "bg-blue-500/15 text-blue-400 border-blue-500/30"
              }`}
            >
              {isAdmin ? <Shield className="w-3.5 h-3.5" /> : isManagerOrAdmin ? <Briefcase className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {userRole} Responsibility Tier
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D4A843]/15 border border-[#D4A843]/30 flex items-center justify-center text-[22px] font-bold text-[#D4A843]">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-[32px] font-bold text-foreground tracking-tight leading-tight">
                    {userData.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      userData.systemRole === "ADMIN"
                        ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                        : userData.systemRole === "MANAGER"
                        ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                        : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {userData.systemRole}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      userData.kycStatus === "VERIFIED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        : userData.kycStatus === "PENDING_REVIEW"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        : "bg-secondary text-[#777] border-border"
                    }`}
                  >
                    KYC: {userData.kycStatus?.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[14px] text-[#777] mt-1 flex items-center gap-2">
                  <span>{userData.email}</span>
                  <span>•</span>
                  <span>Employee ID: #{userData.id.toString().padStart(4, "0")}</span>
                  <span>•</span>
                  <span>Dept: {userData.department || "Sales"}</span>
                  <span>•</span>
                  <span>Joined {new Date(userData.createdAt).toLocaleDateString("en-IN")}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(isManagerOrAdmin || userData.id === parseInt(session?.user?.id || "0", 10)) && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="h-10 px-5 rounded-full bg-[#D4A843] text-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-[#e6bc5a] transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-8 border-b border-[#222] mb-8">
          {[
            { id: "profile", label: "Profile & Responsibilities", icon: "👤" },
            { id: "kyc", label: `Identity KYC Vault (${userData.kycDocuments?.length || 0})`, icon: "🔒" },
            { id: "ledger", label: `Profile Change Ledger (${profileLogs.length})`, icon: "🛡️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3.5 text-[14px] font-semibold transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? "text-[#D4A843] border-[#D4A843]"
                  : "text-[#666] border-transparent hover:text-[#999]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Profile & Scope of Responsibilities */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Responsibilities Scope Card */}
            <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Shield className="w-5 h-5 text-[#D4A843]" />
                <h3 className="text-[15px] font-bold text-foreground">
                  Role Governance & Operational Scope
                </h3>
              </div>
              <p className="text-[13px] text-[#888] leading-relaxed">
                {userData.systemRole === "ADMIN"
                  ? "Full administrative authority: Configuring store pricing, inventory master catalogues, branch authorizations, employee payroll, KYC verification approval, and complete enterprise audit ledger inspection."
                  : userData.systemRole === "MANAGER"
                  ? "Store supervisor responsibilities: Supervising sales floor personnel, approving custom order discounts, conducting stock audits, verifying customer and staff identity KYC proofs, and managing shift rosters."
                  : "Salesman operational scope: POS checkout and invoice generation, walk-in client styling consultation, bespoke order booking, gold advance collection, and submitting identity documents for KYC clearance."}
              </p>
            </div>

            {/* 2 Column Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-6 space-y-4">
                <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider">
                  Personal & Contact Information
                </h3>
                <div className="space-y-3 text-[13px]">
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Primary Phone:</span>
                    <span className="text-foreground font-medium">+91 {userData.phone || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Email Address:</span>
                    <span className="text-foreground">{userData.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Gender:</span>
                    <span className="text-foreground">{userData.gender || "Not specified"}</span>
                  </div>
                  <div className="flex items-start justify-between text-[#888]">
                    <span>Address:</span>
                    <span className="text-foreground text-right max-w-[240px]">
                      {userData.address || "No address on file"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Emergency Contact:</span>
                    <span className="text-foreground">{userData.emergencyContact || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Tax & Banking Details */}
              <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-6 space-y-4">
                <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider">
                  Tax, Compensation & Banking Identifiers
                </h3>
                <div className="space-y-3 text-[13px]">
                  <div className="flex items-center justify-between text-[#888]">
                    <span>PAN Number:</span>
                    <span className="text-foreground font-mono font-medium">
                      {userData.panNumber || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Aadhaar Number:</span>
                    <span className="text-foreground font-mono">
                      {userData.aadharNumber
                        ? `XXXX-XXXX-${userData.aadharNumber.slice(-4)}`
                        : "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Monthly CTC:</span>
                    <span className="text-[#D4A843] font-bold text-[14px]">
                      {userData.salary
                        ? `₹ ${userData.salary.toLocaleString("en-IN")}`
                        : "Not configured"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Bank Account:</span>
                    <span className="text-foreground font-mono">{userData.bankAccount || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span>Bank IFSC:</span>
                    <span className="text-foreground font-mono">{userData.ifscCode || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Branch Assignments */}
            <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-6">
              <h3 className="text-[12px] font-bold text-[#D4A843] uppercase tracking-wider mb-3">
                Assigned Branch Access
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {userData.userBranches && userData.userBranches.length > 0 ? (
                  userData.userBranches.map((ub: any) => (
                    <span
                      key={ub.branchId}
                      className="px-3.5 py-1.5 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground flex items-center gap-2"
                    >
                      <Building className="w-4 h-4 text-[#D4A843]" />
                      {ub.branch?.name || `Branch #${ub.branchId}`}
                    </span>
                  ))
                ) : (
                  <p className="text-[13px] text-[#666] italic">Assigned to all enterprise branches</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Identity KYC Vault */}
        {activeTab === "kyc" && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-5 rounded-2xl border flex items-start gap-4 ${
                userData.kycStatus === "VERIFIED"
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : userData.kycStatus === "PENDING_REVIEW"
                  ? "bg-amber-950/20 border-amber-500/30"
                  : "bg-onyx-surface border-onyx-border"
              }`}
            >
              {userData.kycStatus === "VERIFIED" ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : userData.kycStatus === "PENDING_REVIEW" ? (
                <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-[#777] shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-[15px] font-bold text-foreground">
                  Employee Identity KYC Status: {userData.kycStatus?.replace("_", " ")}
                </h4>
                <p className="text-[13px] text-[#888] mt-0.5 leading-relaxed">
                  {userData.kycStatus === "VERIFIED"
                    ? "Employee credentials and identity proofs (PAN/Aadhaar/Qualification) have been authenticated and approved by store management."
                    : userData.kycStatus === "PENDING_REVIEW"
                    ? "Uploaded KYC documents are awaiting review and verification by an authorized Store Manager or Administrator."
                    : "Identity proofs are pending submission. Staff members should upload Aadhaar, PAN, and certificate scans to complete authentication."}
                </p>
              </div>
            </div>

            {/* 2 Column Layout: Vault List & Direct Uploader */}
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6">
              {/* Vault Documents List */}
              <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-6 space-y-4">
                <h3 className="text-[15px] font-bold text-foreground">Encrypted Identity Vault</h3>
                {userData.kycDocuments?.length === 0 ? (
                  <div className="py-16 border border-dashed border-[#222] rounded-xl text-center bg-onyx">
                    <FileText className="w-8 h-8 text-[#444] mx-auto mb-2" />
                    <p className="text-[13px] text-[#666] italic">No KYC documents stored in vault.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userData.kycDocuments?.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl bg-onyx border border-onyx-border flex items-center justify-between hover:border-[#D4A843]/25 transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                              doc.verified
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                : doc.rejectionReason
                                ? "bg-red-500/10 border-red-500/25 text-red-400"
                                : "bg-amber-500/10 border-amber-500/25 text-amber-400"
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13.5px] font-bold text-foreground">
                                {doc.documentType}
                              </span>
                              {doc.verified ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                                  Verified
                                </span>
                              ) : doc.rejectionReason ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase">
                                  Rejected
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                                  Pending Review
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-[#666] truncate max-w-[240px] mt-0.5">
                              {doc.fileName} ({(doc.fileSize / 1024).toFixed(1)} KB)
                            </p>
                            {doc.notes && (
                              <p className="text-[11px] text-[#555] italic mt-0.5">"{doc.notes}"</p>
                            )}
                            {doc.verifiedByName && (
                              <p className="text-[10px] text-[#666] mt-0.5">
                                Verified by {doc.verifiedByName} on{" "}
                                {new Date(doc.verifiedAt).toLocaleDateString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isManagerOrAdmin && (
                            <>
                              {!doc.verified && (
                                <button
                                  onClick={() => {
                                    setVerifyModalDoc(doc);
                                    setVerifyAction("VERIFY");
                                    setVerifyNotes("");
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold hover:bg-emerald-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                              )}
                              {doc.verified && (
                                <button
                                  onClick={() => {
                                    setVerifyModalDoc(doc);
                                    setVerifyAction("REJECT");
                                    setVerifyNotes("");
                                  }}
                                  className="h-8 px-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-medium hover:bg-red-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3 h-3" /> Revoke
                                </button>
                              )}
                            </>
                          )}

                          <a
                            href={`/api/settings/users/${userId}/kyc/download/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-onyx-elevated border border-[#222] text-[#888] hover:text-[#D4A843] flex items-center justify-center transition-all"
                            title="Download / View Decrypted File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {isManagerOrAdmin && (
                            <button
                              onClick={() => handleDeleteKycDoc(doc.id)}
                              className="h-8 w-8 rounded-lg bg-onyx-elevated border border-[#222] text-[#888] hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Uploader Form */}
              <div className="bg-onyx-surface border border-onyx-border rounded-2xl p-6 space-y-4">
                <h3 className="text-[15px] font-bold text-foreground">Upload Identity Proof</h3>
                <form onSubmit={handleUploadKyc} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-[#666] uppercase font-bold tracking-wider mb-1.5">
                      Document Type
                    </label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-onyx border border-onyx-border text-[13px] text-foreground outline-none focus:border-[#D4A843] cursor-pointer"
                    >
                      <option value="AADHAR">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                      <option value="DEGREE_CERTIFICATE">Degree / Qualification</option>
                      <option value="BANK_PROOF">Bank Passbook / Cheque</option>
                      <option value="POLICE_VERIFICATION">Police Verification</option>
                      <option value="OTHER">Other Proof</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#666] uppercase font-bold tracking-wider mb-1.5">
                      Select File (PDF / Image)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                        }
                      }}
                      className="w-full h-10 px-3 py-1.5 rounded-xl bg-onyx border border-onyx-border text-[12px] text-[#aaa] file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-onyx-elevated file:text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#666] uppercase font-bold tracking-wider mb-1.5">
                      Verification Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="e.g. Original physically inspected at branch desk"
                      className="w-full p-3 rounded-xl bg-onyx border border-onyx-border text-[12.5px] text-foreground outline-none focus:border-[#D4A843] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="w-full py-2.5 rounded-xl bg-[#D4A843] text-foreground text-[13px] font-bold hover:bg-[#e6bc5a] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Encrypting..." : "Encrypt & Store in Vault"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Staff Profile Change Ledger */}
        {activeTab === "ledger" && (
          <div className="space-y-4">
            {/* Filter & Search */}
            <div className="p-5 rounded-2xl bg-onyx-surface border border-onyx-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                    <History className="w-4.5 h-4.5 text-[#D4A843]" />
                    Staff Profile Change Ledger & Audit Trail
                  </h3>
                  <p className="text-[12px] text-[#666] mt-0.5">
                    Immutable history of registrations, field modifications, role transitions & KYC actions
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded-lg border border-onyx-border text-[#aaa] hover:text-foreground text-[11.5px] font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Ledger
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search changes by keyword, field, or actor..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-onyx border border-onyx-border text-[12.5px] text-foreground outline-none focus:border-[#D4A843]"
                  />
                </div>

                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-onyx border border-onyx-border text-[12px] text-foreground outline-none focus:border-[#D4A843] cursor-pointer"
                >
                  <option value="">All Actions</option>
                  <option value="STAFF.CREATED">Profile Created</option>
                  <option value="STAFF.UPDATED">Profile Updated</option>
                  <option value="STAFF.KYC_UPLOADED">KYC Uploaded</option>
                  <option value="STAFF.KYC_VERIFIED">KYC Verified</option>
                  <option value="STAFF.KYC_REJECTED">KYC Rejected</option>
                  <option value="STAFF.KYC_DELETED">KYC Deleted</option>
                </select>

                <select
                  value={logRoleFilter}
                  onChange={(e) => setLogRoleFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-onyx border border-onyx-border text-[12px] text-foreground outline-none focus:border-[#D4A843] cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SALESMAN">Salesman</option>
                </select>
              </div>
            </div>

            {/* Timeline Log Entries */}
            {logsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 text-[#D4A843] animate-spin mb-2" />
                <p className="text-[#666] text-[13px]">Querying audit ledger...</p>
              </div>
            ) : profileLogs.length === 0 ? (
              <div className="py-16 border border-dashed border-[#222] rounded-2xl text-center bg-onyx-surface">
                <History className="w-8 h-8 text-[#444] mx-auto mb-2" />
                <p className="text-[13px] text-[#666] italic">
                  No profile modification logs recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {profileLogs.map((log: any) => {
                  const isCreated = log.action?.includes("CREATED");
                  const isUpdated = log.action?.includes("UPDATED");
                  const isKycVerified = log.action?.includes("KYC_VERIFIED");
                  const isKycRejected = log.action?.includes("KYC_REJECTED");

                  return (
                    <div
                      key={log.id}
                      className="p-5 rounded-2xl bg-onyx-surface border border-onyx-border space-y-3.5 hover:border-[#333] transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                              isCreated || isKycVerified
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : isKycRejected
                                ? "bg-red-500/10 border-red-500/30 text-red-400"
                                : "bg-[#D4A843]/10 border-[#D4A843]/30 text-[#D4A843]"
                            }`}
                          >
                            {isCreated || isKycVerified ? (
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            ) : isKycRejected ? (
                              <XCircle className="w-4.5 h-4.5" />
                            ) : (
                              <Edit2 className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-bold text-foreground">
                                {log.humanAction}
                              </span>
                              <span className="text-[10px] font-mono text-[#666]">
                                ({log.action})
                              </span>
                            </div>
                            <p className="text-[12.5px] text-[#888] mt-0.5">{log.description}</p>
                          </div>
                        </div>

                        {/* Performer */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[12.5px] font-semibold text-foreground">
                              {log.performer?.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                log.performer?.role === "ADMIN"
                                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                  : log.performer?.role === "MANAGER"
                                  ? "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30"
                                  : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {log.performer?.role || "SALESMAN"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#555] mt-0.5">
                            {new Date(log.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Reason Pill */}
                      {log.reason && (
                        <div className="p-2.5 rounded-xl bg-onyx border border-onyx-border text-[12px] text-[#aaa] flex items-start gap-2">
                          <span className="text-[#D4A843] font-bold text-[11px] uppercase shrink-0">
                            Reason / Note:
                          </span>
                          <span className="text-foreground">{log.reason}</span>
                        </div>
                      )}

                      {/* Visual Before ➔ After Diff */}
                      {isUpdated && log.before && log.after && (
                        <div className="bg-onyx rounded-xl p-3.5 border border-onyx-border space-y-1.5">
                          <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">
                            Field Modifications Diff
                          </span>
                          <div className="space-y-1">
                            {Object.keys(log.after)
                              .filter(
                                (key) =>
                                  log.before[key] !== log.after[key] &&
                                  log.after[key] !== undefined
                              )
                              .map((key) => (
                                <div
                                  key={key}
                                  className="grid grid-cols-[140px_1fr_auto_1fr] items-center gap-3 text-[12px] py-1 border-b border-[#161616] last:border-none"
                                >
                                  <span className="font-semibold text-[#888] capitalize">
                                    {key.replace(/([A-Z])/g, " $1")}:
                                  </span>
                                  <span className="text-red-400/80 line-through truncate font-mono bg-red-950/20 px-2 py-0.5 rounded border border-red-500/20">
                                    {log.before[key] === null || log.before[key] === undefined
                                      ? "(none)"
                                      : String(log.before[key])}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#555]" />
                                  <span className="text-emerald-400 font-mono font-medium truncate bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {String(log.after[key])}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Meta */}
                      <div className="flex items-center justify-between text-[10px] text-[#444] pt-0.5">
                        <span>Audit ID #{log.id.slice(-8)}</span>
                        <span>IP: {log.ipAddress || "127.0.0.1"} • Device: {log.deviceInfo || "Web Console"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && (
          <EditStaffModal
            open={showEditModal}
            user={userData}
            roles={roles}
            branches={branches}
            userRole={userRole}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchStaffDetails();
              fetchProfileLedger();
            }}
          />
        )}

        {/* KYC Verification / Rejection Modal */}
        {verifyModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    verifyAction === "VERIFY"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {verifyAction === "VERIFY" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground">
                    {verifyAction === "VERIFY" ? "Approve KYC Document" : "Reject KYC Document"}
                  </h3>
                  <p className="text-[12px] text-[#666]">
                    {verifyModalDoc.documentType} ({verifyModalDoc.fileName})
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider">
                  {verifyAction === "VERIFY" ? "Manager Verification Notes (Optional)" : "Reason for Rejection *"}
                </label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder={
                    verifyAction === "VERIFY"
                      ? "e.g. Verified with original government identity records."
                      : "e.g. Expired ID, photo illegible, or name mismatch."
                  }
                  className="w-full p-3 rounded-xl bg-onyx border border-[#222] text-[12px] text-foreground outline-none focus:border-[#D4A843] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  onClick={() => setVerifyModalDoc(null)}
                  className="px-4 py-2 rounded-xl text-[13px] text-[#888] bg-onyx-elevated border border-[#252525] hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmVerification}
                  disabled={verifyLoading || (verifyAction === "REJECT" && !verifyNotes.trim())}
                  className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                    verifyAction === "VERIFY"
                      ? "bg-emerald-500 text-foreground hover:bg-emerald-600"
                      : "bg-red-500 text-foreground hover:bg-red-600"
                  }`}
                >
                  {verifyLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : verifyAction === "VERIFY" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  {verifyAction === "VERIFY" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
