// client/src/app/api/security/2fa/devices/[id]/route.ts
// Revoke / Delete a specific trusted device

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { SecurityService } from "@/lib/security/SecurityService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = Number(session.user.id);
    const tenantId = "default-tenant";

    if (!id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
    }

    // Find the device
    const device = await prisma.trustedDevice.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json({ error: "Trusted device not found" }, { status: 404 });
    }

    // Only allow device owner or ADMIN / SUPER_ADMIN to delete
    const isOwner = device.userId === userId;
    const isAdmin = (session.user.role as string) === "ADMIN" || (session.user.role as string) === "SUPER_ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this device" }, { status: 403 });
    }

    await prisma.trustedDevice.delete({
      where: { id },
    });

    await SecurityService.logAudit({
      tenantId,
      userId,
      userEmail: session.user.email || undefined,
      eventType: "TRUSTED_DEVICE_REVOKED",
      action: `Trusted device '${device.deviceName}' revoked`,
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
      metadata: {
        revokedDeviceId: id,
        revokedDeviceName: device.deviceName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Trusted device successfully revoked.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/security/2fa/devices/[id]] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke trusted device" },
      { status: 500 }
    );
  }
}
