// client/src/app/api/backups/cron/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BackupService } from "@/lib/backup/services/BackupService";
import { RetentionService } from "@/lib/backup/services/RetentionService";

export async function POST(req: NextRequest) {
  // 1. Authenticate webhook / cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution token" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") || "DAILY";
    const type = (["DAILY", "WEEKLY", "MONTHLY"].includes(typeParam) ? typeParam : "DAILY") as any;

    // Trigger scheduled backup
    const backup = await BackupService.createBackup({
      type,
      description: `Automated ${type} backup triggered by cron runner`,
    });

    // Enforce retention policy
    const retentionReport = await RetentionService.enforceRetention();

    return NextResponse.json({
      success: true,
      message: `Scheduled ${type} backup (${backup.backupId}) executed successfully.`,
      data: {
        backupId: backup.backupId,
        type: backup.type,
        status: backup.status,
        fileSize: Number(backup.fileSize),
        retentionReport,
      },
    });
  } catch (error: any) {
    console.error("Scheduled Backup Cron Error:", error);
    return NextResponse.json(
      { error: error.message || "Scheduled backup execution failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
