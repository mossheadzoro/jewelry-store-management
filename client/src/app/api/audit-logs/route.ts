// client/src/app/api/audit-logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Permission check: ADMIN, MANAGER, or authorized role
  const userRole = session.user.role || "SALESMAN";
  if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. Insufficient audit permissions." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = "default-tenant";

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const moduleParam = searchParams.get("module") || undefined;
    const action = searchParams.get("action") || undefined;
    const status = searchParams.get("status") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const isSecurityEvent = searchParams.get("isSecurityEvent") === "true" ? true : undefined;
    const userId = searchParams.get("userId") ? parseInt(searchParams.get("userId")!, 10) : undefined;
    const role = searchParams.get("role") || undefined;
    const branchId = searchParams.get("branchId") ? parseInt(searchParams.get("branchId")!, 10) : undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const data = await AuditLogService.queryLogs({
      tenantId,
      page,
      limit,
      search,
      module: moduleParam,
      action,
      status,
      severity,
      isSecurityEvent,
      userId,
      role,
      branchId,
      entityType,
      entityId,
      from,
      to,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query audit logs" },
      { status: 500 }
    );
  }
}
