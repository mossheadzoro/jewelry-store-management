import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { requireAuth } from "@/lib/authGuard";

export async function GET(req: Request) {
  const auth = await requireAuth(req, { module: "CUSTOMERS", requireBranch: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const branchId = auth.branchId!;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search")?.trim() || "";

  const skip = (page - 1) * limit;

  try {
    // Build where clause for search and tags
    const where: any = {};
    const conditions: any[] = [];

    if (search.length >= 2) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { mobile: { contains: search } },
          { id: !isNaN(Number(search)) ? { equals: Number(search) } : undefined },
        ].filter((clause) => {
          return !Object.values(clause).some((v) => v === undefined);
        }),
      });
    }

    const tagId = searchParams.get("tagId");
    if (tagId) {
      conditions.push({
        tags: {
          some: {
            tagDefinitionId: tagId,
          },
        },
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Total count for pagination
    const totalCount = await prisma.customer.count({ where });

    // Get customers with invoice data and tags
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: {
            tagDefinition: true,
          },
        },
        invoices: {
          where: { branchId },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
            isFullyPaid: true,
            createdAt: true,
            items: {
              select: {
                product: {
                  select: {
                    name: true,
                    subCategory: {
                      select: {
                        name: true,
                        category: { select: { name: true } },
                      },
                    },
                  },
                },
              },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Process customers to add computed fields
    const processedCustomers = customers.map((customer) => {
      const totalInvoices = customer.invoices.length;
      const totalSpent = customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const outstanding = customer.invoices
        .filter((inv) => !inv.isFullyPaid)
        .reduce((sum, inv) => sum + inv.balanceAmount, 0);

      // Last purchase info
      const lastInvoice = customer.invoices[0];
      const lastPurchaseDate = lastInvoice?.createdAt || null;
      const lastPurchaseItem = lastInvoice?.items?.[0]?.product?.subCategory?.name
        || lastInvoice?.items?.[0]?.product?.name
        || null;

      // Earliest unpaid invoice for "due in X days"
      const unpaidInvoices = customer.invoices.filter((inv) => !inv.isFullyPaid);
      const oldestUnpaid = unpaidInvoices.length > 0
        ? unpaidInvoices[unpaidInvoices.length - 1]
        : null;
      const dueDays = oldestUnpaid
        ? Math.floor((Date.now() - new Date(oldestUnpaid.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Tier calculation
      let tier: "VIP" | "GOLD" | "REGULAR" = "REGULAR";
      if (totalInvoices >= 10 || totalSpent >= 1000000) {
        tier = "VIP";
      } else if (totalInvoices >= 5 || totalSpent >= 500000) {
        tier = "GOLD";
      }

      // Generate customer code
      const customerCode = `AT-${customer.id.toString().padStart(4, "0")}`;

      return {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        city: customer.city,
        state: customer.state,
        address: customer.address,
        gender: customer.gender,
        customerCode,
        tier,
        totalPurchases: totalInvoices,
        totalSpent,
        lastPurchaseDate,
        lastPurchaseItem,
        outstanding,
        dueDays,
        createdAt: customer.createdAt,
        tags: customer.tags.map((t) => ({
          id: t.tagDefinition.id,
          name: t.tagDefinition.name,
          label: t.tagDefinition.label,
          color: t.tagDefinition.color,
          type: t.tagDefinition.type,
        })),
      };
    });

    // Summary stats — efficient aggregation instead of fetching all customers
    const allCustomerCount = await prisma.customer.count();

    // Total outstanding — use Prisma aggregation
    const outstandingAgg = await prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: { isFullyPaid: false, branchId },
    });
    const totalOutstanding = outstandingAgg._sum.balanceAmount || 0;

    // VIP count — use raw SQL for grouped HAVING clause
    const vipResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM (
        SELECT c.id
        FROM "Customer" c
        JOIN "Invoice" i ON i."customerId" = c.id
        WHERE i."branchId" = ${branchId}
        GROUP BY c.id
        HAVING COUNT(i.id) >= 10 OR SUM(i."totalAmount") >= 1000000
      ) vips
    `);
    const vipCount = Number(vipResult[0]?.count || 0);

    // New customers this month vs last month for percentage
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthCount = await prisma.customer.count({
      where: { createdAt: { gte: thisMonthStart } },
    });
    const lastMonthCount = await prisma.customer.count({
      where: {
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    });

    const growthPercent = lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : thisMonthCount > 0 ? 100 : 0;

    return NextResponse.json({
      customers: processedCustomers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalClientele: allCustomerCount,
        vipCount,
        totalOutstanding,
        growthPercent,
      },
    });
  } catch (err) {
    console.error("Customer list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
