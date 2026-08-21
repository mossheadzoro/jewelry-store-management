import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@libs/prisma";
import { NextResponse } from "next/server";

export async function requireAuth(req: Request, options?: { module?: string, requireBranch?: boolean }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const userId = parseInt(session.user.id, 10);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      userBranches: true
    }
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  // 1. Branch Validation
  let branchId: number | undefined;
  
  if (options?.requireBranch !== false) {
    // Try to get branchId from URL params or JSON body if it's a POST/PUT
    const url = new URL(req.url);
    const branchIdStr = url.searchParams.get("branchId");
    
    if (branchIdStr) {
      branchId = parseInt(branchIdStr, 10);
    } else if (req.method === "POST" || req.method === "PUT") {
      try {
        // Clone request so we don't consume the body for the actual route handler
        const reqClone = req.clone();
        const body = await reqClone.json();
        if (body.branchId) branchId = parseInt(body.branchId, 10);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Fallback to user's default branch if they only have one, or if they are ADMIN
    if (!branchId && session.user.branchId) {
       branchId = parseInt(session.user.branchId, 10);
    }

    if (!branchId && options?.requireBranch === true) {
      return { error: "Branch ID is required", status: 400 };
    }

    // If a branchId is specified, ensure the user has access to it
    if (branchId && user.systemRole !== "ADMIN") {
      const allowedBranchIds = [
        user.branchId,
        ...user.userBranches.map(ub => ub.branchId)
      ].filter(Boolean);

      if (!allowedBranchIds.includes(branchId)) {
        return { error: "Forbidden: You do not have access to this branch", status: 403 };
      }
    }
  }

  // 2. Role / Permission Validation
  if (options?.module && user.systemRole !== "ADMIN" && user.systemRole !== "OWNER" && user.systemRole !== "SUPER_ADMIN") {
    // Determine the action based on HTTP method
    let action = "view";
    if (req.method === "POST") action = "create";
    if (req.method === "PUT" || req.method === "PATCH") action = "edit";
    if (req.method === "DELETE") action = "delete";

    // Support wildcard permissions (e.g. {"*": true} from seeded Admin roles)
    const perms = user.role?.permissions as any;
    const hasWildcard = perms && !Array.isArray(perms) && typeof perms === "object" && perms["*"] === true;

    if (!hasWildcard) {
      // Check custom role permissions
      const permissionsList = Array.isArray(user.role?.permissions) ? user.role!.permissions as any[] : [];
      const hasPermission = permissionsList.some(
        (p: any) => p.module === options.module && p.action === action
      );

      if (!hasPermission) {
        return { error: `Forbidden: Missing ${action} permission for ${options.module}`, status: 403 };
      }
    }
  }

  return { session, user, branchId };
}

