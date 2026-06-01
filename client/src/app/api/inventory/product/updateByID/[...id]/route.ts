import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string[] | string }> }
) {
  const { id: rawId } = await context.params;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = parseInt(idStr);

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
      size,
      purity,
      barcode,
      subCategoryId,
      quantity,
      stoneDetails,
    } = body;

    const updatedProduct = await prisma.productItem.update({
      where: { id },
      data: {
        name,
        price: price ? parseFloat(price.toString()) : null,
        gsWeight: parseFloat(gsWeight.toString()),
        ntWeight: parseFloat(ntWeight.toString()),
        productCode,
        huidNumber,
        image,
        description,
        size,
        purity: parseFloat(purity.toString()),
        barcode,
        subCategoryId: parseInt(subCategoryId.toString()),
        quantity: parseInt(quantity.toString()),
        stoneDetails: stoneDetails ? {
          deleteMany: {},
          create: stoneDetails.map((stone: any) => ({
            name: stone.name,
            weight: stone.weight ? parseFloat(stone.weight.toString()) : 0,
            carat: stone.carat,
            color: stone.color,
            colorGrade: stone.colorGrade,
            clarity: stone.clarity,
            cut: stone.cut,
            shape: stone.shape,
            origin: stone.origin,
            treatment: stone.treatment,
            certification: stone.certification,
            quality: stone.quality || "Premium",
            quantity: Number(stone.quantity || 1),
            price: stone.price ? parseFloat(stone.price.toString()) : null,
            stoneImageUrl: stone.stoneImageUrl,
            certImageUrl: stone.certImageUrl,
          })),
        } : undefined,
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
