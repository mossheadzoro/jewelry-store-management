// Gold Rates Live & Branch API
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { GoldRateLedgerService } from "@/lib/services/GoldRateLedgerService";

// Using globalThis to preserve cache across HMR reloads in Next.js development
const globalForCache = globalThis as unknown as {
  goldRatesCache: { data: any; timestamp: number } | undefined;
};

const DEFAULT_FALLBACK_RATES = {
  timestamp: new Date().toISOString(),
  ratesPerGram: { "24k": 7650, "22k": 7015, "18k": 5740, "14k": 4465 },
  ratesPer10Gram: { "24k": 76500, "22k": 70150, "18k": 57400, "14k": 44650 },
  silverRate: 95,
};

async function fetchLiveMarketRate() {
  const now = Date.now();
  // Cache for 5 minutes (300,000 ms)
  if (globalForCache.goldRatesCache && now - globalForCache.goldRatesCache.timestamp < 300000) {
    return globalForCache.goldRatesCache.data;
  }

  try {
    const res = await fetch("https://gold-rate-api-rho.vercel.app/api/gold-rates", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      throw new Error(`External API returned status ${res.status}`);
    }

    const data = await res.json();
    globalForCache.goldRatesCache = {
      data,
      timestamp: now,
    };

    // Non-blocking: Record into Gold Rate History Ledger in background
    GoldRateLedgerService.recordLiveRate(data).catch((logErr) => {
      console.error("Failed to record live gold rate in ledger:", logErr);
    });

    return data;
  } catch (fetchErr) {
    // If fetch failed or timed out, use existing cache if available, or reliable fallback
    if (globalForCache.goldRatesCache?.data) {
      return globalForCache.goldRatesCache.data;
    }
    return { ...DEFAULT_FALLBACK_RATES, timestamp: new Date().toISOString() };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceLive = searchParams.get("forceLive") === "true";
    const branchIdStr = searchParams.get("branchId");

    // If caller explicitly requests forceLive (e.g. settings reference box), return live external market rates
    if (forceLive) {
      const liveData = await fetchLiveMarketRate();
      return NextResponse.json(liveData);
    }

    // Determine branch ID
    let targetBranchId: number | undefined = branchIdStr ? parseInt(branchIdStr, 10) : undefined;

    if (!targetBranchId) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.branchId) {
          targetBranchId = parseInt(session.user.branchId, 10);
        }
      } catch {
        // Session not available
      }
    }

    // Look up branch's gold rate settings
    let settings = null;
    if (targetBranchId) {
      settings = await prisma.globalProductSettings.findUnique({
        where: { branchId: targetBranchId },
      });
    }

    // If no branch-specific settings found, fallback to the first available settings
    if (!settings) {
      settings = await prisma.globalProductSettings.findFirst({
        where: { goldRateConfig: { not: null as any } },
      });
    }

    const goldRateConfig: any = settings?.goldRateConfig || {};

    // Check if branch is configured with Manual Rates
    if (goldRateConfig.isLive === false && goldRateConfig.manualRates) {
      const manual = goldRateConfig.manualRates;
      const rate24k = Number(manual["24k"]) || 0;
      const rate22k = Number(manual["22k"]) || 0;
      const rate18k = Number(manual["18k"]) || 0;
      const rate14k = Number(manual["14k"]) || 0;

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        isLive: false,
        source: {
          mode: "MANUAL",
          branchId: targetBranchId || settings?.branchId || null,
          note: "Configured via Gold Rate Settings",
        },
        ratesPerGram: {
          "24k": rate24k,
          "22k": rate22k,
          "18k": rate18k,
          "14k": rate14k,
        },
        ratesPer10Gram: {
          "24k": rate24k * 10,
          "22k": rate22k * 10,
          "18k": rate18k * 10,
          "14k": rate14k * 10,
        },
        silverRate: Number(manual["silver"]) || 95,
      });
    }

    // Otherwise, fetch and return Live Market Rate
    const liveData = await fetchLiveMarketRate();
    return NextResponse.json({
      ...liveData,
      isLive: true,
      branchId: targetBranchId || null,
    });
  } catch (error) {
    console.error("Error in gold-rates API:", error);
    if (globalForCache.goldRatesCache?.data) {
      return NextResponse.json({
        ...globalForCache.goldRatesCache.data,
        isLive: true,
        cached: true,
      });
    }
    return NextResponse.json({ error: "Failed to fetch gold rates" }, { status: 500 });
  }
}
