// client/src/app/api/settings/email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@libs/prisma";
import { EmailCrypto } from "@/lib/email/crypto/EmailCrypto";
import { EmailService } from "@/lib/email/services/EmailService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : 0;
    const tenantId = "default-tenant";

    // 1. Fetch branch-specific or tenant-wide default
    let settings = null;
    let isInherited = false;

    if (branchId > 0) {
      settings = await prisma.emailSettings.findFirst({
        where: { tenantId, branchId },
      });
    }

    if (!settings) {
      settings = await prisma.emailSettings.findFirst({
        where: { tenantId, OR: [{ branchId: 0 }, { branchId: null }] },
      });
      if (settings && branchId > 0) {
        isInherited = true;
      }
    }

    // 2. Create default if not found
    if (!settings) {
      settings = await prisma.emailSettings.create({
        data: {
          tenantId,
          branchId: 0,
          isInherited: false,
          provider: "ERP_MANAGED",
          senderName: "Jewellery ERP",
          senderEmail: "no-reply@jewelleryerp.com",
          monthlyLimit: 5000,
          monthlyUsage: 0,
          dispatchPreferences: {
            sendInvoicePdf: true,
            sendPaymentReceipt: true,
            sendOrderConfirmation: true,
            sendBookingConfirmation: true,
            sendDeliveryNotification: true,
            sendReturnConfirmation: true,
            sendExchangeConfirmation: true,
            sendCreditNote: true,
            sendDebitNote: false,
            sendPaymentReminder: true,
            sendMonthlyStatement: false,
            sendOutstandingBalance: false,
            sendPasswordReset: true,
            sendLoginAlert: false,
            sendTwoFactorOtp: true,
            sendSecurityAlert: true,
            sendBackupSuccess: true,
            sendBackupFailed: true,
            sendIntegrationFailure: true,
          },
        },
      });
    }

    // 3. Fetch branch & branchSettings if branchId > 0
    let branch = null;
    let branchSettings = null;
    if (branchId > 0) {
      branch = await prisma.branch.findUnique({ where: { id: branchId } });
      branchSettings = await prisma.branchSettings.findUnique({ where: { branchId } });
    }

    // 4. Fetch live usage
    const usage = await EmailService.getEmailUsage(tenantId, branchId > 0 ? branchId : undefined);

    // 5. Return safe payload (NEVER expose decrypted password or API key)
    const hasPassword = Boolean(settings.smtpPasswordEncrypted);
    const hasApiKey = Boolean(settings.providerApiKeyEncrypted || process.env.BREVO_API_KEY || process.env.SIB_API_KEY);

    const effectiveSenderName =
      (settings.senderName && settings.senderName !== "Jewellery ERP" ? settings.senderName : null) ||
      branchSettings?.shopName ||
      branch?.name ||
      settings.senderName ||
      "Jewellery ERP";

    const safeData = {
      ...settings,
      senderName: effectiveSenderName,
      isInherited: isInherited || settings.isInherited,
      smtpPassword: hasPassword ? "••••••••••••••••" : "",
      hasPassword,
      providerApiKey: hasApiKey ? "••••••••••••••••" : "",
      hasApiKey,
      usage,
    };

    return NextResponse.json({
      success: true,
      data: safeData,
    });
  } catch (error: any) {
    console.error("[GET /api/settings/email] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch email settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      branchId,
      applyToAllBranches,
      isInherited,
      provider,
      smtpHost,
      smtpPort,
      smtpEncryption,
      smtpUsername,
      smtpPassword,
      providerApiKey,
      senderName,
      senderEmail,
      replyTo,
      companyLogoUrl,
      emailSignature,
      businessAddress,
      phone,
      website,
      gstin,
      dispatchPreferences,
      monthlyLimit,
    } = body;

    const tenantId = "default-tenant";
    const targetBranchId = branchId ? parseInt(branchId, 10) : 0;

    // Encrypt password if updated (and not the masked placeholder)
    let encryptedPasswordUpdate: string | undefined = undefined;
    if (smtpPassword && smtpPassword !== "••••••••••••••••") {
      encryptedPasswordUpdate = EmailCrypto.encrypt(smtpPassword);
    }

    // Encrypt provider API key if updated (and not the masked placeholder)
    let encryptedApiKeyUpdate: string | undefined = undefined;
    if (providerApiKey && providerApiKey !== "••••••••••••••••") {
      encryptedApiKeyUpdate = EmailCrypto.encrypt(providerApiKey);
    }

    const updatePayload: any = {
      provider: provider || "ERP_MANAGED",
      smtpHost: smtpHost || null,
      smtpPort: smtpPort ? parseInt(smtpPort, 10) : 587,
      smtpEncryption: smtpEncryption || "STARTTLS",
      smtpUsername: smtpUsername || null,
      senderName: senderName || "Jewellery ERP",
      senderEmail: senderEmail || "no-reply@jewelleryerp.com",
      replyTo: replyTo || null,
      companyLogoUrl: companyLogoUrl || null,
      emailSignature: emailSignature || null,
      businessAddress: businessAddress || null,
      phone: phone || null,
      website: website || null,
      gstin: gstin || null,
      dispatchPreferences: dispatchPreferences || undefined,
      monthlyLimit: monthlyLimit ? parseInt(monthlyLimit, 10) : 5000,
    };

    if (encryptedPasswordUpdate !== undefined) {
      updatePayload.smtpPasswordEncrypted = encryptedPasswordUpdate;
    }

    if (encryptedApiKeyUpdate !== undefined) {
      updatePayload.providerApiKeyEncrypted = encryptedApiKeyUpdate;
    }

    let savedResult;

    if (applyToAllBranches) {
      // 1. Update or create global tenant default (branchId: 0)
      const existingGlobal = await prisma.emailSettings.findFirst({
        where: { tenantId, OR: [{ branchId: 0 }, { branchId: null }] },
      });

      if (existingGlobal) {
        savedResult = await prisma.emailSettings.update({
          where: { id: existingGlobal.id },
          data: {
            branchId: 0,
            isInherited: false,
            ...updatePayload,
          },
        });
      } else {
        savedResult = await prisma.emailSettings.create({
          data: {
            tenantId,
            branchId: 0,
            isInherited: false,
            ...updatePayload,
          },
        });
      }

      // 2. Update branches that are inheriting (preserving explicit branch overrides)
      const allBranches = await prisma.branch.findMany({ select: { id: true } });
      for (const b of allBranches) {
        const branchSetting = await prisma.emailSettings.findFirst({
          where: { tenantId, branchId: b.id },
        });

        // Only update if it does NOT have an explicit override
        if (!branchSetting || branchSetting.isInherited) {
          if (branchSetting) {
            await prisma.emailSettings.update({
              where: { id: branchSetting.id },
              data: {
                isInherited: true,
                ...updatePayload,
              },
            });
          } else {
            await prisma.emailSettings.create({
              data: {
                tenantId,
                branchId: b.id,
                isInherited: true,
                ...updatePayload,
              },
            });
          }
        }
      }

      // Record audit log
      await prisma.emailAuditLog.create({
        data: {
          tenantId,
          userId: Number(session.user.id) || undefined,
          userEmail: session.user.email || undefined,
          action: "ALL_BRANCHES_APPLIED",
          details: {
            provider: updatePayload.provider,
            smtpHost: updatePayload.smtpHost,
            senderEmail: updatePayload.senderEmail,
          },
        },
      });
    } else {
      // Single branch or global tenant update
      const existing = await prisma.emailSettings.findFirst({
        where: {
          tenantId,
          ...(targetBranchId === 0
            ? { OR: [{ branchId: 0 }, { branchId: null }] }
            : { branchId: targetBranchId }),
        },
      });

      if (existing) {
        savedResult = await prisma.emailSettings.update({
          where: { id: existing.id },
          data: {
            branchId: targetBranchId,
            isInherited: isInherited ?? false,
            ...updatePayload,
          },
        });
      } else {
        savedResult = await prisma.emailSettings.create({
          data: {
            tenantId,
            branchId: targetBranchId,
            isInherited: isInherited ?? false,
            ...updatePayload,
          },
        });
      }

      // Record audit log
      await prisma.emailAuditLog.create({
        data: {
          tenantId,
          branchId: targetBranchId > 0 ? targetBranchId : undefined,
          userId: Number(session.user.id) || undefined,
          userEmail: session.user.email || undefined,
          action: "CONFIG_UPDATED",
          details: {
            branchId: targetBranchId,
            provider: updatePayload.provider,
            smtpHost: updatePayload.smtpHost,
            senderEmail: updatePayload.senderEmail,
            isInherited: isInherited ?? false,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: applyToAllBranches
        ? "Email configuration applied to all shared branches (explicit overrides preserved)."
        : "Email settings saved successfully.",
      data: {
        ...savedResult,
        smtpPassword: savedResult.smtpPasswordEncrypted ? "••••••••••••••••" : "",
      },
    });
  } catch (error: any) {
    console.error("[PUT /api/settings/email] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save email settings" },
      { status: 500 }
    );
  }
}
