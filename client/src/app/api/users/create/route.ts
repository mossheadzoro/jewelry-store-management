// app/api/users/create/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existing) {
    return NextResponse.json({ message: "User already exists" }, { status: 400 });
  }

  // 🧠 Restrict MANAGER to only create SALESMAN
  if (session.user.role === "MANAGER" && body.role !== "SALESMAN") {
    return NextResponse.json({ message: "Managers can only create Salesmen" }, { status: 403 });
  }

  // 🧠 Automatically assign manager’s branch if not passed
  let branchId = body.branchId;
  if (session.user.role === "MANAGER") {
    const manager = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    branchId = manager?.branchId;
  }

  const hashed = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashed,
      role: body.role,
      gender:body.gender,
      phone:body.phone,
      address:body.address,
      aadharNumber:body.aadharNumber,
      panNumber:body.panNumber,
      salary:parseFloat(body.salary), 
      bankAccount:body.bankAccount,
      ifscCode:body.ifscCode,
      branchId: Number(branchId),
      createdById: Number(session.user.id),
    },
  });

  return NextResponse.json({ message: "User created", user });
}

