// src/app/api/inventory/product/codes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";
import { generateCodesHelper } from "../../../../../../src/lib/actions/generateCodes";

export async function POST(req: Request) {
  try {
    const { branchId, categoryName, offset = 0 } = await req.json();

    if (!branchId || !categoryName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch category details to get the categoryType (id)
    const category = await prisma.category.findUnique({
      where: { name_branchId: { name: categoryName, branchId: branchId } },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const categoryType = category.id.toString();

    // Generate preview codes (increment = false)
    const { productCode, barcode } = await generateCodesHelper(
      prisma,
      branchId,
      categoryType,
      categoryName,
      false,
      Number(offset)
    );

    return NextResponse.json({ productCode, barcode }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
