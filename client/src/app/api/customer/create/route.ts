import { NextResponse } from 'next/server';
import { PrismaClient, Gender, Prisma } from '@prisma/client';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

function parseDate(value?: string): Date | null {
  if (!value || value.trim() === "") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      name,
      mobile,
      email,
      pan,
      gstin,
      aadhar,
      address,
      city,
      state,
      pincode,
      gender,
      dob,
      anniversary,
      customerGroup,
      optInWhatsapp,
      optInSms,
      optInEmail,
      optInPromotions,
    } = body;

    // Basic validation
    if (!name || !mobile || !address || !city || !state || !pincode || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email?.trim() || undefined,
        pan: pan?.trim() || undefined,
        gstin: gstin?.trim() || undefined,
        aadhar: aadhar?.trim() || undefined,
        address,
        city,
        state,
        pincode,
        gender: gender.toUpperCase() as Gender,
        dob: parseDate(dob),
        anniversary: parseDate(anniversary),
        customerGroup: customerGroup || undefined,
        optInWhatsapp: optInWhatsapp !== undefined ? optInWhatsapp : true,
        optInSms: optInSms !== undefined ? optInSms : true,
        optInEmail: optInEmail !== undefined ? optInEmail : true,
        optInPromotions: optInPromotions !== undefined ? optInPromotions : true,
      },
    });

    // Record Business Audit Event
    try {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.CUSTOMERS,
        action: AuditActions.CUSTOMER_CREATED,
        entityType: "CUSTOMER",
        entityId: String(newCustomer.id),
        entityDisplayName: newCustomer.name,
        description: `Created customer profile for ${newCustomer.name} (${newCustomer.mobile})`,
        after: {
          id: newCustomer.id,
          name: newCustomer.name,
          mobile: newCustomer.mobile,
          email: newCustomer.email,
          city: newCustomer.city,
          state: newCustomer.state,
          gender: newCustomer.gender,
          customerGroup: newCustomer.customerGroup,
          pan: newCustomer.pan,
          gstin: newCustomer.gstin,
          aadhar: newCustomer.aadhar,
        },
        context: {
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          userNameSnapshot: session?.user?.name || "System Staff",
          roleSnapshot: session?.user?.role || "SALESMAN",
          branchId: session?.user?.branchId ? parseInt(session.user.branchId, 10) : undefined,
        },
        metadata: {
          creationSource: "Customer Management Panel",
        },
      });
    } catch (auditErr) {
      console.error("[CustomerCreate] Failed to record audit log:", auditErr);
    }

    return NextResponse.json(newCustomer, { status: 201 });

  } catch (error) {
    console.error("Server error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Customer with this mobile or email already exists.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
