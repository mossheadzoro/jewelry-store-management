// client/src/app/api/rfid/tags/replace/route.ts

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
    const { oldEpc, newEpc, productItemId, reason } = body;

    if (!newEpc || !productItemId) {
      return NextResponse.json({ error: 'New EPC and Product Item ID are required' }, { status: 400 });
    }

    const cleanNewEpc = newEpc.trim().toUpperCase();
    const cleanOldEpc = oldEpc?.trim().toUpperCase();
    const branchId = auth.branchId!;
    const userId = parseInt(auth.session.user.id, 10);

    const productItem = await prisma.productItem.findUnique({
      where: { id: parseInt(productItemId, 10) },
      include: { rfidTag: true },
    });

    if (!productItem) {
      return NextResponse.json({ error: 'Product item not found' }, { status: 404 });
    }

    // 1. Retire old tag if exists
    if (cleanOldEpc) {
      const oldTag = await prisma.rFIDTag.findUnique({ where: { epc: cleanOldEpc } });
      if (oldTag) {
        await prisma.rFIDTag.update({
          where: { id: oldTag.id },
          data: {
            status: 'RETIRED',
            productItemId: null,
            retiredAt: new Date(),
            retiredReason: `Replaced by ${cleanNewEpc}. Reason: ${reason || 'Damaged tag replacement'}`,
          },
        });

        await logRFIDTagAssignment({
          tagId: oldTag.id,
          epc: cleanOldEpc,
          oldProductItemId: productItem.id,
          action: 'RETIRED',
          oldStatus: oldTag.status,
          newStatus: 'RETIRED',
          reason: `Replaced with new EPC ${cleanNewEpc}`,
          performedById: userId,
        });
      }
    }

    // 2. Assign new tag
    const newTag = await prisma.rFIDTag.upsert({
      where: { epc: cleanNewEpc },
      create: {
        epc: cleanNewEpc,
        status: 'ACTIVE',
        productItemId: productItem.id,
        branchId,
        currentZoneId: productItem.rfidTag?.currentZoneId || null,
        assignedAt: new Date(),
        assignedById: userId,
        notes: `Replacement tag. ${reason || ''}`,
      },
      update: {
        status: 'ACTIVE',
        productItemId: productItem.id,
        assignedAt: new Date(),
        assignedById: userId,
        notes: `Replacement tag. ${reason || ''}`,
      },
    });

    await logRFIDTagAssignment({
      tagId: newTag.id,
      epc: cleanNewEpc,
      productItemId: productItem.id,
      action: 'REPLACED',
      newProductItemId: productItem.id,
      newStatus: 'ACTIVE',
      reason: reason || 'Physical tag replacement for damaged tag',
      performedById: userId,
    });

    return NextResponse.json({
      success: true,
      message: `RFID Tag successfully replaced with ${cleanNewEpc} for "${productItem.name}".`,
      data: newTag,
    });
  } catch (error: any) {
    console.error('Replace RFID Tag API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to replace RFID tag' }, { status: 500 });
  }
}
