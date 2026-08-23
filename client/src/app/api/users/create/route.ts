// app/api/users/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";

import { prisma } from "@libs/prisma";

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
      systemRole: body.role,
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

  // Record Audit Event
  try {
    const { AuditLogService } = await import("@/lib/audit/AuditLogService");
    await AuditLogService.recordBusinessEvent({
      req,
      module: "USERS",
      action: "USERS.USER_CREATED",
      entityType: "USER",
      entityId: String(user.id),
      entityDisplayName: `${user.name} (${user.email})`,
      description: `Created new employee user ${user.name} with role ${user.systemRole}`,
      after: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
        branchId: user.branchId,
      },
      context: {
        branchId: Number(branchId),
        userId: Number(session.user.id),
        userNameSnapshot: session.user.name || undefined,
        roleSnapshot: session.user.role || undefined,
      },
    });
  } catch (auditErr) {
    console.error("User create audit failed:", auditErr);
  }

  return NextResponse.json({ message: "User created", user });
}

