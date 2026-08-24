import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Preview — returns invoice count and IDs in a range
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "0");
    const startInvoice = searchParams.get("startInvoice") || "";
    const endInvoice = searchParams.get("endInvoice") || "";

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    if (!startInvoice || !endInvoice) {
      return NextResponse.json({ error: "startInvoice and endInvoice are required" }, { status: 400 });
    }

    // Find invoices where invoiceNumber is between start and end (alphabetically)
    const invoices = await prisma.invoice.findMany({
      where: {
        branchId,
        invoiceNumber: {
          gte: startInvoice,
          lte: endInvoice,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        createdAt: true,
        customer: {
          select: { name: true },
        },
      },
      orderBy: { invoiceNumber: "asc" },
    });

    const totalValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return NextResponse.json({
      count: invoices.length,
      totalValue,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
        customerName: inv.customer.name,
        date: inv.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Bulk print preview failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview bulk print" },
      { status: 500 }
    );
  }
}
