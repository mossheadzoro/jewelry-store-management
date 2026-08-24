import { NextRequest, NextResponse } from "next/server";
import { GoldRateLedgerService } from "@/lib/services/GoldRateLedgerService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : undefined;
    const source = searchParams.get("source") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const data = await GoldRateLedgerService.getRateHistory({
      branchId,
      source,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in gold-rates/history API:", error);
    return NextResponse.json({ error: "Failed to fetch gold rate history ledger" }, { status: 500 });
  }
}
