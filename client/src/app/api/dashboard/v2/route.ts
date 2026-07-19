import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get("branchId");
    const dateRange = searchParams.get("dateRange") || "today";

    let branchId = null;
    if (branchIdParam && branchIdParam !== "all") {
      branchId = parseInt(branchIdParam, 10);
    }

    const data = await getDashboardData(branchId, dateRange);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching dashboard v2 data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
