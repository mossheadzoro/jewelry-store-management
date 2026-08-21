import { NextResponse } from "next/server";

// Using globalThis to preserve cache across HMR reloads in Next.js development
const globalForCache = globalThis as unknown as {
  goldRatesCache: { data: any; timestamp: number } | undefined;
};

export async function GET() {
  try {
    const now = Date.now();
    // Cache for 5 minutes (300,000 ms)
    if (globalForCache.goldRatesCache && (now - globalForCache.goldRatesCache.timestamp < 300000)) {
      return NextResponse.json(globalForCache.goldRatesCache.data);
    }

    const res = await fetch("https://gold-rate-api-rho.vercel.app/api/gold-rates", {
      next: { revalidate: 300 } // Keep Next.js cache too
    });

    if (!res.ok) {
      throw new Error("Failed to fetch from external API");
    }

    const data = await res.json();
    
    // Store in global cache
    globalForCache.goldRatesCache = {
      data,
      timestamp: now,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in gold-rates proxy API:", error);
    // If external API fails but we have stale cache, return it
    if (globalForCache.goldRatesCache?.data) {
      return NextResponse.json(globalForCache.goldRatesCache.data);
    }
    return NextResponse.json({ error: "Failed to fetch live gold rates" }, { status: 500 });
  }
}
