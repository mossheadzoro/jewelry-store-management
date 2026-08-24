// client/src/app/api/backups/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/backup/storage/StorageFactory";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let settings = await prisma.backupSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.backupSettings.create({
        data: {
          id: 1,
          enabled: true,
          frequency: "DAILY",
          scheduleTime: "01:00",
          timezone: "Asia/Kolkata",
          retentionDaily: 30,
          retentionWeekly: 12,
          retentionMonthly: 12,
          r2BucketName: process.env.BACKUP_R2_BUCKET || "moual-backup",
          r2Endpoint: process.env.BACKUP_R2_ENDPOINT || "https://325d75742553c0aae0ef780a8d097053.r2.cloudflarestorage.com",
          r2AccessKeyId: process.env.BACKUP_R2_ACCESS_KEY_ID || "",
          r2SecretAccessKey: process.env.BACKUP_R2_SECRET_ACCESS_KEY || "",
          r2Region: process.env.BACKUP_R2_REGION || "auto",
          localBackupPath: "/MoualDB-Backups",
          saveLocalCopy: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch backup settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required to modify backup settings." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      enabled,
      frequency,
      scheduleTime,
      timezone,
      retentionDaily,
      retentionWeekly,
      retentionMonthly,
      requirePreRestoreBackup,
      require2FAForRestore,
      maintenanceModeDuringRestore,
      r2AccountId,
      r2BucketName,
      r2Endpoint,
      r2AccessKeyId,
      r2SecretAccessKey,
      r2Region,
      localBackupPath,
      saveLocalCopy,
    } = body;

    const updated = await prisma.backupSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        enabled: enabled ?? true,
        frequency: frequency || "DAILY",
        scheduleTime: scheduleTime || "01:00",
        timezone: timezone || "Asia/Kolkata",
        retentionDaily: retentionDaily !== undefined ? parseInt(retentionDaily, 10) : 30,
        retentionWeekly: retentionWeekly !== undefined ? parseInt(retentionWeekly, 10) : 12,
        retentionMonthly: retentionMonthly !== undefined ? parseInt(retentionMonthly, 10) : 12,
        requirePreRestoreBackup: requirePreRestoreBackup ?? true,
        require2FAForRestore: require2FAForRestore ?? true,
        maintenanceModeDuringRestore: maintenanceModeDuringRestore ?? true,
        r2AccountId: r2AccountId ?? undefined,
        r2BucketName: r2BucketName || "moual-backup",
        r2Endpoint: r2Endpoint ?? undefined,
        r2AccessKeyId: r2AccessKeyId ?? undefined,
        r2SecretAccessKey: r2SecretAccessKey ?? undefined,
        r2Region: r2Region || "auto",
        localBackupPath: localBackupPath || "/MoualDB-Backups",
        saveLocalCopy: saveLocalCopy ?? true,
      },
      update: {
        enabled: enabled !== undefined ? enabled : undefined,
        frequency: frequency || undefined,
        scheduleTime: scheduleTime || undefined,
        timezone: timezone || undefined,
        retentionDaily: retentionDaily !== undefined ? parseInt(retentionDaily, 10) : undefined,
        retentionWeekly: retentionWeekly !== undefined ? parseInt(retentionWeekly, 10) : undefined,
        retentionMonthly: retentionMonthly !== undefined ? parseInt(retentionMonthly, 10) : undefined,
        requirePreRestoreBackup: requirePreRestoreBackup !== undefined ? requirePreRestoreBackup : undefined,
        require2FAForRestore: require2FAForRestore !== undefined ? require2FAForRestore : undefined,
        maintenanceModeDuringRestore:
          maintenanceModeDuringRestore !== undefined ? maintenanceModeDuringRestore : undefined,
        r2AccountId: r2AccountId !== undefined ? r2AccountId : undefined,
        r2BucketName: r2BucketName !== undefined ? r2BucketName : undefined,
        r2Endpoint: r2Endpoint !== undefined ? r2Endpoint : undefined,
        r2AccessKeyId: r2AccessKeyId !== undefined ? r2AccessKeyId : undefined,
        r2SecretAccessKey: r2SecretAccessKey !== undefined ? r2SecretAccessKey : undefined,
        r2Region: r2Region !== undefined ? r2Region : undefined,
        localBackupPath: localBackupPath !== undefined ? localBackupPath : undefined,
        saveLocalCopy: saveLocalCopy !== undefined ? saveLocalCopy : undefined,
      },
    });

    // Reset cached Storage instance so any credential changes take effect immediately
    StorageFactory.resetInstance();

    return NextResponse.json({
      success: true,
      message: "Backup and Cloudflare R2 storage settings updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update backup settings" },
      { status: 500 }
    );
  }
}
