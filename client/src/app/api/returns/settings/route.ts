// src/app/api/returns/settings/route.ts
// Branch Return & Exchange Policy Configuration API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { ReturnEligibilityService } from "@/lib/services/returns/ReturnEligibilityService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "") || auth.branchId || auth.user.branchId;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required." }, { status: 400 });
    }

    const policy = await ReturnEligibilityService.getBranchPolicy(branchId);
    return NextResponse.json(policy, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching return settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const isManagerOrAdmin = ["ADMIN", "MANAGER", "SUPER_ADMIN", "OWNER"].includes(
      auth.user.systemRole as string
    );

    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only Managers or Admins can modify Return & Exchange policies." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const branchId = body.branchId || auth.branchId || auth.user.branchId;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required." }, { status: 400 });
    }

    const updated = await prisma.returnExchangePolicySettings.upsert({
      where: { branchId },
      update: {
        returnWindowDays: body.returnWindowDays !== undefined ? Number(body.returnWindowDays) : undefined,
        exchangeWindowDays: body.exchangeWindowDays !== undefined ? Number(body.exchangeWindowDays) : undefined,
        minimumReturnPhotoCount: body.minimumReturnPhotoCount !== undefined ? Number(body.minimumReturnPhotoCount) : undefined,
        maximumReturnPhotoCount: body.maximumReturnPhotoCount !== undefined ? Number(body.maximumReturnPhotoCount) : undefined,
        requireBarcodeVerification: body.requireBarcodeVerification !== undefined ? Boolean(body.requireBarcodeVerification) : undefined,
        requireWeightVerification: body.requireWeightVerification !== undefined ? Boolean(body.requireWeightVerification) : undefined,
        requireHuidVerification: body.requireHuidVerification !== undefined ? Boolean(body.requireHuidVerification) : undefined,
        requireRfidVerification: body.requireRfidVerification !== undefined ? Boolean(body.requireRfidVerification) : undefined,
        requirePhotoVerification: body.requirePhotoVerification !== undefined ? Boolean(body.requirePhotoVerification) : undefined,
        weightToleranceGrams: body.weightToleranceGrams !== undefined ? Number(body.weightToleranceGrams) : undefined,
        allowStoreCredit: body.allowStoreCredit !== undefined ? Boolean(body.allowStoreCredit) : undefined,
        allowCashRefund: body.allowCashRefund !== undefined ? Boolean(body.allowCashRefund) : undefined,
        allowOriginalPaymentRefund: body.allowOriginalPaymentRefund !== undefined ? Boolean(body.allowOriginalPaymentRefund) : undefined,
        allowOldGoldPhysicalReturn: body.allowOldGoldPhysicalReturn !== undefined ? Boolean(body.allowOldGoldPhysicalReturn) : undefined,
        allowOldGoldMonetarySettlement: body.allowOldGoldMonetarySettlement !== undefined ? Boolean(body.allowOldGoldMonetarySettlement) : undefined,
        allowPolicyOverride: body.allowPolicyOverride !== undefined ? Boolean(body.allowPolicyOverride) : undefined,
        managerApprovalRequired: body.managerApprovalRequired !== undefined ? Boolean(body.managerApprovalRequired) : undefined,
        highValueApprovalThreshold: body.highValueApprovalThreshold !== undefined ? Number(body.highValueApprovalThreshold) : undefined,
        requireStepUpAuthAboveThreshold: body.requireStepUpAuthAboveThreshold !== undefined ? Boolean(body.requireStepUpAuthAboveThreshold) : undefined,
        makingChargeReturnPolicy: body.makingChargeReturnPolicy || undefined,
        stoneChargeReturnPolicy: body.stoneChargeReturnPolicy || undefined,
        hallmarkChargeReturnPolicy: body.hallmarkChargeReturnPolicy || undefined,
        damageDeductionPolicy: body.damageDeductionPolicy || undefined,
        taxAdjustmentStatutoryDays: body.taxAdjustmentStatutoryDays !== undefined ? Number(body.taxAdjustmentStatutoryDays) : undefined,
      },
      create: {
        branchId,
        returnWindowDays: body.returnWindowDays !== undefined ? Number(body.returnWindowDays) : 3,
        exchangeWindowDays: body.exchangeWindowDays !== undefined ? Number(body.exchangeWindowDays) : 7,
        minimumReturnPhotoCount: body.minimumReturnPhotoCount !== undefined ? Number(body.minimumReturnPhotoCount) : 2,
        maximumReturnPhotoCount: body.maximumReturnPhotoCount !== undefined ? Number(body.maximumReturnPhotoCount) : 5,
        requireBarcodeVerification: body.requireBarcodeVerification !== undefined ? Boolean(body.requireBarcodeVerification) : true,
        requireWeightVerification: body.requireWeightVerification !== undefined ? Boolean(body.requireWeightVerification) : true,
        requireHuidVerification: body.requireHuidVerification !== undefined ? Boolean(body.requireHuidVerification) : false,
        requireRfidVerification: body.requireRfidVerification !== undefined ? Boolean(body.requireRfidVerification) : false,
        requirePhotoVerification: body.requirePhotoVerification !== undefined ? Boolean(body.requirePhotoVerification) : true,
        weightToleranceGrams: body.weightToleranceGrams !== undefined ? Number(body.weightToleranceGrams) : 0.010,
        allowStoreCredit: body.allowStoreCredit !== undefined ? Boolean(body.allowStoreCredit) : true,
        allowCashRefund: body.allowCashRefund !== undefined ? Boolean(body.allowCashRefund) : true,
        allowOriginalPaymentRefund: body.allowOriginalPaymentRefund !== undefined ? Boolean(body.allowOriginalPaymentRefund) : true,
        allowOldGoldPhysicalReturn: body.allowOldGoldPhysicalReturn !== undefined ? Boolean(body.allowOldGoldPhysicalReturn) : true,
        allowOldGoldMonetarySettlement: body.allowOldGoldMonetarySettlement !== undefined ? Boolean(body.allowOldGoldMonetarySettlement) : true,
        allowPolicyOverride: body.allowPolicyOverride !== undefined ? Boolean(body.allowPolicyOverride) : true,
        managerApprovalRequired: body.managerApprovalRequired !== undefined ? Boolean(body.managerApprovalRequired) : true,
        highValueApprovalThreshold: body.highValueApprovalThreshold !== undefined ? Number(body.highValueApprovalThreshold) : 100000,
        requireStepUpAuthAboveThreshold: body.requireStepUpAuthAboveThreshold !== undefined ? Boolean(body.requireStepUpAuthAboveThreshold) : true,
        makingChargeReturnPolicy: body.makingChargeReturnPolicy || "FULL",
        stoneChargeReturnPolicy: body.stoneChargeReturnPolicy || "FULL",
        hallmarkChargeReturnPolicy: body.hallmarkChargeReturnPolicy || "FULL",
        damageDeductionPolicy: body.damageDeductionPolicy || "NONE",
        taxAdjustmentStatutoryDays: body.taxAdjustmentStatutoryDays !== undefined ? Number(body.taxAdjustmentStatutoryDays) : 180,
      },
    });

    return NextResponse.json({ message: "Return policy updated.", settings: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating return settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings." },
      { status: 500 }
    );
  }
}
