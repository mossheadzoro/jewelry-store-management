// src/app/api/returns/reports/route.ts
// Return & Exchange Analytics and Registers API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "") || auth.branchId || auth.user.branchId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const baseWhere: any = {};
    if (branchId && auth.user.systemRole !== "ADMIN") {
      baseWhere.branchId = branchId;
    }

    const [
      pendingApprovalCount,
      completedReturnsToday,
      completedExchangesToday,
      totalCreditNotesCount,
      policyOverridesCount,
      totalTransactions,
      recentTransactions,
      taxDocuments,
    ] = await Promise.all([
      prisma.returnExchangeTransaction.count({
        where: { ...baseWhere, status: "PENDING_APPROVAL" },
      }),
      prisma.returnExchangeTransaction.count({
        where: {
          ...baseWhere,
          transactionType: "RETURN",
          status: "COMPLETED",
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.returnExchangeTransaction.count({
        where: {
          ...baseWhere,
          transactionType: "EXCHANGE",
          status: "COMPLETED",
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.taxDocument.count({
        where: baseWhere.branchId ? { branchId: baseWhere.branchId } : {},
      }),
      prisma.returnExchangeTransaction.count({
        where: { ...baseWhere, policyOverride: true },
      }),
      prisma.returnExchangeTransaction.count({ where: baseWhere }),
      prisma.returnExchangeTransaction.findMany({
        where: baseWhere,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: true,
          taxDocuments: true,
        },
      }),
      prisma.taxDocument.findMany({
        where: baseWhere.branchId ? { branchId: baseWhere.branchId } : {},
        take: 10,
        orderBy: { issueDate: "desc" },
        include: { customer: true },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        pendingApprovalCount,
        todayReturnsCount: completedReturnsToday,
        todayExchangesCount: completedExchangesToday,
        totalCreditNotesCount,
        policyOverridesCount,
        totalTransactions,
      },
      recentTransactions,
      recentTaxDocuments: taxDocuments,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating returns report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report." },
      { status: 500 }
    );
  }
}
