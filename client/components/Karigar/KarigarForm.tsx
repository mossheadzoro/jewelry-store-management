"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Hammer,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  UploadCloud,
  X,
  Plus,
} from "lucide-react";

type DocumentState = {
  file: File | null;
  preview: string | null;
  uploading?: boolean;
};

export default function KarigarForm() {
  const router = useRouter();
  const { selectedBranch, branches } = useBranchStore();

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ---------- BRANCH & PERSONAL DETAILS ---------- */
  const [branchId, setBranchId] = useState<string>(
    selectedBranch?.id ? String(selectedBranch.id) : "1"
  );
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [address, setAddress] = useState("");

  /* ---------- PROFILE PHOTO & WORK DETAILS ---------- */
  const [profilePhoto, setProfilePhoto] = useState<DocumentState>({
    file: null,
    preview: null,
  });
  const [department, setDepartment] = useState<string>("");
  const [wastage, setWastage] = useState("");

  /* ---------- DOCUMENTS ---------- */
  const [aadhaarFront, setAadhaarFront] = useState<DocumentState>({
    file: null,
    preview: null,
  });
  const [aadhaarBack, setAadhaarBack] = useState<DocumentState>({
    file: null,
    preview: null,
  });
  const [panCard, setPanCard] = useState<DocumentState>({
    file: null,
    preview: null,
  });
  const [voterId, setVoterId] = useState<DocumentState>({
    file: null,
    preview: null,
  });
  const [specialities, setSpecialities] = useState<string[]>([
    "Gold Work",
    "Diamond Setting",
    "Polishing",
    "Repairs",
  ]);

  useEffect(() => {
    if (selectedBranch?.id) {
      setBranchId(String(selectedBranch.id));
    }
  }, [selectedBranch]);

  const isUploading =
    profilePhoto.uploading ||
    aadhaarFront.uploading ||
    aadhaarBack.uploading ||
    panCard.uploading ||
    voterId.uploading;

  const removeImage = (setter: (v: DocumentState) => void) => {
    setter({ file: null, preview: null });
  };

  /* ---------- VALIDATION ---------- */
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full Name is required.";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full Name must be at least 2 characters.";
    }

    if (!mobile.trim()) {
      errors.mobile = "Mobile Number is required.";
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit phone number.";
    }

    if (!department) {
      errors.department = "Please select a department.";
    }

    if (!branchId) {
      errors.branchId = "Please select a branch.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ---------- SUBMIT ---------- */
  const handleSave = async () => {
    setServerError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    if (isUploading) {
      setServerError("Please wait for image uploads to complete before saving.");
      return;
    }

    setSaving(true);

    const payload = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      whatsapp: sameAsMobile ? mobile.trim() : whatsapp.trim(),
      address: address.trim(),
      department,
      branchId: parseInt(branchId, 10),
      specialities,
      wastage: wastage ? parseFloat(wastage) : 0,
      profilePhoto,
      documents: {
        aadhaarFront,
        aadhaarBack,
        panCard,
        voterId,
      },
    };

    try {
      const res = await fetch("/api/karigar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to save Karigar.");
      }

      setSuccessMessage("Master Artisan registered successfully!");
      setTimeout(() => {
        router.push("/karigar");
      }, 1500);
    } catch (error: any) {
      setServerError(error.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const [newSpeciality, setNewSpeciality] = useState("");

  const addSpeciality = () => {
    const value = newSpeciality.trim();
    if (!value) return;

    if (!specialities.includes(value)) {
      setSpecialities((prev) => [...prev, value]);
    }
    setNewSpeciality("");
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/karigar", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: DocumentState) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setter({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    });

    try {
      const uploaded = await uploadToCloudinary(file);
      setter({
        file: null,
        preview: uploaded.url,
        uploading: false,
      });
    } catch {
      setter({ file: null, preview: null, uploading: false });
      setServerError("Image upload failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground p-6 md:p-10 pb-32 w-full max-w-[1400px] mx-auto">
      {/* Back Button & Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/karigar")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-[#C9943A] transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Karigar Directory
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3 font-serif">
              <Hammer className="w-8 h-8 text-[#C9943A]" /> Register Master Artisan (Karigar)
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add artisan profile, assign primary branch atelier, set wastage agreements, and upload KYC documents.
            </p>
          </div>

          <Badge variant="outline" className="border-[#C9943A]/40 text-[#C9943A] bg-[#C9943A]/10 px-4 py-2 text-xs font-bold self-start md:self-auto">
            Active Registration Mode
          </Badge>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATIONS */}
      {serverError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT / MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          {/* PERSONAL DETAILS & BRANCH ASSIGNMENT */}
          <Card className="bg-[#121214] border-border shadow-xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-[#C9943A] text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Branch & Personal Profile
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Branch Assignment Selector */}
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Branch Atelier *</Label>
                <Select value={branchId} onValueChange={(v) => { setBranchId(v); setFieldErrors(p => ({...p, branchId: ""})) }}>
                  <SelectTrigger className={`mt-1.5 h-11 bg-card border-border text-foreground rounded-xl ${fieldErrors.branchId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select assigned branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name} ({b.city || "Branch"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.branchId && <p className="text-xs text-red-400 mt-1">{fieldErrors.branchId}</p>}
              </div>

              {/* Profile Photo & Names */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  {profilePhoto.preview ? (
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[#C9943A]/60 shadow-lg">
                      <img src={profilePhoto.preview} alt="Profile" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(setProfilePhoto)}
                        className="absolute top-1 right-1 bg-background/80 text-foreground p-1 rounded-full hover:bg-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-28 h-28 flex flex-col items-center justify-center rounded-full border-2 border-dashed border-[#C9943A]/40 bg-card/60 cursor-pointer text-xs text-muted-foreground hover:border-[#C9943A] hover:bg-card transition">
                      <UploadCloud className="w-6 h-6 text-[#C9943A] mb-1" />
                      Upload Photo
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, setProfilePhoto)}
                      />
                    </label>
                  )}
                  <span className="text-[11px] text-muted-foreground">JPG / PNG • Square</span>
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({...p, fullName: ""})) }}
                      placeholder="e.g. Master Rajesh Sharma"
                      className={`mt-1.5 h-11 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl focus:border-[#C9943A] ${fieldErrors.fullName ? "border-red-500" : ""}`}
                    />
                    {fieldErrors.fullName && <p className="text-xs text-red-400 mt-1">{fieldErrors.fullName}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Number *</Label>
                    <Input
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value); setFieldErrors(p => ({...p, mobile: ""})) }}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`mt-1.5 h-11 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl focus:border-[#C9943A] ${fieldErrors.mobile ? "border-red-500" : ""}`}
                    />
                    {fieldErrors.mobile && <p className="text-xs text-red-400 mt-1">{fieldErrors.mobile}</p>}
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Number</Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={sameAsMobile}
                      onCheckedChange={(v) => {
                        setSameAsMobile(Boolean(v));
                        if (!sameAsMobile) setWhatsapp(mobile);
                      }}
                      className="border-border data-[state=checked]:bg-[#C9943A]"
                    />
                    <span>Same as mobile</span>
                  </div>
                </div>
                <Input
                  value={sameAsMobile ? mobile : whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  disabled={sameAsMobile}
                  placeholder="WhatsApp phone number"
                  className="h-11 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl"
                />
              </div>

              {/* Address */}
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Residential Address</Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, pincode..."
                  className="mt-1.5 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl min-h-[90px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* DOCUMENTS */}
          <Card className="bg-[#121214] border-border shadow-xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-[#C9943A] text-lg font-bold">KYC & Document Verification</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <ImageUploader
                title="Aadhaar Front"
                state={aadhaarFront}
                onUpload={(e) => handleImageUpload(e, setAadhaarFront)}
                onRemove={() => removeImage(setAadhaarFront)}
              />
              <ImageUploader
                title="Aadhaar Back"
                state={aadhaarBack}
                onUpload={(e) => handleImageUpload(e, setAadhaarBack)}
                onRemove={() => removeImage(setAadhaarBack)}
              />
              <ImageUploader
                title="PAN Card"
                state={panCard}
                onUpload={(e) => handleImageUpload(e, setPanCard)}
                onRemove={() => removeImage(setPanCard)}
              />
              <ImageUploader
                title="Voter ID / Other Proof"
                state={voterId}
                onUpload={(e) => handleImageUpload(e, setVoterId)}
                onRemove={() => removeImage(setVoterId)}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — WORK DETAILS */}
        <div className="space-y-8">
          <Card className="bg-[#121214] border-border shadow-xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-[#C9943A] text-lg font-bold">Work & Atelier Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department *</Label>
                <Select value={department} onValueChange={(v) => { setDepartment(v); setFieldErrors(p => ({...p, department: ""})) }}>
                  <SelectTrigger className={`mt-1.5 h-11 bg-card border-border text-foreground rounded-xl ${fieldErrors.department ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="GOLD">Gold Department</SelectItem>
                    <SelectItem value="SILVER">Silver Department</SelectItem>
                    <SelectItem value="DIAMOND">Diamond / Studded Department</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.department && <p className="text-xs text-red-400 mt-1">{fieldErrors.department}</p>}
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Artisan Specialities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialities.map((s) => (
                    <Badge
                      key={s}
                      className="bg-[#C9943A]/15 text-[#C9943A] border border-[#C9943A]/40 px-3 py-1 flex items-center gap-1.5 text-xs rounded-lg"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSpecialities((prev) => prev.filter((i) => i !== s))}
                        className="text-muted-foreground hover:text-red-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add custom skill (e.g. Kundan, Filigree)..."
                    value={newSpeciality}
                    onChange={(e) => setNewSpeciality(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpeciality();
                      }
                    }}
                    className="h-10 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSpeciality}
                    className="border-[#C9943A]/50 text-[#C9943A] hover:bg-[#C9943A]/10 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Agreed Wastage (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.50 %"
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                  className="mt-1.5 h-11 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0C]/95 backdrop-blur-md border-t border-border px-6 md:px-10 py-4 flex justify-end gap-4 z-40">
        <Button
          variant="ghost"
          disabled={saving || isUploading}
          onClick={() => router.push("/karigar")}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>

        <Button
          disabled={saving || isUploading}
          onClick={handleSave}
          className="bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-foreground font-bold hover:brightness-110 px-6 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Karigar...
            </>
          ) : (
            "Save Karigar"
          )}
        </Button>
      </div>
    </div>
  );
}

function ImageUploader({
  title,
  state,
  onUpload,
  onRemove,
}: {
  title: string;
  state: DocumentState;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</Label>

      {state.preview ? (
        <div className="relative mt-2 w-full h-32 rounded-xl overflow-hidden border border-border bg-card">
          <img
            src={state.preview}
            alt={title}
            className={`object-cover w-full h-full ${state.uploading ? "opacity-40" : ""}`}
          />
          {state.uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-[#C9943A] font-semibold">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
            </div>
          )}
          {!state.uploading && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-background/80 text-foreground p-1 rounded-full hover:bg-red-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <label className="mt-2 flex flex-col items-center justify-center h-28 rounded-xl border border-dashed border-border bg-card/40 cursor-pointer text-xs text-muted-foreground hover:border-[#C9943A]/50 hover:bg-card transition">
          <UploadCloud className="w-5 h-5 text-muted-foreground mb-1" />
          <span>Upload {title}</span>
          <Input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={state.uploading} />
        </label>
      )}
    </div>
  );
}
