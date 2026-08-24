import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const documents = await prisma.customerDocument.findMany({
      where: { customerId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        customerId: true,
        documentType: true,
        fileName: true,
        uploadedAt: true,
        verified: true,
        verifiedAt: true,
        notes: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (err) {
    console.error("Error listing customer documents:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
