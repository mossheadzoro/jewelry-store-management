// client/src/app/api/audit-logs/retention/route.ts

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
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
  }

  try {
    const tenantId = "default-tenant";
    const policy = await AuditLogService.getRetentionPolicy(tenantId);

    return NextResponse.json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error("[GET /api/audit-logs/retention] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit retention policy" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "SALESMAN";
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const tenantId = "default-tenant";

    const updated = await AuditLogService.updateRetentionPolicy(tenantId, body);

    return NextResponse.json({
      success: true,
      message: "Audit retention policy updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PUT /api/audit-logs/retention] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update audit retention policy" },
      { status: 500 }
    );
  }
}
