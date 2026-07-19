import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../../libs/prisma";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    const role = await prisma.role.update({
      where: { id: parseInt(params.id, 10) },
      data: {
        name,
        description,
        permissions,
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roleId = parseInt(params.id, 10);
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 });
    }

    if (role._count.users > 0) {
      return NextResponse.json({ error: "Cannot delete role assigned to users" }, { status: 400 });
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
