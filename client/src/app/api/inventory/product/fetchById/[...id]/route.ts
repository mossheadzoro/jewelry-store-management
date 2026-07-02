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

    let activeBookingDetails = null;
    if (product.reservedQty > 0) {
      try {
        const activeBookingItem = await prisma.productBookingItem.findFirst({
          where: {
            productId: product.id,
            booking: {
              status: "ACTIVE"
            }
          },
          include: {
            booking: {
              include: { customer: true }
            }
          }
        });
        if (activeBookingItem && activeBookingItem.booking) {
           activeBookingDetails = {
             bookingNumber: activeBookingItem.booking.bookingNumber,
             customerName: activeBookingItem.booking.customer?.name || "Customer",
             bookingId: activeBookingItem.booking.id
           };
        }
      } catch (e) {
        console.error("Error fetching active booking details", e);
      }
    }

    return NextResponse.json({ ...formattedProduct, activeBookingDetails });
  } catch (error: any) {
    console.error("Error fetching product:", error.message || error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
