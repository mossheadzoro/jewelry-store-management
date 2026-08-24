import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
    const actionFilter = url.searchParams.get("action") || "";
    const roleFilter = url.searchParams.get("role") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const where: any = {
      OR: [
        { entityType: "CUSTOMER", entityId: String(customerId) },
        { module: "CUSTOMERS", entityId: String(customerId) },
      ],
    };

    if (actionFilter) {
      where.action = actionFilter;
    }

    if (roleFilter) {
      where.roleSnapshot = roleFilter;
    }

    const [rawLogs, totalCount] = await Promise.all([
      prisma.enterpriseAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enterpriseAuditLog.count({ where }),
    ]);

    // Format logs for rich client presentation
    const formattedLogs = rawLogs
      .filter((log) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          log.description?.toLowerCase().includes(q) ||
          log.userNameSnapshot?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q) ||
          log.reason?.toLowerCase().includes(q) ||
          log.changedFields?.some((f) => f.toLowerCase().includes(q))
        );
      })
      .map((log) => {
        let actionCategory = "PROFILE";
        let actionBadgeColor = "blue";
        let humanAction = "Profile Updated";

        if (log.action.includes("CREATED")) {
          actionCategory = "CREATION";
          actionBadgeColor = "emerald";
          humanAction = "Profile Created";
        } else if (log.action.includes("DELETED")) {
          actionCategory = "DELETION";
          actionBadgeColor = "rose";
          humanAction = "Profile Deleted";
        } else if (log.action.includes("KYC")) {
          actionCategory = "KYC";
          if (log.action.includes("VERIFIED")) {
            actionBadgeColor = "emerald";
            humanAction = "KYC Document Verified";
          } else if (log.action.includes("REJECTED")) {
            actionBadgeColor = "rose";
            humanAction = "KYC Document Rejected";
          } else if (log.action.includes("DELETED")) {
            actionBadgeColor = "amber";
            humanAction = "KYC Document Removed";
          } else if (log.action.includes("LINK")) {
            actionBadgeColor = "violet";
            humanAction = "KYC Link Generated";
          } else {
            actionBadgeColor = "indigo";
            humanAction = "KYC Document Uploaded";
          }
        } else if (log.action.includes("TAGS")) {
          actionCategory = "TAGS";
          actionBadgeColor = "purple";
          humanAction = "Tags Assigned / Changed";
        } else if (log.action.includes("COMMUNICATION")) {
          actionCategory = "COMMUNICATION";
          actionBadgeColor = "amber";
          humanAction = "Direct Message Sent";
        }

        return {
          id: log.id,
          action: log.action,
          humanAction,
          actionCategory,
          actionBadgeColor,
          description: log.description,
          reason: log.reason,
          before: log.before,
          after: log.after,
          changedFields: log.changedFields || [],
          performer: {
            userId: log.userId,
            name: log.userNameSnapshot || "System Staff",
            role: log.roleSnapshot || "SALESMAN",
            branchName: log.branchNameSnapshot,
          },
          status: log.status,
          severity: log.severity,
          ipAddress: log.ipAddress,
          deviceInfo: log.deviceInfo,
          createdAt: log.createdAt,
          metadata: log.metadata,
        };
      });

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err) {
    console.error("[CustomerProfileLedger] Error querying ledger:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer profile ledger" },
      { status: 500 }
    );
  }
}
