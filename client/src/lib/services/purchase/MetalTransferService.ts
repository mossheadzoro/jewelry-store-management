// client/src/lib/services/purchase/MetalTransferService.ts
// Metal Transfers to Karigars, Wholesalers & Inter-Branch Movements

import { prisma, MetalCategory, TransferDestinationType, MetalTransferStatusEnum } from "@/lib/prisma";
import { PurchaseNumberingService } from "./PurchaseNumberingService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { insertLedgerEntry } from "@/lib/inventoryLedger";

export interface IssueMetalTransferParams {
  sourceBranchId: number;
  destinationType: TransferDestinationType;
  karigarId?: string;
  wholesalerId?: string;
  targetBranchId?: number;
  destinationName: string;
  metalCategory: MetalCategory;
  purityPercent?: number;
  grossWeight: number; // in grams
  lotBatchNo?: string;
  expectedReturnDate?: Date | string;
  purpose: string;
  wastageAllowedPercent?: number;
  notes?: string;
  authorizedById: number;
  reqContext?: any;
}

export interface SettleMetalTransferParams {
  transferId: string;
  metalReceivedBack: number;
  metalConsumed: number;
  notes?: string;
  actorId: number;
  reqContext?: any;
}

export class MetalTransferService {
  /**
   * Issues raw 24K/22K metal from showroom to Karigar, Wholesaler or Branch.
   */
  public static async issueTransfer(params: IssueMetalTransferParams) {
    const {
      sourceBranchId,
      destinationType,
      karigarId,
      wholesalerId,
      targetBranchId,
      destinationName,
      metalCategory = "GOLD_24K",
      grossWeight,
      lotBatchNo,
      expectedReturnDate,
      purpose,
      wastageAllowedPercent = 0,
      notes,
      authorizedById,
      reqContext,
    } = params;

    if (grossWeight <= 0) {
      throw new Error("Gross weight must be greater than zero.");
    }

    let defaultPurity = 99.50;
    let karatage = 24;
    if (metalCategory === "GOLD_24K") { defaultPurity = 99.50; karatage = 24; }
    else if (metalCategory === "GOLD_22K") { defaultPurity = 91.60; karatage = 22; }
    else if (metalCategory === "GOLD_18K") { defaultPurity = 75.00; karatage = 18; }
    else if (metalCategory === "GOLD_14K") { defaultPurity = 58.50; karatage = 14; }
    else if (metalCategory === "SILVER_999") { defaultPurity = 99.90; karatage = 0; }
    else if (metalCategory === "SILVER_925") { defaultPurity = 92.50; karatage = 0; }

    const purityPercent = params.purityPercent || defaultPurity;
    // 24K bullion is 99.50% standard — fine weight equals gross weight for 24K metal
    const fineWeight = (metalCategory === "GOLD_24K" && purityPercent >= 99.50)
      ? Number(grossWeight.toFixed(3))
      : Number(((grossWeight * purityPercent) / 99.50).toFixed(3));

    const transferNumber = await PurchaseNumberingService.generateNumber("METAL_TRANSFER", sourceBranchId);

    // Find bullion product item
    const bullionProduct = await prisma.productItem.findFirst({
      where: {
        branchId: sourceBranchId,
        productCode: `BULLION-${metalCategory}`,
      },
    });

    const transfer = await prisma.$transaction(async (tx) => {
      // 1. Create PurchaseMetalTransfer record
      const created = await tx.purchaseMetalTransfer.create({
        data: {
          transferNumber,
          sourceBranchId,
          destinationType,
          karigarId,
          wholesalerId,
          targetBranchId,
          destinationName,
          metalCategory,
          purityPercent,
          grossWeight,
          fineWeight,
          lotBatchNo: lotBatchNo || `LOT-${transferNumber}`,
          issueDate: new Date(),
          transactionAt: new Date(),
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          purpose,
          wastageAllowedPercent,
          metalReceivedBack: 0,
          metalConsumed: 0,
          metalBalance: grossWeight,
          status: MetalTransferStatusEnum.ISSUED,
          notes,
          authorizedById,
        },
        include: {
          sourceBranch: { select: { id: true, name: true } },
          karigar: true,
          wholesaler: true,
          authorizedBy: { select: { id: true, name: true } },
        },
      });

      // 2. Post atomic entry to InventoryLedger (Deduct metal from branch stock)
      if (bullionProduct) {
        await insertLedgerEntry(
          tx,
          {
            productId: bullionProduct.id,
            branchId: sourceBranchId,
            txnType: destinationType === "KARIGAR" ? "KARIGAR_ISSUE_OUT" : "TRANSFER_OUT",
            refType: destinationType === "KARIGAR" ? "KARIGAR_JOB" : "TRANSFER",
            refId: created.id,
            qtyOut: 1,
            grossWeightOut: grossWeight,
            netWeightOut: grossWeight,
            unitCost: 0,
            totalValue: 0,
            remarks: `Metal transfer ${transferNumber} to ${destinationName} (${grossWeight}g ${metalCategory})`,
            createdById: authorizedById,
          },
          {
            karatage,
            purityPercent,
            batchLotNo: created.lotBatchNo || undefined,
          }
        );

        await tx.productItem.update({
          where: { id: bullionProduct.id },
          data: {
            gsWeight: { decrement: grossWeight },
            ntWeight: { decrement: grossWeight },
          },
        });
      }

      // 3. If Karigar, update KarigarHeldMetal
      if (karigarId) {
        await tx.karigarHeldMetal.upsert({
          where: {
            karigarId_purity: {
              karigarId,
              purity: purityPercent,
            },
          },
          create: {
            karigarId,
            purity: purityPercent,
            weight: grossWeight,
          },
          update: {
            weight: { increment: grossWeight },
          },
        });
      }

      // 4. If Wholesaler, update Wholesaler balance and ledger
      if (wholesalerId) {
        const isGold = metalCategory.startsWith("GOLD");
        await tx.wholesaler.update({
          where: { id: wholesalerId },
          data: {
            goldBal: isGold ? { increment: fineWeight } : undefined,
            silverBal: !isGold ? { increment: fineWeight } : undefined,
          },
        });

        const txRecord = await tx.wholesalerTransaction.create({
          data: {
            wholesalerId,
            type: "ISSUE_METAL",
            metalType: isGold ? "GOLD" : "SILVER",
            purityLabel: metalCategory,
            purityFactor: purityPercent / 100,
            weight: grossWeight,
            wastage: 0,
            fineWeight,
            totalCashAmount: 0,
            remarks: `Issued metal transfer ${transferNumber} (${purpose})`,
          },
        });

        await tx.wholesalerLedgerEntry.create({
          data: {
            wholesalerId,
            transactionId: txRecord.id,
            entryType: "ISSUE_METAL",
            metalAmount: fineWeight,
            cashAmount: 0,
            description: `Transfer ${transferNumber} - ${grossWeight}g issued`,
          },
        });
      }

      return created;
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_TRANSFERS",
      action: "METAL_ISSUED",
      entityType: "METAL_TRANSFER",
      entityId: transfer.id,
      entityDisplayName: `${transfer.transferNumber} (${transfer.grossWeight}g to ${destinationName})`,
      description: `Issued ${grossWeight}g ${metalCategory} to ${destinationName} under ${transfer.transferNumber}`,
      after: transfer,
      severity: grossWeight > 100 ? "HIGH" : "INFO",
    });

    return transfer;
  }

