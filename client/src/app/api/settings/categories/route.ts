import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : session.user.branchId ? parseInt(session.user.branchId, 10) : undefined;

    if (!branchId) return NextResponse.json({ error: "Branch ID required" }, { status: 400 });

    const categories = await prisma.category.findMany({
      where: { branchId },
      include: { subCategories: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, branchId, subCategories } = body;

    const targetBranchId = branchId || (session.user.branchId ? parseInt(session.user.branchId, 10) : undefined);
    if (!targetBranchId) return NextResponse.json({ error: "Branch ID required" }, { status: 400 });

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { name_branchId: { name, branchId: targetBranchId } }
    });

    if (existing) {
      return NextResponse.json({ error: "Category already exists in this branch" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        branchId: targetBranchId,
        subCategories: subCategories && subCategories.length > 0 ? {
          create: subCategories.map((sub: string) => ({ name: sub, branchId: targetBranchId }))
        } : undefined
      },
      include: { subCategories: true }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
