import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../libs/prisma";
import { encryptBuffer } from "@/lib/services/KycEncryption";
import fs from "fs";
import path from "path";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!file || !documentType) {
      return NextResponse.json({ error: "File and documentType are required" }, { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Encrypt
    const { encrypted, iv } = encryptBuffer(fileBuffer);

    // Ensure secure-uploads folder exists
    const uploadDir = path.join(process.cwd(), "secure-uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save encrypted file
    const docId = crypto.randomUUID();
    const encFileName = `${docId}.enc`;
    const encFilePath = path.join(uploadDir, encFileName);
    fs.writeFileSync(encFilePath, encrypted);

    // Save to Database
    const doc = await prisma.customerDocument.create({
      data: {
        id: docId,
        customerId,
        documentType,
        fileName: file.name,
        filePath: encFilePath,
        iv,
        notes,
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (err) {
    console.error("Error uploading KYC document:", err);
    return NextResponse.json({ error: "Server error during upload" }, { status: 500 });
  }
}
