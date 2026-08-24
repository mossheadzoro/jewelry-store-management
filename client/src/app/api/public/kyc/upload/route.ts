import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptBuffer } from "@/lib/services/KycEncryption";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!token || !file || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify token
    const uploadToken = await prisma.kycUploadToken.findUnique({
      where: { token },
    });

    if (!uploadToken) {
      return NextResponse.json({ error: "Invalid upload token" }, { status: 404 });
    }

    if (uploadToken.isUsed) {
      return NextResponse.json({ error: "This upload link has already been used" }, { status: 410 });
    }

    if (new Date() > uploadToken.expiresAt) {
      return NextResponse.json({ error: "This upload link has expired" }, { status: 410 });
    }

    // Read and encrypt file
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { encrypted, iv } = encryptBuffer(fileBuffer);

    // Save encrypted file
    const uploadDir = path.join(process.cwd(), "secure-uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const docId = crypto.randomUUID();
    const encFileName = `${docId}.enc`;
    const encFilePath = path.join(uploadDir, encFileName);
    fs.writeFileSync(encFilePath, encrypted);

    // Write database entry
    const doc = await prisma.customerDocument.create({
      data: {
        id: docId,
        customerId: uploadToken.customerId,
        documentType,
        fileName: file.name,
        filePath: encFilePath,
        iv,
        notes: notes || "Uploaded via public link",
      },
    });

    // Mark token as used
    await prisma.kycUploadToken.update({
      where: { id: uploadToken.id },
      data: { isUsed: true },
    });

    return NextResponse.json({ success: true, document: { id: doc.id, fileName: doc.fileName } });
  } catch (err) {
    console.error("Error in public upload API:", err);
    return NextResponse.json({ error: "Server error during public upload" }, { status: 500 });
  }
}
