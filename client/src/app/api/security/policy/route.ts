// client/src/app/api/security/policy/route.ts
// Security Policy API Route

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { SecurityService } from "@/lib/security/SecurityService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenantId = "default-tenant";
    const policy = await SecurityService.getTenantPolicy(tenantId);

    // Calculate Security Health Score (0 - 100)
    let score = 30; // base score for auth & role setup
    if (policy.twoFactorEnabled) score += 25;
    if (policy.recaptchaEnabled) score += 15;
    if (policy.ipWhitelistEnabled) score += 15;
    if (policy.rateLimitLogin) score += 5;
    if (policy.progressiveLockout) score += 5;
    if (policy.require2FAAfterPasswordReset) score += 5;

    return NextResponse.json({
      success: true,
      data: {
        ...policy,
        securityScore: Math.min(100, score),
      },
    });
  } catch (error: any) {
    console.error("[GET /api/security/policy] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch security policy" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const tenantId = "default-tenant";

    const policyFields = {
      twoFactorEnabled: body.twoFactorEnabled !== undefined ? Boolean(body.twoFactorEnabled) : false,
      allowUserDisable2FA: body.allowUserDisable2FA !== undefined ? Boolean(body.allowUserDisable2FA) : true,
      require2FAAfterPasswordReset: body.require2FAAfterPasswordReset !== undefined ? Boolean(body.require2FAAfterPasswordReset) : true,
      require2FAForNewDevices: body.require2FAForNewDevices !== undefined ? Boolean(body.require2FAForNewDevices) : false,
      rememberTrustedDevice: body.rememberTrustedDevice !== undefined ? Boolean(body.rememberTrustedDevice) : true,
      trustedDeviceDurationDays: body.trustedDeviceDurationDays ? parseInt(body.trustedDeviceDurationDays, 10) : 30,
      twoFactorRoles: body.twoFactorRoles || {},
      requireEnrollmentAfterFirstLogin: body.requireEnrollmentAfterFirstLogin !== undefined ? Boolean(body.requireEnrollmentAfterFirstLogin) : false,
      enrollmentGracePeriodHours: body.enrollmentGracePeriodHours ? parseInt(body.enrollmentGracePeriodHours, 10) : 24,
      blockAccessUntilEnrolled: body.blockAccessUntilEnrolled !== undefined ? Boolean(body.blockAccessUntilEnrolled) : false,
      totpIssuer: body.totpIssuer || "MOUAL ERP",
      totpAlgorithm: body.totpAlgorithm || "SHA-1",
      totpDigits: body.totpDigits ? parseInt(body.totpDigits, 10) : 6,
      totpPeriod: body.totpPeriod ? parseInt(body.totpPeriod, 10) : 30,
      totpTolerance: body.totpTolerance ? parseInt(body.totpTolerance, 10) : 1,
      recaptchaEnabled: body.recaptchaEnabled !== undefined ? Boolean(body.recaptchaEnabled) : false,
      recaptchaActions: body.recaptchaActions || { login: true, passwordReset: true, recovery: true },
      recaptchaLoginThreshold: body.recaptchaLoginThreshold !== undefined ? parseFloat(body.recaptchaLoginThreshold) : 0.5,
      recaptchaPasswordResetThreshold: body.recaptchaPasswordResetThreshold !== undefined ? parseFloat(body.recaptchaPasswordResetThreshold) : 0.7,
      recaptchaRecoveryThreshold: body.recaptchaRecoveryThreshold !== undefined ? parseFloat(body.recaptchaRecoveryThreshold) : 0.8,
      ipWhitelistEnabled: body.ipWhitelistEnabled !== undefined ? Boolean(body.ipWhitelistEnabled) : false,
      ipWhitelistMode: body.ipWhitelistMode || "MONITOR_ONLY",
      maxLoginAttempts: body.maxLoginAttempts ? parseInt(body.maxLoginAttempts, 10) : 5,
      lockoutDurationMinutes: body.lockoutDurationMinutes ? parseInt(body.lockoutDurationMinutes, 10) : 15,
      progressiveLockout: body.progressiveLockout !== undefined ? Boolean(body.progressiveLockout) : true,
      rateLimitLogin: body.rateLimitLogin !== undefined ? Boolean(body.rateLimitLogin) : true,
      rateLimitPasswordReset: body.rateLimitPasswordReset !== undefined ? Boolean(body.rateLimitPasswordReset) : true,
      rateLimit2FA: body.rateLimit2FA !== undefined ? Boolean(body.rateLimit2FA) : true,
      notifyAdminOnSuspiciousLogin: body.notifyAdminOnSuspiciousLogin !== undefined ? Boolean(body.notifyAdminOnSuspiciousLogin) : true,
      sessionTimeoutMinutes: body.sessionTimeoutMinutes ? parseInt(body.sessionTimeoutMinutes, 10) : 480,
      idleTimeoutMinutes: body.idleTimeoutMinutes ? parseInt(body.idleTimeoutMinutes, 10) : 30,
      maxConcurrentSessions: body.maxConcurrentSessions ? parseInt(body.maxConcurrentSessions, 10) : 5,
      requireStepUpAuth: body.requireStepUpAuth !== undefined ? Boolean(body.requireStepUpAuth) : true,
      invalidateSessionsOnPasswordChange: body.invalidateSessionsOnPasswordChange !== undefined ? Boolean(body.invalidateSessionsOnPasswordChange) : true,
      invalidateSessionsOn2FAReset: body.invalidateSessionsOn2FAReset !== undefined ? Boolean(body.invalidateSessionsOn2FAReset) : true,
    };

    const updated = await prisma.tenantSecurityPolicy.upsert({
      where: { tenantId },
      update: policyFields,
      create: {
        tenantId,
        ...policyFields,
      },
    });

    // Record audit event
    await SecurityService.logAudit({
      tenantId,
      userId: Number(session.user.id),
      userEmail: session.user.email || undefined,
      eventType: "SECURITY_POLICY_CHANGED",
      action: "Tenant security policies updated",
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
      metadata: {
        twoFactorEnabled: body.twoFactorEnabled,
        ipWhitelistMode: body.ipWhitelistMode,
        recaptchaEnabled: body.recaptchaEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Security policy updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PUT /api/security/policy] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update security policy" },
      { status: 500 }
    );
  }
}
