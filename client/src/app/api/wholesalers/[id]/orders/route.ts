import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fetch unassigned orders
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const unassignedOrders = await prisma.order.findMany({
      where: {
        wholesalerId: null,
      },
      include: {
        items: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(unassignedOrders);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch unassigned orders" },
      { status: 500 }
    );
  }
}

// Assign orders to this wholesaler
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Invalid order IDs" }, { status: 400 });
    }

    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        wholesalerId: id,
        status: "ASSIGNED",
      },
    });

    return NextResponse.json({ message: "Orders assigned successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to assign orders" },
      { status: 500 }
    );
  }
}

// Bulk update order status
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { orderIds, status } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        wholesalerId: id, // Ensure we only update orders belonging to this wholesaler
      },
      data: {
        status: status,
      },
    });

    return NextResponse.json({ message: "Orders updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update orders" },
      { status: 500 }
    );
  }
}
