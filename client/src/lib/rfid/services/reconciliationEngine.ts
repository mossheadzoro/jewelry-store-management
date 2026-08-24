// client/src/lib/rfid/services/reconciliationEngine.ts

import { prisma } from "@/lib/prisma";
import {
  ReconciliationItem,
  ReconciliationSummary,
  RFIDReconciliationStatus,
} from '../types';

export interface AuditScopeFilter {
  categoryId?: number;
  subCategoryId?: number;
  zoneId?: string;
  isSafeVaultOnly?: boolean;
  minPurity?: number;
}

class RFIDReconciliationEngine {
  /**
   * Run full reconciliation comparison between expected ERP inventory and observed RFID reads for a scan session.
   */
  async reconcileSession(sessionId: string): Promise<{
    summary: ReconciliationSummary;
    items: ReconciliationItem[];
  }> {
    const session = await prisma.rFIDScanSession.findUnique({
      where: { id: sessionId },
      include: {
        branch: true,
        zone: true,
        observations: {
          include: {
            productItem: {
              include: {
                branch: true,
                subCategory: { include: { category: true } },
                rfidTag: { include: { currentZone: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Scan Session ${sessionId} not found`);
    }

    const scope = (session.scopeFilter as AuditScopeFilter) || {};

    // 1. Fetch expected ProductItems from ERP matching the scope
    const whereClause: any = {
      branchId: session.branchId,
      quantity: { gt: 0 },
    };

    if (session.zoneId) {
      whereClause.rfidTag = { currentZoneId: session.zoneId };
    }
    if (scope.categoryId) {
      whereClause.subCategory = { categoryId: scope.categoryId };
    }
    if (scope.subCategoryId) {
      whereClause.subCategoryId = scope.subCategoryId;
    }
    if (scope.minPurity) {
      whereClause.purity = { gte: scope.minPurity };
    }

    const expectedItems = await prisma.productItem.findMany({
      where: whereClause,
      include: {
        branch: true,
        subCategory: { include: { category: true } },
        rfidTag: { include: { currentZone: true } },
      },
    });

    // Map expected items by EPC and by ID
    const expectedByEpc = new Map<string, typeof expectedItems[0]>();
    const expectedById = new Map<number, typeof expectedItems[0]>();

    for (const item of expectedItems) {
      expectedById.set(item.id, item);
      if (item.rfidTag?.epc) {
        expectedByEpc.set(item.rfidTag.epc, item);
      }
    }

    // Map observed items by EPC
    const observedByEpc = new Map<string, typeof session.observations[0]>();
    for (const obs of session.observations) {
      observedByEpc.set(obs.epc, obs);
    }

    const allReconciledItems: ReconciliationItem[] = [];
    const processedEpcs = new Set<string>();

    let matchedCount = 0;
    let missingCount = 0;
    let unexpectedCount = 0;
    let wrongZoneCount = 0;
    let wrongBranchCount = 0;
    let statusMismatchCount = 0;
    let unassignedCount = 0;
    let soldDetectedCount = 0;

    // 2. Process all expected items to determine MATCHED or MISSING
    for (const expected of expectedItems) {
      const epc = expected.rfidTag?.epc;
      const obs = epc ? observedByEpc.get(epc) : undefined;

      if (epc) processedEpcs.add(epc);

      if (obs) {
        // Tag was physically observed!
        // Check if zone matches expected
        let status: RFIDReconciliationStatus = 'MATCHED';

        if (session.zoneId && expected.rfidTag?.currentZoneId && expected.rfidTag.currentZoneId !== session.zoneId) {
          status = 'WRONG_ZONE';
          wrongZoneCount++;
        } else if (expected.branchId !== session.branchId) {
          status = 'WRONG_BRANCH';
          wrongBranchCount++;
        } else if (expected.quantity <= 0) {
          status = 'STATUS_MISMATCH';
          statusMismatchCount++;
        } else {
          matchedCount++;
        }

        allReconciledItems.push({
          id: expected.id,
          productCode: expected.productCode,
          barcode: expected.barcode,
          huidNumber: expected.huidNumber,
          name: expected.name,
          category: expected.subCategory?.category?.name,
          subCategory: expected.subCategory?.name,
          gsWeight: expected.gsWeight,
          ntWeight: expected.ntWeight,
          purity: expected.purity,
          price: expected.price,
          epc: epc || 'NO_EPC',
          expectedBranchId: expected.branchId,
          expectedBranchName: expected.branch.name,
          expectedZoneId: expected.rfidTag?.currentZoneId,
          expectedZoneName: expected.rfidTag?.currentZone?.name || 'Showroom Floor',
          detectedBranchId: obs.detectedBranchId,
          detectedBranchName: session.branch.name,
          detectedZoneId: obs.detectedZoneId || session.zoneId,
          detectedZoneName: session.zone?.name || 'Scanned Zone',
          reconciliationStatus: status,
          inventoryStatus: expected.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
          lastRssi: obs.peakRssi,
          readCount: obs.readCount,
          firstSeenAt: obs.firstSeenAt,
          lastSeenAt: obs.lastSeenAt,
          isHighValue: (expected.price || 0) >= 100000 || (expected.gsWeight || 0) >= 50,
        });
      } else {
        // Expected item was NOT detected during this scan
        missingCount++;
        allReconciledItems.push({
          id: expected.id,
          productCode: expected.productCode,
          barcode: expected.barcode,
          huidNumber: expected.huidNumber,
          name: expected.name,
          category: expected.subCategory?.category?.name,
          subCategory: expected.subCategory?.name,
          gsWeight: expected.gsWeight,
          ntWeight: expected.ntWeight,
          purity: expected.purity,
          price: expected.price,
          epc: epc || 'UNASSIGNED',
          expectedBranchId: expected.branchId,
          expectedBranchName: expected.branch.name,
          expectedZoneId: expected.rfidTag?.currentZoneId,
          expectedZoneName: expected.rfidTag?.currentZone?.name || 'Showroom Floor',
          reconciliationStatus: 'MISSING',
          inventoryStatus: expected.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
          isHighValue: (expected.price || 0) >= 100000 || (expected.gsWeight || 0) >= 50,
        });
      }
    }

    // 3. Process observed tags that were NOT in the expected list
    for (const [epc, obs] of observedByEpc.entries()) {
      if (processedEpcs.has(epc)) continue; // Already handled above

      // Lookup this EPC in DB across all branches/items
      const dbTag = await prisma.rFIDTag.findUnique({
        where: { epc },
        include: {
          currentZone: true,
          branch: true,
          productItem: {
            include: {
              branch: true,
              subCategory: { include: { category: true } },
            },
          },
        },
      });

      if (!dbTag || !dbTag.productItem) {
        // Tag is unassigned or not in system
        unassignedCount++;
        allReconciledItems.push({
          name: 'Unassigned RFID Tag',
          epc,
          detectedBranchId: obs.detectedBranchId,
          detectedBranchName: session.branch.name,
          detectedZoneId: obs.detectedZoneId || session.zoneId,
          detectedZoneName: session.zone?.name || 'Scanned Area',
          reconciliationStatus: 'UNASSIGNED',
          lastRssi: obs.peakRssi,
          readCount: obs.readCount,
          firstSeenAt: obs.firstSeenAt,
          lastSeenAt: obs.lastSeenAt,
        });
      } else {
        const item = dbTag.productItem;
        let status: RFIDReconciliationStatus = 'UNEXPECTED';

        if (item.branchId !== session.branchId) {
          status = 'WRONG_BRANCH';
          wrongBranchCount++;
        } else if (session.zoneId && dbTag.currentZoneId && dbTag.currentZoneId !== session.zoneId) {
          status = 'WRONG_ZONE';
          wrongZoneCount++;
        } else if (item.quantity <= 0) {
          status = 'SOLD_DETECTED';
          soldDetectedCount++;
        } else {
          unexpectedCount++;
        }

        allReconciledItems.push({
          id: item.id,
          productCode: item.productCode,
          barcode: item.barcode,
          huidNumber: item.huidNumber,
          name: item.name,
          category: item.subCategory?.category?.name,
          subCategory: item.subCategory?.name,
          gsWeight: item.gsWeight,
          ntWeight: item.ntWeight,
          purity: item.purity,
          price: item.price,
          epc,
          expectedBranchId: item.branchId,
          expectedBranchName: item.branch.name,
          expectedZoneId: dbTag.currentZoneId,
          expectedZoneName: dbTag.currentZone?.name || 'Other Zone',
          detectedBranchId: obs.detectedBranchId,
          detectedBranchName: session.branch.name,
          detectedZoneId: obs.detectedZoneId || session.zoneId,
          detectedZoneName: session.zone?.name || 'Scanned Area',
          reconciliationStatus: status,
          inventoryStatus: item.quantity > 0 ? 'AVAILABLE' : 'SOLD/OUT_OF_STOCK',
          lastRssi: obs.peakRssi,
          readCount: obs.readCount,
          firstSeenAt: obs.firstSeenAt,
          lastSeenAt: obs.lastSeenAt,
          isHighValue: (item.price || 0) >= 100000 || (item.gsWeight || 0) >= 50,
        });
      }
    }

    const totalExpected = expectedItems.length;
    const totalDetected = session.observations.length;
    const accuracyPercentage =
      totalExpected > 0 ? Math.max(0, Math.min(100, Math.round((matchedCount / totalExpected) * 100))) : 100;

    const summary: ReconciliationSummary = {
      totalExpected,
      totalDetected,
      matchedCount,
      missingCount,
      unexpectedCount,
      wrongZoneCount,
      wrongBranchCount,
      statusMismatchCount,
      unassignedCount,
      soldDetectedCount,
      accuracyPercentage,
    };

    // Update the Scan Session with latest counts in database
    await prisma.rFIDScanSession.update({
      where: { id: sessionId },
      data: {
        totalExpected,
        totalDetected,
        matchedCount,
        missingCount,
        unexpectedCount,
        wrongZoneCount,
        wrongBranchCount,
        statusMismatchCount,
      },
    });

    return { summary, items: allReconciledItems };
  }
}

export const rfidReconciliationEngine = new RFIDReconciliationEngine();
