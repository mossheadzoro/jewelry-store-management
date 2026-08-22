// client/src/app/api/rfid/scans/[id]/results/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@libs/prisma';
import { requireAuth } from '@/lib/authGuard';
import { rfidReconciliationEngine } from '@/lib/rfid/services/reconciliationEngine';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const session = await prisma.rFIDScanSession.findUnique({
      where: { id },
      include: {
        zone: true,
        reader: true,
        branch: true,
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Scan session not found' }, { status: 404 });
    }

    const { summary, items } = await rfidReconciliationEngine.reconcileSession(id);

    return NextResponse.json({
      success: true,
      data: {
        session,
        summary,
        items,
      },
    });
  } catch (error: any) {
    console.error('Fetch Scan Results Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch scan results' }, { status: 500 });
  }
}
