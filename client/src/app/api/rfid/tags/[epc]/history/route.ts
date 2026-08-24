// client/src/app/api/rfid/tags/[epc]/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ epc: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { epc } = await params;
    const cleanEpc = epc.trim().toUpperCase();

    const tag = await prisma.rFIDTag.findUnique({
      where: { epc: cleanEpc },
      include: {
        productItem: {
          include: {
            branch: true,
            subCategory: { include: { category: true } },
          },
        },
        currentZone: true,
        lastReader: true,
        assignedBy: { select: { id: true, name: true, email: true } },
        assignmentHistory: {
          include: {
            performedBy: { select: { id: true, name: true } },
            authorizedBy: { select: { id: true, name: true } },
            productItem: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        exceptions: {
          include: {
            resolvedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'RFID Tag not found' }, { status: 404 });
    }

    // Fetch recent physical read observations across readers
    const readEvents = await prisma.rFIDReadEvent.findMany({
      where: { epc: cleanEpc },
      take: 40,
      orderBy: { timestamp: 'desc' },
      include: {
        reader: true,
        zone: true,
        branch: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tag,
        readEvents,
      },
    });
  } catch (error: any) {
    console.error('Fetch RFID Tag History API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tag history' }, { status: 500 });
  }
}
