// client/src/app/api/rfid/tags/retire/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@libs/prisma';
import { requireAuth } from '@/lib/authGuard';
import { logRFIDTagAssignment } from '@/lib/rfid/services/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { epc, reason, authorizedById } = body;

    if (!epc) {
      return NextResponse.json({ error: 'EPC is required' }, { status: 400 });
    }

    const cleanEpc = epc.trim().toUpperCase();
    const userId = parseInt(auth.session.user.id, 10);
    const userRole = auth.user.systemRole;

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !authorizedById) {
      return NextResponse.json(
        { error: 'Manager authorization is required to retire an active RFID tag.' },
        { status: 403 }
      );
    }

    const tag = await prisma.rFIDTag.findUnique({
      where: { epc: cleanEpc },
      include: { productItem: true },
    });

    if (!tag) {
      return NextResponse.json({ error: 'RFID tag not found' }, { status: 404 });
    }

    const oldItemId = tag.productItemId;

    const retiredTag = await prisma.rFIDTag.update({
      where: { id: tag.id },
      data: {
        status: 'RETIRED',
        productItemId: null,
        retiredAt: new Date(),
        retiredReason: reason || 'Manual tag retirement',
      },
    });

    await logRFIDTagAssignment({
      tagId: tag.id,
      epc: cleanEpc,
      action: 'RETIRED',
      oldProductItemId: oldItemId || undefined,
      oldStatus: tag.status,
      newStatus: 'RETIRED',
      reason: reason || 'Authorized tag retirement',
      performedById: userId,
      authorizedById: authorizedById || (userRole === 'ADMIN' || userRole === 'MANAGER' ? userId : undefined),
    });

    return NextResponse.json({
      success: true,
      message: `RFID tag ${cleanEpc} retired successfully.`,
      data: retiredTag,
    });
  } catch (error: any) {
    console.error('Retire RFID Tag API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to retire RFID tag' }, { status: 500 });
  }
}
