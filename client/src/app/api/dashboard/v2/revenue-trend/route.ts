// client/src/app/api/dashboard/v2/revenue-trend/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  subDays,
  differenceInCalendarDays,
  addDays,
  format,
  parseISO,
  isValid,
} from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get("branchId");
    const timeframe = searchParams.get("timeframe") || "30d";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let branchId = null;
    if (branchIdParam && branchIdParam !== "all") {
      branchId = parseInt(branchIdParam, 10);
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (timeframe === "custom" && startDateParam && endDateParam) {
      const parsedStart = parseISO(startDateParam);
      const parsedEnd = parseISO(endDateParam);
      startDate = isValid(parsedStart) ? startOfDay(parsedStart) : startOfDay(subDays(now, 29));
      endDate = isValid(parsedEnd) ? endOfDay(parsedEnd) : endOfDay(now);
      if (startDate > endDate) {
        const temp = startDate;
        startDate = startOfDay(endDate);
        endDate = endOfDay(temp);
      }
    } else {
      endDate = endOfDay(now);
      switch (timeframe) {
        case "7d":
          startDate = startOfDay(subDays(now, 6));
          break;
        case "14d":
          startDate = startOfDay(subDays(now, 13));
          break;
        case "30d":
          startDate = startOfDay(subDays(now, 29));
          break;
        case "90d":
          startDate = startOfDay(subDays(now, 89));
          break;
        case "180d":
          startDate = startOfDay(subDays(now, 179));
          break;
        case "ytd":
          startDate = startOfDay(new Date(now.getFullYear(), 0, 1));
          break;
        case "1y":
          startDate = startOfDay(subDays(now, 364));
          break;
        default:
          startDate = startOfDay(subDays(now, 29));
          break;
      }
    }

    const branchFilter = branchId ? { branchId } : {};

    const invoices = await prisma.invoice.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group invoices by date
    const salesMap = new Map<string, { revenue: number; orders: number }>();
    let totalRevenue = 0;
    const totalOrders = invoices.length;

    invoices.forEach((inv) => {
      const dateKey = format(new Date(inv.createdAt), "yyyy-MM-dd");
      const current = salesMap.get(dateKey) || { revenue: 0, orders: 0 };
      current.revenue += inv.totalAmount;
      current.orders += 1;
      salesMap.set(dateKey, current);
      totalRevenue += inv.totalAmount;
    });

    const dayCount = Math.min(differenceInCalendarDays(endDate, startDate) + 1, 366);
    let peakRevenue = 0;
    let peakDate = "";

    const chartData = Array.from({ length: dayCount }, (_, i) => {
      const d = addDays(startDate, i);
      const dateKey = format(d, "yyyy-MM-dd");
      const agg = salesMap.get(dateKey) || { revenue: 0, orders: 0 };
      if (agg.revenue > peakRevenue) {
        peakRevenue = agg.revenue;
        peakDate = dateKey;
      }
      return {
        date: dateKey,
        revenue: agg.revenue,
        orders: agg.orders,
      };
    });

    const dailyAverage = dayCount > 0 ? Number((totalRevenue / dayCount).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders,
          dailyAverage,
          peakRevenue: Number(peakRevenue.toFixed(2)),
          peakDate,
          dayCount,
        },
        timeframe,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
    });
  } catch (error: any) {
    console.error("Error fetching revenue trend:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
