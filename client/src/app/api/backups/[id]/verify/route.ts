// client/src/app/api/backups/[id]/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { BackupService } from "@/lib/backup/services/BackupService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await BackupService.verifyBackup(id);

    return NextResponse.json({
      success: true,
      message: result.details,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to verify backup integrity" },
      { status: 500 }
    );
  }
}
