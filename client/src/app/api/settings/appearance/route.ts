import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr
      ? parseInt(branchIdStr, 10)
      : (session.user.branchId ? parseInt(session.user.branchId, 10) : undefined);

    if (!branchId || isNaN(branchId)) {
      return NextResponse.json({ error: "Valid Branch ID is required" }, { status: 400 });
    }

    // Verify branch exists in DB
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    let settings = await prisma.branchSettings.findUnique({
      where: { branchId },
    });

    if (!settings) {
      settings = await prisma.branchSettings.create({
        data: {
          branchId,
          themeMode: "light",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch appearance settings:", error);
    return NextResponse.json({ error: "Failed to fetch appearance settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user?.role || (session?.user as any)?.systemRole || "").toUpperCase();
  const isAllowed = ["ADMIN", "MANAGER", "SUPER_ADMIN", "OWNER"].includes(userRole);
  if (!session || !isAllowed) {
    return NextResponse.json({ error: "Unauthorized: Admin or Manager access required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      branchId, themeMode, applyToAllBranches
    } = body;

    const targetBranchId = branchId !== undefined && branchId !== null
      ? parseInt(String(branchId), 10)
      : (session.user.branchId ? parseInt(session.user.branchId, 10) : undefined);

    if (!targetBranchId || isNaN(targetBranchId)) {
       return NextResponse.json({ error: "Valid Branch ID is required" }, { status: 400 });
    }

    const updateData: { themeMode?: string } = {};
    if (themeMode && ["light", "dark", "system"].includes(themeMode)) {
      updateData.themeMode = themeMode;
    }

    let settings;
    
    if (applyToAllBranches) {
      const branches = await prisma.branch.findMany({ select: { id: true } });
      const upsertPromises = branches.map((b) => 
        prisma.branchSettings.upsert({
          where: { branchId: b.id },
          update: updateData,
          create: {
            branchId: b.id,
            themeMode: updateData.themeMode || "light",
          }
        })
      );
      await Promise.all(upsertPromises);
      
      settings = await prisma.branchSettings.findUnique({
        where: { branchId: targetBranchId }
      });
    } else {
      settings = await prisma.branchSettings.upsert({
        where: { branchId: targetBranchId },
        update: updateData,
        create: {
          branchId: targetBranchId,
          themeMode: updateData.themeMode || "light",
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update appearance settings:", error);
    return NextResponse.json({ error: "Failed to update appearance settings" }, { status: 500 });
  }
}
