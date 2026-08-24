// client/src/lib/rfid/services/auditLogger.ts

import { prisma } from "@/lib/prisma";

export async function logRFIDTagAssignment(params: {
  tagId: string;
  epc: string;
  productItemId?: number;
  action: 'ASSIGNED' | 'REASSIGNED' | 'SUSPENDED' | 'REPLACED' | 'RETIRED';
  oldProductItemId?: number;
  newProductItemId?: number;
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  performedById?: number;
  authorizedById?: number;
}): Promise<void> {
  try {
    await prisma.rFIDAssignmentHistory.create({
      data: {
        tagId: params.tagId,
        epc: params.epc,
        productItemId: params.productItemId || params.newProductItemId || null,
        action: params.action,
        oldProductItemId: params.oldProductItemId,
        newProductItemId: params.newProductItemId,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        reason: params.reason,
        performedById: params.performedById,
        authorizedById: params.authorizedById,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'RFIDTag',
        entityId: params.tagId,
        action: `RFID_TAG_${params.action}`,
        oldValues: {
          productItemId: params.oldProductItemId,
          status: params.oldStatus,
        },
        newValues: {
          productItemId: params.newProductItemId,
          status: params.newStatus,
          reason: params.reason,
        },
        performedById: params.performedById,
      },
    });
  } catch (err) {
    console.error('Failed to log RFID tag audit event:', err);
  }
}
