import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { requireAuth } from "@/lib/authGuard";

export async function GET(req: Request) {
  const auth = await requireAuth(req, { module: "INVENTORY", requireBranch: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const branchId = auth.branchId!;

  try {
    const categories = await prisma.category.findMany({
      where: { branchId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { subCategories: true }
        }
      }
    });

    const result = await Promise.all(
      categories.map(async (cat) => {
        const stats = await prisma.productItem.aggregate({
          where: { branchId, subCategory: { categoryId: cat.id }, quantity: { gt: 0 } },
          _sum: { ntWeight: true, quantity: true }
        });
        return {
          id: cat.id,
          name: cat.name,
          totalWeight: parseFloat((stats._sum.ntWeight || 0).toFixed(2)),
          itemCount: stats._sum.quantity || 0,
          subCategoryCount: cat._count.subCategories,
        };
      })
    );

    const totalVaultWeight = result.reduce((s, c) => s + c.totalWeight, 0);
    const totalItems = result.reduce((s, c) => s + c.itemCount, 0);

    return NextResponse.json({ categories: result, totalVaultWeight, totalItems });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
