import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "0");

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const lastLog = await prisma.backupLog.findFirst({
      where: { branchId },
      orderBy: { createdAt: "desc" }
    });

    if (!lastLog) {
      return NextResponse.json({
        lastBackupAt: null,
        size: null,
        format: null
      });
    }

    return NextResponse.json({
      lastBackupAt: lastLog.createdAt.toISOString(),
      size: formatBytes(lastLog.sizeBytes),
      format: lastLog.format
    });

  } catch (error: any) {
    console.error("Failed to query last backup metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch backup logs" },
      { status: 500 }
    );
  }
}
