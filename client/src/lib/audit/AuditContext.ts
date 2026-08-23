// client/src/lib/audit/AuditContext.ts
// Context extractor for Enterprise Audit Logging

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { SecurityService } from "@/lib/security/SecurityService";
import { prisma } from "@libs/prisma";

export interface AuditRequestContext {
  tenantId: string;
  userId?: number;
  userNameSnapshot?: string;
  roleSnapshot?: string;
  branchId?: number;
  branchNameSnapshot?: string;
  ipAddress: string;
  userAgent?: string;
  deviceInfo?: string;
  requestId: string;
  correlationId?: string;
}

export class AuditContext {
  /**
   * Automatically derives the authoritative audit request context from session & request.
   */
  public static async extract(
    req?: NextRequest | Request | any,
    manualContext?: Partial<AuditRequestContext>
  ): Promise<AuditRequestContext> {
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch {
      // Background / unauthenticated call
    }

    const clientIp = req ? SecurityService.getClientIp(req) : "127.0.0.1";
    let userAgent = "";
    if (req?.headers) {
      if (typeof req.headers.get === "function") {
        userAgent = req.headers.get("user-agent") || "";
      } else if (req.headers["user-agent"]) {
        userAgent = req.headers["user-agent"];
      }
    }

    const requestId =
      manualContext?.requestId ||
      (req?.headers && typeof req.headers.get === "function" ? req.headers.get("x-request-id") : null) ||
      `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const correlationId =
      manualContext?.correlationId ||
      (req?.headers && typeof req.headers.get === "function" ? req.headers.get("x-correlation-id") : null) ||
      requestId;

    let userId = manualContext?.userId || (session?.user?.id ? parseInt(session.user.id, 10) : undefined);
    let userNameSnapshot = manualContext?.userNameSnapshot || session?.user?.name || undefined;
    let roleSnapshot = manualContext?.roleSnapshot || session?.user?.role || undefined;
    let branchId = manualContext?.branchId || (session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined);
    let branchNameSnapshot = manualContext?.branchNameSnapshot || undefined;

    // Fetch branch name snapshot if branchId is present and branchNameSnapshot missing
    if (branchId && !branchNameSnapshot) {
      try {
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          select: { name: true },
        });
        if (branch) {
          branchNameSnapshot = branch.name;
        }
      } catch {
        // Fallback
      }
    }

    // Determine device info from userAgent
    let deviceInfo = "Web Browser";
    if (userAgent) {
      if (/mobile/i.test(userAgent)) deviceInfo = "Mobile Device";
      else if (/tablet/i.test(userAgent)) deviceInfo = "Tablet Device";
      else if (/windows/i.test(userAgent)) deviceInfo = "Windows Desktop";
      else if (/macintosh|mac os/i.test(userAgent)) deviceInfo = "macOS Desktop";
      else if (/linux/i.test(userAgent)) deviceInfo = "Linux Workstation";
    }

    return {
      tenantId: manualContext?.tenantId || "default-tenant",
      userId,
      userNameSnapshot,
      roleSnapshot,
      branchId,
      branchNameSnapshot,
      ipAddress: clientIp,
      userAgent: userAgent.slice(0, 255),
      deviceInfo,
      requestId,
      correlationId,
    };
  }
}
