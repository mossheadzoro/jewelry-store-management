// client/src/lib/backup/services/RetentionService.ts

import { prisma } from "@/lib/prisma";
import { StorageFactory } from "../storage/StorageFactory";

export interface RetentionCleanupReport {
  evaluatedCount: number;
  expiredCount: number;
  deletedKeys: string[];
  preservedCount: number;
  errors: string[];
}

export class RetentionService {
  /**
   * Evaluates all verified backups against configured daily, weekly, and monthly retention policies.
   */
  public static async enforceRetention(): Promise<RetentionCleanupReport> {
    const report: RetentionCleanupReport = {
      evaluatedCount: 0,
      expiredCount: 0,
      deletedKeys: [],
      preservedCount: 0,
      errors: [],
    };

    try {
      // 1. Fetch retention configuration
      let settings = await prisma.backupSettings.findUnique({ where: { id: 1 } });
      if (!settings) {
        settings = await prisma.backupSettings.create({
          data: {
            id: 1,
            retentionDaily: 30,
            retentionWeekly: 12,
            retentionMonthly: 12,
          },
        });
      }

      const { retentionDaily, retentionWeekly, retentionMonthly } = settings;

      // 2. Fetch all verified backups ordered by creation descending
      const backups = await prisma.backupRecord.findMany({
        where: {
          status: { in: ["VERIFIED", "RESTORED"] },
        },
        orderBy: { createdAt: "desc" },
      });

      report.evaluatedCount = backups.length;

      // Hard safety check: If only 1 backup exists, NEVER delete it
      if (backups.length <= 1) {
        report.preservedCount = backups.length;
        return report;
      }

      const now = new Date();
      const dailyCutoff = new Date(now.getTime() - retentionDaily * 24 * 60 * 60 * 1000);
      const weeklyCutoff = new Date(now.getTime() - retentionWeekly * 7 * 24 * 60 * 60 * 1000);
      const monthlyCutoff = new Date(now.getTime() - retentionMonthly * 30 * 24 * 60 * 60 * 1000);

      // Track kept weeks and months to preserve one per period
      const keptWeeks = new Set<string>();
      const keptMonths = new Set<string>();
      const backupsToKeep = new Set<string>();

      // ALWAYS keep the latest verified backup
      backupsToKeep.add(backups[0].id);

      for (const backup of backups) {
        const date = new Date(backup.createdAt);
        const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        const monthKey = `${date.getFullYear()}-M${date.getMonth() + 1}`;

        // 1. Within Daily retention?
        if (date >= dailyCutoff) {
          backupsToKeep.add(backup.id);
          continue;
        }

        // 2. Within Weekly retention? Keep 1 per week
        if (date >= weeklyCutoff && !keptWeeks.has(weekKey)) {
          keptWeeks.add(weekKey);
          backupsToKeep.add(backup.id);
          continue;
        }

        // 3. Within Monthly retention? Keep 1 per month
        if (date >= monthlyCutoff && !keptMonths.has(monthKey)) {
          keptMonths.add(monthKey);
          backupsToKeep.add(backup.id);
          continue;
        }

        // 4. Pre-restore safety backups from the last 7 days are protected
        if (backup.type === "PRE_RESTORE_SAFETY" && date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
          backupsToKeep.add(backup.id);
          continue;
        }
      }

      // Final sanity check: Ensure at least one verified backup remains
      if (backupsToKeep.size === 0 && backups.length > 0) {
        backupsToKeep.add(backups[0].id);
      }

      report.preservedCount = backupsToKeep.size;

      // 3. Delete expired backups from storage and mark status as EXPIRED
      const storage = StorageFactory.getProvider();

      for (const backup of backups) {
        if (!backupsToKeep.has(backup.id)) {
          try {
            // Delete from S3/R2 storage
            await storage.delete(backup.storageKey);
            report.deletedKeys.push(backup.storageKey);

            // Update database status
            await prisma.backupRecord.update({
              where: { id: backup.id },
              data: { status: "EXPIRED" },
            });

            report.expiredCount++;
          } catch (err: any) {
            report.errors.push(`Failed to purge backup ${backup.backupId}: ${err.message || String(err)}`);
          }
        }
      }

      return report;
    } catch (err: any) {
      report.errors.push(`Retention evaluation error: ${err.message || String(err)}`);
      return report;
    }
  }
}
