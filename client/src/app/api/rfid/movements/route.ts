// client/src/app/api/rfid/movements/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { branchId } = auth;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const zoneId = url.searchParams.get('zoneId');
    const readerId = url.searchParams.get('readerId');

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (zoneId && zoneId !== 'ALL') where.zoneId = zoneId;
    if (readerId && readerId !== 'ALL') where.readerId = readerId;

    const readEvents = await prisma.rFIDReadEvent.findMany({
      where,
      include: {
        tag: {
          include: {
            productItem: {
              include: {
                subCategory: { include: { category: true } },
              },
            },
          },
        },
        reader: true,
        zone: true,
        branch: true,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: readEvents,
    });
  } catch (error: any) {
    console.error('Fetch RFID Movements API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch movements' }, { status: 500 });
  }
}
