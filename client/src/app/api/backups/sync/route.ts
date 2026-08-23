// client/src/app/api/backups/sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { BackupService } from "@/lib/backup/services/BackupService";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await BackupService.syncFromCloudStorage();

    return NextResponse.json({
      success: true,
      message:
        result.syncedCount > 0
          ? `Successfully discovered and synced ${result.syncedCount} backup(s) from Cloudflare R2!`
          : "Cloud storage is in sync. All cloud backups are already listed.",
      data: result,
    });
  } catch (error: any) {
    console.error("Sync Backups API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync backups from Cloudflare R2" },
      { status: 500 }
    );
  }
}
