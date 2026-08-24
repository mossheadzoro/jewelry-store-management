// client/src/app/api/rfid/tags/reassign/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';
import { logRFIDTagAssignment } from '@/lib/rfid/services/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { epc, newProductItemId, reason, authorizedById } = body;

    if (!epc || !newProductItemId) {
      return NextResponse.json({ error: 'EPC and new Product Item ID are required' }, { status: 400 });
    }

    const cleanEpc = epc.trim().toUpperCase();
    const userId = parseInt(auth.session.user.id, 10);
    const userRole = auth.user.systemRole;

    // Check manager authorization
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !authorizedById) {
      return NextResponse.json(
        { error: 'Manager authorization is required to reassign an active RFID tag.' },
        { status: 403 }
      );
    }

    const tag = await prisma.rFIDTag.findUnique({
      where: { epc: cleanEpc },
      include: { productItem: true },
    });

    if (!tag) {
      return NextResponse.json({ error: 'RFID Tag not found' }, { status: 404 });
    }

    const newProductItem = await prisma.productItem.findUnique({
      where: { id: parseInt(newProductItemId, 10) },
      include: { rfidTag: true },
    });

    if (!newProductItem) {
      return NextResponse.json({ error: 'Target product item not found' }, { status: 404 });
    }

    const oldItemId = tag.productItemId;

    // Update tag assignment
    const updatedTag = await prisma.rFIDTag.update({
      where: { id: tag.id },
      data: {
        productItemId: newProductItem.id,
        status: 'ACTIVE',
        assignedAt: new Date(),
        assignedById: userId,
        notes: `Reassigned from Item #${oldItemId || 'N/A'}. Reason: ${reason || 'Physical re-tagging'}`,
      },
    });

    // Record audit event
    await logRFIDTagAssignment({
      tagId: tag.id,
      epc: cleanEpc,
      action: 'REASSIGNED',
      oldProductItemId: oldItemId || undefined,
      newProductItemId: newProductItem.id,
      oldStatus: tag.status,
      newStatus: 'ACTIVE',
      reason: reason || 'Authorized tag reassignment',
      performedById: userId,
      authorizedById: authorizedById || (userRole === 'ADMIN' || userRole === 'MANAGER' ? userId : undefined),
    });

    return NextResponse.json({
      success: true,
      message: `RFID tag ${cleanEpc} reassigned to "${newProductItem.name}" successfully.`,
      data: updatedTag,
    });
  } catch (error: any) {
    console.error('Reassign RFID Tag API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reassign RFID tag' }, { status: 500 });
  }
}
