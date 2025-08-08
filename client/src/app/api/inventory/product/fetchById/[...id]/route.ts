import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const productId = parseInt(id);

  if (!productId) {
    return NextResponse.json({ error: "Missing or invalid product ID" }, { status: 400 });
  }

  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId },
      include: {
        branch: true,
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
      weight: product.weight,
      productCode: product.productCode,
      huidNumber: product.huidNumber,
      image: product.image,
      description: product.description,
      purity: product.purity,
      barcode: product.barcode,
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