  /**
   * Settles or records return of transferred metal.
   */
  public static async settleTransfer(params: SettleMetalTransferParams) {
    const { transferId, metalReceivedBack, metalConsumed, notes, actorId, reqContext } = params;

    const transfer = await prisma.purchaseMetalTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer) throw new Error(`Metal transfer ${transferId} not found.`);

    const totalAccounted = Number((metalReceivedBack + metalConsumed).toFixed(3));
    const newBalance = Math.max(0, Number((transfer.grossWeight - totalAccounted).toFixed(3)));
    const newStatus = newBalance <= 0.01 ? MetalTransferStatusEnum.SETTLED : MetalTransferStatusEnum.DELIVERED;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update transfer record
      const updatedTransfer = await tx.purchaseMetalTransfer.update({
        where: { id: transferId },
        data: {
          metalReceivedBack,
          metalConsumed,
          metalBalance: newBalance,
          status: newStatus,
          notes: notes ? `${transfer.notes || ""}\n${notes}` : transfer.notes,
          receivedById: actorId,
        },
      });

      // 2. If metal received back and product exists, intake back into inventory
      if (metalReceivedBack > 0) {
        const bullionProduct = await tx.productItem.findFirst({
          where: {
            branchId: transfer.sourceBranchId,
            productCode: `BULLION-${transfer.metalCategory}`,
          },
        });

        if (bullionProduct) {
          await insertLedgerEntry(
            tx,
            {
              productId: bullionProduct.id,
              branchId: transfer.sourceBranchId,
              txnType: transfer.destinationType === "KARIGAR" ? "KARIGAR_RECEIVE_IN" : "TRANSFER_IN",
              refType: "TRANSFER",
              refId: transfer.id,
              qtyIn: 1,
              grossWeightIn: metalReceivedBack,
              netWeightIn: metalReceivedBack,
              unitCost: 0,
              totalValue: 0,
              remarks: `Metal returned from ${transfer.destinationName} on transfer ${transfer.transferNumber}`,
              createdById: actorId,
            },
            {
              karatage: transfer.metalCategory === "GOLD_24K" ? 24 : 22,
              purityPercent: transfer.purityPercent,
            }
          );

          await tx.productItem.update({
            where: { id: bullionProduct.id },
            data: {
              gsWeight: { increment: metalReceivedBack },
              ntWeight: { increment: metalReceivedBack },
            },
          });
        }
      }

