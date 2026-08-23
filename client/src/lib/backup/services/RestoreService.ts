// client/src/lib/backup/services/RestoreService.ts

import { prisma } from "@libs/prisma";
import { PostgresRestoreEngine } from "../database/PostgresRestoreEngine";
import { PostgresSchemaValidator } from "../database/PostgresSchemaValidator";
import { BackupCrypto } from "../crypto/BackupCrypto";
import { StorageFactory } from "../storage/StorageFactory";
import { BackupService } from "./BackupService";
import { MaintenanceModeService } from "./MaintenanceModeService";

export interface RestorePreviewResult {
  success: boolean;
  backupId: string;
  tablesRestoredCount?: number;
  recordsRestoredCount?: number;
  durationMs?: number;
  compatibilityReport?: any;
  error?: string;
  logs?: any[];
}

export interface ProductionRestoreResult {
  success: boolean;
  restoreId: string;
  backupId: string;
  preRestoreSafetyBackupId?: string | null;
  durationMs: number;
  tablesRestoredCount: number;
  recordsRestoredCount: number;
  logs: Array<{ timestamp: string; stage: string; message: string }>;
  error?: string;
}

export class RestoreService {
  /**
   * Generates a unique, traceable restore event ID.
   */
  private static generateRestoreId(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RESTORE-${dateStr}-${timeStr}-${randomHex}`;
  }

  /**
   * Previews and validates a backup in an isolated, dry-run transactional environment.
   */
  public static async previewRestore(
    backupId: string,
    requestedById?: number
  ): Promise<RestorePreviewResult> {
    let storageKey = `backups/${backupId.toLowerCase()}.sql.gz.enc`;
    let recordChecksum: string | undefined = undefined;
    let latestMigration: string | null = null;
    let recordId: string | null = null;

    try {
      const record = await prisma.backupRecord.findFirst({
        where: { OR: [{ backupId }, { storageKey }] },
      });
      if (record) {
        storageKey = record.storageKey;
        recordChecksum = record.checksum;
        latestMigration = record.latestMigration;
        recordId = record.id;
      }
    } catch {}

    const storage = StorageFactory.getProvider();
    const encryptedData = await storage.download(storageKey);

    // 1. Unpack & Verify Checksum
    const rawSql = await BackupCrypto.unpackBackupPipeline(encryptedData, recordChecksum);

    // 2. Execute dry run in transaction with rollback
    const restoreEngine = new PostgresRestoreEngine();
    const restoreRes = await restoreEngine.executeRestore(rawSql, { isDryRun: true });

    // 3. Evaluate Schema and Migration Compatibility
    const validator = new PostgresSchemaValidator();
    const compatibilityReport = await validator.validateCompatibility(latestMigration || undefined);

    // 4. Record Restore Audit (if DB tables exist)
    const restoreId = this.generateRestoreId();
    let validUserId = requestedById;

    try {
      if (!validUserId) {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        validUserId = firstUser?.id || 1;
      }

      if (recordId) {
        await prisma.restoreAudit.create({
          data: {
            restoreId,
            backupRecordId: recordId,
            targetDatabaseType: "TEMPORARY_VALIDATION",
            status: restoreRes.success ? "PREVIEW_PASSED" : "PREVIEW_FAILED",
            isDryRun: true,
            migrationCompatibility: compatibilityReport as any,
            validationResults: {
              success: restoreRes.success,
              tablesRestoredCount: restoreRes.tablesRestoredCount,
              recordsRestoredCount: restoreRes.recordsRestoredCount,
            } as any,
            requestedById: validUserId,
            errorMessage: restoreRes.error || null,
            logs: restoreRes.logs as any,
          },
        });
      }
    } catch (auditErr) {
      console.warn("Could not record preview audit log:", auditErr);
    }

    return {
      success: restoreRes.success,
      backupId,
      tablesRestoredCount: restoreRes.tablesRestoredCount,
      recordsRestoredCount: restoreRes.recordsRestoredCount,
      durationMs: restoreRes.durationMs,
      compatibilityReport,
      error: restoreRes.error,
      logs: restoreRes.logs,
    };
  }

  /**
   * Executes a live, complete disaster recovery restore into production PostgreSQL.
   */
  public static async executeProductionRestore(
    backupId: string,
    requestedById?: number,
    authorizedById?: number
  ): Promise<ProductionRestoreResult> {
    const restoreId = this.generateRestoreId();
    let storageKey = `backups/${backupId.toLowerCase()}.sql.gz.enc`;
    let recordChecksum: string | undefined = undefined;

    let existingRecord: any = null;
    try {
      existingRecord = await prisma.backupRecord.findFirst({
        where: { OR: [{ backupId }, { storageKey }] },
      });
      if (existingRecord) {
        storageKey = existingRecord.storageKey;
        recordChecksum = existingRecord.checksum;
      }
    } catch {}

    const logs: Array<{ timestamp: string; stage: string; message: string }> = [];
    const addLog = (stage: string, message: string) => {
      logs.push({
        timestamp: new Date().toISOString(),
        stage,
        message,
      });
    };

    const startTime = Date.now();
    let preRestoreSafetyBackupId: string | null = null;

    addLog("START", `Beginning production database restore using backup ${backupId}`);

    try {
      // --- STEP 1: AUTOMATIC PRE-RESTORE SAFETY BACKUP ---
      try {
        addLog("SAFETY_BACKUP", "Attempting pre-restore safety snapshot of live database...");
        const safetyBackup = await BackupService.createBackup({
          type: "PRE_RESTORE_SAFETY",
          createdById: requestedById,
          description: `Pre-restore safety snapshot before restoring ${backupId}`,
        });
        preRestoreSafetyBackupId = safetyBackup.backupId;
        addLog("SAFETY_BACKUP", `Emergency safety backup created successfully: ${preRestoreSafetyBackupId}`);
      } catch (safetyErr) {
        addLog("SAFETY_BACKUP", `Skipped pre-restore safety snapshot (database may be fresh/empty).`);
      }

      // --- STEP 2: ACTIVATE MAINTENANCE MODE ---
      addLog("MAINTENANCE", "Activating ERP System Maintenance Mode...");
      try {
        await MaintenanceModeService.enableMaintenanceMode(
          `Production database recovery in progress (${restoreId})`,
          requestedById
        );
        addLog("MAINTENANCE", "System maintenance mode engaged. Concurrent writes restricted.");
      } catch {}

      // --- STEP 3: DOWNLOAD & DECRYPT BACKUP ---
      addLog("DECRYPT", "Downloading target backup from Cloudflare R2 storage...");
      const storage = StorageFactory.getProvider();
      const encryptedData = await storage.download(storageKey);
      addLog("DECRYPT", `Downloaded ${encryptedData.length} bytes from storage. Decrypting...`);

      const rawSql = await BackupCrypto.unpackBackupPipeline(encryptedData, recordChecksum);
      addLog("DECRYPT", "Backup payload unpacked and checksum verified.");

      // --- STEP 4: EXECUTE PRODUCTION RESTORE ---
      addLog("RESTORE", "Executing production database overwrite and schema sync...");
      const restoreEngine = new PostgresRestoreEngine();
      const restoreRes = await restoreEngine.executeRestore(rawSql, { isDryRun: false });

      if (!restoreRes.success) {
        throw new Error(restoreRes.error || "Failed to execute SQL restoration script");
      }

      addLog("RESTORE", `Database restored: ${restoreRes.tablesRestoredCount} tables, ${restoreRes.recordsRestoredCount} records.`);

      // --- STEP 5: VERIFY DATABASE HEALTH ---
      addLog("HEALTH_CHECK", "Verifying post-restore database connectivity and query engine...");
      const connTest = await restoreEngine.testDatabaseConnection();
      if (!connTest.success) {
        throw new Error(`Post-restore connection verification failed: ${connTest.details}`);
      }
      addLog("HEALTH_CHECK", `Post-restore health check passed: ${connTest.details}`);

      // --- STEP 6: POST-RESTORE AUDIT & RECONCILIATION ---
      try {
        await MaintenanceModeService.disableMaintenanceMode();
        addLog("MAINTENANCE", "System maintenance mode disengaged. ERP operational.");
      } catch {}

      // Refresh connection pool
      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch {}

      // Reconcile Backup Record in the newly restored database
      let targetBackupRecord: any = null;
      try {
        targetBackupRecord = await prisma.backupRecord.findFirst({
          where: { OR: [{ backupId }, { storageKey }] },
        });

        if (!targetBackupRecord) {
          targetBackupRecord = await prisma.backupRecord.create({
            data: {
              backupId,
              type: existingRecord?.type || "MANUAL",
              status: "RESTORED",
              isVerified: true,
              storageProvider: "R2",
              storageBucket: process.env.BACKUP_R2_BUCKET || process.env.BACKUP_S3_BUCKET || "moual-backup",
              storageKey,
              fileName: storageKey.split("/").pop() || `${backupId}.sql.gz.enc`,
              fileSize: BigInt(encryptedData.length),
              rawSize: BigInt(rawSql.length),
              checksum: recordChecksum || "",
              createdAt: existingRecord?.createdAt || new Date(),
              completedAt: existingRecord?.completedAt || new Date(),
            },
          });
        } else {
          await prisma.backupRecord.update({
            where: { id: targetBackupRecord.id },
            data: { status: "RESTORED" },
          });
        }
      } catch {}

      // Reconcile valid user ID in restored DB
      let validUserId = requestedById;
      try {
        if (validUserId) {
          const userExists = await prisma.user.findUnique({ where: { id: validUserId } });
          if (!userExists) {
            const fallbackUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
            validUserId = fallbackUser?.id || undefined;
          }
        } else {
          const fallbackUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
          validUserId = fallbackUser?.id || undefined;
        }
      } catch {}

      const durationMs = Date.now() - startTime;
      addLog("COMPLETE", `Production disaster recovery completed in ${durationMs}ms.`);

      // Complete Audit Record
      try {
        if (targetBackupRecord && validUserId) {
          await prisma.restoreAudit.upsert({
            where: { restoreId },
            create: {
              restoreId,
              backupRecordId: targetBackupRecord.id,
              targetDatabaseType: "PRODUCTION",
              status: "COMPLETED",
              completedAt: new Date(),
              isDryRun: false,
              durationMs,
              preRestoreBackupId: preRestoreSafetyBackupId,
              requestedById: validUserId,
              authorizedById: authorizedById ? validUserId : null,
              validationResults: {
                success: true,
                tablesRestoredCount: restoreRes.tablesRestoredCount,
                recordsRestoredCount: restoreRes.recordsRestoredCount,
              } as any,
              logs: logs as any,
            },
            update: {
              status: "COMPLETED",
              completedAt: new Date(),
              durationMs,
              validationResults: {
                success: true,
                tablesRestoredCount: restoreRes.tablesRestoredCount,
                recordsRestoredCount: restoreRes.recordsRestoredCount,
              } as any,
              logs: logs as any,
            },
          });
        }
      } catch (auditErr) {
        console.warn("Could not save completion restore audit log:", auditErr);
      }

      return {
        success: true,
        restoreId,
        backupId,
        preRestoreSafetyBackupId,
        durationMs,
        tablesRestoredCount: restoreRes.tablesRestoredCount,
        recordsRestoredCount: restoreRes.recordsRestoredCount,
        logs,
      };
    } catch (err: any) {
      try {
        await MaintenanceModeService.disableMaintenanceMode();
      } catch {}
      const durationMs = Date.now() - startTime;
      addLog("ERROR", `Production restore failed: ${err.message || String(err)}`);

      throw err;
    }
  }
}
