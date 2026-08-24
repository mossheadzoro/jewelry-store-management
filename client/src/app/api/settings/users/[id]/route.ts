import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { StaffKycService } from "@/lib/services/StaffKycService";
import { AuditLogService } from "@/lib/audit/AuditLogService";
import { AuditActions, AuditModules } from "@/lib/audit/AuditRegistry";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(params.id, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        userBranches: { include: { branch: true } },
        branch: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    const { documents, kycStatus, hasPan, hasAadhar } = await StaffKycService.getStaffDocuments(
      userId
    );

    return NextResponse.json({
      user: {
        ...user,
        kycStatus,
        kycDocuments: documents,
        hasPan,
        hasAadhar,
      },
    });
  } catch (error) {
    console.error("Failed to fetch staff details:", error);
    return NextResponse.json({ error: "Failed to fetch staff details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = session.user.role;
  const actorId = parseInt(session.user.id, 10);
  const targetUserId = parseInt(params.id, 10);

  // RBAC checks:
  // - Admin/Owner: Full edit authority
  // - Manager: Can edit Salesmen and staff in their branch (cannot elevate to Admin)
  // - Salesman: Can only edit their own phone, address, emergency contact
  const isSelf = actorId === targetUserId;
  const isManagerOrAdmin =
    actorRole === "ADMIN" ||
    actorRole === "MANAGER" ||
    actorRole === "SUPER_ADMIN" ||
    actorRole === "OWNER";

  if (!isManagerOrAdmin && !isSelf) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to modify this staff profile." },
      { status: 403 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        userBranches: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    // Manager cannot edit an ADMIN user unless they are ADMIN themselves
    if (actorRole === "MANAGER" && existingUser.systemRole === "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Managers cannot edit Admin user profiles." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      systemRole,
      roleId,
      gender,
      phone,
      address,
      aadharNumber,
      panNumber,
      salary,
      bankAccount,
      ifscCode,
      status,
      department,
      emergencyContact,
      photo,
      signature,
      twoFactorEnabled,
      forcePasswordReset,
      loginTimeStart,
      loginTimeEnd,
      allowedIps,
      password,
      branches,
      reason,
    } = body;

    let updateData: any = {};

    if (isSelf && !isManagerOrAdmin) {
      // Salesman editing self: restricted to contact & personal details
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (emergencyContact) updateData.emergencyContact = emergencyContact;
      if (gender) updateData.gender = gender;
    } else {
      // Manager or Admin editing
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (gender !== undefined) updateData.gender = gender;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (aadharNumber !== undefined) updateData.aadharNumber = aadharNumber;
      if (panNumber !== undefined) updateData.panNumber = panNumber;
      if (bankAccount !== undefined) updateData.bankAccount = bankAccount;
      if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
      if (status !== undefined) updateData.status = status;
      if (department !== undefined) updateData.department = department;
      if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
      if (photo !== undefined) updateData.photo = photo;
      if (signature !== undefined) updateData.signature = signature;
      if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;
      if (forcePasswordReset !== undefined) updateData.forcePasswordReset = forcePasswordReset;
      if (loginTimeStart !== undefined) updateData.loginTimeStart = loginTimeStart;
      if (loginTimeEnd !== undefined) updateData.loginTimeEnd = loginTimeEnd;
      if (allowedIps !== undefined) updateData.allowedIps = allowedIps;

      // Role elevation check
      if (systemRole !== undefined) {
        if (actorRole === "MANAGER" && systemRole === "ADMIN") {
          return NextResponse.json(
            { error: "Managers cannot elevate accounts to Admin tier." },
            { status: 403 }
          );
        }
        updateData.systemRole = systemRole;
      }

      if (roleId !== undefined) {
        updateData.roleId =
          roleId === "" || roleId === null ? null : parseInt(roleId as string, 10);
      }

      if (salary !== undefined) {
        updateData.salary =
          salary === "" || salary === null ? null : parseFloat(salary as string);
      }

      if (branches && Array.isArray(branches)) {
        updateData.branchId = branches.length > 0 ? parseInt(branches[0], 10) : undefined;
        updateData.userBranches = {
          deleteMany: {},
          create: branches.map((bId: number | string) => ({
            branchId: parseInt(bId as string, 10),
          })),
        };
      }
    }

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Build Before Snapshot
    const beforeSnapshot: any = {
      name: existingUser.name,
      email: existingUser.email,
      systemRole: existingUser.systemRole,
      roleId: existingUser.roleId,
      department: existingUser.department,
      phone: existingUser.phone,
      address: existingUser.address,
      panNumber: existingUser.panNumber,
      aadharNumber: existingUser.aadharNumber,
      salary: existingUser.salary,
      bankAccount: existingUser.bankAccount,
      ifscCode: existingUser.ifscCode,
      status: existingUser.status,
      emergencyContact: existingUser.emergencyContact,
      branchId: existingUser.branchId,
    };

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      include: {
        role: true,
        userBranches: { include: { branch: true } },
        branch: true,
      },
    });

    // Build After Snapshot
    const afterSnapshot: any = {
      name: updatedUser.name,
      email: updatedUser.email,
      systemRole: updatedUser.systemRole,
      roleId: updatedUser.roleId,
      department: updatedUser.department,
      phone: updatedUser.phone,
      address: updatedUser.address,
      panNumber: updatedUser.panNumber,
      aadharNumber: updatedUser.aadharNumber,
      salary: updatedUser.salary,
      bankAccount: updatedUser.bankAccount,
      ifscCode: updatedUser.ifscCode,
      status: updatedUser.status,
      emergencyContact: updatedUser.emergencyContact,
      branchId: updatedUser.branchId,
    };

    // Calculate changed fields
    const changedFields: string[] = [];
    Object.keys(afterSnapshot).forEach((key) => {
      if (beforeSnapshot[key] !== afterSnapshot[key]) {
        changedFields.push(key);
      }
    });

    // Record Immutable Audit Log if changes occurred
    if (changedFields.length > 0 || password) {
      await AuditLogService.recordBusinessEvent({
        req,
        module: AuditModules.USERS,
        action: AuditActions.STAFF_UPDATED,
        entityType: "STAFF_USER",
        entityId: updatedUser.id.toString(),
        entityDisplayName: updatedUser.name,
        description: `Staff profile updated for ${updatedUser.name} by ${session.user.name || "Staff"} (${actorRole}). Fields changed: ${changedFields.join(", ")}`,
        before: beforeSnapshot,
        after: afterSnapshot,
        reason: reason || "Staff profile record updated",
        context: {
          userId: actorId,
          userName: session.user.name || "System Staff",
          userRole: actorRole,
          branchId: updatedUser.branchId || undefined,
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Failed to update staff user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = session.user.role;
  if (actorRole !== "ADMIN" && actorRole !== "SUPER_ADMIN" && actorRole !== "OWNER") {
    return NextResponse.json(
      { error: "Forbidden: Staff account deletion requires Admin authority." },
      { status: 403 }
    );
  }

  try {
    const userId = parseInt(params.id, 10);
    if (userId.toString() === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    // Record Immutable Audit Log
    await AuditLogService.recordBusinessEvent({
      req,
      module: AuditModules.USERS,
      action: AuditActions.STAFF_DELETED,
      entityType: "STAFF_USER",
      entityId: userId.toString(),
      entityDisplayName: existingUser.name,
      description: `Staff account ${existingUser.name} (${existingUser.email}) permanently deleted by ${session.user.name || "Admin"}`,
      before: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        systemRole: existingUser.systemRole,
        department: existingUser.department,
      },
      reason: "Account termination by Admin",
      context: {
        userId: parseInt(session.user.id, 10),
        userName: session.user.name || "System Admin",
        userRole: actorRole,
      },
    });

    return NextResponse.json({ message: "Staff user deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
