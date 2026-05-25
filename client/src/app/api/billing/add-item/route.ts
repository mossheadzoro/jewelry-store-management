import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const {
      invoiceId,
      productId,
      quantity,
      metalRate,
      makingPercent,
      stoneCharge,
      discountOnMaking,
    } = await req.json();

    if (!invoiceId || !productId || !quantity || !metalRate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch product
    const product = await prisma.productItem.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate values
    const gsWeight = product.gsWeight;
    const ntWeight = product.ntWeight;
    const metalValue = ntWeight * metalRate;
    const makingAmount = (metalValue * (makingPercent ?? 0)) / 100;
    const totalBeforeTax =
      metalValue + makingAmount + (stoneCharge ?? 0) - (discountOnMaking ?? 0);
    const cgst = totalBeforeTax * 0.015; // example: 1.5% CGST
    const sgst = totalBeforeTax * 0.015; // example: 1.5% SGST
    const totalAfterTax = totalBeforeTax + cgst + sgst;

    // Create invoice item
    const invoiceItem = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        productId,
        quantity,
        gsWeight,
        ntWeight,
        metalRate,
        metalValue,
        makingPercent: makingPercent ?? 0,
        makingAmount,
        stoneCharge: stoneCharge ?? 0,
        discountOnMaking: discountOnMaking ?? 0,
        totalBeforeTax,
        cgst,
        sgst,
        totalAfterTax,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(invoiceItem);
  } catch (error: any) {
    console.error("Add invoice item error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to add invoice item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
