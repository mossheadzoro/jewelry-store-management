import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissions || {},
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
