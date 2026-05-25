import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const categoryId = parseInt(id);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subCategories: {
          include: {
            products: {
              select: { ntWeight: true, gsWeight: true, quantity: true },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let totalWeight = 0;
    const subCategories = category.subCategories.map((sub) => {
      const weight = sub.products.reduce((s, p) => s + (p.ntWeight ?? 0), 0);
      const items = sub.products.reduce((s, p) => s + (p.quantity ?? 1), 0);
      totalWeight += weight;

      return {
        id: sub.id,
        name: sub.name,
        itemCount: items,
        totalWeight: parseFloat(weight.toFixed(2)),
      };
    });

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      subCategories,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}
