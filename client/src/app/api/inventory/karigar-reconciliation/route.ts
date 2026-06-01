/**
 * GET /api/inventory/karigar-reconciliation
 *
 * Per karigar (craftsman) job reconciliation report showing:
 * - Issued metal weight vs received weight
 * - Outstanding metal with karigar
 * - Allowed vs actual wastage variance
 * - Job status (OPEN / CLOSED / OVERDUE)
 *
 * Filters: branchId, karigarId, status, dateFrom, dateTo
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const karigarId = searchParams.get("karigarId");
    const status = searchParams.get("status"); // "OPEN" | "CLOSED" | "OVERDUE"
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build KarigarJob filter
    const jobWhere: any = {};
    if (karigarId) jobWhere.karigarId = karigarId;
    if (status === "OPEN") jobWhere.status = "OPEN";
    if (status === "CLOSED") jobWhere.status = "CLOSED";
    if (dateFrom || dateTo) {
      jobWhere.createdAt = {};
      if (dateFrom) jobWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo)
        jobWhere.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    }

    // Fetch karigar jobs with karigar info
    const jobs = await prisma.karigarJob.findMany({
      where: jobWhere,
      include: {
        karigar: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            department: true,
          },
        },
        jewelleryItems: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.karigarJob.count({ where: jobWhere });
    const now = new Date();
    const OVERDUE_DAYS = 30; // Jobs open > 30 days are considered overdue

    // Build reconciliation data for each job
    const reconciliation = await Promise.all(
      jobs.map(async (job) => {
        // Get KARIGAR_ISSUE_OUT entries for this job
        const issueEntries = await prisma.inventoryLedger.findMany({
          where: {
            refType: "KARIGAR_JOB",
            refId: job.id,
            txnType: "KARIGAR_ISSUE_OUT",
            ...(branchId ? { branchId: parseInt(branchId) } : {}),
          },
          select: {
            netWeightOut: true,
            grossWeightOut: true,
            allowedWastageWt: true,
          },
        });

        // Get KARIGAR_RECEIVE_IN entries for this job
        const receiveEntries = await prisma.inventoryLedger.findMany({
          where: {
            refType: "KARIGAR_JOB",
            refId: job.id,
            txnType: "KARIGAR_RECEIVE_IN",
            ...(branchId ? { branchId: parseInt(branchId) } : {}),
          },
          select: {
            netWeightIn: true,
            grossWeightIn: true,
            actualWastageWt: true,
          },
        });

        // Sum issued weight
        const issuedNetWt = parseFloat(
          issueEntries
            .reduce((sum, e) => sum + (e.netWeightOut ?? 0), 0)
            .toFixed(3)
        );

        // Sum received weight
        const receivedNetWt = parseFloat(
          receiveEntries
            .reduce((sum, e) => sum + (e.netWeightIn ?? 0), 0)
            .toFixed(3)
        );

        // Also include weight from jewellery items for more accurate data
        const jewelleryReceivedWt = parseFloat(
          job.jewelleryItems
            .reduce((sum, item) => sum + (item.weight ?? 0), 0)
            .toFixed(3)
        );

        // Use the larger of ledger-tracked or jewellery-item-tracked
        const effectiveReceivedWt = Math.max(receivedNetWt, jewelleryReceivedWt);

        // Outstanding = what's still with karigar
        const outstandingNetWt = parseFloat(
          (issuedNetWt - effectiveReceivedWt).toFixed(3)
        );

        // Wastage calculations
        const allowedWastage = parseFloat(
          issueEntries
            .reduce((sum, e) => sum + (e.allowedWastageWt ?? 0), 0)
            .toFixed(3)
        );

        // If no explicit allowed wastage, calculate from wastagePercent
        const effectiveAllowedWastage =
          allowedWastage > 0
            ? allowedWastage
            : parseFloat(
                (issuedNetWt * ((job.wastagePercent ?? 0) / 100)).toFixed(3)
              );

        // Actual wastage = issued - received (what was lost in manufacturing)
        const actualWastage = parseFloat(
          receiveEntries
            .reduce((sum, e) => sum + (e.actualWastageWt ?? 0), 0)
            .toFixed(3)
        );

        // If no explicit actual wastage tracked, calculate from weight difference
        const effectiveActualWastage =
          actualWastage > 0
            ? actualWastage
            : job.status === "CLOSED"
              ? parseFloat(
                  (
                    issuedNetWt -
                    effectiveReceivedWt -
                    (job.remainingRawMetal ?? 0)
                  ).toFixed(3)
                )
              : 0;

        const wastageVariance = parseFloat(
          (effectiveActualWastage - effectiveAllowedWastage).toFixed(3)
        );

        // Determine status
        const daysSinceIssue = Math.floor(
          (now.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        let jobStatus: "OPEN" | "CLOSED" | "OVERDUE";
        if (job.status === "CLOSED") {
          jobStatus = "CLOSED";
        } else if (daysSinceIssue > OVERDUE_DAYS) {
          jobStatus = "OVERDUE";
        } else {
          jobStatus = "OPEN";
        }

        // Filter by status if requested
        if (status === "OVERDUE" && jobStatus !== "OVERDUE") return null;

        return {
          karigarId: job.karigar.id,
          karigarName: job.karigar.name,
          karigarPhone: job.karigar.phoneNumber,
          karigarDepartment: job.karigar.department,
          jobRefId: job.id,
          issuedNetWt,
          issuedPurity: job.issuedPurity,
          receivedNetWt: effectiveReceivedWt,
          outstandingNetWt: Math.max(0, outstandingNetWt),
          remainingRawMetal: job.remainingRawMetal ?? 0,
          allowedWastage: effectiveAllowedWastage,
          actualWastage: effectiveActualWastage,
          wastageVariance,
          wastagePercent: job.wastagePercent ?? 0,
          status: jobStatus,
          issuedAt: job.createdAt,
          closedAt: job.closedAt ?? null,
          expectedReturnAt: null, // Can be enhanced later with expected return tracking
          daysSinceIssue,
          jewelleryItemCount: job.jewelleryItems.length,
        };
      })
    );

    // Filter out nulls (status filter for OVERDUE)
    const filteredReconciliation = reconciliation.filter(
      (item) => item !== null
    );

    // Aggregate totals
    const totals = filteredReconciliation.reduce(
      (acc, item) => ({
        totalJobs: acc.totalJobs + 1,
        totalIssuedWt: parseFloat(
          (acc.totalIssuedWt + (item?.issuedNetWt ?? 0)).toFixed(3)
        ),
        totalReceivedWt: parseFloat(
          (acc.totalReceivedWt + (item?.receivedNetWt ?? 0)).toFixed(3)
        ),
        totalOutstandingWt: parseFloat(
          (acc.totalOutstandingWt + (item?.outstandingNetWt ?? 0)).toFixed(3)
        ),
        totalWastageVariance: parseFloat(
          (acc.totalWastageVariance + (item?.wastageVariance ?? 0)).toFixed(3)
        ),
        openJobs:
          acc.openJobs + (item?.status === "OPEN" ? 1 : 0),
        overdueJobs:
          acc.overdueJobs + (item?.status === "OVERDUE" ? 1 : 0),
        closedJobs:
          acc.closedJobs + (item?.status === "CLOSED" ? 1 : 0),
      }),
      {
        totalJobs: 0,
        totalIssuedWt: 0,
        totalReceivedWt: 0,
        totalOutstandingWt: 0,
        totalWastageVariance: 0,
        openJobs: 0,
        overdueJobs: 0,
        closedJobs: 0,
      }
    );

    return NextResponse.json({
      items: filteredReconciliation,
      totals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Karigar reconciliation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch karigar reconciliation" },
      { status: 500 }
    );
  }
}
