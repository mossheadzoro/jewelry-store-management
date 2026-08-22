// client/src/app/api/rfid/readers/route.ts

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

    const readers = await prisma.rFIDReader.findMany({
      where: whereBranch,
      include: {
        branch: true,
        zone: true,
        antennas: { orderBy: { antennaNo: 'asc' } },
        _count: { select: { readEvents: true, tagsLastSeen: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: readers,
    });
  } catch (error: any) {
    console.error('Fetch RFID Readers API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch RFID readers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { readerCode, name, manufacturer, model, ipAddress, port, connectionType, powerDbm, zoneId, isMock, numAntennas } = body;

    if (!readerCode || !name) {
      return NextResponse.json({ error: 'Reader Code and Name are required' }, { status: 400 });
    }

    const branchId = auth.branchId!;

    const existing = await prisma.rFIDReader.findUnique({
      where: { readerCode: readerCode.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: `Reader with code ${readerCode} already exists` }, { status: 409 });
    }

    const reader = await prisma.rFIDReader.create({
      data: {
        readerCode: readerCode.trim().toUpperCase(),
        name,
        manufacturer: manufacturer || 'Generic',
        model: model || null,
        ipAddress: ipAddress || null,
        port: port ? parseInt(port, 10) : 5084,
        connectionType: connectionType || 'NETWORK_TCP',
        powerDbm: powerDbm ? parseFloat(powerDbm) : 30.0,
        status: isMock ? 'ONLINE' : 'OFFLINE',
        branchId,
        zoneId: zoneId || null,
        isMock: !!isMock,
        lastHeartbeat: new Date(),
      },
    });

    // Auto-create antennas
    const count = numAntennas ? parseInt(numAntennas, 10) : 4;
    const antennaCreations = [];
    for (let i = 1; i <= count; i++) {
      antennaCreations.push(
        prisma.rFIDAntenna.create({
          data: {
            readerId: reader.id,
            antennaNo: i,
            name: `Antenna ${i}`,
            powerDbm: reader.powerDbm,
            zoneId: zoneId || null,
          },
        })
      );
    }
    await Promise.all(antennaCreations);

    const fullReader = await prisma.rFIDReader.findUnique({
      where: { id: reader.id },
      include: { antennas: true, zone: true, branch: true },
    });

    return NextResponse.json({
      success: true,
      message: `RFID Reader "${name}" registered successfully.`,
      data: fullReader,
    });
  } catch (error: any) {
    console.error('Register RFID Reader API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to register RFID reader' }, { status: 500 });
  }
}
