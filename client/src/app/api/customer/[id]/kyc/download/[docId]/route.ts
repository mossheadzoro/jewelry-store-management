import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../../libs/prisma";
import { decryptBuffer } from "@/lib/services/KycEncryption";
import fs from "fs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);
  const docId = resolvedParams.docId;

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const document = await prisma.customerDocument.findUnique({
      where: { id: docId },
    });

    if (!document || document.customerId !== customerId) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    if (!fs.existsSync(document.filePath)) {
      return NextResponse.json({ error: "Encrypted file not found on storage server" }, { status: 404 });
    }

    // Read encrypted file
    const encBuffer = fs.readFileSync(document.filePath);

    // Decrypt
    const decryptedBuffer = decryptBuffer(encBuffer, document.iv || "");

    // Determine content type based on extension
    const ext = document.fileName.split(".").pop()?.toLowerCase() || "";
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";

    return new Response(decryptedBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        "Content-Length": decryptedBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Error downloading document:", err);
    return NextResponse.json({ error: "Server error during decryption" }, { status: 500 });
  }
}

// Add DELETE handler to delete the document and clean up local file storage
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);
  const docId = resolvedParams.docId;

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const document = await prisma.customerDocument.findUnique({
      where: { id: docId },
    });

    if (!document || document.customerId !== customerId) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete database entry
    await prisma.customerDocument.delete({
      where: { id: docId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting document:", err);
    return NextResponse.json({ error: "Server error during deletion" }, { status: 500 });
  }
}
