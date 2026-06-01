/**
 * GET /api/inventory/approval-outstanding
 *
 * Lists items currently out on approval (APPROVAL_OUT with no matching APPROVAL_IN).
 * Approval/memo is a common practice in the jewelry industry where items are sent
 * to customers or events for viewing, with the expectation of return or purchase.
 *
 * Filters: branchId, overdueDays
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const overdueThresholdDays = parseInt(
      searchParams.get("overdueDays") || "14"
    );
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build filter for APPROVAL_OUT entries
    const approvalOutWhere: any = {
      txnType: "APPROVAL_OUT",
    };
    if (branchId) approvalOutWhere.branchId = parseInt(branchId);

    // Fetch all APPROVAL_OUT entries
    const approvalOutEntries = await prisma.inventoryLedger.findMany({
      where: approvalOutWhere,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            barcode: true,
            image: true,
            subCategory: {
              include: {
                category: { select: { name: true } },
              },
            },
          },
        },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // For each APPROVAL_OUT, check if there's a matching APPROVAL_IN
    const outstandingItems = await Promise.all(
      approvalOutEntries.map(async (outEntry) => {
        // Check for a matching APPROVAL_IN with the same refId
        const matchingReturn = await prisma.inventoryLedger.findFirst({
          where: {
            txnType: "APPROVAL_IN",
            refId: outEntry.refId,
            productId: outEntry.productId,
            branchId: outEntry.branchId,
          },
        });

        // If there's a matching return, this item is no longer outstanding
        if (matchingReturn) return null;

        // Calculate days out
        const daysOut = Math.floor(
          (now.getTime() - outEntry.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const isOverdue = daysOut > overdueThresholdDays;

        // Estimate value based on available data
        const estimatedValue = outEntry.totalValue ?? 0;

        return {
          productId: outEntry.productId,
          productName: outEntry.product.name,
          productCode: outEntry.product.productCode,
          barcode: outEntry.product.barcode,
          category:
            outEntry.product.subCategory?.category?.name ?? "Uncategorized",
          branchId: outEntry.branchId,
          branchName: outEntry.branch.name,
          approvalRefId: outEntry.refId ?? "N/A",
          sentAt: outEntry.createdAt,
          daysOut,
          netWt: outEntry.netWeightOut ?? 0,
          grossWt: outEntry.grossWeightOut ?? 0,
          qty: outEntry.qtyOut ?? 0,
          estimatedValue,
          isOverdue,
          remarks: outEntry.remarks ?? null,
          ledgerEntryId: outEntry.id,
        };
      })
    );

    // Filter out nulls (items that have been returned)
    const filtered = outstandingItems.filter((item) => item !== null);

    // Apply pagination
    const paginatedItems = filtered.slice((page - 1) * limit, page * limit);

    // Aggregate totals
    const totals = filtered.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + 1,
        totalNetWt: parseFloat(
          (acc.totalNetWt + (item?.netWt ?? 0)).toFixed(3)
        ),
        totalQty: acc.totalQty + (item?.qty ?? 0),
        totalEstimatedValue: parseFloat(
          (acc.totalEstimatedValue + (item?.estimatedValue ?? 0)).toFixed(2)
        ),
        overdueCount:
          acc.overdueCount + (item?.isOverdue ? 1 : 0),
      }),
      {
        totalItems: 0,
        totalNetWt: 0,
        totalQty: 0,
        totalEstimatedValue: 0,
        overdueCount: 0,
      }
    );

    return NextResponse.json({
      items: paginatedItems,
      totals,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
      metadata: {
        overdueThresholdDays,
      },
    });
  } catch (error: any) {
    console.error("Approval outstanding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch approval outstanding items" },
      { status: 500 }
    );
  }
}
