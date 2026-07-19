import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { requireAuth } from "@/lib/authGuard";

const getKaratage = (purity: number) => {
  if (!purity) return 22;
  const val = purity > 1 ? purity / 100 : purity;
  if (Math.abs(val - 0.916) < 0.01) return 22;
  if (Math.abs(val - 0.75) < 0.01) return 18;
  if (Math.abs(val - 0.585) < 0.01) return 14;
  return Math.round(val * 24);
};

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, { module: "BILLING", requireBranch: true });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const branchId = auth.branchId!;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const salespersonId = searchParams.get("salespersonId");
    const huidStatus = searchParams.get("huidStatus");
    const amountMin = searchParams.get("amountMin") ? parseFloat(searchParams.get("amountMin")!) : undefined;
    const amountMax = searchParams.get("amountMax") ? parseFloat(searchParams.get("amountMax")!) : undefined;

    // Build where clause
    const where: any = { branchId };

    // Date filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search filtering (invoice number or customer name)
    if (search.trim()) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { mobile: { contains: search } } },
      ];
    }

    // Status filtering
    if (status) {
      if (status === "PAID") {
        where.isFullyPaid = true;
      } else if (status === "PENDING") {
        where.isFullyPaid = false;
        where.paidAmount = 0;
      } else if (status === "PARTIAL") {
        where.isFullyPaid = false;
        where.paidAmount = { gt: 0 };
      }
    }

    // Payment method filtering
    if (paymentMethod && paymentMethod !== "ALL") {
      where.paymentMethod = paymentMethod;
    }

    // Salesperson filtering
    if (salespersonId && salespersonId !== "ALL") {
      where.createdById = parseInt(salespersonId);
    }

    // HUID filtering
    if (huidStatus) {
      if (huidStatus === "WITH_HUID") {
        where.items = {
          some: {
            product: {
              huidNumber: { not: null },
            },
          },
        };
      } else if (huidStatus === "MISSING_HUID") {
        where.items = {
          some: {
            product: {
              OR: [
                { huidNumber: null },
                { huidNumber: "" }
              ]
            },
          },
        };
      }
    }

    // Amount range filtering
    if (amountMin !== undefined || amountMax !== undefined) {
      where.totalAmount = {};
      if (amountMin !== undefined) where.totalAmount.gte = amountMin;
      if (amountMax !== undefined) where.totalAmount.lte = amountMax;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
              gstin: true,
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  productCode: true,
                  huidNumber: true,
                  purity: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    const formattedInvoices = invoices.map((inv) => {
      const items = inv.items.map((item) => ({
        productName: item.product.name,
        qty: item.quantity,
        grossWt: item.gsWeight,
        netWt: item.ntWeight,
        karatage: getKaratage(item.product.purity),
        huidNumber: item.product.huidNumber,
        rate: item.metalRate,
        amount: item.totalAfterTax,
      }));

      const totalNetWt = items.reduce((sum, it) => sum + it.netWt, 0);
      const invoiceStatus = inv.isFullyPaid ? "PAID" : inv.paidAmount > 0 ? "PARTIAL" : "PENDING";

      return {
        id: inv.id.toString(),
        invoiceNo: inv.invoiceNumber,
        date: inv.createdAt.toISOString(),
        customer: {
          name: inv.customer.name,
          phone: inv.customer.mobile,
          gstin: inv.customer.gstin,
        },
        items,
        itemCount: items.length,
        totalNetWt,
        subtotal: inv.totalMetalAmount + inv.totalMakingAmount + inv.totalStoneAmount,
        makingCharges: inv.totalMakingAmount,
        gst: inv.cgst + inv.sgst,
        cgst: inv.cgst,
        sgst: inv.sgst,
        igst: 0, // In this app, CGST/SGST is default
        totalAmount: inv.totalAmount,
        paymentMethod: inv.paymentMethod,
        amountPaid: inv.paidAmount,
        balanceDue: inv.balanceAmount,
        status: invoiceStatus,
        salesperson: {
          name: inv.createdBy?.name || "System",
        },
        createdAt: inv.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Failed to list invoices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
