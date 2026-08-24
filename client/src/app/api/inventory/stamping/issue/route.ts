import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

async function getOrCreateStampingCenterCategory(tx: any, branchId: number) {
  let category = await tx.category.findFirst({
    where: { branchId, name: { equals: "STAMPING CENTER", mode: "insensitive" } },
  });

  if (!category) {
    category = await tx.category.create({
      data: {
        name: "STAMPING CENTER",
        description: "Jewellery currently at the Hallmarking/Stamping Center",
        branchId,
      },
    });
  }

  let subCategory = await tx.subCategory.findFirst({
    where: { branchId, categoryId: category.id, name: { equals: "Stamping Queue", mode: "insensitive" } },
  });

  if (!subCategory) {
    subCategory = await tx.subCategory.create({
      data: {
        name: "Stamping Queue",
        categoryId: category.id,
        branchId,
      },
    });
  }

  return { category, subCategory };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { branchId, productIds } = await req.json();

    if (!branchId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const bid = Number(branchId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Stamping Center category
      const { subCategory } = await getOrCreateStampingCenterCategory(tx, bid);

      // 2. Fetch the products being transferred
      const products = await tx.productItem.findMany({
        where: { id: { in: productIds }, branchId: bid },
      });

      if (products.length !== productIds.length) {
        throw new Error("Some products were not found");
      }

      // 3. Process each product
      for (const product of products) {
        // Move product to Stamping Center
        await tx.productItem.update({
          where: { id: product.id },
          data: {
            subCategory: { connect: { id: subCategory.id } },
          },
        });

        // Add single ledger entry (HALLMARK_OUT from unmarked)
        await tx.inventoryLedger.create({
          data: {
            productId: product.id,
            branchId: bid,
            txnType: "HALLMARK_OUT",
            refType: "HALLMARK_BATCH",
            qtyOut: product.quantity,
            netWeightOut: product.ntWeight,
            grossWeightOut: product.gsWeight,
            purityPercent: product.purity,
            remarks: "Unmarked to Stamp Center",
            createdById: Number(session.user.id),
          },
        });
      }

      return { success: true, count: products.length };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error issuing to Stamping Center:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
