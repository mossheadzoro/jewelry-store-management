// client/src/app/api/security/challenge/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SecurityService } from "@/lib/security/SecurityService";
import { SecurityCrypto } from "@/lib/security/SecurityCrypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, recaptchaToken } = body;
    const clientIp = SecurityService.getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "";
    const tenantId = "default-tenant";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // 1. Rate Limit Check (5 attempts per 15 min per IP)
    const rateLimit = SecurityService.checkRateLimit(`login:${clientIp}`, 5, 900000);
    if (!rateLimit.allowed) {
      const waitMins = Math.ceil(((rateLimit.lockedUntil || Date.now()) - Date.now()) / 60000);
      await SecurityService.logAudit({
        tenantId,
        userEmail: email,
        eventType: "LOGIN_BLOCKED",
        action: "Login blocked by progressive rate limiter",
        success: false,
        reason: `Exceeded max failed login attempts from IP ${clientIp}`,
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json({
        error: `Too many login attempts. Access temporarily locked for ${waitMins} minute(s).`,
      }, { status: 429 });
    }

    // 2. reCAPTCHA Verification
    const recaptchaResult = await SecurityService.verifyRecaptcha(
      tenantId,
      recaptchaToken,
      "login",
      clientIp
    );

    if (!recaptchaResult.success) {
      return NextResponse.json({
        error: recaptchaResult.error || "Security verification failed. Please try again.",
      }, { status: 400 });
    }

    // 3. User & Credential Lookup
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { userSecurity: true },
    });

    if (!user || !user.password) {
      // Record failed attempt
      await SecurityService.logAudit({
        tenantId,
        userEmail: email,
        eventType: "LOGIN_FAILED",
        action: "Failed login attempt (user not found)",
        success: false,
        reason: "Invalid email address entered",
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await SecurityService.logAudit({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        branchId: user.branchId || undefined,
        eventType: "LOGIN_FAILED",
        action: "Failed login attempt (invalid password)",
        success: false,
        reason: "Password comparison mismatch",
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 4. IP Whitelist Access Check
    const ipCheck = await SecurityService.evaluateIpAccess(
      tenantId,
      clientIp,
      user.systemRole,
      user.branchId || undefined
    );

    if (!ipCheck.allowed) {
      await SecurityService.logAudit({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        branchId: user.branchId || undefined,
        eventType: "IP_BLOCKED",
        action: "Login blocked by store IP whitelist access policy",
        success: false,
        reason: ipCheck.reason || "IP not permitted",
        ipAddress: clientIp,
        userAgent,
        metadata: { clientIp, mode: ipCheck.mode },
      });

      return NextResponse.json({
        error: "Access from this network is not permitted by store IP policy. Contact your administrator.",
      }, { status: 403 });
    }

    // 5. Evaluate 2FA requirement (with Trusted Device bypass support)
    const rawDeviceToken =
      req.cookies.get("moual_trusted_device")?.value ||
      req.headers.get("x-trusted-device-token") ||
      body.trustedDeviceToken ||
      null;

    const twoFactorReq = await SecurityService.isTwoFactorRequired(
      tenantId,
      user.id,
      user.systemRole,
      rawDeviceToken
    );

    // If 2FA is enabled or required for role (and not bypassed by trusted device)
    if (twoFactorReq.required) {
      // Create 5-minute single-use challenge token
      const challengeToken = SecurityCrypto.generateSecureToken(32);
      await prisma.securityChallenge.create({
        data: {
          tenantId,
          userId: user.id,
          challengeToken,
          purpose: "2FA_LOGIN",
          expiresAt: new Date(Date.now() + 300000), // 5 minutes
          used: false,
        },
      });

      return NextResponse.json({
        success: true,
        requires2FA: true,
        challengeToken,
        userEnrolled: twoFactorReq.userEnrolled,
        email: user.email,
        name: user.name,
      });
    }

    // Reset rate limit on successful credentials with no 2FA
    SecurityService.resetRateLimit(`login:${clientIp}`);

    // Audit successful login
    await SecurityService.logAudit({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      branchId: user.branchId || undefined,
      eventType: "LOGIN_SUCCESS",
      action: twoFactorReq.trustedDeviceBypassed
        ? "User logged in successfully (2FA bypassed via trusted device)"
        : "User logged in successfully (Single-factor)",
      success: true,
      ipAddress: clientIp,
      userAgent,
      metadata: {
        trustedDeviceBypassed: Boolean(twoFactorReq.trustedDeviceBypassed),
      },
    });

    return NextResponse.json({
      success: true,
      requires2FA: false,
      trustedDeviceBypassed: Boolean(twoFactorReq.trustedDeviceBypassed),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.systemRole,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/security/challenge] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process login challenge" },
      { status: 500 }
    );
  }
}
