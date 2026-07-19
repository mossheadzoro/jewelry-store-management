import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : session.user.branchId ? parseInt(session.user.branchId, 10) : undefined;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    let settings = await prisma.globalProductSettings.findUnique({
      where: { branchId }
    });

    if (!settings) {
      settings = await prisma.globalProductSettings.create({
        data: {
          branchId,
          metalConfig: {},
          codeConfig: {},
          weightConfig: {},
          pricingConfig: {},
          stoneConfig: {},
          hallmarkConfig: {},
          mediaConfig: {},
          inventoryConfig: {},
          printConfig: {},
          customFields: {},
          validationRules: {},
          financialConfig: {},
          schemeConfig: {},
          goldRateConfig: {},
          customerConfig: {}
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch product settings:", error);
    return NextResponse.json({ error: "Failed to fetch product settings" }, { status: 500 });
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
      branchId, metalConfig, codeConfig, weightConfig, pricingConfig,
      stoneConfig, hallmarkConfig, mediaConfig, inventoryConfig,
      printConfig, customFields, validationRules, financialConfig, schemeConfig, goldRateConfig, customerConfig, applyToAllBranches
    } = body;

    if (!branchId) {
       return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (metalConfig !== undefined) updateData.metalConfig = metalConfig;
    if (codeConfig !== undefined) updateData.codeConfig = codeConfig;
    if (weightConfig !== undefined) updateData.weightConfig = weightConfig;
    if (pricingConfig !== undefined) updateData.pricingConfig = pricingConfig;
    if (stoneConfig !== undefined) updateData.stoneConfig = stoneConfig;
    if (hallmarkConfig !== undefined) updateData.hallmarkConfig = hallmarkConfig;
    if (mediaConfig !== undefined) updateData.mediaConfig = mediaConfig;
    if (inventoryConfig !== undefined) updateData.inventoryConfig = inventoryConfig;
    if (printConfig !== undefined) updateData.printConfig = printConfig;
    if (customFields !== undefined) updateData.customFields = customFields;
    if (validationRules !== undefined) updateData.validationRules = validationRules;
    if (financialConfig !== undefined) updateData.financialConfig = financialConfig;
    if (schemeConfig !== undefined) updateData.schemeConfig = schemeConfig;
    if (goldRateConfig !== undefined) updateData.goldRateConfig = goldRateConfig;
    if (customerConfig !== undefined) updateData.customerConfig = customerConfig;

    let settings;
    
    if (applyToAllBranches) {
      const branches = await prisma.branch.findMany({ select: { id: true } });
      const upsertPromises = branches.map((b) => 
        prisma.globalProductSettings.upsert({
          where: { branchId: b.id },
          update: updateData,
          create: {
            branchId: b.id,
            ...updateData
          }
        })
      );
      await Promise.all(upsertPromises);
      
      // Fetch the updated settings for the current branch to return
      settings = await prisma.globalProductSettings.findUnique({
        where: { branchId }
      });
    } else {
      settings = await prisma.globalProductSettings.upsert({
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
    console.error("Failed to update product settings:", error);
    return NextResponse.json({ error: "Failed to update product settings" }, { status: 500 });
  }
}
