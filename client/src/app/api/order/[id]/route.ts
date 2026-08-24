import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch single order by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        karigar: {
          select: {
            id: true,
            name: true,
            department: true,
            phoneNumber: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            address: true,
            city: true,
            state: true,
          },
        },
        items: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
        advance: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH: Update order (assign karigar, change status, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};

    if (body.karigarId !== undefined) {
      updateData.karigarId = body.karigarId || null;
      // Auto-update status to ASSIGNED if karigar is being assigned
      if (body.karigarId) {
        const currentOrder = await prisma.order.findUnique({
          where: { id },
          select: { status: true },
        });
        if (currentOrder?.status === "CREATED") {
          updateData.status = "ASSIGNED";
        }
      }
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.deliveryDate !== undefined) {
      updateData.deliveryDate = new Date(body.deliveryDate);
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        karigar: { select: { id: true, name: true, department: true } },
        customer: { select: { id: true, name: true, mobile: true } },
        items: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
        advance: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
