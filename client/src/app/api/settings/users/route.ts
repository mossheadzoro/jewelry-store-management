import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        role: true, 
        userBranches: { include: { branch: true } }, 
        branch: true, 
      },
      orderBy: { createdAt: "desc" },
    });
    
    if (session.user.role === "MANAGER") {
       const managerBranchId = session.user.branchId ? parseInt(session.user.branchId, 10) : null;
       const filteredUsers = users.filter(u => u.branchId === managerBranchId || u.userBranches.some(ub => ub.branchId === managerBranchId));
       return NextResponse.json(filteredUsers);
    }

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name, email, password, systemRole, roleId, status, branches,
      gender, phone, address, aadharNumber, panNumber, salary, bankAccount, ifscCode,
      department, emergencyContact
    } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const primaryBranchId = branches && branches.length > 0 ? parseInt(branches[0], 10) : undefined;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        systemRole: systemRole || "SALESMAN",
        roleId: roleId ? parseInt(roleId, 10) : undefined,
        status: status || "ACTIVE",
        branchId: primaryBranchId,
        gender, phone, address, aadharNumber, panNumber, 
        salary: salary ? parseFloat(salary) : undefined, 
        bankAccount, ifscCode, department, emergencyContact,
        createdById: parseInt(session.user.id, 10),
        userBranches: branches && branches.length > 0 ? {
          create: branches.map((bId: string | number) => ({ branchId: parseInt(bId as string, 10) }))
        } : undefined
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
