// client/src/app/api/rfid/readers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';
import { rfidReaderManager } from '@/lib/rfid/services/readerManager';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const reader = await prisma.rFIDReader.findUnique({
      where: { id },
      include: {
        antennas: { orderBy: { antennaNo: 'asc' } },
        zone: true,
        branch: true,
      },
    });

    if (!reader) {
      return NextResponse.json({ error: 'Reader not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reader });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reader' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, powerDbm, zoneId, ipAddress, port, connectionType, status, isMock } = body;

    const reader = await prisma.rFIDReader.findUnique({ where: { id } });
    if (!reader) {
      return NextResponse.json({ error: 'Reader not found' }, { status: 404 });
    }

    const updated = await prisma.rFIDReader.update({
      where: { id },
      data: {
        name: name !== undefined ? name : reader.name,
        powerDbm: powerDbm !== undefined ? parseFloat(powerDbm) : reader.powerDbm,
        zoneId: zoneId !== undefined ? zoneId || null : reader.zoneId,
        ipAddress: ipAddress !== undefined ? ipAddress || null : reader.ipAddress,
        port: port !== undefined ? parseInt(port, 10) : reader.port,
        connectionType: connectionType !== undefined ? connectionType : reader.connectionType,
        status: status !== undefined ? status : reader.status,
        isMock: isMock !== undefined ? isMock : reader.isMock,
      },
      include: { antennas: true, zone: true, branch: true },
    });

    await rfidReaderManager.evictAdapter(id);

    return NextResponse.json({
      success: true,
      message: 'Reader updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update reader' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await rfidReaderManager.evictAdapter(id);
    await prisma.rFIDReader.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Reader deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete reader' }, { status: 500 });
  }
}
