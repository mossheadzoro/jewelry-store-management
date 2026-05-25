import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        gstin: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
