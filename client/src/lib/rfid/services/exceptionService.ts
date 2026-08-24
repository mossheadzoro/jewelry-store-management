// client/src/lib/rfid/services/exceptionService.ts

import { prisma } from "@/lib/prisma";
import {
  ReconciliationItem,
  RFIDExceptionSeverity,
  RFIDExceptionType,
  RFIDResolutionType,
} from '../types';

class RFIDExceptionService {
  /**
   * Generate exceptions for all non-matched items from an audit reconciliation.
   */
  async generateExceptionsForSession(sessionId: string, items: ReconciliationItem[]): Promise<number> {
    const session = await prisma.rFIDScanSession.findUnique({
      where: { id: sessionId },
      include: { zone: true },
    });

    if (!session) return 0;

    let createdCount = 0;

    for (const item of items) {
      if (item.reconciliationStatus === 'MATCHED') continue;

      let exceptionType: RFIDExceptionType = 'UNEXPECTED';
      let severity: RFIDExceptionSeverity = 'MEDIUM';

      switch (item.reconciliationStatus) {
        case 'MISSING':
          exceptionType = 'MISSING';
          severity = item.isHighValue || session.zone?.isSecureVault ? 'CRITICAL' : 'HIGH';
          break;
        case 'WRONG_BRANCH':
          exceptionType = 'WRONG_BRANCH';
          severity = item.isHighValue ? 'CRITICAL' : 'HIGH';
          break;
        case 'WRONG_ZONE':
          exceptionType = 'WRONG_ZONE';
          severity = session.zone?.isSecureVault ? 'HIGH' : 'MEDIUM';
          break;
        case 'SOLD_DETECTED':
          exceptionType = 'SOLD_ITEM_DETECTED';
          severity = 'CRITICAL';
          break;
        case 'STATUS_MISMATCH':
          exceptionType = 'STATUS_MISMATCH';
          severity = 'HIGH';
          break;
        case 'UNASSIGNED':
          exceptionType = 'UNASSIGNED_TAG';
          severity = 'LOW';
          break;
        default:
          exceptionType = 'UNEXPECTED';
          severity = item.isHighValue ? 'HIGH' : 'MEDIUM';
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const exceptionNo = `EXC-${new Date().getFullYear()}-${randomSuffix}`;

      try {
        await prisma.rFIDException.create({
          data: {
            exceptionNo,
            type: exceptionType,
            severity,
            status: 'OPEN',
            scanSessionId: sessionId,
            productItemId: item.id || null,
            tagEpc: item.epc,
            expectedBranchId: item.expectedBranchId || null,
            expectedZoneId: item.expectedZoneId || null,
            detectedBranchId: item.detectedBranchId || null,
            detectedZoneId: item.detectedZoneId || null,
            details: `Item "${item.name}" flagged as ${item.reconciliationStatus}. Expected at ${
              item.expectedBranchName || 'Branch'
            } / ${item.expectedZoneName || 'Zone'}, observed at ${item.detectedBranchName || 'Branch'} / ${
              item.detectedZoneName || 'Zone'
            }.`,
          },
        });
        createdCount++;
      } catch (err) {
        console.warn('Failed to insert exception:', err);
      }
    }

    return createdCount;
  }

  /**
   * Resolve an open exception with proper authorization verification.
   */
  async resolveException(
    exceptionId: string,
    params: {
      resolutionType: RFIDResolutionType;
      resolutionNotes: string;
      userId: number;
      userRole: string;
      authorizedById?: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    const exception = await prisma.rFIDException.findUnique({
      where: { id: exceptionId },
      include: { productItem: true, tag: true },
    });

    if (!exception) {
      throw new Error(`Exception ${exceptionId} not found`);
    }

    if (exception.status === 'RESOLVED') {
      return { success: true, message: 'Exception is already resolved.' };
    }

    // Check manager authorization for Critical / High severity exceptions
    const isHighRisk =
      exception.severity === 'CRITICAL' ||
      exception.severity === 'HIGH' ||
      exception.type === 'SOLD_ITEM_DETECTED';

    if (isHighRisk && params.userRole !== 'ADMIN' && params.userRole !== 'MANAGER' && !params.authorizedById) {
      throw new Error('Manager authorization required to resolve high-severity RFID exceptions.');
    }

    // Execute resolution actions
    if (params.resolutionType === 'LOCATION_UPDATED' && exception.detectedZoneId && exception.tagEpc) {
      // Update physical observed zone on tag
      await prisma.rFIDTag.updateMany({
        where: { epc: exception.tagEpc },
        data: {
          currentZoneId: exception.detectedZoneId,
          lastSeenAt: new Date(),
        },
      });
    }

    await prisma.rFIDException.update({
      where: { id: exceptionId },
      data: {
        status: 'RESOLVED',
        resolutionType: params.resolutionType,
        resolutionNotes: params.resolutionNotes,
        resolvedById: params.userId,
        authorizedById: params.authorizedById || (params.userRole === 'ADMIN' || params.userRole === 'MANAGER' ? params.userId : null),
        resolvedAt: new Date(),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: 'RFIDException',
        entityId: exceptionId,
        action: 'RESOLVE_EXCEPTION',
        oldValues: { status: exception.status },
        newValues: {
          status: 'RESOLVED',
          resolutionType: params.resolutionType,
          resolutionNotes: params.resolutionNotes,
        },
        performedById: params.userId,
      },
    });

    return { success: true, message: 'Exception resolved successfully.' };
  }
}

export const rfidExceptionService = new RFIDExceptionService();
