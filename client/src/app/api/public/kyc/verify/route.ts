import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const uploadToken = await prisma.kycUploadToken.findUnique({
      where: { token },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
          },
        },
      },
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

    return NextResponse.json({
      valid: true,
      customer: uploadToken.customer,
      expiresAt: uploadToken.expiresAt,
    });
  } catch (err) {
    console.error("Error verifying upload token:", err);
    return NextResponse.json({ error: "Server error during token verification" }, { status: 500 });
  }
}
