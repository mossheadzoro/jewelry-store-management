import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { insertLedgerEntry } from "../../../../../libs/inventoryLedger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branchId, items, remarks } = body;

    if (!branchId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auditNo = `AUD-${Date.now().toString().slice(-8)}`;

    const audit = await prisma.$transaction(async (tx: any) => {
      const newAudit = await tx.stockAudit.create({
        data: {
          auditNo,
          branchId,
          status: "CLOSED",
          remarks: remarks || null,
        },
      });

      for (const item of items) {
        const variance = item.physicalQty - item.systemQty;

        await tx.stockAuditItem.create({
          data: {
            auditId: newAudit.id,
            productId: item.productId,
            systemQty: item.systemQty,
            physicalQty: item.physicalQty,
            varianceQty: variance,
            remarks: item.remarks || null,
          },
        });

        // Auto-adjust stock
        if (variance !== 0) {
          await tx.productItem.update({
            where: { id: item.productId },
            data: { quantity: item.physicalQty },
          });

          const product = await tx.productItem.findUnique({ where: { id: item.productId } });

          if (variance > 0) {
            await insertLedgerEntry(tx, {
              productId: item.productId,
              branchId,
              txnType: "ADJUSTMENT_IN",
              refType: "SYSTEM",
              refId: newAudit.id,
              qtyIn: variance,
              grossWeightIn: (product?.gsWeight || 0) * variance,
              netWeightIn: (product?.ntWeight || 0) * variance,
              remarks: `Stock audit adjustment (+${variance}) - ${auditNo}`,
            });
          } else {
            await insertLedgerEntry(tx, {
              productId: item.productId,
              branchId,
              txnType: "ADJUSTMENT_OUT",
              refType: "SYSTEM",
              refId: newAudit.id,
              qtyOut: Math.abs(variance),
              grossWeightOut: (product?.gsWeight || 0) * Math.abs(variance),
              netWeightOut: (product?.ntWeight || 0) * Math.abs(variance),
              remarks: `Stock audit adjustment (${variance}) - ${auditNo}`,
            });
          }
        }
      }

      return newAudit;
    });

    return NextResponse.json({ success: true, auditId: audit.id, auditNo });
  } catch (error: any) {
    console.error("Audit error:", error);
    return NextResponse.json({ error: error.message || "Failed to create audit" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId) where.branchId = parseInt(branchId);

    const audits = await prisma.stockAudit.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, productCode: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ audits });
  } catch (error: any) {
    console.error("Audit fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch audits" }, { status: 500 });
  }
}
