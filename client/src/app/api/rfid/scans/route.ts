// client/src/app/api/rfid/scans/route.ts

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
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (type && type !== 'ALL') where.type = type;
    if (status && status !== 'ALL') where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.rFIDScanSession.findMany({
        where,
        include: {
          zone: true,
          reader: true,
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          _count: { select: { observations: true, exceptions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rFIDScanSession.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch RFID Scans API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch scan sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, type, zoneId, readerId, scopeFilter, notes } = body;

    const branchId = auth.branchId!;
    const userId = parseInt(auth.session.user.id, 10);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sessionNo = `AUD-${new Date().getFullYear()}-${randomSuffix}`;

    // Pre-calculate total expected items matching this scope
    const whereClause: any = {
      branchId,
      quantity: { gt: 0 },
    };
    if (zoneId) {
      whereClause.rfidTag = { currentZoneId: zoneId };
    }
    if (scopeFilter?.categoryId) {
      whereClause.subCategory = { categoryId: scopeFilter.categoryId };
    }
    if (scopeFilter?.subCategoryId) {
      whereClause.subCategoryId = scopeFilter.subCategoryId;
    }

    const expectedCount = await prisma.productItem.count({ where: whereClause });

    const session = await prisma.rFIDScanSession.create({
      data: {
        sessionNo,
        name: name || `Inventory Audit — ${new Date().toLocaleDateString('en-IN')}`,
        type: type || 'INVENTORY_AUDIT',
        status: 'CREATED',
        branchId,
        zoneId: zoneId || null,
        readerId: readerId || null,
        createdById: userId,
        totalExpected: expectedCount,
        scopeFilter: scopeFilter || null,
        notes: notes || null,
      },
      include: {
        zone: true,
        reader: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Scan Session ${sessionNo} created successfully.`,
      data: session,
    });
  } catch (error: any) {
    console.error('Create Scan Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create scan session' }, { status: 500 });
  }
}
