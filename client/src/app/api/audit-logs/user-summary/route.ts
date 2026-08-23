// client/src/app/api/audit-logs/user-summary/route.ts

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
    const userId = searchParams.get("userId") ? parseInt(searchParams.get("userId")!, 10) : Number(session.user.id);
    const tenantId = "default-tenant";

    const summary = await AuditLogService.queryUserActivity(tenantId, userId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs/user-summary] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user activity summary" },
      { status: 500 }
    );
  }
}
