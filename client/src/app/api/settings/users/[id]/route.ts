import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../../libs/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(params.id, 10);
    const body = await req.json();
    
    const {
      name, email, systemRole, roleId, gender, phone, address, 
      aadharNumber, panNumber, salary, bankAccount, ifscCode,
      status, department, emergencyContact, photo, signature,
      twoFactorEnabled, forcePasswordReset, loginTimeStart, loginTimeEnd, allowedIps,
      password, branches
    } = body;

    let updateData: any = {
      name, email, systemRole, gender, phone, address,
      aadharNumber, panNumber, bankAccount, ifscCode,
      status, department, emergencyContact, photo, signature,
      twoFactorEnabled, forcePasswordReset, loginTimeStart, loginTimeEnd, allowedIps,
    };

    if (roleId !== undefined) {
      updateData.roleId = roleId === "" || roleId === null ? null : parseInt(roleId as string, 10);
    }

    if (salary !== undefined) {
      updateData.salary = salary === "" || salary === null ? null : parseFloat(salary as string);
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (branches && Array.isArray(branches)) {
      updateData.userBranches = {
        deleteMany: {},
        create: branches.map((bId: number | string) => ({ branchId: parseInt(bId as string, 10) }))
      };
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        userBranches: { include: { branch: true } },
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(params.id, 10);
    
    if (userId.toString() === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
