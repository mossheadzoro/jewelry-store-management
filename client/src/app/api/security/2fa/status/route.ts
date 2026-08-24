// client/src/app/api/security/2fa/status/route.ts

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
    const userId = Number(session.user.id);
    const tenantId = "default-tenant";

    const userSecurity = await prisma.userSecurity.findUnique({
      where: { userId },
    });

    const recoveryCount = await prisma.recoveryCode.count({
      where: { tenantId, userId, used: false },
    });

    const policy = await SecurityService.getTenantPolicy(tenantId);
    const requirement = await SecurityService.isTwoFactorRequired(
      tenantId,
      userId,
      session.user.role || "SALESMAN"
    );

    const trustedDevices = await prisma.trustedDevice.findMany({
      where: {
        tenantId,
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceName: true,
        browser: true,
        ipAddress: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        twoFactorEnabled: Boolean(userSecurity?.twoFactorEnabled),
        twoFactorMethod: userSecurity?.twoFactorMethod || "TOTP",
        totpEnabledAt: userSecurity?.totpEnabledAt || null,
        lastTwoFactorVerifiedAt: userSecurity?.lastTwoFactorVerifiedAt || null,
        recoveryCodesRemaining: recoveryCount,
        isPolicyMandatory: requirement.required,
        policyReason: requirement.reason,
        allowUserDisable: policy.allowUserDisable2FA,
        trustedDevices,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/security/2fa/status] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch 2FA status" },
      { status: 500 }
    );
  }
}
