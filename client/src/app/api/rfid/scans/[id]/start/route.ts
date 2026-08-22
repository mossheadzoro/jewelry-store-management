// client/src/app/api/rfid/scans/[id]/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@libs/prisma';
import { requireAuth } from '@/lib/authGuard';
import { rfidReaderManager } from '@/lib/rfid/services/readerManager';

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

    const updated = await prisma.rFIDScanSession.update({
      where: { id },
      data: {
        status: 'SCANNING',
        startedAt: session.startedAt || new Date(),
      },
    });

    // If reader attached, start scanning
    if (session.readerId) {
      try {
        const adapter = await rfidReaderManager.getAdapter(session.readerId);
        await adapter.startScanning(() => {});
      } catch (err) {
        console.warn('Reader startScanning warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Scan session started',
      data: updated,
    });
  } catch (error: any) {
    console.error('Start Scan Session Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start scan session' }, { status: 500 });
  }
}
