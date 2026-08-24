// client/src/app/api/rfid/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const branchId = auth.branchId!;

    let settings = await prisma.rFIDSettings.findUnique({
      where: { branchId },
    });

    if (!settings) {
      settings = await prisma.rFIDSettings.create({
        data: {
          branchId,
          rfidEnabled: true,
          defaultScanDurationSec: 30,
          deduplicationWindowMs: 2000,
          readerPollingIntervalMs: 5000,
          heartbeatTimeoutSec: 30,
          highValueThreshold: 100000,
          requireManagerAuthForReassign: true,
          requireManagerAuthForRetire: true,
          requireManagerAuthForSoldAlert: true,
          autoGenerateExceptions: true,
          soundEffectsEnabled: true,
          inAppAlertsEnabled: true,
          mockReaderEnabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Fetch RFID Settings API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const branchId = auth.branchId!;
    const body = await req.json();

    const updated = await prisma.rFIDSettings.upsert({
      where: { branchId },
      create: {
        branchId,
        ...body,
      },
      update: {
        ...body,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'RFID Settings updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Update RFID Settings API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
