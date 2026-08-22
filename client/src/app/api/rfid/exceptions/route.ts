// client/src/app/api/rfid/exceptions/route.ts

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
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (branchId) {
      where.OR = [
        { expectedBranchId: branchId },
        { detectedBranchId: branchId },
      ];
    }
    if (status && status !== 'ALL') where.status = status;
    if (severity && severity !== 'ALL') where.severity = severity;
    if (type && type !== 'ALL') where.type = type;

    if (search.trim()) {
      where.AND = [
        {
          OR: [
            { exceptionNo: { contains: search.trim(), mode: 'insensitive' } },
            { tagEpc: { contains: search.trim(), mode: 'insensitive' } },
            { productItem: { name: { contains: search.trim(), mode: 'insensitive' } } },
            { productItem: { barcode: { contains: search.trim(), mode: 'insensitive' } } },
            { productItem: { productCode: { contains: search.trim(), mode: 'insensitive' } } },
            { productItem: { huidNumber: { contains: search.trim(), mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [exceptions, total] = await Promise.all([
      prisma.rFIDException.findMany({
        where,
        include: {
          productItem: {
            include: {
              subCategory: { include: { category: true } },
            },
          },
          expectedZone: true,
          detectedZone: true,
          resolvedBy: { select: { id: true, name: true, email: true } },
          authorizedBy: { select: { id: true, name: true, email: true } },
          scanSession: { select: { id: true, sessionNo: true, name: true } },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.rFIDException.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: exceptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch RFID Exceptions API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch exceptions' }, { status: 500 });
  }
}
