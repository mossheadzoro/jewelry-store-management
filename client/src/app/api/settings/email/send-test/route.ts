// client/src/app/api/settings/email/send-test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { EmailService } from "@/lib/email/services/EmailService";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipient, branchId, provider, smtpHost, smtpPort, smtpEncryption, smtpUsername, smtpPassword, senderName, senderEmail, apiKey: bodyApiKey } = body;

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid recipient email address is required." }, { status: 400 });
    }

    const tenantId = "default-tenant";
    let adHocConfig = undefined;
    let resolvedApiKey = undefined;

    if (provider === "CUSTOM_SMTP") {
      let resolvedPassword = smtpPassword;
      if (!resolvedPassword || resolvedPassword === "••••••••••••••••") {
        const existing = await prisma.emailSettings.findFirst({
          where: { tenantId, branchId: branchId ? parseInt(branchId, 10) : null },
        });
        if (existing?.smtpPasswordEncrypted) {
          const { EmailCrypto } = await import("@/lib/email/crypto/EmailCrypto");
          resolvedPassword = EmailCrypto.decrypt(existing.smtpPasswordEncrypted);
        }
      }

      adHocConfig = {
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort, 10) : 587,
        encryption: smtpEncryption || "STARTTLS",
        username: smtpUsername || undefined,
        password: resolvedPassword || undefined,
        senderName,
        senderEmail,
      };
    } else if (provider === "ERP_MANAGED") {
      if (bodyApiKey && bodyApiKey !== "••••••••••••••••") {
        resolvedApiKey = bodyApiKey;
      } else {
        const existing = await prisma.emailSettings.findFirst({
          where: { tenantId, branchId: branchId ? parseInt(branchId, 10) : null },
        });
        if (existing?.providerApiKeyEncrypted) {
          const { EmailCrypto } = await import("@/lib/email/crypto/EmailCrypto");
          resolvedApiKey = EmailCrypto.decrypt(existing.providerApiKeyEncrypted);
        }
      }
    }

    const result = await EmailService.sendTestEmail(
      recipient,
      tenantId,
      branchId ? parseInt(branchId, 10) : undefined,
      adHocConfig,
      provider,
      resolvedApiKey,
      senderEmail,
      senderName
    );

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.success ? undefined : result.error || "Failed to dispatch email",
    });
  } catch (error: any) {
    console.error("[POST /api/settings/email/send-test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to dispatch test email",
      },
      { status: 500 }
    );
  }
}
