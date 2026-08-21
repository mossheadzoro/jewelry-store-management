import cloudinary from "@/lib/cloudinary"
import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import os from "os"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = formData.get("folder") as string || "branch_assets"

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 })
  }

  // Convert to buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Temporary file path
  const tempDir = os.tmpdir()
  const filePath = path.join(tempDir, file.name)

  await writeFile(filePath, buffer)

  const upload = await cloudinary.uploader.upload(filePath, {
    folder: folder,
  })

  return NextResponse.json({
    url: upload.secure_url,
    public_id: upload.public_id,
  })
}
