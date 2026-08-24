// client/src/app/api/rfid/read-events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';
import { rfidDeduplicationService } from '@/lib/rfid/services/deduplicationService';
import { RawRFIDReadPacket } from '@/lib/rfid/types';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { reads, scanSessionId, readerId, zoneId } = body;

    const branchId = auth.branchId!;

    if (!reads || !Array.isArray(reads) || reads.length === 0) {
      return NextResponse.json({ error: 'No RFID read packets provided' }, { status: 400 });
    }

    const packets: RawRFIDReadPacket[] = reads.map((r: any) => ({
      epc: r.epc?.trim().toUpperCase(),
      tid: r.tid,
      readerId: r.readerId || readerId || 'READER-DEFAULT',
      antennaNo: r.antennaNo || 1,
      rssi: r.rssi !== undefined ? parseFloat(r.rssi) : -50.0,
      frequency: r.frequency ? parseFloat(r.frequency) : 865.7,
      phase: r.phase ? parseFloat(r.phase) : undefined,
      timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
    }));

    const observations = await rfidDeduplicationService.processBatch(packets, {
      branchId,
      zoneId,
      scanSessionId,
    });

    return NextResponse.json({
      success: true,
      processed: packets.length,
      observations,
    });
  } catch (error: any) {
    console.error('Ingest Read Events API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process read events' }, { status: 500 });
  }
}
