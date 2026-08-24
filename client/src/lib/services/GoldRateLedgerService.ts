// Gold Rate History Ledger Service
import { prisma } from "@/lib/prisma";

export interface GoldRateLedgerEntry {
  id: string;
  branchId: number | null;
  branch?: { id: number; name: string } | null;
  source: "LIVE_API" | "MANUAL_OVERRIDE" | string;
  rate24k: number;
  rate22k: number;
  rate18k: number;
  rate14k: number;
  silverRate: number | null;
  xauUsd: number | null;
  usdInr: number | null;
  changeFromPrev: number | null;
  notes: string | null;
  rawMetadata: any | null;
  recordedAt: Date;
}

export class GoldRateLedgerService {
  /**
   * Records a live API market rate snapshot every 5-minute cycle
   */
  static async recordLiveRate(rateData: any): Promise<GoldRateLedgerEntry | null> {
    try {
      const rate24k = Number(rateData.ratesPerGram?.["24k"]) || 0;
      const rate22k = Number(rateData.ratesPerGram?.["22k"]) || 0;
      const rate18k = Number(rateData.ratesPerGram?.["18k"]) || 0;
      const rate14k = Number(rateData.ratesPerGram?.["14k"]) || 0;
      const silverRate = Number(rateData.silverRate) || null;
      const xauUsd = Number(rateData.source?.xauUsd) || null;
      const usdInr = Number(rateData.source?.usdInr) || null;

      if (!rate24k) return null;

      // Check last recorded entry
      let lastEntry: any = null;
      try {
        if ((prisma as any).goldRateHistoryLedger) {
          lastEntry = await (prisma as any).goldRateHistoryLedger.findFirst({
            where: { source: "LIVE_API" },
            orderBy: { recordedAt: "desc" },
          });
        }
      } catch (e) {
        // Model might be accessed via raw query fallback
      }

      // Avoid duplicate logs if within 4 minutes and price is identical
      if (lastEntry) {
        const timeDiffMs = Date.now() - new Date(lastEntry.recordedAt).getTime();
        if (timeDiffMs < 240000 && Math.abs(lastEntry.rate24k - rate24k) < 0.01) {
          return lastEntry;
        }
      }

      const changeFromPrev = lastEntry ? Number((rate24k - lastEntry.rate24k).toFixed(2)) : 0;

      let newEntry: any = null;
      if ((prisma as any).goldRateHistoryLedger) {
        newEntry = await (prisma as any).goldRateHistoryLedger.create({
          data: {
            source: "LIVE_API",
            rate24k,
            rate22k,
            rate18k,
            rate14k,
            silverRate,
            xauUsd,
            usdInr,
            changeFromPrev,
            notes: "Automatic 5-minute Live API market synchronization",
            rawMetadata: rateData,
            recordedAt: new Date(rateData.timestamp || Date.now()),
          },
        });
      } else {
        // Fallback SQL query
        const id = `grl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "GoldRateHistoryLedger" ("id", "source", "rate24k", "rate22k", "rate18k", "rate14k", "silverRate", "xauUsd", "usdInr", "changeFromPrev", "notes", "rawMetadata", "recordedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)`,
          id,
          "LIVE_API",
          rate24k,
          rate22k,
          rate18k,
          rate14k,
          silverRate,
          xauUsd,
          usdInr,
          changeFromPrev,
          "Automatic 5-minute Live API market synchronization",
          JSON.stringify(rateData),
          new Date(rateData.timestamp || Date.now())
        );
      }

      return newEntry;
    } catch (error) {
      console.error("Failed to record gold rate in history ledger:", error);
      return null;
    }
  }

  /**
   * Records a manual rate override by store administrator
   */
  static async recordManualRate(
    branchId: number | null,
    manualRates: Record<string, any>,
    userSnapshot?: { name?: string; role?: string }
  ): Promise<GoldRateLedgerEntry | null> {
    try {
      const rate24k = Number(manualRates["24k"]) || 0;
      const rate22k = Number(manualRates["22k"]) || 0;
      const rate18k = Number(manualRates["18k"]) || 0;
      const rate14k = Number(manualRates["14k"]) || 0;
      const silverRate = Number(manualRates["silver"]) || null;

      const userName = userSnapshot?.name || "Store Administrator";
      const userRole = userSnapshot?.role || "ADMIN";
      const notes = `Manual rate override configured by ${userName} (${userRole})${
        branchId ? ` for Branch #${branchId}` : " applied globally to all branches"
      }`;

      let lastEntry: any = null;
      if ((prisma as any).goldRateHistoryLedger) {
        lastEntry = await (prisma as any).goldRateHistoryLedger.findFirst({
          where: branchId ? { branchId } : {},
          orderBy: { recordedAt: "desc" },
        });
      }

      const changeFromPrev = lastEntry ? Number((rate24k - lastEntry.rate24k).toFixed(2)) : 0;

      let newEntry: any = null;
      if ((prisma as any).goldRateHistoryLedger) {
        newEntry = await (prisma as any).goldRateHistoryLedger.create({
          data: {
            branchId,
            source: "MANUAL_OVERRIDE",
            rate24k,
            rate22k,
            rate18k,
            rate14k,
            silverRate,
            changeFromPrev,
            notes,
            rawMetadata: manualRates,
            recordedAt: new Date(),
          },
        });
      } else {
        const id = `grl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "GoldRateHistoryLedger" ("id", "branchId", "source", "rate24k", "rate22k", "rate18k", "rate14k", "silverRate", "changeFromPrev", "notes", "rawMetadata", "recordedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)`,
          id,
          branchId,
          "MANUAL_OVERRIDE",
          rate24k,
          rate22k,
          rate18k,
          rate14k,
          silverRate,
          changeFromPrev,
          notes,
          JSON.stringify(manualRates),
          new Date()
        );
      }

      return newEntry;
    } catch (error) {
      console.error("Failed to record manual rate in history ledger:", error);
      return null;
    }
  }

  /**
   * Queries the gold rate history ledger with metrics & pagination
   */
  static async getRateHistory(params: {
    branchId?: number;
    source?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { branchId, source, startDate, endDate, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (branchId) {
      where.OR = [{ branchId }, { branchId: null }];
    }
    if (source) {
      where.source = source;
    }
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.recordedAt.lte = eDate;
      }
    }

    try {
      let entries: any[] = [];
      let total = 0;

      if ((prisma as any).goldRateHistoryLedger) {
        [entries, total] = await Promise.all([
          (prisma as any).goldRateHistoryLedger.findMany({
            where,
            include: { branch: { select: { id: true, name: true } } },
            orderBy: { recordedAt: "desc" },
            take: limit,
            skip,
          }),
          (prisma as any).goldRateHistoryLedger.count({ where }),
        ]);
      } else {
        entries = await prisma.$queryRawUnsafe(
          `SELECT * FROM "GoldRateHistoryLedger" ORDER BY "recordedAt" DESC LIMIT $1 OFFSET $2`,
          limit,
          skip
        );
        const countRes: any = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as count FROM "GoldRateHistoryLedger"`
        );
        total = countRes[0]?.count || 0;
      }

      // Compute 24h & today analytics
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let todayEntries: any[] = [];
      if ((prisma as any).goldRateHistoryLedger) {
        todayEntries = await (prisma as any).goldRateHistoryLedger.findMany({
          where: { recordedAt: { gte: todayStart } },
          select: { rate24k: true, rate22k: true, recordedAt: true },
        });
      }

      const today24kRates = todayEntries.map((e) => e.rate24k);
      const high24k = today24kRates.length > 0 ? Math.max(...today24kRates) : entries[0]?.rate24k || 0;
      const low24k = today24kRates.length > 0 ? Math.min(...today24kRates) : entries[0]?.rate24k || 0;
      const latestRate = entries[0]?.rate24k || 0;
      const latest22k = entries[0]?.rate22k || 0;

      return {
        entries,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        metrics: {
          latest24k: latestRate,
          latest22k,
          high24k,
          low24k,
          totalSnapshots: total,
          lastUpdated: entries[0]?.recordedAt || null,
        },
      };
    } catch (error) {
      console.error("Failed to query gold rate history ledger:", error);
      return {
        entries: [],
        pagination: { total: 0, page: 1, limit, totalPages: 1 },
        metrics: {
          latest24k: 0,
          latest22k: 0,
          high24k: 0,
          low24k: 0,
          totalSnapshots: 0,
          lastUpdated: null,
        },
      };
    }
  }
}
