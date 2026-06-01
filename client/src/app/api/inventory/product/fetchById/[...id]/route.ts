import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string[] | string }> }
) {
  const { id } = await context.params;
  const idStr = Array.isArray(id) ? id[0] : id;
  const productId = parseInt(idStr);

  if (!productId) {
    return NextResponse.json({ error: "Missing or invalid product ID" }, { status: 400 });
  }

  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId },
      include: {
        branch: true,
        stoneDetails: true,
        subCategory: {
          include: {
            products: true,
            category: true,
          },
        },
      },
    });

   
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formattedProduct = {
      id: product.id,
      price: product.price,
      name: product.name,
      gsWeight: product.gsWeight,
      ntWeight: product.ntWeight,
      productCode: product.productCode,
      huidNumber: product.huidNumber,
      image: product.image,
      description: product.description,
      purity: product.purity,
      barcode: product.barcode,
      size: product.size,
      quantity: product.quantity,
      reservedQty: product.reservedQty,
      stoneDetails: product.stoneDetails.map((stone) => ({
        id: stone.id,
        name: stone.name,
        weight: stone.weight,
        carat: stone.carat,
        color: stone.color,
        colorGrade: stone.colorGrade,
        clarity: stone.clarity,
        cut: stone.cut,
        shape: stone.shape,
        origin: stone.origin,
        treatment: stone.treatment,
        certification: stone.certification,
        quality: stone.quality,
        quantity: stone.quantity,
        price: stone.price,
        stoneImageUrl: stone.stoneImageUrl,
        certImageUrl: stone.certImageUrl,
      })),
      branch: {
        id: product.branch.id,
        name: product.branch.name,
      },
      subCategory: {
        id: product.subCategory?.id,
        name: product.subCategory?.name,
      },
      category: {
        id: product.subCategory?.category?.id,
        name: product.subCategory?.category?.name,
      },
    };

    return NextResponse.json(formattedProduct);
  } catch (error: any) {
    console.error("Error fetching product:", error.message || error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
