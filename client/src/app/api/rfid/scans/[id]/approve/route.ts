// client/src/app/api/rfid/scans/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';
import { rfidReconciliationEngine } from '@/lib/rfid/services/reconciliationEngine';
import { rfidExceptionService } from '@/lib/rfid/services/exceptionService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const userId = parseInt(auth.session.user.id, 10);
    const userRole = auth.user.systemRole;

    const session = await prisma.rFIDScanSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Scan session not found' }, { status: 404 });
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json({ error: 'Session is already closed' }, { status: 400 });
    }

    // 1. Run final reconciliation
    const { summary, items } = await rfidReconciliationEngine.reconcileSession(id);

    // 2. Generate exceptions for all non-matched items
    const createdExceptions = await rfidExceptionService.generateExceptionsForSession(id, items);

    // 3. Mark session as approved & closed
    const updatedSession = await prisma.rFIDScanSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        approvedById: userId,
        endedAt: session.endedAt || new Date(),
      },
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: 'RFIDScanSession',
        entityId: id,
        action: 'AUDIT_APPROVED_AND_CLOSED',
        oldValues: { status: session.status },
        newValues: {
          status: 'CLOSED',
          accuracyPercentage: summary.accuracyPercentage,
          matchedCount: summary.matchedCount,
          missingCount: summary.missingCount,
          exceptionsGenerated: createdExceptions,
        },
        performedById: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Audit ${session.sessionNo} approved & closed. ${createdExceptions} exceptions created for investigation.`,
      data: {
        session: updatedSession,
        summary,
        createdExceptions,
      },
    });
  } catch (error: any) {
    console.error('Approve Scan Session Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve scan session' }, { status: 500 });
  }
}
