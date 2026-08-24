// client/src/app/api/rfid/readers/[id]/mock-trigger/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';
import { rfidDeduplicationService } from '@/lib/rfid/services/deduplicationService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { scanSessionId, count = 5, customEpcs } = body;
    const branchId = auth.branchId!;

    const reader = await prisma.rFIDReader.findUnique({
      where: { id },
      include: { zone: true },
    });

    if (!reader) {
      return NextResponse.json({ error: 'Reader not found' }, { status: 404 });
    }

    // Fetch tags to simulate
    let epcsToSimulate: string[] = [];

    if (customEpcs && Array.isArray(customEpcs) && customEpcs.length > 0) {
      epcsToSimulate = customEpcs;
    } else {
      const activeTags = await prisma.rFIDTag.findMany({
        where: { branchId },
        take: Math.max(count, 5),
        select: { epc: true },
      });

      epcsToSimulate = activeTags.map((t) => t.epc);

      // If no active tags exist yet, generate sample jewellery EPCs
      if (epcsToSimulate.length === 0) {
        epcsToSimulate = [
          'E28068940000501234567890',
          'E28068940000501234567891',
          'E28068940000501234567892',
          'E28068940000501234567893',
          'E28068940000501234567894',
        ];
      }
    }

    const packets = epcsToSimulate.map((epc) => ({
      epc,
      readerId: reader.id,
      antennaNo: Math.floor(Math.random() * 4) + 1,
      rssi: Number((-(Math.random() * 20 + 40)).toFixed(1)),
      frequency: 865.7,
      timestamp: new Date(),
    }));

    const observations = await rfidDeduplicationService.processBatch(packets, {
      branchId,
      zoneId: reader.zoneId || undefined,
      scanSessionId,
    });

    return NextResponse.json({
      success: true,
      message: `Triggered ${packets.length} simulated reads on "${reader.name}"`,
      data: observations,
    });
  } catch (error: any) {
    console.error('Mock Trigger API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger mock reads' }, { status: 500 });
  }
}
