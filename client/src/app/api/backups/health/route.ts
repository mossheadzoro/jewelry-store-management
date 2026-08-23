// client/src/app/api/backups/health/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { BackupService } from "@/lib/backup/services/BackupService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const health = await BackupService.getBackupHealth();
    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch backup system health" },
      { status: 500 }
    );
  }
}
