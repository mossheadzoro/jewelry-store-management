import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { generateCodesHelper } from "../../../../../../src/lib/actions/generateCodes";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { branchId, items } = await req.json();

    if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bid = Number(branchId);

    const result = await prisma.$transaction(async (tx) => {
      const updatedProducts = [];

      for (const item of items) {
        const stampingProductId = item.stampingId;
        const targetSubCategoryId = item.subCategoryId;

        if (!stampingProductId || !targetSubCategoryId) {
          throw new Error("Missing stampingId or subCategoryId in item");
        }

        // 1. Fetch the product being finalized
        const product = await tx.productItem.findUnique({
          where: { id: stampingProductId },
        });

        if (!product) {
          throw new Error(`Product not found for stampingId: ${stampingProductId}`);
        }

        // Fetch subCategory to get category name for barcode generation
        const subCat = await tx.subCategory.findUnique({
          where: { id: targetSubCategoryId },
          include: { category: true }
        });

        let finalProductCode = item.productCode || product.productCode;
        let finalBarcode = item.barcode || product.barcode;

        if (subCat?.category?.name) {
          const categoryType = subCat.category.id.toString();
          const { productCode, barcode } = await generateCodesHelper(
            tx,
            bid,
            categoryType,
            subCat.category.name,
            true // INCREMENT = true: This securely locks and increments the gapless SequenceTracker in DB
          );
          finalProductCode = productCode;
          finalBarcode = barcode;
        }

        // Delete existing stones if any, to recreate them cleanly (optional but safe)
        await tx.stoneDetail.deleteMany({
          where: { productItemId: product.id }
        });

        // 2. Update product to its final category, name, barcode, purity, weights, etc.
        const updatedProduct = await tx.productItem.update({
          where: { id: stampingProductId },
          data: {
            subCategory: { connect: { id: targetSubCategoryId } },
            name: item.name || product.name,
            productCode: finalProductCode,
            barcode: finalBarcode,
            huidNumber: item.huidNumber || product.huidNumber,
            purity: item.purity ? Number(item.purity) : product.purity,
            ntWeight: item.ntWeight ? Number(item.ntWeight) : product.ntWeight,
            gsWeight: item.gsWeight ? Number(item.gsWeight) : product.gsWeight,
            price: item.price ? Number(item.price) : product.price,
            description: item.description || product.description,
            otherCharges: item.otherCharges || product.otherCharges,
            otherChargesPrice: item.otherChargesPrice ? Number(item.otherChargesPrice) : product.otherChargesPrice,
            size: item.size || product.size,
            image: item.image || product.image,
            stoneDetails: {
              create: item.stoneDetails?.map((stone: any) => ({
                name: stone.name || "Stone",
                weight: Number(stone.weight) || 0,
                carat: stone.carat || null,
                color: stone.color || null,
                colorGrade: stone.colorGrade || null,
                clarity: stone.clarity || null,
                cut: stone.cut || null,
                shape: stone.shape || null,
                quality: stone.quality || "Good",
                quantity: Number(stone.quantity) || 1,
                price: stone.price ? Number(stone.price) : null,
              })) || [],
            }
          },
        });

        // 3. Add single ledger entry (HALLMARK_IN to final target category)
        await tx.inventoryLedger.create({
          data: {
            productId: updatedProduct.id,
            branchId: bid,
            txnType: "HALLMARK_IN",
            refType: "HALLMARK_BATCH",
            qtyIn: 1,
            netWeightIn: updatedProduct.ntWeight,
            grossWeightIn: updatedProduct.gsWeight,
            purityPercent: updatedProduct.purity,
            remarks: "Received from Stamp Center to Vault",
            createdById: Number(session.user.id),
          },
        });

        updatedProducts.push(updatedProduct);
      }

      return updatedProducts;
    });

    return NextResponse.json({ success: true, products: result });
  } catch (error: any) {
    console.error("Error receiving from Stamping Center:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
