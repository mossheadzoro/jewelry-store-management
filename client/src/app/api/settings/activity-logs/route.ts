import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const moduleStr = searchParams.get("module");
    const action = searchParams.get("action");
    const branchId = searchParams.get("branchId");
    
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let whereClause: any = {};
    if (userId) whereClause.userId = parseInt(userId, 10);
    if (moduleStr) whereClause.module = moduleStr;
    if (action) whereClause.action = action;
    if (branchId) whereClause.branchId = parseInt(branchId, 10);
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    if (session.user.role === "MANAGER") {
       const managerBranchId = session.user.branchId ? parseInt(session.user.branchId, 10) : null;
       whereClause.branchId = managerBranchId;
    }

    const logs = await prisma.userActivityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, systemRole: true, role: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, module, metadata } = body;
    
    const log = await prisma.userActivityLog.create({
      data: {
        userId: parseInt(session.user.id, 10),
        branchId: session.user.branchId ? parseInt(session.user.branchId, 10) : null,
        action,
        module,
        metadata: metadata || {}
      }
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
