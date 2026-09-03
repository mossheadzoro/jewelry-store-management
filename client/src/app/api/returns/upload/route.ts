// src/app/api/returns/upload/route.ts
// Secure Photo Upload Endpoint for Return Inspections

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import crypto from "crypto";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "DETAIL";

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute SHA-256 hash for forensic immutability
    const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

    let storageUrl = "";
    let storageKey = "";

    // If Cloudinary is configured, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        folder: "returns/inspections",
        public_id: `ret_${Date.now()}_${sha256Hash.substring(0, 8)}`,
      });
      storageUrl = uploadResult.secure_url;
      storageKey = uploadResult.public_id;
    } else {
      // Fallback data URI
      storageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
      storageKey = `local_${Date.now()}_${sha256Hash.substring(0, 8)}`;
    }

    return NextResponse.json(
      {
        storageUrl,
        storageKey,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        sha256Hash,
        category,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Return photo upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo." },
      { status: 500 }
    );
  }
}
