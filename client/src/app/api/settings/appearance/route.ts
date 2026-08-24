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
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : (session.user.branchId ? parseInt(session.user.branchId, 10) : undefined);

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    let settings = await prisma.branchSettings.findUnique({
      where: { branchId }
    });

    if (!settings) {
      settings = await prisma.branchSettings.create({
        data: {
          branchId,
          themeMode: "light"
        }
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
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      branchId, themeMode, applyToAllBranches
    } = body;

    if (!branchId) {
       return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (themeMode !== undefined) updateData.themeMode = themeMode;

    let settings;
    
    if (applyToAllBranches) {
      const branches = await prisma.branch.findMany({ select: { id: true } });
      const upsertPromises = branches.map((b) => 
        prisma.branchSettings.upsert({
          where: { branchId: b.id },
          update: updateData,
          create: {
            branchId: b.id,
            ...updateData
          }
        })
      );
      await Promise.all(upsertPromises);
      
      settings = await prisma.branchSettings.findUnique({
        where: { branchId }
      });
    } else {
      settings = await prisma.branchSettings.upsert({
        where: { branchId },
        update: updateData,
        create: {
          branchId,
          ...updateData
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update appearance settings:", error);
    return NextResponse.json({ error: "Failed to update appearance settings" }, { status: 500 });
  }
}
