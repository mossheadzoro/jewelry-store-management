// client/src/app/api/security/2fa/recovery/regenerate/route.ts

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
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Current password is required to regenerate backup codes." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password. Re-authentication failed." }, { status: 403 });
    }

    const newCodes = await SecurityService.regenerateRecoveryCodes(tenantId, userId);

    // Audit event
    await SecurityService.logAudit({
      tenantId,
      userId,
      userEmail: session.user.email || undefined,
      eventType: "RECOVERY_CODES_REGENERATED",
      action: "Regenerated 10 emergency backup recovery codes",
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "New emergency backup recovery codes generated. All previous codes have been invalidated.",
      data: {
        recoveryCodes: newCodes,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/security/2fa/recovery/regenerate] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate recovery codes" },
      { status: 500 }
    );
  }
}
