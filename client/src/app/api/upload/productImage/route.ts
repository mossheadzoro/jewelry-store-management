// client/src/app/api/upload/productImage/route.ts
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Temporary file path for Cloudinary upload
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${Date.now()}_${file.name || "product_image.png"}`);

    await writeFile(tempFilePath, buffer);

    // Upload directly to Cloudinary
    const upload = await cloudinary.uploader.upload(tempFilePath, {
      folder: folder,
      resource_type: "image",
    });

    return NextResponse.json({
      imageUrl: upload.secure_url,
      url: upload.secure_url,
      public_id: upload.public_id,
    });
  } catch (error: any) {
    console.error("Cloudinary product image upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image upload to Cloudinary" },
      { status: 500 }
    );
  }
}
