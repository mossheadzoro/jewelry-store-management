// client/src/lib/audit/AuditLogService.ts
// Centralized Enterprise Audit Logging & Activity Tracking Service

import { prisma } from "@libs/prisma";
import { AuditContext, AuditRequestContext } from "./AuditContext";
import { AuditDiffEngine } from "./AuditDiffEngine";
import { AuditRedactor } from "./AuditRedactor";
import { AuditSeverityType, AuditStatusType } from "./AuditRegistry";
import { NextRequest } from "next/server";

export interface RecordBusinessEventOptions {
  req?: NextRequest | Request | any;
  context?: Partial<AuditRequestContext>;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityDisplayName?: string;
  description?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  changedFields?: string[];
  reason?: string;
  approvalId?: string;
  approvedById?: number;
  approvedByNameSnapshot?: string;
  status?: AuditStatusType;
  failureReason?: string;
  severity?: AuditSeverityType;
  isSecurityEvent?: boolean;
  metadata?: Record<string, any>;
}

export interface RecordTechnicalLogOptions {
  tenantId?: string;
  requestId: string;
  method: string;
  route: string;
  statusCode: number;
  responseTimeMs: number;
  ipAddress?: string;
  userId?: number;
  userNameSnapshot?: string;
  userAgent?: string;
}

export interface AuditQueryParams {
  tenantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  from?: string | Date;
  to?: string | Date;
  userId?: number;
  role?: string;
  branchId?: number;
  module?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  severity?: string;
  isSecurityEvent?: boolean;
  ipAddress?: string;
  correlationId?: string;
}

