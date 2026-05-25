import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const subCategoryId = parseInt(id);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "10");
    const search = req.nextUrl.searchParams.get("search") || "";

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      include: {
        category: true,
      },
    });

    if (!subCategory) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    const whereClause: any = { subCategoryId };
    if (search) {
      whereClause.OR = [
        { productCode: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { huidNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.productItem.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          stoneDetails: true,
        },
      }),
      prisma.productItem.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      subCategory: {
        id: subCategory.id,
        name: subCategory.name,
        category: subCategory.category,
      },
      products,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
