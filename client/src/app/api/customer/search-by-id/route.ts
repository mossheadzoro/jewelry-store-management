import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  try {
    const customerData = await prisma.customer.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        gstin: true,
        invoices: {
          select: {
            balanceAmount: true,
          }
        }
      },
    });

    if (!customerData) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const currentDue = customerData.invoices.reduce((acc: number, inv: any) => acc + (inv.balanceAmount || 0), 0);
    const { invoices, ...customer } = customerData;

    return NextResponse.json({ customer: { ...customer, currentDue } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
