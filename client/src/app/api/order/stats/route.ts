import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

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
      activeKarigarsResult,
      totalKarigarsResult,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { branchId: bid },
      }),

      // Active karigars (unique)
      prisma.order.findMany({
        where: {
          branchId: bid,
          karigarId: { not: null },
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        select: { karigarId: true },
        distinct: ["karigarId"],
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
    // METAL IN PROCESS (from Advance table)
    // =========================
    const metalInProcessResult = await prisma.advance.aggregate({
      where: {
        order: {
          branchId: bid,
          status: { in: ["CREATED", "ASSIGNED", "IN_PROGRESS"] },
        },
      },
      _sum: {
        metalWeight: true,
      },
    });

    // =========================
    // PENDING DELIVERIES
    // =========================
    const pendingDeliveriesCount = await prisma.order.count({
      where: {
        branchId: bid,
        status: { in: ["CREATED", "ASSIGNED", "IN_PROGRESS"] },
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
    // FINAL RESPONSE
    // =========================
    return NextResponse.json({
      totalOrders,

      totalValue: totalAdvanceMoney._sum.moneyAmount || 0,

      activeKarigars: activeKarigarsResult.length,

      totalKarigars: totalKarigarsResult,

      metalInProcess:
        metalInProcessResult._sum.metalWeight || 0,

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