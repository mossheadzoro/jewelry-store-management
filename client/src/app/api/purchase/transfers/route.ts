// client/src/app/api/purchase/transfers/route.ts
// Metal Transfers to Karigars, Wholesalers & Branches API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { MetalTransferService } from "@/lib/services/purchase/MetalTransferService";

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
    const destinationType = searchParams.get("destinationType") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await MetalTransferService.getTransfers({
      branchId,
      destinationType,
      status,
      search,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Get metal transfers error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transfers" }, { status: 500 });
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
    const sourceBranchId = body.sourceBranchId ? parseInt(body.sourceBranchId, 10) : auth.branchId || 1;
    const authorizedById = parseInt(auth.session.user.id, 10);

    const transfer = await MetalTransferService.issueTransfer({
      sourceBranchId,
      destinationType: body.destinationType || "KARIGAR",
      karigarId: body.karigarId || undefined,
      wholesalerId: body.wholesalerId || undefined,
      targetBranchId: body.targetBranchId ? parseInt(body.targetBranchId, 10) : undefined,
      destinationName: body.destinationName,
      metalCategory: body.metalCategory || "GOLD_24K",
      purityPercent: body.purityPercent ? Number(body.purityPercent) : undefined,
      grossWeight: Number(body.grossWeight),
      lotBatchNo: body.lotBatchNo,
      expectedReturnDate: body.expectedReturnDate,
      purpose: body.purpose || "Workshop Issue",
      wastageAllowedPercent: body.wastageAllowedPercent ? Number(body.wastageAllowedPercent) : 0,
      notes: body.notes,
      authorizedById,
      reqContext: {
        userId: authorizedById,
        userEmail: auth.session.user.email,
        userName: auth.session.user.name,
        role: auth.user.systemRole,
        branchId: sourceBranchId,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: any) {
    console.error("Issue metal transfer error:", error);
    return NextResponse.json({ error: error.message || "Failed to issue metal transfer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
    const { transferId, metalReceivedBack = 0, metalConsumed = 0, notes } = body;

    if (!transferId) {
      return NextResponse.json({ error: "transferId is required" }, { status: 400 });
    }

    const updated = await MetalTransferService.settleTransfer({
      transferId,
      metalReceivedBack: Number(metalReceivedBack),
      metalConsumed: Number(metalConsumed),
      notes,
      actorId: parseInt(auth.session.user.id, 10),
      reqContext: {
        userId: parseInt(auth.session.user.id, 10),
        userEmail: auth.session.user.email,
        role: auth.user.systemRole,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Settle metal transfer error:", error);
    return NextResponse.json({ error: error.message || "Failed to settle metal transfer" }, { status: 500 });
  }
}
