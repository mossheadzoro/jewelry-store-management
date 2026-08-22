// client/src/app/api/rfid/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@libs/prisma';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { branchId } = auth;
    const whereBranch = branchId ? { branchId } : {};

    // 1. Reader Stats
    const totalReaders = await prisma.rFIDReader.count({ where: whereBranch });
    const onlineReaders = await prisma.rFIDReader.count({
      where: { ...whereBranch, status: 'ONLINE' },
    });
    const scanningReaders = await prisma.rFIDReader.count({
      where: { ...whereBranch, status: 'SCANNING' },
    });
    const offlineReaders = await prisma.rFIDReader.count({
      where: { ...whereBranch, status: 'OFFLINE' },
    });
    const errorReaders = await prisma.rFIDReader.count({
      where: { ...whereBranch, status: 'ERROR' },
    });

    // 2. Tag Stats
    const totalTags = await prisma.rFIDTag.count({ where: whereBranch });
    const activeTags = await prisma.rFIDTag.count({
      where: { ...whereBranch, status: 'ACTIVE' },
    });
    const unassignedTags = await prisma.rFIDTag.count({
      where: { ...whereBranch, status: 'UNASSIGNED' },
    });
    const suspendedTags = await prisma.rFIDTag.count({
      where: { ...whereBranch, status: 'SUSPENDED' },
    });
    const retiredTags = await prisma.rFIDTag.count({
      where: { ...whereBranch, status: 'RETIRED' },
    });

    // 3. Scanning Stats (Today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const readsToday = await prisma.rFIDReadEvent.count({
      where: {
        ...whereBranch,
        timestamp: { gte: todayStart },
      },
    });

    const uniqueDetectedToday = await prisma.rFIDReadEvent.groupBy({
      by: ['epc'],
      where: {
        ...whereBranch,
        timestamp: { gte: todayStart },
      },
    });

    const activeSessions = await prisma.rFIDScanSession.count({
      where: {
        ...whereBranch,
        status: 'SCANNING',
      },
    });

    // 4. Latest Audit Reconciliation Stats
    const latestAudit = await prisma.rFIDScanSession.findFirst({
      where: {
        ...whereBranch,
        type: 'INVENTORY_AUDIT',
        status: { in: ['REVIEW', 'APPROVED', 'CLOSED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Active Exceptions / Alerts
    const openExceptions = await prisma.rFIDException.findMany({
      where: {
        status: 'OPEN',
        ...(branchId ? { OR: [{ expectedBranchId: branchId }, { detectedBranchId: branchId }] } : {}),
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        productItem: true,
        expectedZone: true,
        detectedZone: true,
      },
    });

    // 6. Physical Zones with live metrics
    const zones = await prisma.rFIDZone.findMany({
      where: whereBranch,
      include: {
        _count: { select: { tags: true, readers: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        readers: {
          total: totalReaders,
          online: onlineReaders + scanningReaders,
          offline: offlineReaders,
          error: errorReaders,
          scanning: scanningReaders,
        },
        tags: {
          total: totalTags,
          active: activeTags,
          unassigned: unassignedTags,
          suspended: suspendedTags,
          retired: retiredTags,
        },
        scanning: {
          readsToday,
          uniqueItemsToday: uniqueDetectedToday.length,
          activeSessions,
        },
        reconciliation: latestAudit
          ? {
              sessionId: latestAudit.id,
              sessionNo: latestAudit.sessionNo,
              totalExpected: latestAudit.totalExpected,
              totalDetected: latestAudit.totalDetected,
              matched: latestAudit.matchedCount,
              missing: latestAudit.missingCount,
              unexpected: latestAudit.unexpectedCount,
              wrongZone: latestAudit.wrongZoneCount,
              wrongBranch: latestAudit.wrongBranchCount,
              statusMismatch: latestAudit.statusMismatchCount,
            }
          : {
              totalExpected: 0,
              totalDetected: 0,
              matched: 0,
              missing: 0,
              unexpected: 0,
              wrongZone: 0,
              wrongBranch: 0,
              statusMismatch: 0,
            },
        alerts: openExceptions,
        zones,
      },
    });
  } catch (error: any) {
    console.error('RFID Dashboard API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load RFID dashboard' }, { status: 500 });
  }
}
