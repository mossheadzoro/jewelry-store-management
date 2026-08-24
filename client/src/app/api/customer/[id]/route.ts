import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

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
        CustomerWallet: true,
        CustomerDocument: {
          orderBy: { uploadedAt: "desc" },
        },
        savingSchemes: {
          include: {
            deposits: true,
            redemptions: true,
          },
          orderBy: { createdAt: "desc" },
        },
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
                    purity: true,
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
          where: {
            status: { not: "DELIVERED" }
          },
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
            Wholesaler: {
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

// UPDATE customer with RBAC & Audit Ledger Tracking
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
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role || "SALESMAN";
    const body = await req.json();

    const {
      name, mobile, email, pan, gstin, aadhar,
      address, city, state, pincode, gender, dob, anniversary, customerGroup,
      optInWhatsapp, optInSms, optInEmail, optInPromotions, reason
    } = body;

    // Fetch existing customer state before updating
    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // RBAC: If salesman, prevent modifying customerGroup or tax identifiers if restricted
    const isManagerOrAdmin = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN" || userRole === "OWNER";

    const updateData: any = {
      ...(name && { name }),
      ...(mobile && { mobile }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(gender && { gender: gender.toUpperCase() as Gender }),
      ...(dob !== undefined && { dob: parseDate(dob) }),
      ...(anniversary !== undefined && { anniversary: parseDate(anniversary) }),
      ...(optInWhatsapp !== undefined && { optInWhatsapp }),
      ...(optInSms !== undefined && { optInSms }),
      ...(optInEmail !== undefined && { optInEmail }),
      ...(optInPromotions !== undefined && { optInPromotions }),
    };

    // Manager / Admin elevated permissions
    if (isManagerOrAdmin) {
      if (pan !== undefined) updateData.pan = pan?.trim() || null;
      if (gstin !== undefined) updateData.gstin = gstin?.trim() || null;
      if (aadhar !== undefined) updateData.aadhar = aadhar?.trim() || null;
      if (customerGroup !== undefined) updateData.customerGroup = customerGroup?.trim() || null;
    } else {
      // Salesman can only update tax IDs if they were previously empty
      if (pan !== undefined && !existing.pan) updateData.pan = pan?.trim() || null;
      if (gstin !== undefined && !existing.gstin) updateData.gstin = gstin?.trim() || null;
      if (aadhar !== undefined && !existing.aadhar) updateData.aadhar = aadhar?.trim() || null;
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    // Record Business Audit Event into Profile Change Ledger
    try {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.CUSTOMERS,
        action: AuditActions.CUSTOMER_UPDATED,
        entityType: "CUSTOMER",
        entityId: String(customerId),
        entityDisplayName: updated.name,
        description: `Updated customer profile for ${updated.name}${reason ? ` - ${reason}` : ""}`,
        before: {
          name: existing.name,
          mobile: existing.mobile,
          email: existing.email,
          pan: existing.pan,
          gstin: existing.gstin,
          aadhar: existing.aadhar,
          address: existing.address,
          city: existing.city,
          state: existing.state,
          pincode: existing.pincode,
          gender: existing.gender,
          customerGroup: existing.customerGroup,
        },
        after: {
          name: updated.name,
          mobile: updated.mobile,
          email: updated.email,
          pan: updated.pan,
          gstin: updated.gstin,
          aadhar: updated.aadhar,
          address: updated.address,
          city: updated.city,
          state: updated.state,
          pincode: updated.pincode,
          gender: updated.gender,
          customerGroup: updated.customerGroup,
        },
        reason: reason || "Customer profile details modified",
        context: {
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          userNameSnapshot: session?.user?.name || "System Staff",
          roleSnapshot: userRole,
          branchId: session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined,
        },
        metadata: {
          updatedFields: Object.keys(updateData),
        },
      });
    } catch (auditErr) {
      console.error("[CustomerUpdate] Failed to record audit log:", auditErr);
    }

    return NextResponse.json({ customer: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE customer (restricted to MANAGER & ADMIN, only if no invoices/orders)
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
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role || "SALESMAN";

    // RBAC: Only Managers & Admins can delete
    if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN" && userRole !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Customer deletion requires Manager or Admin authority." },
        { status: 403 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

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

    // Record deletion in Audit Log
    try {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.CUSTOMERS,
        action: AuditActions.CUSTOMER_DELETED,
        entityType: "CUSTOMER",
        entityId: String(customerId),
        entityDisplayName: customer.name,
        description: `Deleted customer profile ${customer.name} (Mobile: ${customer.mobile})`,
        before: {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email,
          city: customer.city,
        },
        context: {
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          userNameSnapshot: session?.user?.name || "System Staff",
          roleSnapshot: userRole,
          branchId: session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined,
        },
      });
    } catch (auditErr) {
      console.error("[CustomerDelete] Failed to record audit log:", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

