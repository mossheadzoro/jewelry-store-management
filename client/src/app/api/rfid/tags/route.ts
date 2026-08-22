// client/src/app/api/rfid/tags/route.ts

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
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');
    const zoneId = url.searchParams.get('zoneId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status && status !== 'ALL') where.status = status;
    if (zoneId && zoneId !== 'ALL') where.currentZoneId = zoneId;

    if (search.trim()) {
      where.OR = [
        { epc: { contains: search.trim(), mode: 'insensitive' } },
        { tid: { contains: search.trim(), mode: 'insensitive' } },
        { productItem: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { productItem: { barcode: { contains: search.trim(), mode: 'insensitive' } } },
        { productItem: { productCode: { contains: search.trim(), mode: 'insensitive' } } },
        { productItem: { huidNumber: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.rFIDTag.findMany({
        where,
        include: {
          productItem: {
            include: {
              subCategory: { include: { category: true } },
            },
          },
          currentZone: true,
          lastReader: true,
          assignedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rFIDTag.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch RFID Tags API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch RFID tags' }, { status: 500 });
  }
}
