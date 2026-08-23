// client/src/lib/backup/services/MaintenanceModeService.ts

import { prisma } from "@libs/prisma";

export class MaintenanceModeService {
  private static cachedState: { isMaintenance: boolean; expiresAt: number } | null = null;

  public static async isMaintenanceMode(): Promise<boolean> {
    const now = Date.now();
    if (this.cachedState && this.cachedState.expiresAt > now) {
      return this.cachedState.isMaintenance;
    }

    try {
      const state = await prisma.systemMaintenanceState.findUnique({
        where: { id: 1 },
      });
      const isMaintenance = state?.isMaintenance ?? false;
      this.cachedState = { isMaintenance, expiresAt: now + 5000 }; // 5s cache
      return isMaintenance;
    } catch {
      return false;
    }
  }

  public static async enableMaintenanceMode(reason: string, startedById?: number): Promise<void> {
    await prisma.systemMaintenanceState.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        isMaintenance: true,
        reason,
        startedAt: new Date(),
        startedById,
      },
      update: {
        isMaintenance: true,
        reason,
        startedAt: new Date(),
        startedById,
      },
    });

    this.cachedState = { isMaintenance: true, expiresAt: Date.now() + 5000 };
  }

  public static async disableMaintenanceMode(): Promise<void> {
    await prisma.systemMaintenanceState.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        isMaintenance: false,
        reason: null,
      },
      update: {
        isMaintenance: false,
        reason: null,
      },
    });

    this.cachedState = { isMaintenance: false, expiresAt: Date.now() + 5000 };
  }
}
