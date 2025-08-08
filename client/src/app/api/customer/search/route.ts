
import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");

  if (!mobile) {
    return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: {
        mobile: {
          equals: mobile,
        },
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        gstin: true,
      },
    });

    return NextResponse.json({ customer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
