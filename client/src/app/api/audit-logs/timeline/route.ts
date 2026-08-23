// client/src/app/api/audit-logs/timeline/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const tenantId = "default-tenant";

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
    }

    const timeline = await AuditLogService.queryEntityTimeline(tenantId, entityType, entityId);

    return NextResponse.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs/timeline] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch entity timeline" },
      { status: 500 }
    );
  }
}
