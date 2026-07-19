import { NextResponse } from 'next/server';
import { PrismaClient, Gender, Prisma } from '@prisma/client';

import { prisma } from "@libs/prisma";

function parseDate(value?: string): Date | null {
  if (!value || value.trim() === "") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function POST(req: Request) {
  try {
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
      },
    });

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
