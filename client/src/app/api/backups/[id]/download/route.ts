// client/src/app/api/backups/[id]/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { BackupService } from "@/lib/backup/services/BackupService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required for downloading raw database backups." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const downloadUrl = await BackupService.getBackupDownloadUrl(id);

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresInSeconds: 1800,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
