import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../../libs/prisma";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    const { name, description, subCategories } = body;

    // We can update name, description, and subcategories
    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
      include: { subCategories: true }
    });

    // If subCategories are provided, we replace them by deleting existing and creating new ones.
    // However, deleting subcategories might fail if they are tied to products. 
    // For safety, we only add new ones, or soft-manage them. 
    // Here we'll do a simple sync: find existing, create missing. 
    if (subCategories && Array.isArray(subCategories)) {
      const existingSubs = category.subCategories.map(s => s.name);
      const toAdd = subCategories.filter(s => !existingSubs.includes(s));
      const toRemove = category.subCategories.filter(s => !subCategories.includes(s.name));

      // Remove the ones no longer in the list (this may fail if tied to products, handle gracefully)
      for (const sub of toRemove) {
        try {
          await prisma.subCategory.delete({ where: { id: sub.id } });
        } catch (e) {
          console.warn(`Could not delete subcategory ${sub.name} (likely in use)`);
        }
      }

      // Add new ones
      for (const newSub of toAdd) {
        await prisma.subCategory.create({
          data: { name: newSub, categoryId: id, branchId: category.branchId }
        });
      }
    }

    const updated = await prisma.category.findUnique({
      where: { id },
      include: { subCategories: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);
    
    // Deleting a category will fail if products are linked. We let Prisma throw if so.
    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Cannot delete category in use" }, { status: 400 });
  }
}
