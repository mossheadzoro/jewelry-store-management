// client/src/app/api/purchase/gst/periods/route.ts
// Monthly GST Period Management & Snapshot Locking API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchaseGSTService } from "@/lib/services/purchase/PurchaseGSTService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;

    const where: any = {};
    if (branchId) where.branchId = branchId;

    const periods = await prisma.purchaseGSTPeriod.findMany({
      where,
      include: {
        lockedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    });

    return NextResponse.json({ success: true, data: periods });
  } catch (error: any) {
    console.error("Get GST periods error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch GST periods" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden: Only Admin or Manager can manage GST periods." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      branchId = auth.branchId || 1,
      financialYear,
      periodMonth,
      periodYear,
      status = "LOCKED",
      notes,
    } = body;

    if (!financialYear || !periodMonth || !periodYear) {
      return NextResponse.json(
        { error: "financialYear, periodMonth, and periodYear are required" },
        { status: 400 }
      );
    }

    const period = await PurchaseGSTService.setPeriodStatus({
      branchId: Number(branchId),
      financialYear,
      periodMonth: Number(periodMonth),
      periodYear: Number(periodYear),
      status,
      notes,
      actorId: parseInt(auth.session.user.id, 10),
      reqContext: {
        userId: parseInt(auth.session.user.id, 10),
        userEmail: auth.session.user.email,
        role: auth.user.systemRole,
      },
    });

    return NextResponse.json({ success: true, data: period });
  } catch (error: any) {
    console.error("Set GST period status error:", error);
    return NextResponse.json({ error: error.message || "Failed to update GST period" }, { status: 500 });
  }
}
