// client/src/app/api/security/integrations/recaptcha/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@libs/prisma";
import { SecurityCrypto } from "@/lib/security/SecurityCrypto";
import { SecurityService } from "@/lib/security/SecurityService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenantId = "default-tenant";
    const config = await SecurityService.getIntegrationConfig(tenantId);
    const policy = await SecurityService.getTenantPolicy(tenantId);

    const hasSecretKey = Boolean(config.recaptchaSecretKeyEncrypted || process.env.RECAPTCHA_SECRET_KEY);

    return NextResponse.json({
      success: true,
      data: {
        recaptchaSiteKey: config.recaptchaSiteKey || "",
        hasSecretKey,
        recaptchaSecretKey: hasSecretKey ? "••••••••••••••••" : "",
        recaptchaEnvironment: config.recaptchaEnvironment || "PRODUCTION",
        recaptchaStatus: config.recaptchaStatus || "NOT_CONFIGURED",
        recaptchaLastTestedAt: config.recaptchaLastTestedAt || null,
        ipDetectionMode: config.ipDetectionMode || "AUTO",
        trustedProxies: config.trustedProxies || [],
        proxyHeader: config.proxyHeader || "AUTO",
        enabled: policy.recaptchaEnabled,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/security/integrations/recaptcha] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reCAPTCHA integration config" },
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
      recaptchaSiteKey,
      recaptchaSecretKey,
      recaptchaEnvironment,
      ipDetectionMode,
      trustedProxies,
      proxyHeader,
      enabled,
    } = body;
    const tenantId = "default-tenant";

    const updateData: any = {
      recaptchaSiteKey: recaptchaSiteKey?.trim() || null,
      recaptchaEnvironment: recaptchaEnvironment || "PRODUCTION",
      ipDetectionMode: ipDetectionMode || "AUTO",
      trustedProxies: Array.isArray(trustedProxies) ? trustedProxies : [],
      proxyHeader: proxyHeader || "AUTO",
    };

    // Encrypt secret key if updated and not the masked placeholder
    if (recaptchaSecretKey && recaptchaSecretKey !== "••••••••••••••••") {
      updateData.recaptchaSecretKeyEncrypted = SecurityCrypto.encrypt(recaptchaSecretKey.trim());
      updateData.recaptchaStatus = "NOT_CONFIGURED"; // requires test
    }

    const saved = await prisma.securityIntegrationConfig.upsert({
      where: { tenantId },
      update: updateData,
      create: {
        tenantId,
        ...updateData,
      },
    });

    if (enabled !== undefined) {
      await prisma.tenantSecurityPolicy.upsert({
        where: { tenantId },
        update: { recaptchaEnabled: enabled },
        create: { tenantId, recaptchaEnabled: enabled },
      });
    }

    // Audit event
    await SecurityService.logAudit({
      tenantId,
      userId: Number(session.user.id),
      userEmail: session.user.email || undefined,
      eventType: "SECURITY_POLICY_CHANGED",
      action: "Updated Google reCAPTCHA v3 & IP Proxy settings",
      success: true,
      ipAddress: SecurityService.getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Security integrations saved successfully.",
      data: {
        ...saved,
        recaptchaSecretKey: saved.recaptchaSecretKeyEncrypted ? "••••••••••••••••" : "",
        hasSecretKey: Boolean(saved.recaptchaSecretKeyEncrypted),
      },
    });
  } catch (error: any) {
    console.error("[PUT /api/security/integrations/recaptcha] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update reCAPTCHA integration config" },
      { status: 500 }
    );
  }
}
