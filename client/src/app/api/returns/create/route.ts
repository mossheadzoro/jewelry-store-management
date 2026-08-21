import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function POST(req: Request) {
  try {
    const { invoiceNumber, huidNumber, reason, branchId } = await req.json();

    if (!invoiceNumber || !huidNumber || !branchId) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceNumber, huidNumber, branchId" },
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

    // 2. Validate HUID belongs to this invoice
    const itemInInvoice = originalInvoice.items.find(
      item => item.product.huidNumber === huidNumber
    );

    if (!itemInInvoice) {
      return NextResponse.json(
        { error: "HUID does not belong to this invoice" },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate returns
    const existingReturn = await prisma.returnRequest.findFirst({
      where: {
        originalInvoiceId: originalInvoice.id,
        huidNumber: huidNumber,
        status: {
          notIn: ["REJECTED", "CLOSED"]
        }
      }
    });

    if (existingReturn) {
      return NextResponse.json(
        { error: "Return request already exists for this HUID" },
        { status: 400 }
      );
    }

    // 4. Create Return Request and Credit Note in a transaction
    const [returnRequest] = await prisma.$transaction([
      prisma.returnRequest.create({
        data: {
          originalInvoiceId: originalInvoice.id,
          customerId: originalInvoice.customerId,
          huidNumber,
          reason,
          refundAmount: itemInInvoice.totalAfterTax || (itemInInvoice.totalBeforeTax + itemInInvoice.cgst + itemInInvoice.sgst),
          creditNote: {
            create: {
              taxableValue: itemInInvoice.totalBeforeTax,
              cgstAmount: itemInInvoice.cgst,
              sgstAmount: itemInInvoice.sgst,
              totalAmount: itemInInvoice.totalAfterTax || (itemInInvoice.totalBeforeTax + itemInInvoice.cgst + itemInInvoice.sgst)
            }
          }
        }
      }),
      prisma.auditLog.create({
        data: {
          entityType: "ReturnRequest",
          entityId: "PENDING_ID", // Will be updated below
          action: "CREATE",
          newValues: { invoiceNumber, huidNumber, reason },
        }
      })
    ]);

    // Update the audit log with the actual return request ID
    await prisma.auditLog.updateMany({
      where: { entityId: "PENDING_ID", action: "CREATE", entityType: "ReturnRequest" },
      data: { entityId: returnRequest.id }
    });

    return NextResponse.json(
      { message: "Return request created successfully", returnRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating return request:", error);
    return NextResponse.json(
      { error: "Failed to create return request", details: error.message },
      { status: 500 }
    );
  }
}
