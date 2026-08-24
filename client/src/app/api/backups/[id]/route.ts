// client/src/app/api/backups/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { BackupService } from "@/lib/backup/services/BackupService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const backup = await prisma.backupRecord.findFirst({
      where: {
        OR: [{ id }, { backupId: id }],
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        restoreAudits: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...backup,
        rawSize: backup.rawSize ? Number(backup.rawSize) : 0,
        fileSize: backup.fileSize ? Number(backup.fileSize) : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch backup details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required for backup deletion." }, { status: 403 });
  }

  try {
    const { id } = await params;
    await BackupService.deleteBackup(id);

    return NextResponse.json({
      success: true,
      message: `Backup ${id} deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete backup" },
      { status: 400 }
    );
  }
}
