// client/src/app/api/security/2fa/setup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@libs/prisma";
import { SecurityService } from "@/lib/security/SecurityService";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);
    const tenantId = "default-tenant";
    const body = await req.json();
    const { currentPassword } = body;

    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to initiate 2FA setup." }, { status: 400 });
    }

    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password. Re-authentication failed." }, { status: 403 });
    }

    // Generate TOTP setup
    const { secret, otpauthUri, qrCodeDataUrl } = await SecurityService.generateTotpSetup(
      tenantId,
      user.email,
      user.name
    );

    // Audit enrollment started
    await SecurityService.logAudit({
      tenantId,
      userId,
      userEmail: user.email,
      eventType: "2FA_ENROLLMENT_STARTED",
      action: "User initiated TOTP enrollment wizard",
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        secret,
        otpauthUri,
        qrCodeDataUrl,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/security/2fa/setup] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize 2FA setup" },
      { status: 500 }
    );
  }
}
