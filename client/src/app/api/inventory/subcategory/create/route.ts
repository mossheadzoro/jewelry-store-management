import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "../../../../../../libs/prisma";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, categoryId ,branchId} = body;

  try {
    const newSubCategory = await prisma.subCategory.create({
      data: {
        name,
        categoryId: parseInt(categoryId),
        branchId: parseInt(branchId),
      },
    });

    return NextResponse.json(newSubCategory, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating subcategory", error }, { status: 500 });
  }
}
