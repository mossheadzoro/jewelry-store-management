import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 }
      );
    }

    const bid = Number(branchId);

    // =========================
    // MAIN PARALLEL QUERIES
    // =========================
    const [
      totalOrders,
      assignedOrdersCount,
      totalKarigarsResult,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { branchId: bid },
      }),

      // Assigned orders count
      prisma.order.count({
        where: {
          branchId: bid,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
      }),

      // Total karigars
      prisma.karigar.count({
        where: { isActive: true },
      }),
    ]);

    // =========================
    // ADVANCE MONEY (from Advance table)
    // =========================
    const totalAdvanceMoney = await prisma.advance.aggregate({
      where: {
        order: {
          branchId: bid,
        },
      },
      _sum: {
        moneyAmount: true,
      },
    });

    // =========================
    // METAL IN PROCESS (from OrderItem table)
    // =========================
    const metalInProcessResult = await prisma.orderItem.aggregate({
      where: {
        order: {
          branchId: bid,
          status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
        },
      },
      _sum: {
        weight: true,
      },
    });

    // =========================
    // PENDING DELIVERIES
    // =========================
    const pendingDeliveriesCount = await prisma.order.count({
      where: {
        branchId: bid,
        status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
      },
    });

    // =========================
    // URGENT ORDERS
    // =========================
    const urgentRequests = await prisma.order.count({
      where: {
        branchId: bid,
        priority: { in: ["URGENT", "RUSH"] },
        status: {
          notIn: ["COMPLETED", "DELIVERED", "CANCELLED"],
        },
      },
    });

    // =========================
    // ESTIMATED TOTAL VALUE (Gold value of ordered items)
    // =========================
    let estimatedTotalValue = 0;
    try {
      // Fetch live gold rates
      const goldRateRes = await fetch("https://gold-rate-api-rho.vercel.app/api/gold-rates");
      const rates = goldRateRes.ok ? await goldRateRes.json() : null;

      if (rates) {
        // Fetch all active orders' items and their advance's metalPurity
        const activeOrdersWithItems = await prisma.order.findMany({
          where: {
            branchId: bid,
            status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
          },
          select: {
            advance: { select: { metalPurity: true } },
            items: { select: { weight: true } },
          },
        });

        for (const order of activeOrdersWithItems) {
          const purity = order.advance?.metalPurity || "22K";
          const rateKey = purity === "24K" ? "price24k" : "price22k";
          const rate = Number(rates[rateKey] || rates.price22k || 0);
          
          for (const item of order.items) {
            estimatedTotalValue += Number(item.weight || 0) * rate;
          }
        }
      }
    } catch (err) {
      console.error("Failed to calculate estimated total value:", err);
    }

    // =========================
    // FINAL RESPONSE
    // =========================
    return NextResponse.json({
      totalOrders,
      totalValue: estimatedTotalValue || 0,
      assignedOrders: assignedOrdersCount,
      totalKarigars: totalKarigarsResult,
      metalInProcess: Number(metalInProcessResult._sum.weight || 0),
      pendingDeliveries: pendingDeliveriesCount,

      urgentRequests,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch order stats" },
      { status: 500 }
    );
  }
}