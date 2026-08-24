// client/src/app/api/security/sessions/route.ts

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
    const isAdmin = session.user.role === "ADMIN";

    // Query active sessions (not expired and not revoked)
    const sessions = await prisma.userSessionRecord.findMany({
      where: {
        tenantId,
        ...(isAdmin ? {} : { userId }),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      take: 50,
    });

    const clientIp = SecurityService.getClientIp(req);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        currentIp: clientIp,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/security/sessions] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch active sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = Number(session.user.id);
    const tenantId = "default-tenant";
    const isAdmin = session.user.role === "ADMIN";

    if (!id) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const sessionRecord = await prisma.userSessionRecord.findUnique({
      where: { id },
    });

    if (!sessionRecord || sessionRecord.tenantId !== tenantId) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (!isAdmin && sessionRecord.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized to revoke this session." }, { status: 403 });
    }

    await prisma.userSessionRecord.update({
      where: { id },
      data: { isRevoked: true },
    });

    // Audit event
    await SecurityService.logAudit({
      tenantId,
      userId,
      userEmail: session.user.email || undefined,
      eventType: "SESSION_REVOKED",
      action: `Revoked session ${id} for user ${sessionRecord.userId}`,
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Session successfully revoked.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/security/sessions] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, currentSessionId } = body;
    const userId = Number(session.user.id);
    const tenantId = "default-tenant";

    if (action === "REVOKE_ALL_OTHER") {
      await prisma.userSessionRecord.updateMany({
        where: {
          tenantId,
          userId,
          isRevoked: false,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: { isRevoked: true },
      });

      // Audit event
      await SecurityService.logAudit({
        tenantId,
        userId,
        userEmail: session.user.email || undefined,
        eventType: "ALL_SESSIONS_REVOKED",
        action: "Revoked all other active login sessions",
        success: true,
        ipAddress: SecurityService.getClientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json({
        success: true,
        message: "All other sessions have been successfully revoked.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/security/sessions] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process session request" },
      { status: 500 }
    );
  }
}
