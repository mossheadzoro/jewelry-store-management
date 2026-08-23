// client/src/app/api/audit-logs/technical/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@libs/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "SALESMAN";
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const tenantId = "default-tenant";

    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (search.trim()) {
      where.OR = [
        { route: { contains: search.trim(), mode: "insensitive" } },
        { requestId: { contains: search.trim(), mode: "insensitive" } },
        { ipAddress: { contains: search.trim(), mode: "insensitive" } },
        { userNameSnapshot: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.technicalRequestLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.technicalRequestLog.count({ where }),
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
    console.error("[GET /api/audit-logs/technical] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch technical request logs" },
      { status: 500 }
    );
  }
}
