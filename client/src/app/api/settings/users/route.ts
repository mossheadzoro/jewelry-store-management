import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { StaffKycService } from "@/lib/services/StaffKycService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const roleFilter = searchParams.get("role");
  const kycStatusFilter = searchParams.get("kycStatus");
  const branchFilter = searchParams.get("branchId");

  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        userBranches: { include: { branch: true } },
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let filteredUsers = users;

    // RBAC Scope
    if (session.user.role === "MANAGER") {
      const managerBranchId = session.user.branchId ? parseInt(session.user.branchId, 10) : null;
      if (managerBranchId) {
        filteredUsers = filteredUsers.filter(
          (u) =>
            u.branchId === managerBranchId ||
            u.userBranches.some((ub) => ub.branchId === managerBranchId)
        );
      }
    } else if (session.user.role === "SALESMAN") {
      // Salesman sees colleague directory in read-only or their own profile
      // Allow viewing staff directory with filtered public details
    }

    // Query Filters
    if (search) {
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.phone && u.phone.includes(search)) ||
          (u.department && u.department.toLowerCase().includes(search))
      );
    }

    if (roleFilter) {
      filteredUsers = filteredUsers.filter((u) => u.systemRole === roleFilter);
    }

    if (branchFilter) {
      const bId = parseInt(branchFilter, 10);
      filteredUsers = filteredUsers.filter(
        (u) => u.branchId === bId || u.userBranches.some((ub) => ub.branchId === bId)
      );
    }

    // Enrich with KYC status from StaffKycService
    const enrichedUsers = await Promise.all(
      filteredUsers.map(async (u) => {
        const { documents, kycStatus, hasPan, hasAadhar } = await StaffKycService.getStaffDocuments(
          u.id
        );
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          systemRole: u.systemRole,
          roleId: u.roleId,
          role: u.role,
          status: u.status,
          gender: u.gender,
          phone: u.phone,
          address: u.address,
          department: u.department,
          salary: u.salary,
          bankAccount: u.bankAccount,
          ifscCode: u.ifscCode,
          emergencyContact: u.emergencyContact,
          panNumber: u.panNumber,
          aadharNumber: u.aadharNumber,
          branchId: u.branchId,
          branch: u.branch,
          userBranches: u.userBranches,
          createdAt: u.createdAt,
          kycStatus,
          kycDocsCount: documents.length,
          hasPan,
          hasAadhar,
        };
      })
    );

    let result = enrichedUsers;
    if (kycStatusFilter) {
      result = result.filter((u) => u.kycStatus === kycStatusFilter);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch staff users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RBAC: Only Admin or Manager can create staff profiles
  const actorRole = session.user.role;
  if (actorRole !== "ADMIN" && actorRole !== "MANAGER" && actorRole !== "SUPER_ADMIN" && actorRole !== "OWNER") {
    return NextResponse.json(
      { error: "Forbidden: Staff profile creation requires Manager or Admin authority." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      systemRole,
      roleId,
      status,
      branches,
      gender,
      phone,
      address,
      aadharNumber,
      panNumber,
      salary,
      bankAccount,
      ifscCode,
      department,
      emergencyContact,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and temporary password are required." },
        { status: 400 }
      );
    }

    // Manager cannot create an ADMIN
    if (actorRole === "MANAGER" && systemRole === "ADMIN") {
      return NextResponse.json(
        { error: "Managers cannot create Admin accounts." },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const primaryBranchId =
      branches && branches.length > 0 ? parseInt(branches[0], 10) : undefined;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        systemRole: systemRole || "SALESMAN",
        roleId: roleId ? parseInt(roleId, 10) : undefined,
        status: status || "ACTIVE",
        branchId: primaryBranchId,
        gender,
        phone,
        address,
        aadharNumber,
        panNumber,
        salary: salary ? parseFloat(salary) : undefined,
        bankAccount,
        ifscCode,
        department,
        emergencyContact,
        createdById: parseInt(session.user.id, 10),
        userBranches:
          branches && branches.length > 0
            ? {
                create: branches.map((bId: string | number) => ({
                  branchId: parseInt(bId as string, 10),
                })),
              }
            : undefined,
      },
      include: {
        role: true,
        userBranches: { include: { branch: true } },
      },
    });

    // Record Immutable Audit Log
    await AuditLogService.recordBusinessEvent({
      req,
      module: AuditModules.USERS,
      action: AuditActions.STAFF_CREATED,
      entityType: "STAFF_USER",
      entityId: user.id.toString(),
      entityDisplayName: user.name,
      description: `Staff profile created for ${user.name} (${user.systemRole}) by ${session.user.name || "Manager"}`,
      after: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
        department: user.department,
        phone: user.phone,
        salary: user.salary,
        branchId: user.branchId,
        status: user.status,
      },
      reason: body.creationReason || "New staff onboarding registration",
      context: {
        userId: parseInt(session.user.id, 10),
        userName: session.user.name || "Staff Admin",
        userRole: actorRole,
        branchId: primaryBranchId,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create staff user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create user." },
      { status: 500 }
    );
  }
}
