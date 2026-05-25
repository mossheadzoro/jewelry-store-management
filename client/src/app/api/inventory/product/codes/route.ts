// src/app/api/product/generate-codes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";

export async function POST(req: Request) {
  try {
    const { branchId, categoryName, offset = 0 } = await req.json();

    if (!branchId || !categoryName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch branch details
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Fetch category details
    const category = await prisma.category.findUnique({
      where: { name_branchId: { name: categoryName, branchId: branchId } },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const branchCode = branch.name.substring(0, 3).toUpperCase();
    const categoryPrefix = categoryName.substring(0, 3).toUpperCase();
    const categoryType = category.id; // numeric category type

    // Get last product for this branch & category
    const lastProduct = await prisma.productItem.findFirst({
      where: { branchId, barcode: { startsWith: String(branchId).padStart(2, "0") } },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    const nextSeq = (lastProduct ? lastProduct.id + 1 : 1) + Number(offset);
    const seqStr = String(nextSeq).padStart(5, "0");

    // ProductCode (your old logic)
    const productCode = `${branchCode}${branchId}${categoryType}${categoryPrefix}${seqStr}`;

    // Barcode: numeric only = [BranchID(2)][CategoryID(2)][YYMMDD][Seq(5)]
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    const barcode = `${String(branchId).padStart(2, "0")}${String(categoryType).padStart(2, "0")}${datePart}${seqStr}`;

    return NextResponse.json({ productCode, barcode }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