      // 3. Update KarigarHeldMetal deduction
      if (transfer.karigarId) {
        await tx.karigarHeldMetal.updateMany({
          where: {
            karigarId: transfer.karigarId,
            purity: transfer.purityPercent,
          },
          data: {
            weight: { decrement: totalAccounted },
          },
        });
      }

      return updatedTransfer;
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_TRANSFERS",
      action: "TRANSFER_SETTLED",
      entityType: "METAL_TRANSFER",
      entityId: updated.id,
      entityDisplayName: `${updated.transferNumber} (Settled: ${totalAccounted}g)`,
      description: `Settled transfer ${updated.transferNumber} for ${transfer.destinationName}. Received: ${metalReceivedBack}g, Consumed: ${metalConsumed}g`,
      after: updated,
      severity: "INFO",
    });

    return updated;
  }

  /**
   * Retrieves metal transfers list.
   */
  public static async getTransfers(params: {
    branchId?: number;
    destinationType?: string;
    status?: string;
    from?: string | Date;
    to?: string | Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      branchId,
      destinationType,
      status,
      from,
      to,
      search,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};
    if (branchId) where.sourceBranchId = branchId;
    if (destinationType && destinationType !== "ALL") where.destinationType = destinationType as any;
    if (status && status !== "ALL") where.status = status as any;

    if (from || to) {
      where.issueDate = {};
      if (from) where.issueDate.gte = new Date(from);
      if (to) where.issueDate.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: "insensitive" } },
        { destinationName: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, transfers] = await Promise.all([
      prisma.purchaseMetalTransfer.count({ where }),
      prisma.purchaseMetalTransfer.findMany({
        where,
        include: {
          sourceBranch: { select: { id: true, name: true } },
          karigar: { select: { id: true, name: true, phoneNumber: true } },
          wholesaler: { select: { id: true, name: true, phone: true } },
          authorizedBy: { select: { id: true, name: true } },
          receivedBy: { select: { id: true, name: true } },
        },
        orderBy: { issueDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, transfers };
  }
}
