import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  if (!id) {
    return NextResponse.json({ error: "Missing or invalid product ID" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const {
      name,
      price,
      gsWeight,
      ntWeight,
      productCode,
      huidNumber,
      image,
      description,
      purity,
      barcode,
      subCategoryId,
    } = body;

    const updatedProduct = await prisma.productItem.update({
      where: { id },
      data: {
        name,
        price,
        gsWeight,
        ntWeight,
        productCode,
        huidNumber,
        image,
        description,
        purity,
        barcode,
        subCategoryId,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Error updating product:", error.message || error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
