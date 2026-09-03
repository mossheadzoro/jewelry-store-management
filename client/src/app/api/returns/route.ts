// src/app/api/returns/route.ts
// Return & Exchange Transaction Listing and Creation API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { ReturnExchangeService } from "@/lib/services/returns/ReturnExchangeService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branchId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (auth.user.systemRole !== "ADMIN") {
      where.branchId = auth.branchId || auth.user.branchId;
    } else if (branchIdParam) {
      where.branchId = parseInt(branchIdParam, 10);
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.transactionType = type;
    }

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        { originalInvoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { mobile: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, transactions] = await Promise.all([
      prisma.returnExchangeTransaction.count({ where }),
      prisma.returnExchangeTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          branch: true,
          originalInvoice: true,
          requestedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              originalInvoiceItem: { include: { product: true } },
              originalProductItem: true,
              inspection: true,
              photos: true,
            },
          },
          taxDocuments: true,
          refundTransactions: true,
          oldGoldSettlements: true,
        },
      }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching returns list:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch returns." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const branchId = body.branchId || auth.branchId || auth.user.branchId;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required." }, { status: 400 });
    }

    const isManagerOrAdmin = ["ADMIN", "MANAGER", "SUPER_ADMIN", "OWNER"].includes(auth.user.systemRole as string);
    const autoApprove = !!body.autoApprove && isManagerOrAdmin;

    const result = await ReturnExchangeService.createTransaction(
      {
        ...body,
        branchId,
        requestedById: auth.user.id,
        approvedById: autoApprove ? auth.user.id : undefined,
        autoApprove,
      },
      {
        userId: auth.user.id,
        userNameSnapshot: auth.user.name,
        roleSnapshot: auth.user.systemRole,
        branchId,
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating return transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create return transaction." },
      { status: 400 }
    );
  }
}
