"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";

function KycUploadContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [documentType, setDocumentType] = useState("AADHAR");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg("Secure upload token is missing. Please make sure the URL is correct.");
      setLoading(false);
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/public/kyc/verify?token=${token}`);
        const data = await res.json();
        
        if (!res.ok || data.error) {
          setErrorMsg(data.error || "The upload link is invalid or has expired.");
        } else {
          setCustomer(data.customer);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to verify secure upload token. Please try again.");
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("notes", notes);

      const res = await fetch("/api/public/kyc/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to upload document. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred during upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center flex-col space-y-4 px-6 text-center">
        <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
        <p className="text-[14px] text-[#888]">Establishing secure encrypted channel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-onyx flex items-center justify-center px-4 py-16 selection:bg-[#D4A843]/20">
      <div className="w-full max-w-[500px] bg-onyx-surface border border-[#222] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative subtle backdrop gradient */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4A843]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo/Shield Header */}
        <div className="flex items-center gap-3.5 mb-8 pb-6 border-b border-[#222]">
          <div className="w-11 h-11 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-2xl flex items-center justify-center text-[#D4A843] shadow-inner">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-wide uppercase">Atelier Secure Curation</h1>
            <p className="text-[12px] text-[#666]">End-to-End Encrypted KYC Node</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/5 border border-red-500/25 rounded-2xl p-4.5 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-[13px] font-bold text-foreground mb-0.5">Upload Restrained</h3>
              <p className="text-[12px] text-red-400/80 leading-normal">{errorMsg}</p>
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-[#D4A843]/10 border border-[#D4A843]/35 rounded-full flex items-center justify-center text-[#D4A843] mx-auto animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-foreground">Upload Encrypted</h2>
              <p className="text-[13px] text-[#888] mt-2 max-w-sm mx-auto leading-relaxed">
                Your document has been encrypted on-the-fly with AES-256-CBC and stored in our secure vault. The verification token is now invalidated.
              </p>
            </div>
            <div className="pt-2 text-[12px] text-[#555]">
              You can now safely close this browser window.
            </div>
          </div>
        ) : customer ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Context Card */}
            <div className="bg-onyx border border-[#1f1f1f] rounded-2xl p-5">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-widest block mb-1">Authenticated Client</span>
              <span className="text-[16px] font-bold text-foreground block capitalize">{customer.name}</span>
              <span className="text-[12px] text-[#666] block mt-0.5">+91 {customer.mobile}</span>
            </div>

            {/* Document Type Selection */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#888] uppercase tracking-wider block">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#222] bg-onyx text-foreground text-[13px] font-medium outline-none focus:border-[#D4A843] transition-all cursor-pointer"
              >
                <option value="AADHAR">Aadhar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="GST_CERTIFICATE">GST Registration Certificate</option>
                <option value="OTHER">Address / Identity Proof (Other)</option>
              </select>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#888] uppercase tracking-wider block">Upload Document File</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                  dragActive 
                    ? "border-[#D4A843] bg-[#D4A843]/5" 
                    : file 
                      ? "border-[#D4A843]/40 bg-[#0d0d0d]" 
                      : "border-[#222] bg-onyx hover:border-[#D4A843]/30"
                }`}
              >
                <input
                  type="file"
                  id="kyc-file-input"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {file ? (
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl flex items-center justify-center text-[#D4A843] mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground truncate max-w-[280px] mx-auto">{file.name}</p>
                      <p className="text-[11px] text-[#555] mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <span className="text-[11px] text-[#D4A843] hover:underline block pointer-events-none mt-1">Change File</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-[#666] mx-auto">
                      <Upload className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[13px] text-foreground font-medium">Drag & drop your file here</p>
                      <p className="text-[11px] text-[#555] mt-1">Supports PDF or Image (up to 10MB)</p>
                    </div>
                    <span className="inline-block px-3 py-1.5 rounded-lg border border-[#222] text-[#888] text-[11px] font-semibold hover:border-border">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#888] uppercase tracking-wider block">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Self-attested copy of Aadhar card"
                rows={2}
                className="w-full p-3 rounded-xl border border-[#222] bg-onyx text-foreground text-[13px] outline-none focus:border-[#D4A843] transition-all resize-none placeholder-[#333]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || uploading}
              className={`w-full h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
                file && !uploading
                  ? "bg-[#D4A843] text-foreground hover:bg-[#e6bc5a] active:scale-[0.98] cursor-pointer"
                  : "bg-[#1f1f1f] text-[#555] cursor-not-allowed"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encrypting & Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Submit Encrypted KYC
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
            <p className="text-[#666] text-sm mt-2">
              This KYC upload portal could not establish verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KycUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-onyx flex items-center justify-center flex-col space-y-4 text-center">
        <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
        <p className="text-[14px] text-[#888]">Loading portal node...</p>
      </div>
    }>
      <KycUploadContent />
    </Suspense>
  );
}
