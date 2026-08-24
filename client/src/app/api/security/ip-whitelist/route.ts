// client/src/app/api/security/ip-whitelist/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { SecurityService } from "@/lib/security/SecurityService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branchId");
    const tenantId = "default-tenant";

    const where: any = { tenantId };
    if (branchIdParam) {
      const bId = parseInt(branchIdParam, 10);
      where.OR = [{ branchId: null }, { branchId: 0 }, { branchId: bId }];
    }

    const rules = await prisma.ipWhitelistRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const clientIp = SecurityService.getClientIp(req);
    const evaluation = await SecurityService.evaluateIpAccess(
      tenantId,
      clientIp,
      session.user.role,
      branchIdParam ? parseInt(branchIdParam, 10) : undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        rules,
        currentClientIp: clientIp,
        evaluation,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/security/ip-whitelist] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch IP whitelist" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ipCidr, description, branchId, appliesToRoles, status } = body;
    const tenantId = "default-tenant";

    if (!ipCidr || !SecurityService.isValidIpOrCidr(ipCidr)) {
      return NextResponse.json({
        error: "Invalid IP address or CIDR subnet format. Example: 103.25.10.15 or 103.25.10.0/24",
      }, { status: 400 });
    }

    const cleanIpCidr = ipCidr.trim();

    // Check duplicate
    const existing = await prisma.ipWhitelistRule.findFirst({
      where: {
        tenantId,
        ipCidr: cleanIpCidr,
        branchId: branchId ? parseInt(branchId, 10) : null,
      },
    });

    if (existing) {
      return NextResponse.json({
        error: `An IP rule for ${cleanIpCidr} already exists for this branch.`,
      }, { status: 409 });
    }

    const rule = await prisma.ipWhitelistRule.create({
      data: {
        tenantId,
        ipCidr: cleanIpCidr,
        description: description?.trim() || "Store Network Access",
        branchId: branchId ? parseInt(branchId, 10) : null,
        appliesToRoles: Array.isArray(appliesToRoles) ? appliesToRoles : [],
        status: status || "ACTIVE",
        createdById: Number(session.user.id),
      },
    });

    // Audit event
    await SecurityService.logAudit({
      tenantId,
      userId: Number(session.user.id),
      userEmail: session.user.email || undefined,
      eventType: "IP_ADDED",
      action: `Added IP whitelist rule: ${cleanIpCidr}`,
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
      metadata: { ipCidr: cleanIpCidr, description, branchId },
    });

    return NextResponse.json({
      success: true,
      message: `Allowed IP rule ${cleanIpCidr} added successfully.`,
      data: rule,
    });
  } catch (error: any) {
    console.error("[POST /api/security/ip-whitelist] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create IP whitelist rule" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ipCidr, description, branchId, appliesToRoles, status } = body;
    const tenantId = "default-tenant";

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required." }, { status: 400 });
    }

    // Emergency lockout check if disabling rule
    if (status === "DISABLED") {
      const clientIp = SecurityService.getClientIp(req);
      const lockoutCheck = await SecurityService.checkLockoutRisk(tenantId, clientIp, id);
      if (lockoutCheck.hasRisk) {
        return NextResponse.json({ error: lockoutCheck.message }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (ipCidr && SecurityService.isValidIpOrCidr(ipCidr)) updateData.ipCidr = ipCidr.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (branchId !== undefined) updateData.branchId = branchId ? parseInt(branchId, 10) : null;
    if (appliesToRoles !== undefined) updateData.appliesToRoles = Array.isArray(appliesToRoles) ? appliesToRoles : [];
    if (status) updateData.status = status;

    const updated = await prisma.ipWhitelistRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "IP whitelist rule updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PUT /api/security/ip-whitelist] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update IP whitelist rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const tenantId = "default-tenant";

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required." }, { status: 400 });
    }

    // Emergency Lockout Prevention
    const clientIp = SecurityService.getClientIp(req);
    const lockoutCheck = await SecurityService.checkLockoutRisk(tenantId, clientIp, id);
    if (lockoutCheck.hasRisk) {
      return NextResponse.json({ error: lockoutCheck.message }, { status: 400 });
    }

    const deleted = await prisma.ipWhitelistRule.delete({
      where: { id },
    });

    // Audit event
    await SecurityService.logAudit({
      tenantId,
      userId: Number(session.user.id),
      userEmail: session.user.email || undefined,
      eventType: "IP_REMOVED",
      action: `Deleted IP whitelist rule: ${deleted.ipCidr}`,
      success: true,
      ipAddress: clientIp,
      userAgent: req.headers.get("user-agent") || undefined,
      metadata: { id, ipCidr: deleted.ipCidr },
    });

    return NextResponse.json({
      success: true,
      message: `Allowed IP rule ${deleted.ipCidr} removed successfully.`,
    });
  } catch (error: any) {
    console.error("[DELETE /api/security/ip-whitelist] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete IP whitelist rule" },
      { status: 500 }
    );
  }
}
