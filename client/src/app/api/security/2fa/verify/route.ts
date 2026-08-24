// client/src/app/api/security/2fa/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SecurityService } from "@/lib/security/SecurityService";
import { SecurityCrypto } from "@/lib/security/SecurityCrypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeToken, code, isRecoveryCode, rememberDevice, deviceName } = body;
    const clientIp = SecurityService.getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "";
    const tenantId = "default-tenant";

    if (!challengeToken || !code) {
      return NextResponse.json({ error: "Challenge token and 6-digit code or recovery code are required." }, { status: 400 });
    }

    // Check rate limit for 2FA verification attempts (5 attempts per 15 min per IP)
    const rateLimit = SecurityService.checkRateLimit(`2fa_verify:${clientIp}`, 5, 900000);
    if (!rateLimit.allowed) {
      const waitMins = Math.ceil(((rateLimit.lockedUntil || Date.now()) - Date.now()) / 60000);
      return NextResponse.json({
        error: `Too many failed 2FA attempts. Please wait ${waitMins} minute(s) before trying again.`,
      }, { status: 429 });
    }

    // Look up Challenge
    const challenge = await prisma.securityChallenge.findUnique({
      where: { challengeToken },
    });

    if (!challenge || challenge.used || challenge.expiresAt < new Date()) {
      return NextResponse.json({
        error: "2FA challenge expired or invalid. Please sign in again.",
      }, { status: 400 });
    }

    const userId = challenge.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userSecurity: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let isVerified = false;

    if (isRecoveryCode) {
      // Recovery code path
      isVerified = await SecurityService.verifyAndConsumeRecoveryCode(tenantId, userId, code);

      if (isVerified) {
        await SecurityService.logAudit({
          tenantId,
          userId,
          userEmail: user.email,
          branchId: user.branchId || undefined,
          eventType: "RECOVERY_CODE_USED",
          action: "Emergency recovery code used for 2FA authentication",
          success: true,
          ipAddress: clientIp,
          userAgent,
        });
      }
    } else {
      // Standard TOTP path
      if (!user.userSecurity?.totpSecretEncrypted) {
        return NextResponse.json({ error: "2FA secret not configured for user." }, { status: 400 });
      }

      const decryptedSecret = SecurityCrypto.decrypt(user.userSecurity.totpSecretEncrypted);
      isVerified = SecurityService.verifyTotp(decryptedSecret, code);

      if (isVerified) {
        await SecurityService.logAudit({
          tenantId,
          userId,
          userEmail: user.email,
          branchId: user.branchId || undefined,
          eventType: "2FA_VERIFICATION_SUCCESS",
          action: "Two-Factor TOTP passcode verified",
          success: true,
          ipAddress: clientIp,
          userAgent,
        });

        // Update last 2FA verification timestamp
        await prisma.userSecurity.update({
          where: { userId },
          data: {
            lastTwoFactorVerifiedAt: new Date(),
            failedTwoFactorAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    }

    if (!isVerified) {
      await SecurityService.logAudit({
        tenantId,
        userId,
        userEmail: user.email,
        branchId: user.branchId || undefined,
        eventType: "2FA_VERIFICATION_FAILED",
        action: isRecoveryCode ? "Invalid recovery code entered" : "Invalid TOTP passcode entered",
        success: false,
        reason: isRecoveryCode ? "Recovery code not found or already consumed" : "Invalid 6-digit passcode",
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json({
        error: isRecoveryCode
          ? "Invalid or already consumed recovery code."
          : "Invalid 6-digit authentication code.",
      }, { status: 400 });
    }

    // Mark challenge as used
    await prisma.securityChallenge.update({
      where: { id: challenge.id },
      data: { used: true },
    });

    // Reset rate limit
    SecurityService.resetRateLimit(`2fa_verify:${clientIp}`);

    // If rememberDevice is true, generate trusted device token
    let trustedDeviceToken = undefined;
    if (rememberDevice) {
      const rawDeviceToken = SecurityCrypto.generateSecureToken(32);
      const deviceTokenHash = SecurityCrypto.hashToken(rawDeviceToken);
      const policy = await SecurityService.getTenantPolicy(tenantId);
      const durationDays = policy.trustedDeviceDurationDays || 30;

      await prisma.trustedDevice.create({
        data: {
          tenantId,
          userId,
          deviceTokenHash,
          deviceName: deviceName || "Trusted Browser",
          browser: userAgent.slice(0, 100),
          ipAddress: clientIp,
          expiresAt: new Date(Date.now() + durationDays * 86400000),
        },
      });

      trustedDeviceToken = rawDeviceToken;
    }

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication verified successfully.",
      data: {
        userId: user.id,
        email: user.email,
        role: user.systemRole,
        branchId: user.branchId,
        trustedDeviceToken,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/security/2fa/verify] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify 2FA" },
      { status: 500 }
    );
  }
}
