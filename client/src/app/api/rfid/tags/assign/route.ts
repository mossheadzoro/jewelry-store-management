// client/src/app/api/rfid/tags/assign/route.ts

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
    const { epc, productItemId, zoneId, tid, notes } = body;

    if (!epc || !productItemId) {
      return NextResponse.json({ error: 'EPC and Product Item ID are required' }, { status: 400 });
    }

    const cleanEpc = epc.trim().toUpperCase();
    const branchId = auth.branchId!;
    const userId = parseInt(auth.session.user.id, 10);

    // 1. Check ProductItem existence and branch
    const productItem = await prisma.productItem.findUnique({
      where: { id: parseInt(productItemId, 10) },
      include: { rfidTag: true, branch: true },
    });

    if (!productItem) {
      return NextResponse.json({ error: 'Product item not found' }, { status: 404 });
    }

    if (productItem.branchId !== branchId && auth.user.systemRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Item does not belong to your current branch' }, { status: 403 });
    }

    // 2. Check if ProductItem already has an active RFID tag
    if (productItem.rfidTag && productItem.rfidTag.status === 'ACTIVE' && productItem.rfidTag.epc !== cleanEpc) {
      return NextResponse.json(
        {
          error: `Item already has an active RFID tag (${productItem.rfidTag.epc}). Please replace or retire the existing tag before assigning a new one.`,
          existingEpc: productItem.rfidTag.epc,
        },
        { status: 409 }
      );
    }

    // 3. Check if EPC already belongs to ANOTHER ProductItem
    const existingTag = await prisma.rFIDTag.findUnique({
      where: { epc: cleanEpc },
      include: { productItem: true },
    });

    if (existingTag && existingTag.productItemId && existingTag.productItemId !== productItem.id && existingTag.status === 'ACTIVE') {
      return NextResponse.json(
        {
          error: `This RFID tag is already assigned to "${existingTag.productItem?.name}" (${existingTag.productItem?.productCode}). Use the Reassignment workflow with manager authorization.`,
          conflictItem: {
            id: existingTag.productItem?.id,
            name: existingTag.productItem?.name,
            productCode: existingTag.productItem?.productCode,
            barcode: existingTag.productItem?.barcode,
          },
        },
        { status: 409 }
      );
    }

    // 4. Upsert RFID Tag
    let tag;
    if (existingTag) {
      tag = await prisma.rFIDTag.update({
        where: { id: existingTag.id },
        data: {
          productItemId: productItem.id,
          status: 'ACTIVE',
          currentZoneId: zoneId || existingTag.currentZoneId,
          assignedAt: new Date(),
          assignedById: userId,
          notes: notes || existingTag.notes,
          tid: tid || existingTag.tid,
        },
      });
    } else {
      tag = await prisma.rFIDTag.create({
        data: {
          epc: cleanEpc,
          tid: tid || null,
          status: 'ACTIVE',
          productItemId: productItem.id,
          branchId,
          currentZoneId: zoneId || null,
          assignedAt: new Date(),
          assignedById: userId,
          notes: notes || null,
        },
      });
    }

    // 5. Create immutable audit log
    await logRFIDTagAssignment({
      tagId: tag.id,
      epc: cleanEpc,
      productItemId: productItem.id,
      action: 'ASSIGNED',
      newProductItemId: productItem.id,
      newStatus: 'ACTIVE',
      reason: notes || 'Initial physical RFID tag assignment',
      performedById: userId,
    });

    return NextResponse.json({
      success: true,
      message: `RFID tag ${cleanEpc} assigned to "${productItem.name}" successfully.`,
      data: tag,
    });
  } catch (error: any) {
    console.error('Assign RFID Tag API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to assign RFID tag' }, { status: 500 });
  }
}
