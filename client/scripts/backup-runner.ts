// client/scripts/backup-runner.ts
/**
 * Standalone Database Backup & Retention CLI Runner.
 * Usage:
 *   npx tsx scripts/backup-runner.ts [--type=DAILY|WEEKLY|MONTHLY|MANUAL]
 */

import path from "path";
import fs from "fs";

// Load environment variables from .env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { BackupService } from "../src/lib/backup/services/BackupService";
import { RetentionService } from "../src/lib/backup/services/RetentionService";

async function main() {
  const args = process.argv.slice(2);
  let type: any = "DAILY";

  for (const arg of args) {
    if (arg.startsWith("--type=")) {
      type = arg.split("=")[1].toUpperCase();
    }
  }

  console.log(`[BackupRunner] Starting ${type} database backup...`);

  try {
    const backup = await BackupService.createBackup({
      type,
      description: `CLI / Cron automated ${type} backup`,
    });

    console.log(`[BackupRunner] ✓ Backup ${backup.backupId} completed and verified!`);
    console.log(`[BackupRunner] Size: ${Number(backup.fileSize)} bytes`);
    console.log(`[BackupRunner] Tables: ${backup.tablesCount}, Rows: ${backup.recordsCount}`);

    console.log(`[BackupRunner] Enforcing retention policy...`);
    const report = await RetentionService.enforceRetention();
    console.log(
      `[BackupRunner] Retention cleanup: ${report.expiredCount} expired backups purged, ${report.preservedCount} preserved.`
    );

    process.exit(0);
  } catch (err: any) {
    console.error(`[BackupRunner] ✗ Backup failed:`, err.message || err);
    process.exit(1);
  }
}

main();
