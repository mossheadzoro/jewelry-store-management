// client/src/lib/services/purchase/PurchaseGSTService.ts
// Purchase GST Management — GSTR-2B ITC Tracking, Reconciliation & Monthly Period Locks

import { prisma, GSTPeriodStatusEnum, ITCReconciliationStatus } from "@/lib/prisma";
import { AuditLogService } from "@/lib/audit/AuditLogService";

export class PurchaseGSTService {
  /**
   * Retrieves summary of Purchase GST / Input Tax Credit for a given period or FY.
   */
  public static async getGSTSummary(params: {
    branchId?: number;
    financialYear?: string;
    periodMonth?: number;
    periodYear?: number;
  }) {
    const { branchId, financialYear, periodMonth, periodYear } = params;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (financialYear) where.financialYear = financialYear;
    if (periodMonth) where.periodMonth = periodMonth;
    if (periodYear) where.periodYear = periodYear;

    const records = await prisma.purchaseGSTRecord.findMany({
      where,
      include: {
        supplier: { select: { id: true, businessName: true, gstin: true, state: true } },
        invoice: { select: { id: true, invoiceNumber: true, supplierInvoiceNumber: true, invoiceDate: true } },
        creditNote: { select: { id: true, creditNoteNumber: true, itcReductionAmount: true } },
        debitNote: { select: { id: true, debitNoteNumber: true, additionalItcAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalTaxableValue = 0;
    let grossCgst = 0;
    let grossSgst = 0;
    let grossIgst = 0;
    let totalTax = 0;
    let eligibleItc = 0;
    let ineligibleItc = 0;

    let matchedCount = 0;
    let unreconciledCount = 0;

    for (const r of records) {
      totalTaxableValue += r.taxableValue;
      grossCgst += r.cgst;
      grossSgst += r.sgst;
      grossIgst += r.igst;
      totalTax += r.totalTax;

      if (r.itcEligibility === "ELIGIBLE") {
        eligibleItc += r.itcClaimedAmount;
      } else {
        ineligibleItc += r.totalTax;
      }

      if (r.reconciliationStatus === ITCReconciliationStatus.MATCHED) {
        matchedCount++;
      } else {
        unreconciledCount++;
      }
    }

    // Check if period is locked
    let periodStatus: GSTPeriodStatusEnum = GSTPeriodStatusEnum.DRAFT;
    let lockedAt: Date | null = null;
    let lockedByName: string | null = null;

    if (branchId && financialYear && periodMonth) {
      const period = await prisma.purchaseGSTPeriod.findUnique({
        where: {
          branchId_financialYear_periodMonth: {
            branchId,
            financialYear,
            periodMonth,
          },
        },
        include: { lockedBy: { select: { name: true } } },
      });

      if (period) {
        periodStatus = period.status;
        lockedAt = period.lockedAt;
        lockedByName = period.lockedBy?.name || null;
      }
    }

    return {
      financialYear,
      periodMonth,
      periodYear,
      recordCount: records.length,
      totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
      grossCgst: Number(grossCgst.toFixed(2)),
      grossSgst: Number(grossSgst.toFixed(2)),
      grossIgst: Number(grossIgst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      eligibleItc: Number(eligibleItc.toFixed(2)),
      ineligibleItc: Number(ineligibleItc.toFixed(2)),
      netItc: Number((eligibleItc - ineligibleItc).toFixed(2)),
      matchedCount,
      unreconciledCount,
      periodStatus,
      lockedAt,
      lockedByName,
      records,
    };
  }

  /**
   * Reconciles a Purchase GST record with GSTR-2B data.
   */
  public static async reconcileRecord(params: {
    recordId: string;
    reconciliationStatus: ITCReconciliationStatus;
    supplierReportedTax?: number;
    gstr2bFilingDate?: Date | string;
    remarks?: string;
    actorId: number;
    reqContext?: any;
  }) {
    const {
      recordId,
      reconciliationStatus,
      supplierReportedTax,
      gstr2bFilingDate,
      remarks,
      actorId,
      reqContext,
    } = params;

    const record = await prisma.purchaseGSTRecord.findUnique({
      where: { id: recordId },
      include: { supplier: true },
    });
    if (!record) throw new Error(`GST record ${recordId} not found.`);

    const taxDiff = supplierReportedTax !== undefined
      ? Number((record.totalTax - supplierReportedTax).toFixed(2))
      : 0;

    const updated = await prisma.purchaseGSTRecord.update({
      where: { id: recordId },
      data: {
        reconciliationStatus,
        supplierReportedTax,
        taxDifference: taxDiff,
        gstr2bFilingDate: gstr2bFilingDate ? new Date(gstr2bFilingDate) : undefined,
        gstr2bMatchedDate: reconciliationStatus === "MATCHED" ? new Date() : undefined,
        remarks: remarks || record.remarks,
      },
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_GST",
      action: "GSTR2B_RECONCILED",
      entityType: "PURCHASE_GST_RECORD",
      entityId: record.id,
      entityDisplayName: `GST Reconciled: ${record.gstin} (${reconciliationStatus})`,
      description: `GSTR-2B reconciliation updated for ${record.supplier.businessName}. Status: ${reconciliationStatus}`,
      after: updated,
      severity: "INFO",
    });

    return updated;
  }

  /**
   * Locks or unlocks a monthly GST period snapshot.
   */
  public static async setPeriodStatus(params: {
    branchId: number;
    financialYear: string;
    periodMonth: number;
    periodYear: number;
    status: GSTPeriodStatusEnum;
    notes?: string;
    actorId: number;
    reqContext?: any;
  }) {
    const {
      branchId,
      financialYear,
      periodMonth,
      periodYear,
      status,
      notes,
      actorId,
      reqContext,
    } = params;

    const summary = await this.getGSTSummary({
      branchId,
      financialYear,
      periodMonth,
      periodYear,
    });

    const isLocking = status === GSTPeriodStatusEnum.LOCKED;

    const period = await prisma.purchaseGSTPeriod.upsert({
      where: {
        branchId_financialYear_periodMonth: {
          branchId,
          financialYear,
          periodMonth,
        },
      },
      create: {
        branchId,
        financialYear,
        periodMonth,
        periodYear,
        totalPurchases: summary.totalTaxableValue + summary.totalTax,
        taxableValue: summary.totalTaxableValue,
        grossCgst: summary.grossCgst,
        grossSgst: summary.grossSgst,
        grossIgst: summary.grossIgst,
        eligibleItc: summary.eligibleItc,
        ineligibleItc: summary.ineligibleItc,
        netItc: summary.netItc,
        reconciledCount: summary.matchedCount,
        unreconciledCount: summary.unreconciledCount,
        status,
        lockedAt: isLocking ? new Date() : null,
        lockedById: isLocking ? actorId : null,
        notes,
      },
      update: {
        totalPurchases: summary.totalTaxableValue + summary.totalTax,
        taxableValue: summary.totalTaxableValue,
        grossCgst: summary.grossCgst,
        grossSgst: summary.grossSgst,
        grossIgst: summary.grossIgst,
        eligibleItc: summary.eligibleItc,
        ineligibleItc: summary.ineligibleItc,
        netItc: summary.netItc,
        reconciledCount: summary.matchedCount,
        unreconciledCount: summary.unreconciledCount,
        status,
        lockedAt: isLocking ? new Date() : null,
        lockedById: isLocking ? actorId : null,
        notes,
      },
    });

    // Enterprise Audit Log
    await AuditLogService.recordBusinessEvent({
      context: reqContext,
      module: "PURCHASE_GST",
      action: isLocking ? "GST_PERIOD_LOCKED" : "GST_PERIOD_STATUS_UPDATED",
      entityType: "PURCHASE_GST_PERIOD",
      entityId: period.id,
      entityDisplayName: `GST Period ${financialYear} M${periodMonth} (${status})`,
      description: `GST Period for ${financialYear} Month ${periodMonth} changed to ${status}`,
      after: period,
      severity: isLocking ? "HIGH" : "MEDIUM",
    });

    return period;
  }
}
