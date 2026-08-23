// client/src/app/api/audit-logs/metrics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "SALESMAN";
  if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ? parseInt(searchParams.get("branchId")!, 10) : undefined;
    const tenantId = "default-tenant";

    const metrics = await AuditLogService.getAuditMetrics(tenantId, branchId);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs/metrics] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit metrics" },
      { status: 500 }
    );
  }
}
