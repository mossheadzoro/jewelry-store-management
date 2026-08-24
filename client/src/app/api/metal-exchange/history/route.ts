import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branchId");
    const search = searchParams.get("search")?.trim() || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") || "all"; // all, closed, active
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Branch filter
    if (branchIdParam && branchIdParam !== "all") {
      const bId = parseInt(branchIdParam, 10);
      if (!isNaN(bId)) {
        where.branchId = bId;
      }
    }

    // Status filter
    if (status === "closed") {
      where.isClosed = true;
    } else if (status === "active") {
      where.isClosed = false;
    }

    // Date range filter (based on session date or createdAt)
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Search query filter
    if (search) {
      where.OR = [
        { sessionNumber: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        {
          items: {
            some: {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
                { customer: { name: { contains: search, mode: "insensitive" } } },
                { customer: { mobile: { contains: search } } },
              ],
            },
          },
        },
      ];
    }

    // 1. Fetch total count
    const totalCount = await prisma.metalExchangeSession.count({ where });

    // 2. Fetch sessions with items, customer, branch, createdBy, and audits
    const sessions = await prisma.metalExchangeSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                mobile: true,
                city: true,
                address: true,
                gstin: true,
                pan: true,
              },
            },
          },
        },
        MetalExchangeAudit: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 3. Collect authorizer names if authorizedBy ID exists
    const authorizerIds = [
      ...new Set(
        sessions.map((s) => s.authorizedBy).filter((id): id is number => typeof id === "number")
      ),
    ];

    const authorizers = authorizerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: authorizerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const authorizerMap = Object.fromEntries(authorizers.map((u) => [u.id, u.name]));

    // Format sessions for frontend
    const formattedSessions = sessions.map((s) => {
      // Calculate item aggregates for session
      const itemsList = s.items.map((item, index) => {
        const remainingLoss =
          item.lossWeight != null
            ? item.lossWeight
            : item.weightAfter != null
            ? Number((item.weightBefore - item.weightAfter).toFixed(3))
            : 0;

        const calculatedFine =
          item.fineGold != null
            ? item.fineGold
            : item.weightAfter != null && item.purityPercent != null
            ? Number(((item.weightAfter * item.purityPercent) / 100).toFixed(3))
            : 0;

        const tonchValue =
          item.tonch != null
            ? item.tonch
            : item.purityPercent != null
            ? Number((item.purityPercent / 100).toFixed(4))
            : null;

        return {
          id: item.id,
          queueId: `${s.sessionNumber}-${index + 1}`,
          customerId: item.customerId,
          customer: item.customer,
          customerName: item.customer?.name || "Unknown Customer",
          customerPhone: item.customer?.mobile || "—",
          customerCity: item.customer?.city || "",
          description: item.description || "Old Metal Item",
          metalType: item.metalType,
          weightBefore: item.weightBefore,
          weightAfter: item.weightAfter,
          lossWeight: remainingLoss,
          purityPercent: item.purityPercent,
          tonch: tonchValue,
          fineGold: calculatedFine,
          status: item.status,
          isLocked: item.isLocked,
          notes: item.notes,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      });

      const totalItems = itemsList.length;
      const totalWeightBefore = itemsList.reduce((acc, i) => acc + (i.weightBefore || 0), 0);
      const totalWeightAfter = itemsList.reduce((acc, i) => acc + (i.weightAfter || 0), 0);
      const totalLoss = itemsList.reduce((acc, i) => acc + (i.lossWeight || 0), 0);
      const sessionFineGold = itemsList
        .filter((i) => i.metalType === "GOLD")
        .reduce((acc, i) => acc + (i.fineGold || 0), 0);
      const sessionFineSilver = itemsList
        .filter((i) => i.metalType === "SILVER")
        .reduce((acc, i) => acc + (i.fineGold || 0), 0);

      return {
        id: s.id,
        sessionNumber: s.sessionNumber,
        date: s.date,
        createdAt: s.createdAt,
        closedAt: s.closedAt,
        isClosed: s.isClosed,
        status: s.isClosed ? "CLOSED" : "ACTIVE",
        branchId: s.branchId,
        branchName: s.branch?.name || "Main Branch",
        branchCity: s.branch?.city || "",
        createdById: s.createdById,
        createdByName: s.createdBy?.name || "System",
        authorizedById: s.authorizedBy,
        authorizedByName: s.authorizedBy ? authorizerMap[s.authorizedBy] || "Authorized User" : null,
        remarks: s.remarks,
        totalItems,
        totalWeightBefore: Number(totalWeightBefore.toFixed(3)),
        totalWeightAfter: Number(totalWeightAfter.toFixed(3)),
        totalLoss: Number(totalLoss.toFixed(3)),
        fineGold: Number((s.fineGold || sessionFineGold).toFixed(3)),
        fineSilver: Number((s.fineSilver || sessionFineSilver).toFixed(3)),
        items: itemsList,
        auditLogs: s.MetalExchangeAudit.map((a) => ({
          id: a.id,
          action: a.action,
          performedByName: a.performedBy?.name || "Staff",
          createdAt: a.createdAt,
          metadata: a.metadata,
        })),
      };
    });

    // 4. Calculate overall summary aggregates across all matched sessions
    const aggregateData = await prisma.metalExchangeSession.aggregate({
      where,
      _sum: {
        totalWeightBefore: true,
        totalWeightAfter: true,
        fineGold: true,
        fineSilver: true,
        totalItems: true,
      },
    });

    // Also calculate total items and total loss across all matched items
    const allMatchedItems = await prisma.metalExchangeItem.findMany({
      where: {
        session: where,
      },
      select: {
        weightBefore: true,
        weightAfter: true,
        lossWeight: true,
        fineGold: true,
        metalType: true,
      },
    });

    const overallGrossWeight = allMatchedItems.reduce((sum, item) => sum + (item.weightBefore || 0), 0);
    const overallWeightAfter = allMatchedItems.reduce((sum, item) => sum + (item.weightAfter || 0), 0);
    const overallLossWeight = allMatchedItems.reduce((sum, item) => {
      if (item.lossWeight != null) return sum + item.lossWeight;
      if (item.weightAfter != null) return sum + (item.weightBefore - item.weightAfter);
      return sum;
    }, 0);
    const overallFineGold = allMatchedItems
      .filter((i) => i.metalType === "GOLD")
      .reduce((sum, item) => sum + (item.fineGold || 0), 0);
    const overallFineSilver = allMatchedItems
      .filter((i) => i.metalType === "SILVER")
      .reduce((sum, item) => sum + (item.fineGold || 0), 0);

    const summary = {
      totalSessions: totalCount,
      totalItems: allMatchedItems.length,
      grossWeightBefore: Number(overallGrossWeight.toFixed(3)),
      totalWeightAfter: Number(overallWeightAfter.toFixed(3)),
      totalLossWeight: Number(overallLossWeight.toFixed(3)),
      totalFineGold: Number(overallFineGold.toFixed(3)),
      totalFineSilver: Number(overallFineSilver.toFixed(3)),
    };

    return NextResponse.json({
      sessions: formattedSessions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      summary,
    });
  } catch (error: any) {
    console.error("Error fetching metal exchange history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch metal exchange history" },
      { status: 500 }
    );
  }
}
