import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

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

    // 3. Prevent duplicate exchanges
    const existingExchange = await prisma.exchangeRequest.findFirst({
      where: {
        originalInvoiceId: originalInvoice.id,
        oldHuidNumber: oldHuidNumber,
        status: {
          notIn: ["REJECTED", "CLOSED"]
        }
      }
    });

    if (existingExchange) {
      return NextResponse.json(
        { error: "Exchange request already exists for this HUID" },
        { status: 400 }
      );
    }

    // 4. Validate New HUID and calculate differences
    const newProduct = await prisma.productItem.findUnique({
      where: { huidNumber: newHuidNumber }
    });

    if (!newProduct) {
      return NextResponse.json({ error: "New HUID not found in inventory" }, { status: 404 });
    }

    // For a real implementation, the pricing calculation might involve today's gold rate
    // and deduction percentages for the old product.
    // Assuming simple derived prices here:
    const oldValue = itemInInvoice.totalAfterTax;
    const newValue = newProduct.price || 0; // Using base price or calculated price
    const differenceAmount = newValue - oldValue;

    // 5. Create Exchange Request and Debit/Credit Note in a transaction
    // Assume flat 3% tax for simplicity on the difference amount
    const taxRate = 0.03;
    const diffTaxable = Math.abs(differenceAmount) / (1 + taxRate);
    const diffCgst = diffTaxable * (taxRate / 2);
    const diffSgst = diffTaxable * (taxRate / 2);

    const [exchangeRequest] = await prisma.$transaction([
      prisma.exchangeRequest.create({
        data: {
          originalInvoiceId: originalInvoice.id,
          customerId: originalInvoice.customerId,
          oldHuidNumber,
          newHuidNumber,
          oldValue,
          newValue,
          differenceAmount,
          reason,
          ...(differenceAmount > 0 && {
            debitNote: {
              create: {
                taxableValue: diffTaxable,
                cgstAmount: diffCgst,
                sgstAmount: diffSgst,
                totalAmount: Math.abs(differenceAmount),
              }
            }
          }),
          ...(differenceAmount < 0 && {
            creditNote: {
              create: {
                taxableValue: diffTaxable,
                cgstAmount: diffCgst,
                sgstAmount: diffSgst,
                totalAmount: Math.abs(differenceAmount),
              }
            }
          })
        }
      }),
      prisma.auditLog.create({
        data: {
          entityType: "ExchangeRequest",
          entityId: "PENDING_ID",
          action: "CREATE",
          newValues: { invoiceNumber, oldHuidNumber, newHuidNumber, oldValue, newValue, differenceAmount },
        }
      })
    ]);

    await prisma.auditLog.updateMany({
      where: { entityId: "PENDING_ID", action: "CREATE", entityType: "ExchangeRequest" },
      data: { entityId: exchangeRequest.id }
    });

    return NextResponse.json(
      { message: "Exchange request created successfully", exchangeRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating exchange request:", error);
    return NextResponse.json(
      { error: "Failed to create exchange request", details: error.message },
      { status: 500 }
    );
  }
}
