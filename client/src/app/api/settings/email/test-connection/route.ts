// client/src/app/api/settings/email/test-connection/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { EmailService } from "@/lib/email/services/EmailService";
import { prisma } from "@libs/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { branchId, provider, smtpHost, smtpPort, smtpEncryption, smtpUsername, smtpPassword, apiKey: bodyApiKey } = body;
    const tenantId = "default-tenant";

    let adHocConfig = undefined;
    let resolvedApiKey = undefined;

    if (provider === "CUSTOM_SMTP") {
      // If user provided a new password, use it. Otherwise, look up existing encrypted password.
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

    const result = await EmailService.verifyConnection(
      tenantId,
      branchId ? parseInt(branchId, 10) : undefined,
      adHocConfig,
      provider,
      resolvedApiKey
    );

    // Update verification telemetry in database
    try {
      await prisma.emailSettings.updateMany({
        where: { tenantId, branchId: branchId ? parseInt(branchId, 10) : null },
        data: {
          verificationStatus: result.success ? "VERIFIED" : "FAILED",
          lastVerifiedAt: new Date(),
          verificationError: result.success ? null : (result.error || result.message || null),
          latencyMs: result.latencyMs || null,
        },
      });
    } catch {}

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.success ? undefined : result.message || result.error || "Connection test failed",
    });
  } catch (error: any) {
    console.error("[POST /api/settings/email/test-connection] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Connection probe test failed",
      },
      { status: 500 }
    );
  }
}
