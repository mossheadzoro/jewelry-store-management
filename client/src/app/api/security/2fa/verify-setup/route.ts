// client/src/app/api/security/2fa/verify-setup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { SecurityService } from "@/lib/security/SecurityService";
import { SecurityCrypto } from "@/lib/security/SecurityCrypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);
    const tenantId = "default-tenant";
    const body = await req.json();
    const { secret, token } = body;

    if (!secret || !token) {
      return NextResponse.json({ error: "Secret and 6-digit verification code are required." }, { status: 400 });
    }

    // Verify token
    const isValid = SecurityService.verifyTotp(secret, token);
    if (!isValid) {
      // Log failed attempt
      await SecurityService.logAudit({
        tenantId,
        userId,
        userEmail: session.user.email || undefined,
        eventType: "2FA_VERIFICATION_FAILED",
        action: "Initial TOTP setup verification failed",
        success: false,
        reason: "Invalid 6-digit passcode entered during enrollment",
        ipAddress: SecurityService.getClientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json({ error: "Invalid verification code. Please check your authenticator app and try again." }, { status: 400 });
    }

    // Encrypt TOTP secret at rest (NEVER store in plaintext)
    const encryptedSecret = SecurityCrypto.encrypt(secret);

    // Save in UserSecurity and User models
    await prisma.userSecurity.upsert({
      where: { userId },
      update: {
        twoFactorEnabled: true,
        twoFactorMethod: "TOTP",
        totpSecretEncrypted: encryptedSecret,
        totpEnabledAt: new Date(),
        failedTwoFactorAttempts: 0,
        lockedUntil: null,
        lastTwoFactorVerifiedAt: new Date(),
      },
      create: {
        tenantId,
        userId,
        twoFactorEnabled: true,
        twoFactorMethod: "TOTP",
        totpSecretEncrypted: encryptedSecret,
        totpEnabledAt: new Date(),
        lastTwoFactorVerifiedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Generate 10 hashed recovery codes
    const recoveryCodes = await SecurityService.regenerateRecoveryCodes(tenantId, userId);

    // Audit success
    await SecurityService.logAudit({
      tenantId,
      userId,
      userEmail: session.user.email || undefined,
      eventType: "2FA_ENABLED",
      action: "Two-Factor Authentication successfully enrolled & enabled",
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
      metadata: {
        method: "TOTP",
        recoveryCodesCount: recoveryCodes.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication successfully enabled!",
      data: {
        recoveryCodes,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/security/2fa/verify-setup] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to finalize 2FA setup" },
      { status: 500 }
    );
  }
}
