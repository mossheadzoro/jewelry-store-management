import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Generate unique secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    const uploadToken = await prisma.kycUploadToken.create({
      data: {
        customerId,
        token,
        expiresAt,
      },
    });

    // Record Business Audit Event
    try {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.CUSTOMERS,
        action: AuditActions.KYC_LINK_GENERATED,
        entityType: "CUSTOMER",
        entityId: String(customerId),
        entityDisplayName: customer.name,
        description: `Generated secure 24-hour self-service KYC upload link for ${customer.name}`,
        context: {
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          userNameSnapshot: session?.user?.name || "Staff Member",
          roleSnapshot: session?.user?.role || "SALESMAN",
          branchId: session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined,
        },
        metadata: {
          tokenId: uploadToken.id,
          expiresAt: uploadToken.expiresAt,
        },
      });
    } catch (auditErr) {
      console.error("[KycGenerateLink] Failed to record audit log:", auditErr);
    }

    return NextResponse.json({
      success: true,
      token: uploadToken.token,
      expiresAt: uploadToken.expiresAt,
    });
  } catch (err) {
    console.error("Error generating KYC upload token:", err);
    return NextResponse.json({ error: "Server error generating upload link" }, { status: 500 });
  }
}

