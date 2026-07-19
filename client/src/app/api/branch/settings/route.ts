import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const parsedBranchId = parseInt(branchId, 10);

    let settings = await prisma.branchSettings.findUnique({
      where: { branchId: parsedBranchId },
      include: { branch: true },
    });

    if (!settings) {
      // If settings don't exist yet, create them empty
      settings = await prisma.branchSettings.create({
        data: { branchId: parsedBranchId },
        include: { branch: true },
      });
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (err) {
    console.error("Error fetching branch settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only ADMIN can edit settings." }, { status: 401 });
    }

    const body = await req.json();
    const { 
      branchId, 
      name, city, state, pincode, country, // Branch specific
      shopName, gstNumber, pan, currency, address, phoneNumbers, email, website, invoiceHeaderText, termsAndConditions, logoUrl, qrCodeUrl // BranchSettings and some overlapping
    } = body;

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const parsedBranchId = parseInt(branchId, 10);

    // Update Branch
    await prisma.branch.update({
      where: { id: parsedBranchId },
      data: {
        name,
        address,
        city,
        state,
        pincode,
        country,
        phone: phoneNumbers,
        email,
      },
    });

    // Update BranchSettings
    const updatedSettings = await prisma.branchSettings.upsert({
      where: { branchId: parsedBranchId },
      update: {
        shopName, gstNumber, pan, currency, address, phoneNumbers, email, website, invoiceHeaderText, termsAndConditions, logoUrl, qrCodeUrl
      },
      create: {
        branchId: parsedBranchId,
        shopName, gstNumber, pan, currency, address, phoneNumbers, email, website, invoiceHeaderText, termsAndConditions, logoUrl, qrCodeUrl
      }
    });

    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (err) {
    console.error("Error saving branch settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
