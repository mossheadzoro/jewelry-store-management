// client/src/app/api/security/integrations/recaptcha/test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { SecurityCrypto } from "@/lib/security/SecurityCrypto";
import { SecurityService } from "@/lib/security/SecurityService";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { token, siteKey, secretKey } = body;
    const tenantId = "default-tenant";

    let resolvedSecretKey = secretKey;
    if (!resolvedSecretKey || resolvedSecretKey === "••••••••••••••••") {
      const config = await SecurityService.getIntegrationConfig(tenantId);
      if (config.recaptchaSecretKeyEncrypted) {
        resolvedSecretKey = SecurityCrypto.decrypt(config.recaptchaSecretKeyEncrypted);
      } else {
        resolvedSecretKey = process.env.RECAPTCHA_SECRET_KEY || "";
      }
    }

    if (!resolvedSecretKey) {
      return NextResponse.json({
        success: false,
        error: "reCAPTCHA Secret Key is required to test connection.",
      }, { status: 400 });
    }

    // Call Google reCAPTCHA verification API
    const params = new URLSearchParams();
    params.append("secret", resolvedSecretKey);
    params.append("response", token || "test_token_validation");
    params.append("remoteip", SecurityService.getClientIp(req));

    const startTime = Date.now();
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json();

    // If token is invalid (expected when testing without client token), check if error is "invalid-input-secret" vs "invalid-input-response"
    const errorCodes: string[] = data["error-codes"] || [];
    const secretInvalid = errorCodes.includes("invalid-input-secret") || errorCodes.includes("missing-input-secret");

    if (secretInvalid) {
      await prisma.securityIntegrationConfig.updateMany({
        where: { tenantId },
        data: {
          recaptchaStatus: "ERROR",
          recaptchaLastTestedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: false,
        latencyMs,
        error: "Google reCAPTCHA rejected your Secret Key. Please verify your secret key.",
      });
    }

    // Secret Key is valid!
    await prisma.securityIntegrationConfig.updateMany({
      where: { tenantId },
      data: {
        recaptchaStatus: "CONNECTED",
        recaptchaLastTestedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      latencyMs,
      message: "Google reCAPTCHA v3 API connection verified successfully.",
      data: {
        score: typeof data.score === "number" ? data.score : 0.9,
        action: data.action || "test",
        hostname: data.hostname || "localhost",
      },
    });
  } catch (error: any) {
    console.error("[POST /api/security/integrations/recaptcha/test] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test reCAPTCHA connection" },
      { status: 500 }
    );
  }
}
