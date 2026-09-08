import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

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
    const userRole = session?.user?.role || (session?.user as any)?.systemRole;
    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only ADMIN can edit settings." }, { status: 401 });
    }

    const body = await req.json();
    const { 
      branchId, 
      name, city, state, pincode, country, // Branch specific
      shopName, gstNumber, pan, currency, address, phoneNumbers, email, website, invoiceHeaderText, termsAndConditions, logoUrl, qrCodeUrl,
      invoiceFormat, invoicePageSize, invoiceColor, termsPrintLocation, invoiceCustomizations
    } = body;

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const parsedBranchId = parseInt(branchId, 10);

    // Update Branch only if valid, non-empty branch fields are provided
    // This prevents null or undefined from violating required non-nullable fields on model Branch (address, phone, email, etc.)
    const branchUpdateData: Record<string, string> = {};
    if (typeof name === "string" && name.trim()) branchUpdateData.name = name.trim();
    if (typeof address === "string" && address.trim()) branchUpdateData.address = address.trim();
    if (typeof city === "string" && city.trim()) branchUpdateData.city = city.trim();
    if (typeof state === "string" && state.trim()) branchUpdateData.state = state.trim();
    if (typeof pincode === "string" && pincode.trim()) branchUpdateData.pincode = pincode.trim();
    if (typeof country === "string" && country.trim()) branchUpdateData.country = country.trim();
    if (typeof phoneNumbers === "string" && phoneNumbers.trim()) branchUpdateData.phone = phoneNumbers.trim();
    else if (typeof body.phone === "string" && body.phone.trim()) branchUpdateData.phone = body.phone.trim();
    if (typeof email === "string" && email.trim()) branchUpdateData.email = email.trim();

    if (Object.keys(branchUpdateData).length > 0) {
      await prisma.branch.update({
        where: { id: parsedBranchId },
        data: branchUpdateData,
      });
    }

    // Build BranchSettings update payload (only include fields that were provided)
    const settingsUpdateData: Record<string, any> = {};
    if (shopName !== undefined) settingsUpdateData.shopName = shopName;
    if (gstNumber !== undefined) settingsUpdateData.gstNumber = gstNumber;
    if (pan !== undefined) settingsUpdateData.pan = pan;
    if (currency !== undefined && currency !== null) settingsUpdateData.currency = currency;
    if (address !== undefined) settingsUpdateData.address = address;
    if (phoneNumbers !== undefined) settingsUpdateData.phoneNumbers = phoneNumbers;
    if (email !== undefined) settingsUpdateData.email = email;
    if (website !== undefined) settingsUpdateData.website = website;
    if (invoiceHeaderText !== undefined) settingsUpdateData.invoiceHeaderText = invoiceHeaderText;
    if (termsAndConditions !== undefined) settingsUpdateData.termsAndConditions = termsAndConditions;
    if (logoUrl !== undefined) settingsUpdateData.logoUrl = logoUrl;
    if (qrCodeUrl !== undefined) settingsUpdateData.qrCodeUrl = qrCodeUrl;
    if (invoiceFormat !== undefined) settingsUpdateData.invoiceFormat = invoiceFormat;
    if (invoicePageSize !== undefined) settingsUpdateData.invoicePageSize = invoicePageSize;
    if (invoiceColor !== undefined) settingsUpdateData.invoiceColor = invoiceColor;
    if (termsPrintLocation !== undefined) settingsUpdateData.termsPrintLocation = termsPrintLocation;
    if (invoiceCustomizations !== undefined) settingsUpdateData.invoiceCustomizations = invoiceCustomizations;

    // Update BranchSettings
    const updatedSettings = await prisma.branchSettings.upsert({
      where: { branchId: parsedBranchId },
      update: settingsUpdateData,
      create: {
        branchId: parsedBranchId,
        shopName: shopName ?? null,
        gstNumber: gstNumber ?? null,
        pan: pan ?? null,
        currency: currency || "INR",
        address: address ?? null,
        phoneNumbers: phoneNumbers ?? null,
        email: email ?? null,
        website: website ?? null,
        invoiceHeaderText: invoiceHeaderText ?? null,
        termsAndConditions: termsAndConditions ?? null,
        logoUrl: logoUrl ?? null,
        qrCodeUrl: qrCodeUrl ?? null,
        invoiceFormat: invoiceFormat || "standard",
        invoicePageSize: invoicePageSize || "A4",
        invoiceColor: invoiceColor || "brand",
        termsPrintLocation: termsPrintLocation || "front",
        invoiceCustomizations: invoiceCustomizations ?? null,
      }
    });

    // Automatically sync shop name and branding to Email & Notification Settings
    try {
      const emailUpdateData: any = {};
      if (shopName || name) emailUpdateData.senderName = shopName || name;
      if (gstNumber) emailUpdateData.gstin = gstNumber;
      if (phoneNumbers) emailUpdateData.phone = phoneNumbers;
      if (website) emailUpdateData.website = website;
      if (logoUrl) emailUpdateData.companyLogoUrl = logoUrl;
      if (address) emailUpdateData.businessAddress = address;

      if (Object.keys(emailUpdateData).length > 0) {
        await prisma.emailSettings.updateMany({
          where: {
            tenantId: "default-tenant",
            OR: [{ branchId: parsedBranchId }, { branchId: 0 }, { branchId: null }],
          },
          data: emailUpdateData,
        });
      }
    } catch (emailSyncErr) {
      console.warn("Could not sync EmailSettings on branch update", emailSyncErr);
    }

    return NextResponse.json({ message: "Updated successfully", settings: updatedSettings }, { status: 200 });
  } catch (err) {
    console.error("Error saving branch settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
