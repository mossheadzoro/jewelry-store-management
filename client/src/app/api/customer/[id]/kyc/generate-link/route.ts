import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../libs/prisma";
import crypto from "crypto";

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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Generate unique secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    const uploadToken = await prisma.kycUploadToken.create({
      data: {
        customerId,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      token: uploadToken.token,
      expiresAt: uploadToken.expiresAt,
    });
  } catch (err) {
    console.error("Error generating KYC upload token:", err);
    return NextResponse.json({ error: "Server error generating upload link" }, { status: 500 });
  }
}
