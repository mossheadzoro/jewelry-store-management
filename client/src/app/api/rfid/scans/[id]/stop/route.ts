// client/src/app/api/rfid/scans/[id]/stop/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';
import { rfidReaderManager } from '@/lib/rfid/services/readerManager';
import { rfidReconciliationEngine } from '@/lib/rfid/services/reconciliationEngine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const session = await prisma.rFIDScanSession.findUnique({
      where: { id },
      include: { reader: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Scan session not found' }, { status: 404 });
    }

    // Stop attached reader if active
    if (session.readerId) {
      try {
        const adapter = await rfidReaderManager.getAdapter(session.readerId);
        await adapter.stopScanning();
      } catch (err) {
        console.warn('Reader stopScanning warning:', err);
      }
    }

    // Run reconciliation comparison
    const { summary, items } = await rfidReconciliationEngine.reconcileSession(id);

    const updated = await prisma.rFIDScanSession.update({
      where: { id },
      data: {
        status: 'REVIEW',
        endedAt: new Date(),
        totalExpected: summary.totalExpected,
        totalDetected: summary.totalDetected,
        matchedCount: summary.matchedCount,
        missingCount: summary.missingCount,
        unexpectedCount: summary.unexpectedCount,
        wrongZoneCount: summary.wrongZoneCount,
        wrongBranchCount: summary.wrongBranchCount,
        statusMismatchCount: summary.statusMismatchCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Scan session stopped and reconciled successfully',
      data: {
        session: updated,
        summary,
        items,
      },
    });
  } catch (error: any) {
    console.error('Stop Scan Session Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to stop scan session' }, { status: 500 });
  }
}
