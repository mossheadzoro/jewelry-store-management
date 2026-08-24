// client/src/app/api/backups/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { BackupService } from "@/lib/backup/services/BackupService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: any = {};
    if (search) {
      where.OR = [
        { backupId: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
        { latestMigration: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    let [total, backups] = await Promise.all([
      prisma.backupRecord.count({ where }),
      prisma.backupRecord.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // If database was recently reset/reseeded (total === 0) or user requested sync, discover cloud backups
    if (total === 0 || searchParams.get("sync") === "true") {
      try {
        const syncRes = await BackupService.syncFromCloudStorage();
        if (syncRes.syncedCount > 0) {
          [total, backups] = await Promise.all([
            prisma.backupRecord.count({ where }),
            prisma.backupRecord.findMany({
              where,
              include: {
                createdBy: { select: { id: true, name: true, email: true } },
              },
              orderBy: { createdAt: "desc" },
              skip: (page - 1) * limit,
              take: limit,
            }),
          ]);
        }
      } catch (syncErr) {
        console.warn("Auto-sync from cloud storage skipped:", syncErr);
      }
    }

    // Format BigInt values for JSON serialization
    const formatted = backups.map((b) => ({
      ...b,
      rawSize: b.rawSize ? Number(b.rawSize) : 0,
      fileSize: b.fileSize ? Number(b.fileSize) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Fetch Backups API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch backups list" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || "MANUAL";
    const userId = session.user.id ? parseInt(session.user.id, 10) : undefined;

    const backup = await BackupService.createBackup({
      type,
      createdById: userId,
      description: body.description || "Manual backup initiated from settings dashboard",
    });

    return NextResponse.json({
      success: true,
      message: `Backup ${backup.backupId} created and verified successfully!`,
      data: {
        ...backup,
        rawSize: backup.rawSize ? Number(backup.rawSize) : 0,
        fileSize: backup.fileSize ? Number(backup.fileSize) : 0,
      },
    });
  } catch (error: any) {
    console.error("Create Backup API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create database backup" },
      { status: 500 }
    );
  }
}