export class AuditLogService {
  /**
   * Records a business audit event into EnterpriseAuditLog with field diffs & snapshots.
   */
  public static async recordBusinessEvent(options: RecordBusinessEventOptions): Promise<any> {
    try {
      const ctx = await AuditContext.extract(options.req, options.context);

      // Compute field differences if both before and after exist
      let finalBefore = options.before || null;
      let finalAfter = options.after || null;
      let changedFields = options.changedFields || [];

      if (options.before && options.after) {
        const diff = AuditDiffEngine.computeDiff(options.before, options.after);
        finalBefore = diff.before;
        finalAfter = diff.after;
        if (changedFields.length === 0) {
          changedFields = diff.changedFields;
        }
      } else {
        if (finalBefore) finalBefore = AuditRedactor.sanitize(finalBefore);
        if (finalAfter) finalAfter = AuditRedactor.sanitize(finalAfter);
      }

      const sanitizedMetadata = options.metadata ? AuditRedactor.sanitize(options.metadata) : undefined;

      const record = await prisma.enterpriseAuditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          userNameSnapshot: ctx.userNameSnapshot,
          roleSnapshot: ctx.roleSnapshot,
          branchId: ctx.branchId,
          branchNameSnapshot: ctx.branchNameSnapshot,
          module: options.module,
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId ? String(options.entityId) : undefined,
          entityDisplayName: options.entityDisplayName,
          description: options.description,
          before: finalBefore as any,
          after: finalAfter as any,
          changedFields,
          reason: options.reason,
          approvalId: options.approvalId,
          approvedById: options.approvedById,
          approvedByNameSnapshot: options.approvedByNameSnapshot,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          deviceInfo: ctx.deviceInfo,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          status: options.status || "SUCCESS",
          failureReason: options.failureReason,
          severity: options.severity || (options.isSecurityEvent ? "HIGH" : "INFO"),
          isSecurityEvent: Boolean(options.isSecurityEvent),
          metadata: sanitizedMetadata as any,
        },
      });

      return record;
    } catch (err: any) {
      console.error("[AuditLogService.recordBusinessEvent] Safe logging error:", err.message);
      return null;
    }
  }

  /**
   * Records a technical API request log (Layer 1).
   */
  public static async recordTechnicalLog(options: RecordTechnicalLogOptions): Promise<void> {
    try {
      await prisma.technicalRequestLog.create({
        data: {
          tenantId: options.tenantId || "default-tenant",
          requestId: options.requestId,
          method: options.method,
          route: options.route,
          statusCode: options.statusCode,
          responseTimeMs: options.responseTimeMs,
          ipAddress: options.ipAddress,
          userId: options.userId,
          userNameSnapshot: options.userNameSnapshot,
          userAgent: options.userAgent?.slice(0, 255),
        },
      });
    } catch (err: any) {
      console.error("[AuditLogService.recordTechnicalLog] Error:", err.message);
    }
  }

  /**
   * Multi-criteria search and query for Enterprise Audit Logs.
   */
  public static async queryLogs(params: AuditQueryParams) {
    const tenantId = params.tenantId || "default-tenant";
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (params.module && params.module !== "ALL") {
      where.module = params.module;
    }

    if (params.action && params.action !== "ALL") {
      where.action = params.action;
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params.severity && params.severity !== "ALL") {
      where.severity = params.severity;
    }

    if (params.isSecurityEvent !== undefined) {
      where.isSecurityEvent = params.isSecurityEvent;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.role && params.role !== "ALL") {
      where.roleSnapshot = params.role;
    }

    if (params.branchId) {
      where.branchId = params.branchId;
    }

    if (params.entityType && params.entityType !== "ALL") {
      where.entityType = params.entityType;
    }

    if (params.entityId) {
      where.entityId = params.entityId;
    }

    if (params.ipAddress) {
      where.ipAddress = { contains: params.ipAddress, mode: "insensitive" };
    }

    if (params.correlationId) {
      where.correlationId = params.correlationId;
    }

    // Date Range
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) {
        where.createdAt.gte = new Date(params.from);
      }
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Free Text Search
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { userNameSnapshot: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { entityDisplayName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { ipAddress: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
        { requestId: { contains: q, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.enterpriseAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.enterpriseAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves full chronological activity timeline for a specific ERP entity.
   */
  public static async queryEntityTimeline(tenantId: string, entityType: string, entityId: string) {
    const logs = await prisma.enterpriseAuditLog.findMany({
      where: {
        tenantId,
        entityType,
        entityId: String(entityId),
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return logs;
  }

  /**
   * Retrieves summary of all actions performed by a specific user.
   */
  public static async queryUserActivity(tenantId: string, userId: number, from?: Date, to?: Date) {
    const where: any = {
      tenantId,
      userId,
      ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
    };

    const [totalEvents, moduleCounts, recentLogs] = await Promise.all([
      prisma.enterpriseAuditLog.count({ where }),
      prisma.enterpriseAuditLog.groupBy({
        by: ["module"],
        where,
        _count: { id: true },
      }),
      prisma.enterpriseAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    return {
      totalEvents,
      moduleBreakdown: moduleCounts.map((m) => ({ module: m.module, count: m._count.id })),
      recentLogs,
    };
  }

  /**
   * Computes high-level KPI dashboard metrics for Audit Logs.
   */
  public static async getAuditMetrics(tenantId = "default-tenant", branchId?: number) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const baseWhere: any = {
      tenantId,
      ...(branchId ? { branchId } : {}),
    };

    const todayWhere = {
      ...baseWhere,
      createdAt: { gte: startOfToday },
    };

    const [
      totalToday,
      successToday,
      failedToday,
      securityEventsToday,
      topModules,
      recentHighRisk,
    ] = await Promise.all([
      prisma.enterpriseAuditLog.count({ where: todayWhere }),
      prisma.enterpriseAuditLog.count({ where: { ...todayWhere, status: "SUCCESS" } }),
      prisma.enterpriseAuditLog.count({
        where: { ...todayWhere, status: { in: ["FAILED", "BLOCKED", "DENIED"] } },
      }),
      prisma.enterpriseAuditLog.count({
        where: { ...todayWhere, isSecurityEvent: true },
      }),
      prisma.enterpriseAuditLog.groupBy({
        by: ["module"],
        where: todayWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
      prisma.enterpriseAuditLog.findMany({
        where: {
          ...baseWhere,
          severity: { in: ["HIGH", "CRITICAL"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      totalToday,
      successToday,
      failedToday,
      securityEventsToday,
      topModules: topModules.map((m) => ({ module: m.module, count: m._count.id })),
      recentHighRisk,
    };
  }

  /**
   * Generates a CSV stream of filtered audit logs and logs the export event.
   */
  public static async exportLogs(
    params: AuditQueryParams,
    exporterUserId?: number,
    exporterEmail?: string
  ): Promise<string> {
    const result = await this.queryLogs({ ...params, limit: 1000 });
    const logs = result.logs;

    // Build CSV header
    const headers = [
      "Timestamp",
      "Module",
      "Action",
      "Status",
      "Severity",
      "User",
      "Role",
      "Branch",
      "Entity Type",
      "Entity ID",
      "Entity Display Name",
      "Description",
      "Changed Fields",
      "Reason",
      "Client IP",
      "Request ID",
    ];

    const rows = logs.map((log) => [
      `"${new Date(log.createdAt).toISOString()}"`,
      `"${log.module}"`,
      `"${log.action}"`,
      `"${log.status}"`,
      `"${log.severity}"`,
      `"${(log.userNameSnapshot || "").replace(/"/g, '""')}"`,
      `"${(log.roleSnapshot || "").replace(/"/g, '""')}"`,
      `"${(log.branchNameSnapshot || "").replace(/"/g, '""')}"`,
      `"${(log.entityType || "").replace(/"/g, '""')}"`,
      `"${(log.entityId || "").replace(/"/g, '""')}"`,
      `"${(log.entityDisplayName || "").replace(/"/g, '""')}"`,
      `"${(log.description || "").replace(/"/g, '""')}"`,
      `"${(log.changedFields || []).join(", ")}"`,
      `"${(log.reason || "").replace(/"/g, '""')}"`,
      `"${log.ipAddress || ""}"`,
      `"${log.requestId || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // Record the export action in audit logs
    await this.recordBusinessEvent({
      module: "AUDIT",
      action: "AUDIT.LOG_EXPORTED",
      entityType: "AUDIT_EXPORT",
      description: `Exported ${logs.length} audit records to CSV`,
      context: {
        tenantId: params.tenantId || "default-tenant",
        userId: exporterUserId,
        userNameSnapshot: exporterEmail,
      },
      metadata: {
        recordCount: logs.length,
        filterParams: params,
      },
    });

    return csvContent;
  }

  /**
   * Fetches or initializes audit retention policy.
   */
  public static async getRetentionPolicy(tenantId = "default-tenant") {
    let policy = await prisma.auditRetentionPolicy.findUnique({
      where: { tenantId },
    });

    if (!policy) {
      policy = await prisma.auditRetentionPolicy.create({
        data: { tenantId },
      });
    }

    return policy;
  }

  /**
   * Updates audit retention policy.
   */
  public static async updateRetentionPolicy(tenantId = "default-tenant", data: any) {
    const updated = await prisma.auditRetentionPolicy.upsert({
      where: { tenantId },
      update: {
        businessLogRetentionDays: data.businessLogRetentionDays ? parseInt(data.businessLogRetentionDays, 10) : 365,
        technicalLogRetentionDays: data.technicalLogRetentionDays ? parseInt(data.technicalLogRetentionDays, 10) : 30,
        autoArchiveEnabled: Boolean(data.autoArchiveEnabled),
        highRiskAlertEmail: data.highRiskAlertEmail?.trim() || null,
      },
      create: {
        tenantId,
        businessLogRetentionDays: data.businessLogRetentionDays ? parseInt(data.businessLogRetentionDays, 10) : 365,
        technicalLogRetentionDays: data.technicalLogRetentionDays ? parseInt(data.technicalLogRetentionDays, 10) : 30,
        autoArchiveEnabled: Boolean(data.autoArchiveEnabled),
        highRiskAlertEmail: data.highRiskAlertEmail?.trim() || null,
      },
    });

    // Record policy update in audit trail
    await this.recordBusinessEvent({
      module: "AUDIT",
      action: "AUDIT.RETENTION_UPDATED",
      entityType: "RETENTION_POLICY",
      description: `Updated audit retention policy to ${updated.businessLogRetentionDays} days`,
      metadata: { policy: updated },
    });

    return updated;
  }
}
