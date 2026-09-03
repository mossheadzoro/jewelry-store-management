// client/src/app/api/purchase/invoices/[id]/route.ts
// Purchase Invoice Detail & Update API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        branch: { select: { id: true, name: true } },
        items: true,
        payments: true,
        metalReceipts: true,
        returns: true,
        creditNotes: true,
        debitNotes: true,
        gstRecords: true,
        documents: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Purchase invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    console.error("Get invoice detail error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch invoice details" }, { status: 500 });
  }
}
