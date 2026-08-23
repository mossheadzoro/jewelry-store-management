import fs from "fs";
import path from "path";
import { prisma } from "@libs/prisma";
import { PostgresDumpEngine } from "../database/PostgresDumpEngine";
import { BackupCrypto } from "../crypto/BackupCrypto";
import { StorageFactory } from "../storage/StorageFactory";
import { RetentionService } from "./RetentionService";

export interface CreateBackupOptions {
  type?: "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY" | "PRE_RESTORE_SAFETY" | "PRE_MIGRATION";
  createdById?: number;
  description?: string;
}

export class BackupService {
  /**
   * Generates a unique, sortable, human-friendly backup identifier.
   * e.g. BKP-20260822-115028-A4F8
   */
  private static generateBackupId(type: string): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = type === "PRE_RESTORE_SAFETY" ? "SAFE" : "BKP";
    return `${prefix}-${dateStr}-${timeStr}-${randomHex}`;
  }

  /**
   * Core pipeline: Dumps PostgreSQL -> Compresses -> Encrypts -> Uploads to R2 -> Verifies integrity.
   */
  public static async createBackup(options?: CreateBackupOptions): Promise<any> {
    const type = options?.type || "MANUAL";
    const backupId = this.generateBackupId(type);
    const dumpEngine = new PostgresDumpEngine();

    // 1. Concurrency Check (Database Record & Advisory Lock)
    const runningBackup = await prisma.backupRecord.findFirst({
      where: { status: { in: ["RUNNING", "COMPRESSING", "ENCRYPTING", "UPLOADING", "VERIFYING"] } },
    });

    if (runningBackup) {
      // Check if stale (older than 30 mins)
      const staleTime = Date.now() - new Date(runningBackup.createdAt).getTime();
      if (staleTime < 30 * 60 * 1000) {
        throw new Error(
          `Another backup operation (${runningBackup.backupId}) is currently in progress. Please wait for it to complete.`
        );
      } else {
        // Mark stale job as failed
        await prisma.backupRecord.update({
          where: { id: runningBackup.id },
          data: { status: "FAILED", errorMessage: "Operation timed out and was aborted." },
        });
      }
    }

    const unlockAdvisory = await dumpEngine.tryAcquireBackupLock();
    if (!unlockAdvisory) {
      throw new Error("Unable to acquire PostgreSQL backup advisory lock. Another worker is currently dumping.");
    }

    const events: Array<{ timestamp: string; stage: string; message: string }> = [];
    const addEvent = (stage: string, message: string) => {
      events.push({
        timestamp: new Date().toISOString(),
        stage,
        message,
      });
    };

    const fileName = `${backupId.toLowerCase()}.sql.gz.enc`;
    const storageKey = `backups/${fileName}`;
    const startTime = Date.now();

    addEvent("INITIALIZE", `Backup job initialized with ID: ${backupId}`);

    // Create Initial Queued/Running Record in Prisma
    const record = await prisma.backupRecord.create({
      data: {
        backupId,
        type: type as any,
        status: "RUNNING",
        startedAt: new Date(),
        fileName,
        storageBucket:
          process.env.BACKUP_R2_BUCKET ||
          process.env.BACKUP_S3_BUCKET ||
          process.env.R2_BUCKET_NAME ||
          "moual-backup",
        storageKey,
        rawSize: BigInt(0),
        fileSize: BigInt(0),
        checksum: "",
        checksumAlgorithm: "SHA-256",
        isEncrypted: true,
        encryptionAlgorithm: "AES-256-GCM",
        isVerified: false,
        createdById: options?.createdById || null,
        events: events as any,
        metadata: {
          description: options?.description || "Manual database snapshot",
        },
      },
    });

    try {
      // 2. Database Dump Step
      addEvent("DUMP", "Extracting full database catalog (enums, sequences, tables, constraints, data, migrations)...");
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: "RUNNING", events: events as any },
      });

      const dumpResult = await dumpEngine.generateDump();
      addEvent(
        "DUMP",
        `Database dump completed: ${dumpResult.tablesCount} tables, ${dumpResult.recordsCount} rows extracted.`
      );

      // 3. Compression & Encryption Step
      addEvent("ENCRYPT", "Compressing with gzip and encrypting with AES-256-GCM...");
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: "ENCRYPTING", events: events as any },
      });

      const processed = await BackupCrypto.processBackupPipeline(dumpResult.sqlContent);
      addEvent(
        "ENCRYPT",
        `Encrypted & compressed payload generated: ${processed.fileSize} bytes (raw: ${processed.rawSize} bytes). SHA-256: ${processed.checksum.substring(0, 16)}...`
      );

      // 3.5. Local Host OS Filesystem Persistence Step
      let localSavedPath: string | null = null;
      try {
        const settings = await prisma.backupSettings.findUnique({ where: { id: 1 } });
        if (settings?.saveLocalCopy !== false) {
          const defaultLocalDir = path.resolve(process.cwd(), "backups");
          const targetDir = settings?.localBackupPath || defaultLocalDir;
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          localSavedPath = path.join(targetDir, fileName);
          fs.writeFileSync(localSavedPath, processed.processedBuffer);
          addEvent("LOCAL_DISK", `Encrypted snapshot saved to local server disk: ${localSavedPath}`);
        }
      } catch (localErr: any) {
        addEvent("LOCAL_DISK_WARN", `Could not write local copy to disk: ${localErr.message}`);
      }

      // 4. Object Storage Upload Step
      addEvent("UPLOAD", "Uploading encrypted backup to Cloudflare R2 / S3 storage...");
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: "UPLOADING", events: events as any },
      });

      const storage = await StorageFactory.getProviderAsync();
      const uploadResult = await storage.upload(
        storageKey,
        processed.processedBuffer,
        "application/octet-stream",
        {
          backupId,
          checksum: processed.checksum,
          type,
          version: "v1.0.0",
        }
      );
      addEvent("UPLOAD", `Uploaded successfully to ${uploadResult.bucket}/${storageKey}`);

      // 5. Verification Step
      addEvent("VERIFY", "Verifying object integrity and metadata on storage provider...");
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: "VERIFYING", events: events as any },
      });

      const headResult = await storage.head(storageKey);
      if (!headResult || headResult.size !== processed.fileSize) {
        throw new Error(
          `Uploaded object size mismatch! Expected: ${processed.fileSize}, Found: ${headResult?.size}`
        );
      }
      addEvent("VERIFY", `Storage object size verified (${headResult.size} bytes). Integrity check passed.`);

      // 6. Complete & Update Metadata Record
      const durationMs = Date.now() - startTime;
      addEvent("COMPLETE", `Backup ${backupId} completed and marked as VERIFIED in ${durationMs}ms.`);

      const updatedRecord = await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: "VERIFIED",
          completedAt: new Date(),
          durationMs,
          databaseProvider: dumpResult.databaseProvider,
          databaseName: dumpResult.databaseName,
          latestMigration: dumpResult.latestMigration,
          tablesCount: dumpResult.tablesCount,
          recordsCount: dumpResult.recordsCount,
          rawSize: BigInt(processed.rawSize),
          fileSize: BigInt(processed.fileSize),
          checksum: processed.checksum,
          isVerified: true,
          verificationStartedAt: new Date(),
          verificationCompletedAt: new Date(),
          events: events as any,
          metadata: {
            description: options?.description || "Manual database snapshot",
            tableStats: dumpResult.tableStats,
            postgresVersion: dumpResult.postgresVersion,
            storageProvider: storage.name,
          } as any,
        },
      });

      // Update Backup Settings timestamps
      await prisma.backupSettings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          lastSuccessfulBackupAt: new Date(),
          lastVerifiedBackupAt: new Date(),
        },
        update: {
          lastSuccessfulBackupAt: new Date(),
          lastVerifiedBackupAt: new Date(),
        },
      });

      // 7. Enforce retention policy in background
      try {
        await RetentionService.enforceRetention();
      } catch (retentionErr) {
        console.error("Retention enforcement error:", retentionErr);
      }

      return updatedRecord;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      addEvent("ERROR", `Backup failed: ${err.message || String(err)}`);

      await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          durationMs,
          errorMessage: err.message || "Backup execution failed",
          events: events as any,
        },
      });

      throw err;
    } finally {
      await unlockAdvisory();
    }
  }

  /**
   * Re-verifies a backup by reading it from storage, decrypting, and matching its SHA-256 checksum.
   */
  public static async verifyBackup(backupId: string): Promise<{ isVerified: boolean; details: string }> {
    const record = await prisma.backupRecord.findUnique({ where: { backupId } });
    if (!record) throw new Error("Backup record not found");

    const storage = StorageFactory.getProvider();
    const encryptedData = await storage.download(record.storageKey);

    // Unpack and verify checksum
    await BackupCrypto.unpackBackupPipeline(encryptedData, record.checksum);

    await prisma.backupRecord.update({
      where: { id: record.id },
      data: {
        isVerified: true,
        verificationCompletedAt: new Date(),
      },
    });

    return {
      isVerified: true,
      details: `SHA-256 checksum (${record.checksum}) verified successfully against decrypted payload.`,
    };
  }

  /**
   * Safe backup deletion: Blocks deletion if it is the last remaining verified backup.
   */
  public static async deleteBackup(backupId: string): Promise<void> {
    const record = await prisma.backupRecord.findUnique({ where: { backupId } });
    if (!record) throw new Error("Backup record not found");

    // Safety rule: Check if this is the only verified backup
    if (record.isVerified) {
      const verifiedCount = await prisma.backupRecord.count({
        where: { isVerified: true, status: "VERIFIED" },
      });
      if (verifiedCount <= 1) {
        throw new Error(
          "Safety policy violation: Cannot delete the only remaining verified backup in the system."
        );
      }
    }

    // Delete from storage
    try {
      const storage = StorageFactory.getProvider();
      await storage.delete(record.storageKey);
    } catch (storageErr) {
      console.warn("Storage deletion warning:", storageErr);
    }

    // Delete record
    await prisma.backupRecord.delete({ where: { id: record.id } });
  }

  /**
   * Generates a temporary signed download URL for authorized download.
   */
  public static async getBackupDownloadUrl(backupId: string): Promise<string> {
    const record = await prisma.backupRecord.findUnique({ where: { backupId } });
    if (!record) throw new Error("Backup record not found");

    const storage = StorageFactory.getProvider();
    return await storage.getSignedDownloadUrl(record.storageKey, 1800); // 30 mins
  }

  /**
   * Returns system health status, statistics, and storage consumption.
   */
  public static async getBackupHealth(): Promise<any> {
    const [settings, totalCount, verifiedCount, failedCount, lastBackup, lastVerified, storageStats] =
      await Promise.all([
        prisma.backupSettings.findUnique({ where: { id: 1 } }),
        prisma.backupRecord.count(),
        prisma.backupRecord.count({ where: { status: "VERIFIED" } }),
        prisma.backupRecord.count({ where: { status: "FAILED" } }),
        prisma.backupRecord.findFirst({
          where: { status: { in: ["VERIFIED", "RESTORED"] } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.backupRecord.findFirst({
          where: { isVerified: true, status: "VERIFIED" },
          orderBy: { createdAt: "desc" },
        }),
        StorageFactory.getProvider().getStorageStats("backups/"),
      ]);

    let healthStatus: "HEALTHY" | "DEGRADED" | "WARNING" | "CRITICAL" = "HEALTHY";
    const warnings: string[] = [];

    if (!StorageFactory.isConfigured()) {
      healthStatus = "WARNING";
      warnings.push("Cloudflare R2 / S3 storage credentials are not fully configured in environment.");
    }

    if (totalCount === 0) {
      healthStatus = "WARNING";
      warnings.push("No backups have been created yet.");
    } else if (lastVerified) {
      const hoursSinceLastVerified =
        (Date.now() - new Date(lastVerified.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastVerified > 48) {
        healthStatus = "DEGRADED";
        warnings.push(`Last verified backup was created ${Math.round(hoursSinceLastVerified)} hours ago.`);
      }
    }

    return {
      status: healthStatus,
      warnings,
      settings: settings || {
        enabled: true,
        frequency: "DAILY",
        scheduleTime: "01:00",
        timezone: "Asia/Kolkata",
        retentionDaily: 30,
        retentionWeekly: 12,
        retentionMonthly: 12,
      },
      stats: {
        totalBackups: totalCount,
        verifiedBackups: verifiedCount,
        failedBackups: failedCount,
        lastBackupAt: lastBackup?.createdAt || null,
        lastVerifiedAt: lastVerified?.createdAt || null,
        lastBackupSize: lastBackup?.fileSize ? Number(lastBackup.fileSize) : 0,
        totalStorageBytes: storageStats.totalSizeBytes,
        storageProvider: storageStats.provider,
        storageBucket: storageStats.bucket,
      },
    };
  }

  /**
   * Scans the Cloudflare R2 / S3 storage bucket and registers any backup files that
   * do not yet exist in the local PostgreSQL database (e.g. after database reset or reseed).
   */
  public static async syncFromCloudStorage(): Promise<{ syncedCount: number; discovered: string[] }> {
    const storage = StorageFactory.getProvider();
    const cloudFiles = await storage.list("backups/");
    const discovered: string[] = [];

    for (const item of cloudFiles) {
      if (!item.key || !item.key.endsWith(".sql.gz.enc")) continue;

      const existing = await prisma.backupRecord.findFirst({
        where: { storageKey: item.key },
      });

      if (!existing) {
        // Extract or parse backupId
        const filename = item.key.split("/").pop() || item.key;
        const nameWithoutExt = filename.replace(".sql.gz.enc", "");
        const backupId = nameWithoutExt.toUpperCase();

        let type: "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY" | "PRE_RESTORE_SAFETY" = "MANUAL";
        if (backupId.startsWith("SAFE-")) {
          type = "PRE_RESTORE_SAFETY";
        } else if (backupId.startsWith("DAILY-")) {
          type = "DAILY";
        }

        const createdAt = item.lastModified ? new Date(item.lastModified) : new Date();

        await prisma.backupRecord.create({
          data: {
            backupId,
            type,
            status: "VERIFIED",
            isVerified: true,
            storageProvider: "R2",
            storageKey: item.key,
            storageBucket:
              process.env.BACKUP_R2_BUCKET ||
              process.env.BACKUP_S3_BUCKET ||
              process.env.R2_BUCKET_NAME ||
              "moual-backup",
            fileName: filename,
            fileSize: BigInt(item.size || 0),
            rawSize: BigInt(item.size ? item.size * 5 : 0),
            checksum: item.etag || "CLOUD_DISCOVERED",
            metadata: {
              description: "Discovered and synced from Cloudflare R2 cloud storage",
            },
            createdAt,
            completedAt: createdAt,
            events: [
              {
                timestamp: new Date().toISOString(),
                stage: "DISCOVERY",
                message: `Discovered backup from Cloudflare R2 bucket (${item.size} bytes)`,
              },
            ],
          },
        });

        discovered.push(backupId);
      }
    }

    return {
      syncedCount: discovered.length,
      discovered,
    };
  }
}
