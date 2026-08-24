import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { invoiceNumber, oldHuidNumber, newHuidNumber, reason, branchId } = await req.json();

    if (!invoiceNumber || !oldHuidNumber || !newHuidNumber || !branchId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Validate Original Invoice
    const originalInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!originalInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2. Validate Old HUID belongs to this invoice
    const itemInInvoice = originalInvoice.items.find(
      item => item.product.huidNumber === oldHuidNumber
    );

    if (!itemInInvoice) {
      return NextResponse.json(
        { error: "Old HUID does not belong to this invoice" },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate replacements
    const existingReplacement = await prisma.replacementRequest.findFirst({
      where: {
        originalInvoiceId: originalInvoice.id,
        oldHuidNumber: oldHuidNumber,
        status: {
          notIn: ["REJECTED", "CLOSED"]
        }
      }
    });

    if (existingReplacement) {
      return NextResponse.json(
        { error: "Replacement request already exists for this HUID" },
        { status: 400 }
      );
    }

    // 4. Validate New HUID is available in inventory
    const newProduct = await prisma.productItem.findUnique({
      where: { huidNumber: newHuidNumber }
    });

    if (!newProduct) {
      return NextResponse.json({ error: "New HUID not found in inventory" }, { status: 404 });
    }

    // Note: We don't check for exact value match here since replacement could be value equivalent, 
    // or differ slightly, which is handled at approval time.

    // 5. Create Replacement Request
    const replacementRequest = await prisma.replacementRequest.create({
      data: {
        originalInvoiceId: originalInvoice.id,
        customerId: originalInvoice.customerId,
        oldHuidNumber,
        newHuidNumber,
        reason,
      }
    });

    // 6. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        entityType: "ReplacementRequest",
        entityId: replacementRequest.id,
        action: "CREATE",
        newValues: { invoiceNumber, oldHuidNumber, newHuidNumber, reason },
      }
    });

    return NextResponse.json(
      { message: "Replacement request created successfully", replacementRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating replacement request:", error);
    return NextResponse.json(
      { error: "Failed to create replacement request", details: error.message },
      { status: 500 }
    );
  }
}
