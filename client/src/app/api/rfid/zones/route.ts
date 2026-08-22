// client/src/app/api/rfid/zones/route.ts

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
    const whereBranch = branchId ? { branchId } : {};

    const zones = await prisma.rFIDZone.findMany({
      where: whereBranch,
      include: {
        branch: true,
        readers: {
          include: { antennas: true },
        },
        _count: {
          select: { tags: true, scanSessions: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: zones,
    });
  } catch (error: any) {
    console.error('Fetch RFID Zones API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch RFID zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { code, name, type, isSecureVault, description, color } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Zone Code and Name are required' }, { status: 400 });
    }

    const branchId = auth.branchId!;
    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.rFIDZone.findUnique({
      where: {
        branchId_code: {
          branchId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: `Zone with code ${cleanCode} already exists in this branch` }, { status: 409 });
    }

    const zone = await prisma.rFIDZone.create({
      data: {
        code: cleanCode,
        name,
        type: type || 'COUNTER',
        isSecureVault: !!isSecureVault,
        description: description || null,
        color: color || 'gold',
        branchId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `RFID Zone "${name}" created successfully.`,
      data: zone,
    });
  } catch (error: any) {
    console.error('Create RFID Zone API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create RFID zone' }, { status: 500 });
  }
}
