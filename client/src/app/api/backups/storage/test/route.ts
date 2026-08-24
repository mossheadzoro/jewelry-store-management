// client/src/app/api/backups/storage/test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { StorageFactory } from "@/lib/backup/storage/StorageFactory";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {}

    let storage;
    if (body && body.accessKeyId && body.secretAccessKey && body.bucket) {
      // Test ad-hoc credentials submitted from UI form
      let endpoint = body.endpoint;
      if (!endpoint && body.accountId) {
        endpoint = `https://${body.accountId}.r2.cloudflarestorage.com`;
      }
      storage = StorageFactory.createCustomProvider({
        endpoint,
        region: body.region || "auto",
        bucket: body.bucket,
        accessKeyId: body.accessKeyId,
        secretAccessKey: body.secretAccessKey,
        providerName: "Cloudflare R2",
      });
    } else {
      storage = await StorageFactory.getProviderAsync();
    }

    const result = await storage.testConnection();

    // Update connection telemetry in BackupSettings
    try {
      await prisma.backupSettings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          r2Connected: result.success,
          r2LastTestedAt: new Date(),
          r2LatencyMs: result.latencyMs || null,
        },
        update: {
          r2Connected: result.success,
          r2LastTestedAt: new Date(),
          r2LatencyMs: result.latencyMs || null,
        },
      });
    } catch {}

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    try {
      await prisma.backupSettings.update({
        where: { id: 1 },
        data: { r2Connected: false, r2LastTestedAt: new Date() },
      });
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Cloudflare R2 probe test failed",
      },
      { status: 500 }
    );
  }
}
