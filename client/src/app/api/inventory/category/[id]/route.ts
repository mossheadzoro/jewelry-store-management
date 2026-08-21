import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";
import { requireAuth } from "@/lib/authGuard";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { module: "INVENTORY", requireBranch: false });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await context.params;
    const categoryId = parseInt(id);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subCategories: {
          include: {
            products: {
              where: { quantity: { gt: 0 } },
              select: { ntWeight: true, gsWeight: true, quantity: true },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Branch Authorization Check
    if (auth.user!.systemRole !== "ADMIN") {
      const allowedBranchIds = [
        auth.user!.branchId,
        ...auth.user!.userBranches.map(ub => ub.branchId)
      ].filter(Boolean);
      
      if (!allowedBranchIds.includes(category.branchId)) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this branch" }, { status: 403 });
      }
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
