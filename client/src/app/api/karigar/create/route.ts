import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      mobile,
      whatsapp,
      address,

      department,
      specialities,
      wastage,

      profilePhoto,
      documents,

      adharNumber,
      panNumber,
      voterIdNumber,
    } = body;

    // 🔐 Basic validation
    if (!fullName || !mobile || !department) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🚨 Duplicate check (phone is unique)
    const existing = await prisma.karigar.findUnique({
      where: { phoneNumber: mobile },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Karigar with this phone number already exists" },
        { status: 409 }
      );
    }

    const karigar = await prisma.karigar.create({
      data: {
        // Basic
        name: fullName,
        phoneNumber: mobile,
        whatsappNumber: whatsapp || null,
        address: address || null,

        // IDs
        profilePhoto: profilePhoto?.preview || null,

        adharNumber: adharNumber || null,
        panNumber: panNumber || null,

        // Work
        department,
        speciality: specialities || [],

        // Defaults handled by Prisma
        isActive: true,
      },
    });

    return NextResponse.json(karigar, { status: 201 });
  } catch (error) {
    console.error("Karigar creation error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
