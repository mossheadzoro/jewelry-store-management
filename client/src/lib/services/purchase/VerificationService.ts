// client/src/lib/services/purchase/VerificationService.ts
// Unified Verification & Approval Engine for MOUAL Jewellery ERP Purchase Subsystem

import { prisma, VerificationActionType, VerificationStatus } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export interface CreateVerificationParams {
  branchId: number;
  actionType: VerificationActionType;
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
  entityNumber?: string;
  amount?: number;
  requiredRole?: string;
  reason?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requestedById: number;
  items: Array<{
    itemKey: string;
    label: string;
    expectedValue: string;
    actualValue: string;
    difference?: string;
    isFlagged?: boolean;
    notes?: string;
  }>;
  metadata?: Record<string, any>;
  reqContext?: any;
}

export interface VerificationDecisionParams {
  verificationRequestId: string;
  approverId: number;
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  decisionNotes?: string;
  escalatedToRole?: string;
  pinVerified?: boolean;
  stepUpTokenUsed?: string;
  ipAddress?: string;
  userAgent?: string;
  reqContext?: any;
}

export class VerificationService {
  /**
   * Creates a structured Verification Request with checklist items.
   */
  public static async createRequest(params: CreateVerificationParams) {
    const requestNumber = await PurchaseNumberingService.generateNumber(
      "VERIFICATION_REQUEST",
      params.branchId
    );

    const verificationRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.verificationRequest.create({
        data: {
          requestNumber,
          branchId: params.branchId,
          actionType: params.actionType,
          title: params.title,
          description: params.description,
          entityType: params.entityType,
          entityId: params.entityId,
          entityNumber: params.entityNumber,
          amount: params.amount,
          requiredRole: params.requiredRole || "MANAGER",
          status: VerificationStatus.PENDING,
          reason: params.reason,
          riskLevel: params.riskLevel || "MEDIUM",
          requestedById: params.requestedById,
          metadata: params.metadata as any,
          items: {
            create: params.items.map((item) => ({
              itemKey: item.itemKey,
              label: item.label,
              expectedValue: item.expectedValue,
              actualValue: item.actualValue,
              difference: item.difference,
              isFlagged: item.isFlagged || false,
              notes: item.notes,
            })),
          },
          audits: {
            create: {
              actorId: params.requestedById,
              action: "CREATED",
              details: `Verification request ${requestNumber} generated for ${params.title}`,
              ipAddress: params.reqContext?.ipAddress,
              metadata: params.metadata as any,
            },
          },
        },
        include: {
          items: true,
          requestedBy: {
            select: { id: true, name: true, email: true, systemRole: true },
          },
        },
      });

      return created;
    });

    // Record enterprise audit log
    await AuditLogService.recordBusinessEvent({
      context: params.reqContext,
      module: "PURCHASE_VERIFICATION",
      action: `VERIFICATION_REQUESTED.${params.actionType}`,
      entityType: "VERIFICATION_REQUEST",
      entityId: verificationRequest.id,
      entityDisplayName: `${requestNumber} - ${params.title}`,
      description: `Verification request ${requestNumber} submitted by user ${params.requestedById}`,
      after: verificationRequest,
      severity: params.riskLevel === "CRITICAL" || params.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
    });

    return verificationRequest;
  }

  /**
   * Submits an approval/rejection/escalation decision for a verification request.
   */
  public static async decide(params: VerificationDecisionParams) {
    const {
      verificationRequestId,
      approverId,
      decision,
      decisionNotes,
      escalatedToRole,
      pinVerified = true,
      stepUpTokenUsed,
      ipAddress,
      userAgent,
      reqContext,
    } = params;

    const existing = await prisma.verificationRequest.findUnique({
      where: { id: verificationRequestId },
      include: { items: true, branch: true },
    });

    if (!existing) {
      throw new Error(`Verification request ${verificationRequestId} not found.`);
    }

    if (existing.status !== VerificationStatus.PENDING && existing.status !== VerificationStatus.ESCALATED) {
      throw new Error(`Verification request is already in status ${existing.status}.`);
    }

    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      include: { role: true },
    });

    if (!approver) {
      throw new Error(`Approver ${approverId} not found.`);
    }

    // Role check: Only ADMIN, MANAGER, SUPER_ADMIN
    const allowedRoles = ["ADMIN", "MANAGER", "SUPER_ADMIN", "OWNER"];
    if (!allowedRoles.includes(approver.systemRole)) {
      throw new Error("Forbidden: You do not possess the required managerial privileges to decide verification requests.");
    }

    let nextStatus: VerificationStatus = VerificationStatus.PENDING;
    if (decision === "APPROVED") nextStatus = VerificationStatus.APPROVED;
    if (decision === "REJECTED") nextStatus = VerificationStatus.REJECTED;
    if (decision === "ESCALATED") nextStatus = VerificationStatus.ESCALATED;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record approval log
      await tx.verificationApproval.create({
        data: {
          verificationRequestId,
          approverId,
          decision: nextStatus,
          decisionNotes,
          escalatedToRole,
          pinVerified,
          stepUpTokenUsed,
          ipAddress,
          userAgent,
        },
      });

      // 2. Update request status
      const updated = await tx.verificationRequest.update({
        where: { id: verificationRequestId },
        data: {
          status: nextStatus,
          resolvedById: approverId,
          resolvedAt: new Date(),
          resolutionNotes: decisionNotes,
          requiredRole: decision === "ESCALATED" && escalatedToRole ? escalatedToRole : existing.requiredRole,
        },
        include: {
          items: true,
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true, systemRole: true },
              },
            },
          },
        },
      });

      // 3. Add audit trail
      await tx.verificationAudit.create({
        data: {
          verificationRequestId,
          actorId: approverId,
          action: decision,
          details: `Request ${existing.requestNumber} was ${decision.toLowerCase()} by ${approver.name} (${approver.systemRole}). Notes: ${decisionNotes || "None"}`,
          ipAddress,
        },
      });

      // 4. Update underlying entity status if applicable
      if (decision === "APPROVED") {
        if (existing.entityType === "PURCHASE_BOOKING") {
          await tx.purchaseBooking.update({
            where: { id: existing.entityId },
            data: {
              status: "BOOKED",
              verifiedById: approverId,
              verificationId: updated.id,
            },
          });
        } else if (existing.entityType === "PURCHASE_INVOICE") {
          await tx.purchaseInvoice.update({
            where: { id: existing.entityId },
            data: {
              status: "POSTED",
              verificationId: updated.id,
            },
          });
        } else if (existing.entityType === "METAL_RECEIPT") {
          await tx.purchaseMetalReceipt.update({
            where: { id: existing.entityId },
            data: {
              status: "VERIFIED",
              verifiedById: approverId,
              verificationId: updated.id,
            },
          });
        } else if (existing.entityType === "PURCHASE_PAYMENT") {
          await tx.purchasePayment.update({
            where: { id: existing.entityId },
            data: {
              status: "COMPLETED",
              verifiedById: approverId,
              verificationId: updated.id,
            },
          });
        }
      } else if (decision === "REJECTED") {
        if (existing.entityType === "PURCHASE_BOOKING") {
          await tx.purchaseBooking.update({
            where: { id: existing.entityId },
            data: { status: "CANCELLED" },
          });
        } else if (existing.entityType === "PURCHASE_INVOICE") {
          await tx.purchaseInvoice.update({
            where: { id: existing.entityId },
            data: { status: "CANCELLED" },
          });
        } else if (existing.entityType === "METAL_RECEIPT") {
          await tx.purchaseMetalReceipt.update({
            where: { id: existing.entityId },
            data: { status: "REJECTED" },
          });
        } else if (existing.entityType === "PURCHASE_PAYMENT") {
          await tx.purchasePayment.update({
            where: { id: existing.entityId },
            data: { status: "FAILED" },
          });
        }
      }

      return updated;
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_VERIFICATION",
      action: `VERIFICATION_${decision}`,
      entityType: "VERIFICATION_REQUEST",
      entityId: existing.id,
      entityDisplayName: `${existing.requestNumber} - ${existing.title}`,
      description: `Verification request ${existing.requestNumber} marked as ${decision} by ${approver.name}`,
      before: existing,
      after: result,
      severity: decision === "REJECTED" ? "HIGH" : "INFO",
    });

    return result;
  }

  /**
   * Retrieves pending verification queue for a branch or all branches.
   */
  public static async getPendingQueue(branchId?: number) {
    return prisma.verificationRequest.findMany({
      where: {
        status: { in: [VerificationStatus.PENDING, VerificationStatus.ESCALATED] },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        items: true,
        requestedBy: {
          select: { id: true, name: true, email: true, systemRole: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
