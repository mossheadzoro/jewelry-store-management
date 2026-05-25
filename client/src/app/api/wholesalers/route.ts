import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma";


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      ownerName,
      phone,
      whatsapp,
      email,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      branchId,
    } = body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const count = await prisma.wholesaler.count();
    const code = `WS-${String(count + 1).padStart(4, "0")}`;

    const wholesaler = await prisma.wholesaler.create({
      data: {
        code,
        name,
        ownerName,
        phone,
        whatsapp,
        email,
        gstNumber,
        panNumber,
        address,
        city,
        state,
        pincode,
        branchId: Number(branchId),
      },
    });

    return NextResponse.json(wholesaler, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch ID required" },
        { status: 400 }
      );
    }

    const wholesalers = await prisma.wholesaler.findMany({
      where: { branchId: Number(branchId) },
      select: {
        id: true,
        name: true,
        phone: true,
        goldBal: true,
        silverBal: true,
        moneyBal: true,
        isActive: true,
        orders: {
          where: {
            status: {
              in: ["CREATED", "ASSIGNED", "IN_PROGRESS"],
            },
          },
          select: { id: true },
        },
      },
    });

    // 🔥 TABLE FORMAT
    const tableData = wholesalers.map((ws) => ({
      id: ws.id,
      name: ws.name,
      phone: ws.phone,
      goldBal: ws.goldBal,
      silverBal: ws.silverBal,
      moneyBal: ws.moneyBal,
      activeOrders: ws.orders.length,
      status: ws.isActive ? "Active" : "Inactive",
    }));

    // 🔥 SUMMARY CALCULATION
    const totalWholesalers = wholesalers.length;

    const goldDue = wholesalers.reduce(
      (acc, ws) => acc + (ws.goldBal > 0 ? ws.goldBal : 0),
      0
    );

    const silverDue = wholesalers.reduce(
      (acc, ws) => acc + (ws.silverBal > 0 ? ws.silverBal : 0),
      0
    );

    const moneyDue = wholesalers.reduce(
      (acc, ws) => acc + (ws.moneyBal > 0 ? ws.moneyBal : 0),
      0
    );

    const moneyDeposit = wholesalers.reduce(
      (acc, ws) => acc + (ws.moneyBal < 0 ? Math.abs(ws.moneyBal) : 0),
      0
    );

    return NextResponse.json({
      table: tableData,
      summary: {
        totalWholesalers,
        goldDue,
        silverDue,
        moneyDue,
        moneyDeposit,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch wholesalers" },
      { status: 500 }
    );
  }
}
