/**
 * POST /api/inventory/ledger/lock-old-entries
 *
 * Cron-safe endpoint that sets isLocked = true on all ledger entries
 * older than N days (default 90). Only accessible by ADMIN role.
 *
 * Once locked, entries serve as immutable audit trail and cannot be
 * modified by regular operations (enforced at application level).
 *
 * Body (optional):
 *   { lockOlderThanDays?: number }  // default: 90
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    // Auth check — only ADMIN can lock entries
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }
    const userRole = (session.user.systemRole || session.user.role || "").toString().toUpperCase();
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "OWNER" && userRole !== "MANAGER") {
      return NextResponse.json(
        { error: "Only administrators and managers can lock ledger entries." },
        { status: 403 }
      );
    }

    // Parse optional body
    let lockOlderThanDays: number | null = null;
    try {
      const body = await req.json();
      if (typeof body.lockOlderThanDays === "number") {
        lockOlderThanDays = body.lockOlderThanDays;
      }
    } catch {
      // No body or invalid JSON — fallback
    }

    if (lockOlderThanDays === null) {
      const settings = await prisma.companySettings.findFirst({
        select: { defaultLockDays: true },
      });
      lockOlderThanDays = settings?.defaultLockDays ?? 90;
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lockOlderThanDays);

    // Lock all unlocked entries older than the cutoff
    const result = await prisma.inventoryLedger.updateMany({
      where: {
        isLocked: false,
        createdAt: { lt: cutoffDate },
      },
      data: {
        isLocked: true,
      },
    });

    return NextResponse.json({
      success: true,
      lockedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      lockOlderThanDays,
      message: `${result.count} ledger entries locked (entries older than ${lockOlderThanDays} days).`,
    });
  } catch (error: any) {
    console.error("Lock old entries error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lock old entries" },
      { status: 500 }
    );
  }
}
