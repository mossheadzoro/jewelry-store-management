import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUserId = params.id;
  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get("action");
  const roleFilter = searchParams.get("role");
  const search = searchParams.get("search")?.toLowerCase().trim();

  try {
    const whereClause: any = {
      entityId: targetUserId,
      module: {
        in: ["USERS", "STAFF", "SECURITY", "ROLES"],
      },
    };

    if (actionFilter) {
      whereClause.action = actionFilter;
    }

    if (roleFilter) {
      whereClause.roleSnapshot = roleFilter;
    }

    const logs = await prisma.enterpriseAuditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formattedLogs = logs.map((log) => {
      let category = "PROFILE";
      let humanAction = "Profile Modified";

      if (log.action.includes("STAFF_CREATED") || log.action.includes("USER_CREATED")) {
        category = "CREATION";
        humanAction = "Staff Profile Created";
      } else if (log.action.includes("STAFF_UPDATED") || log.action.includes("USER_UPDATED")) {
        category = "PROFILE";
        humanAction = "Profile Details Updated";
      } else if (log.action.includes("STAFF_DELETED")) {
        category = "PROFILE";
        humanAction = "Staff Profile Deleted";
      } else if (log.action.includes("KYC_UPLOADED")) {
        category = "KYC";
        humanAction = "KYC Document Uploaded";
      } else if (log.action.includes("KYC_VERIFIED")) {
        category = "KYC";
        humanAction = "KYC Document Verified & Approved";
      } else if (log.action.includes("KYC_REJECTED")) {
        category = "KYC";
        humanAction = "KYC Document Rejected";
      } else if (log.action.includes("KYC_DELETED")) {
        category = "KYC";
        humanAction = "KYC Document Removed";
      } else if (log.action.includes("SECURITY")) {
        category = "SECURITY";
        humanAction = "Security Policy Changed";
      }

      return {
        id: log.id,
        action: log.action,
        category,
        humanAction,
        description: log.description,
        before: log.before,
        after: log.after,
        changedFields: log.changedFields,
        reason: log.reason,
        performer: {
          id: log.userId,
          name: log.userNameSnapshot || "System Staff",
          role: log.roleSnapshot || "SALESMAN",
          branch: log.branchNameSnapshot,
        },
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        deviceInfo: log.deviceInfo,
        createdAt: log.createdAt,
      };
    });

    let result = formattedLogs;
    if (search) {
      result = result.filter(
        (l) =>
          l.humanAction.toLowerCase().includes(search) ||
          l.description?.toLowerCase().includes(search) ||
          l.performer.name.toLowerCase().includes(search) ||
          (l.reason && l.reason.toLowerCase().includes(search)) ||
          (l.changedFields && l.changedFields.some((f) => f.toLowerCase().includes(search)))
      );
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      totalCount: result.length,
      logs: result,
    });
  } catch (error) {
    console.error("Failed to retrieve staff profile ledger:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile change ledger" },
      { status: 500 }
    );
  }
}
