import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// adjust the path based on your authOptions file
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Verify that branchId exists (optional but recommended)

  try {
    const body = await req.json();
    const { name, description, branchId } = body;
    console.log("Branch ID:", branchId);
    const branchExists = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branchExists) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        branchId,
      },
    });

    return NextResponse.json(
      { message: "Category created successfully", category },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    console.error("Create Category Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
