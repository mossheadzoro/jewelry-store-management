"use client";

import { useState } from "react";
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

/* ---------------- TYPES ---------------- */

type Speciality = "Gold Work" | "Diamond Setting" | "Polishing" | "Repairs";

type DocumentState = {
  file: File | null
  preview: string | null
  uploading?: boolean
}



/* ---------------- COMPONENT ---------------- */

export default function KarigarForm() {
    const [saving, setSaving] = useState(false)
  /* ---------- PERSONAL DETAILS ---------- */
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsMobile, setSameAsMobile] = useState(false);
  /* ---------- PROFILE PHOTO ---------- */
  const [profilePhoto, setProfilePhoto] = useState<DocumentState>({
    file: null,
    preview: null,
  });

  const [address, setAddress] = useState("");

  /* ---------- WORK DETAILS ---------- */
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
  /* ---------- HELPERS ---------- */

  const toggleSpeciality = (item: Speciality) => {
    setSpecialities((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

const isUploading =
  profilePhoto.uploading ||
  aadhaarFront.uploading ||
  aadhaarBack.uploading ||
  panCard.uploading ||
  voterId.uploading


  const removeImage = (setter: (v: DocumentState) => void) => {
    setter({ file: null, preview: null });
  };

  /* ---------- SUBMIT (FRONTEND ONLY) ---------- */

const handleSave = async () => {
  if (isUploading) {
    alert("Please wait for uploads to finish")
    return
  }

  setSaving(true)

  const payload = {
    fullName,
    mobile,
    whatsapp: sameAsMobile ? mobile : whatsapp,
    address,
    department,
    specialities,
    wastage,
    profilePhoto,
    documents: {
      aadhaarFront,
      aadhaarBack,
      panCard,
      voterId,
    },
  }

  try {
    const res = await fetch("/api/karigar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error("Save failed")

    alert("Karigar saved successfully")
  } catch (error) {
    alert("Error saving karigar")
  } finally {
    setSaving(false)
  }
}


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
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/upload/karigar", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) throw new Error("Upload failed")

  return res.json() // { url, public_id }
}
const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (v: DocumentState) => void
) => {
  const file = e.target.files?.[0]
  if (!file) return

  // instant preview + loading
  setter({
    file,
    preview: URL.createObjectURL(file),
    uploading: true,
  })

  try {
    const uploaded = await uploadToCloudinary(file)

    setter({
      file: null,
      preview: uploaded.url,
      uploading: false,
    })
  } catch (error) {
    alert("Image upload failed")
    setter({ file: null, preview: null, uploading: false })
  }
}

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white px-10 py-8 pb-32 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Dashboard / Karigars / Add New
          </p>
          <h1 className="text-3xl font-semibold">Add / Edit Karigar</h1>
          <p className="text-sm text-muted-foreground">
            Manage artisan details and work agreements
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-yellow-500/40 text-yellow-400 px-4 py-2"
        >
          Active Status
        </Badge>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal */}
          <Card className="bg-[#141414] border-yellow-500/10">
            <CardHeader>
              <CardTitle className="text-yellow-400">
                Personal Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className=" md:grid-cols-2 flex flex-row gap-4">
                {/* Profile Photo */}
                <div className="flex items-center  gap-6">
                  <div className="relative">
                    {profilePhoto.preview ? (
                      <div className="w-28 h-28 rounded-full overflow-hidden border border-yellow-500/40">
                        <img
                          src={profilePhoto.preview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(setProfilePhoto)}
                          className="absolute -top-2 -right-2 bg-black text-white text-xs px-2 py-1 rounded-full"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="w-28 h-28 flex items-center justify-center rounded-full border border-dashed border-yellow-500/40 cursor-pointer text-xs text-muted-foreground hover:border-yellow-500">
                        Upload Photo
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(e, setProfilePhoto)
                          }
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <Label>Karigar Profile Photo</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG / PNG • Recommended square image
                    </p>
                  </div>
                </div>

                <div>
                  <div className="w-[400px] py-2 mb-2">
                    <Label>Full Name</Label>
                    <Input
                      className=""
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <Input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>WhatsApp Number</Label>
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={sameAsMobile}
                      onCheckedChange={(v) => {
                        setSameAsMobile(Boolean(v));
                        if (!sameAsMobile) setWhatsapp(mobile);
                      }}
                    />
                    Same as mobile
                  </div>
                </div>
                <Input
                  value={sameAsMobile ? mobile : whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  disabled={sameAsMobile}
                />
              </div>

              <div>
                <Label>Residential Address</Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-[#141414] border-yellow-500/10">
            <CardHeader>
              <CardTitle className="text-yellow-400">
                Document Uploads
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-6">
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
                title="Voter ID / Other"
                state={voterId}
                onUpload={(e) => handleImageUpload(e, setVoterId)}
                onRemove={() => removeImage(setVoterId)}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-8">
          {/* Work */}
          <Card className="bg-[#141414] border-yellow-500/10">
            <CardHeader>
              <CardTitle className="text-yellow-400">Work Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="DIAMOND">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Speciality</Label>

                {/* Selected / Available Specialities */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialities.map((s) => (
                    <Badge
                      key={s}
                      className="bg-yellow-500 text-black flex items-center gap-1"
                    >
                      {s}
                      <button
                        onClick={() =>
                          setSpecialities((prev) => prev.filter((i) => i !== s))
                        }
                        className="ml-1 text-xs hover:text-red-600"
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add New Speciality */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add speciality (e.g. Bangles)"
                    value={newSpeciality}
                    onChange={(e) => setNewSpeciality(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpeciality();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-yellow-500 text-yellow-400"
                    onClick={addSpeciality}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <Label>Wastage Agreement (%)</Label>
                <Input
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0b0b0b] border-t border-yellow-500/10 px-10 py-4 flex justify-end gap-4">
       <Button variant="ghost" disabled={saving || isUploading}>
  Cancel
</Button>

<Button
  variant="outline"
  disabled={saving || isUploading}
  className="border-yellow-500 text-yellow-400"
>
  Save as Draft
</Button>

<Button
  disabled={saving || isUploading}
  className="bg-yellow-500 text-black hover:bg-yellow-400"
  onClick={handleSave}
>
  {saving ? "Saving..." : "Save Karigar"}
</Button>

      </div>
    </div>
  );
}

/* ---------------- IMAGE UPLOADER ---------------- */

function ImageUploader({
  title,
  state,
  onUpload,
  onRemove,
}: {
  title: string
  state: DocumentState
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}) {
  return (
    <div>
      <Label>{title}</Label>

      {state.preview ? (
        <div className="relative mt-2 w-40 h-28 rounded-lg overflow-hidden border">
          <img
            src={state.preview}
            alt={title}
            className={`object-cover w-full h-full ${
              state.uploading ? "opacity-50" : ""
            }`}
          />

          {state.uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs">
              Uploading...
            </div>
          )}

          {!state.uploading && (
            <button
              onClick={onRemove}
              className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <Input
          type="file"
          accept="image/*"
          onChange={onUpload}
          disabled={state.uploading}
        />
      )}
    </div>
  )
}


