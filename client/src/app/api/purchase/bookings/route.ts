// client/src/app/api/purchase/bookings/route.ts
// Purchase Bookings List & Creation API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { PurchaseBookingService } from "@/lib/services/purchase/PurchaseBookingService";

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
    const supplierId = searchParams.get("supplierId") || undefined;
    const status = searchParams.get("status") || undefined;
    const metalCategory = searchParams.get("metalCategory") || undefined;
    const search = searchParams.get("search") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await PurchaseBookingService.getBookings({
      branchId,
      supplierId,
      status,
      metalCategory,
      search,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Get purchase bookings error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const branchId = body.branchId ? parseInt(body.branchId, 10) : auth.branchId || 1;
    const createdById = parseInt(auth.session.user.id, 10);

    const booking = await PurchaseBookingService.createBooking({
      branchId,
      supplierId: body.supplierId,
      metalCategory: body.metalCategory || "GOLD_24K",
      purityPercent: body.purityPercent ? Number(body.purityPercent) : undefined,
      grossWeight: Number(body.grossWeight),
      bookingRate: Number(body.bookingRate),
      marketRate: body.marketRate ? Number(body.marketRate) : undefined,
      rateSource: body.rateSource || "LIVE_MCX",
      isRateOverride: Boolean(body.isRateOverride),
      overrideReason: body.overrideReason,
      overrideUserId: body.isRateOverride ? createdById : undefined,
      expectedReceiptDate: body.expectedReceiptDate,
      notes: body.notes,
      gstCondition: body.gstCondition || "WITHOUT_GST",
      calculateGst: body.calculateGst !== undefined ? Boolean(body.calculateGst) : true,
      createdById,
      autoApprove: role === "ADMIN" && body.autoApprove === true,
      reqContext: {
        userId: createdById,
        userEmail: auth.session.user.email,
        userName: auth.session.user.name,
        role: auth.user.systemRole,
        branchId,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error: any) {
    console.error("Create purchase booking error:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}
