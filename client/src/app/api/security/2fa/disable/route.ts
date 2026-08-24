// client/src/app/api/security/2fa/disable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
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
    const { password, totpCode } = body;

    // Check tenant policy
    const policy = await SecurityService.getTenantPolicy(tenantId);
    const requirement = await SecurityService.isTwoFactorRequired(tenantId, userId, session.user.role);

    // If 2FA is mandatory by role and policy doesn't allow user disable
    if (requirement.required && requirement.reason === "MANDATORY_ROLE_POLICY" && !policy.allowUserDisable2FA && session.user.role !== "ADMIN") {
      return NextResponse.json({
        error: "Two-Factor Authentication is mandatory for your role by store security policy. You cannot disable it.",
      }, { status: 403 });
    }

    if (!password) {
      return NextResponse.json({ error: "Current password is required to disable 2FA." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password. Authorization failed." }, { status: 403 });
    }

    // Disable 2FA
    await prisma.userSecurity.updateMany({
      where: { userId },
      data: {
        twoFactorEnabled: false,
        totpSecretEncrypted: null,
        totpEnabledAt: null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });

    // Invalidate recovery codes
    await prisma.recoveryCode.deleteMany({
      where: { tenantId, userId },
    });

    // Invalidate trusted devices if configured
    await prisma.trustedDevice.deleteMany({
      where: { tenantId, userId },
    });

    // Audit event
    await SecurityService.logAudit({
      tenantId,
      userId,
      userEmail: session.user.email || undefined,
      eventType: "2FA_DISABLED",
      action: "Two-Factor Authentication was disabled",
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication has been disabled.",
    });
  } catch (error: any) {
    console.error("[POST /api/security/2fa/disable] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
