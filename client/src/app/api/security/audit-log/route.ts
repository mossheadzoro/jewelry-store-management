// client/src/app/api/security/audit-log/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@libs/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized. Admin or Manager access required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const eventType = searchParams.get("eventType") || "ALL";
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId");
    const tenantId = "default-tenant";

    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (eventType !== "ALL") {
      where.eventType = eventType;
    }

    if (branchId) {
      where.branchId = parseInt(branchId, 10);
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { userEmail: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { ipAddress: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error("[GET /api/security/audit-log] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch security audit logs" },
      { status: 500 }
    );
  }
}
