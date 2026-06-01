import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { Gender } from "@prisma/client";

function parseDate(value?: string): Date | null {
  if (!value || value.trim() === "") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// GET single customer with full details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tags: {
          include: {
            tagDefinition: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
            isFullyPaid: true,
            createdAt: true,
            paymentMethod: true,
            items: {
              select: {
                quantity: true,
                totalAfterTax: true,
                product: {
                  select: {
                    name: true,
                    subCategory: {
                      select: {
                        name: true,
                        category: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        Order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            priority: true,
            deliveryDate: true,
            notes: true,
            createdAt: true,
            customerName: true,
            customerMobile: true,
            advance: {
              select: {
                advanceReceiptNumber: true,
                moneyAmount: true,
                metalWeight: true,
                metalPurity: true,
              },
            },
            karigar: {
              select: { id: true, name: true },
            },
            items: {
              include: {
                category: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// UPDATE customer
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      name, mobile, email, pan, gstin, aadhar,
      address, city, state, pincode, gender, dob, anniversary,
    } = body;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(name && { name }),
        ...(mobile && { mobile }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(pan !== undefined && { pan: pan?.trim() || null }),
        ...(gstin !== undefined && { gstin: gstin?.trim() || null }),
        ...(aadhar !== undefined && { aadhar: aadhar?.trim() || null }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(gender && { gender: gender.toUpperCase() as Gender }),
        ...(dob !== undefined && { dob: parseDate(dob) }),
        ...(anniversary !== undefined && { anniversary: parseDate(anniversary) }),
      },
    });

    return NextResponse.json({ customer: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE customer (only if no invoices)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    // Check for existing invoices
    const invoiceCount = await prisma.invoice.count({
      where: { customerId },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete customer with ${invoiceCount} existing invoice(s).` },
        { status: 409 }
      );
    }

    // Also check orders
    const orderCount = await prisma.order.count({
      where: { customerId },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete customer with ${orderCount} existing order(s).` },
        { status: 409 }
      );
    }

    await prisma.customer.delete({ where: { id: customerId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
