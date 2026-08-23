// client/src/app/api/audit-logs/export/route.ts

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
    return NextResponse.json({ error: "Access denied. Insufficient export permissions." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = "default-tenant";

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

    const csvData = await AuditLogService.exportLogs(
      {
        tenantId,
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
      },
      Number(session.user.id),
      session.user.email || undefined
    );

    const filename = `MOUAL_ERP_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs/export] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
