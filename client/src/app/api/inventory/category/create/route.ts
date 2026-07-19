import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

import { prisma } from "@libs/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Auth check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Parse request
    const { name, description, branchId } = await req.json();

    if (!branchId || !name?.trim()) {
      return NextResponse.json(
        { error: "Branch ID and Category name are required" },
        { status: 400 }
      );
    }

    // 3️⃣ Verify branch exists
    const branchExists = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branchExists) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // 4️⃣ Check uniqueness within this branch
    const existingCategory = await prisma.category.findFirst({
      where: { name: name.trim(), branchId },
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists for this branch" },
        { status: 409 }
      );
    }

    // 5️⃣ Create category for this branch
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        branchId,
      },
    });

    return NextResponse.json(
      { message: "Category created successfully", category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Category Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
