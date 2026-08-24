import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";

  try {
    // Build search where clause
    const searchWhere = search.length >= 2
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { mobile: { contains: search } },
          ],
        }
      : {};

    // Get customers who have outstanding invoices
    const customers = await prisma.customer.findMany({
      where: {
        ...searchWhere,
        invoices: {
          some: {
            isFullyPaid: false,
            balanceAmount: { gt: 0 },
          },
        },
      },
      include: {
        tags: {
          include: {
            tagDefinition: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
            isFullyPaid: true,
            createdAt: true,
            items: {
              select: {
                gsWeight: true,
                quantity: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const now = new Date();

    const processed = customers.map((customer) => {
      const unpaidInvoices = customer.invoices.filter((inv) => !inv.isFullyPaid && inv.balanceAmount > 0);
      const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

      // Aging calculation
      let amountCurrent = 0; // 0 - 30 days
      let amount30 = 0;      // 31 - 60 days
      let amount60 = 0;      // 61 - 90 days
      let amount90 = 0;      // 90+ days
      let maxOverdueDays = 0;

      unpaidInvoices.forEach((inv) => {
        const diffTime = now.getTime() - new Date(inv.createdAt).getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > maxOverdueDays) {
          maxOverdueDays = diffDays;
        }

        if (diffDays <= 30) {
          amountCurrent += inv.balanceAmount;
        } else if (diffDays <= 60) {
          amount30 += inv.balanceAmount;
        } else if (diffDays <= 90) {
          amount60 += inv.balanceAmount;
        } else {
          amount90 += inv.balanceAmount;
        }
      });

      // Latest purchase (descending ordered invoices)
      const latestInvoice = customer.invoices[0];
      const latestPurchase = latestInvoice
        ? {
            date: latestInvoice.createdAt,
            amount: latestInvoice.totalAmount,
            weight: latestInvoice.items.reduce((sum, item) => sum + (item.gsWeight * item.quantity), 0),
            items: latestInvoice.items.map((item) => item.product.name).join(", "),
          }
        : null;

      // Risk score: based on maxOverdueDays and totalOutstanding
      let riskLevel: "HIGH" | "MEDIUM" | "LOW" | "MINIMAL" = "MINIMAL";
      let riskScore = 0;

      if (maxOverdueDays > 90) {
        riskLevel = "HIGH";
        riskScore = 4000000 + totalOutstanding;
      } else if (maxOverdueDays > 60) {
        riskLevel = "MEDIUM";
        riskScore = 3000000 + totalOutstanding;
      } else if (maxOverdueDays > 30) {
        riskLevel = "LOW";
        riskScore = 2000000 + totalOutstanding;
      } else {
        riskLevel = "MINIMAL";
        riskScore = 1000000 + totalOutstanding;
      }

      return {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        totalOutstanding,
        maxOverdueDays,
        riskLevel,
        riskScore,
        aging: {
          current: amountCurrent,
          thirty: amount30,
          sixty: amount60,
          ninety: amount90,
        },
        latestPurchase,
        tags: customer.tags.map((t) => ({
          id: t.tagDefinition.id,
          name: t.tagDefinition.name,
          label: t.tagDefinition.label,
          color: t.tagDefinition.color,
          type: t.tagDefinition.type,
        })),
      };
    });

    // Sort from High Risk to Low Risk (descending riskScore)
    processed.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({ customers: processed });
  } catch (err) {
    console.error("Outstanding receivables endpoint error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
