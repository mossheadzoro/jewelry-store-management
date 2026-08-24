// /app/api/stock/update/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json();

    if (!id || !action)
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    let updateData = {};

    switch (action) {
      case "reserve":
        updateData = { reservedQty: { increment: 1 } };
        break;
      case "unreserve":
        updateData = { reservedQty: { decrement: 1 } };
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const updated = await prisma.productItem.update({
      where: { id },
      data: updateData,
    });

    // Record Audit Event
    try {
      const { AuditLogService } = await import("@/lib/audit/AuditLogService");
      const isReserve = action === "reserve";
      await AuditLogService.recordBusinessEvent({
        req,
        module: "INVENTORY",
        action: isReserve ? "INVENTORY.STOCK_RESERVED" : "INVENTORY.STOCK_RELEASED",
        entityType: "PRODUCT_ITEM",
        entityId: String(id),
        entityDisplayName: `Product Item #${id}`,
        description: isReserve ? `Reserved 1 unit of product item #${id}` : `Released 1 unit of product item #${id}`,
        after: { id, reservedQty: updated.reservedQty, status: updated.status },
      });
    } catch (auditErr) {
      console.error("Stock update audit failed:", auditErr);
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Stock update error:", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
