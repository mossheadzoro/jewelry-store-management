// client/src/app/api/rfid/readers/[id]/ping/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import { rfidReaderManager } from '@/lib/rfid/services/readerManager';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const result = await rfidReaderManager.pingReader(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Ping RFID Reader API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to ping RFID reader' }, { status: 500 });
  }
}
