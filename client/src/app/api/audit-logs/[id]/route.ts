// client/src/app/api/audit-logs/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "SALESMAN";
  if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  try {
    const { id } = params;
    const tenantId = "default-tenant";

    const log = await prisma.enterpriseAuditLog.findUnique({
      where: { id },
    });

    if (!log || log.tenantId !== tenantId) {
      return NextResponse.json({ error: "Audit record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs/:id] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit log detail" },
      { status: 500 }
    );
  }
}
