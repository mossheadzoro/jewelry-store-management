// client/src/app/api/purchase/audit/route.ts
// Purchase Module Specific Audit Log Stream API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const isAll = searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = isAll ? 2000 : parseInt(searchParams.get("limit") || "100", 10);

    const purchaseModules = [
      "PURCHASE_BOOKING",
      "PURCHASE_INVOICE",
      "PURCHASE_PAYMENT",
      "PURCHASE_RECEIVING",
      "PURCHASE_TRANSFERS",
      "PURCHASE_RETURNS",
      "PURCHASE_GST",
      "PURCHASE_VERIFICATION",
      "PURCHASE_DOCUMENTS",
      "BULLION_SUPPLIERS",
    ];

    const where: any = {
      module: { in: purchaseModules },
      ...(branchId ? { branchId } : {}),
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    };

    // Date range filtering
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    // Comprehensive Search across audit logs & linked booking entities
    if (search) {
      const orConditions: any[] = [
        { entityDisplayName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { userNameSnapshot: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
      ];

      try {
        // If search matches a booking number, find all linked payment and receiving vouchers
        const matchedBookings = await prisma.purchaseBooking.findMany({
          where: {
            OR: [
              { bookingNumber: { contains: search, mode: "insensitive" } },
              { id: { equals: search } },
            ],
          },
          select: { id: true, bookingNumber: true },
          take: 10,
        });

        for (const bk of matchedBookings) {
          orConditions.push(
            { entityId: bk.id },
            { entityDisplayName: { contains: bk.bookingNumber, mode: "insensitive" } },
            { description: { contains: bk.bookingNumber, mode: "insensitive" } }
          );

          const [linkedPayments, linkedReceipts] = await Promise.all([
            prisma.purchasePayment.findMany({
              where: { purchaseBookingId: bk.id },
              select: { id: true, paymentNumber: true },
            }),
            prisma.purchaseMetalReceipt.findMany({
              where: { purchaseBookingId: bk.id },
              select: { id: true, receiptNumber: true },
            }),
          ]);

          linkedPayments.forEach((p) => {
            orConditions.push(
              { entityId: p.id },
              { entityDisplayName: { contains: p.paymentNumber, mode: "insensitive" } },
              { description: { contains: p.paymentNumber, mode: "insensitive" } }
            );
          });

          linkedReceipts.forEach((r) => {
            orConditions.push(
              { entityId: r.id },
              { entityDisplayName: { contains: r.receiptNumber, mode: "insensitive" } },
              { description: { contains: r.receiptNumber, mode: "insensitive" } }
            );
          });
        }
      } catch (err) {
        console.warn("Audit search booking resolution warning:", err);
      }

      where.OR = orConditions;
    }

    const [total, logs] = await Promise.all([
      prisma.enterpriseAuditLog.count({ where }),
      prisma.enterpriseAuditLog.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip: isAll ? 0 : (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({ success: true, total, page, limit, sortOrder, logs });
  } catch (error: any) {
    console.error("Get purchase audit error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch audit trail" }, { status: 500 });
  }
}
