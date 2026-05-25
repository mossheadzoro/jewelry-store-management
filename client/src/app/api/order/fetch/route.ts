import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 }
      );
    }

    const where: any = {
      branchId: Number(branchId),
    };

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
    }

    // Search by customer name, mobile, order number, or slip number
    if (search && search.trim()) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerMobile: { contains: search } },
        { orderNumber: { contains: search, mode: "insensitive" } },
        { advance: { advanceReceiptNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          karigar: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
          items: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          advance: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
