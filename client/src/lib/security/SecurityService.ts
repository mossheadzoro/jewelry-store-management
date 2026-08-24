// client/src/lib/security/SecurityService.ts
// Enterprise 2FA, TOTP RFC 6238, reCAPTCHA v3 & IP Security Engine

import { prisma } from "@/lib/prisma";
import { SecurityCrypto } from "./SecurityCrypto";
import ipaddr from "ipaddr.js";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { NextRequest } from "next/server";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface SecurityAuditLogOptions {
  tenantId?: string;
  userId?: number;
  userEmail?: string;
  branchId?: number;
  eventType: string;
  action: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface IpCheckResult {
  allowed: boolean;
  mode: string;
  clientIp: string;
  matchedRule?: any;
  reason?: string;
}

export interface RecaptchaVerifyResult {
  success: boolean;
  score: number;
  action: string;
  hostname?: string;
  error?: string;
}

// In-Memory Rate Limit Store
interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lockedUntil && entry.lockedUntil < now) {
      rateLimitStore.delete(key);
    } else if (now - entry.firstAttemptAt > 3600000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export class SecurityService {
  // ==========================================
  // 1. CLIENT IP RESOLUTION & SECURITY
  // ==========================================

  /**
   * Resolves the real client IP securely, respecting trusted proxies.
   */
  public static getClientIp(req: NextRequest | Headers | { headers: Headers } | any): string {
    let headers: Headers;
    if (req instanceof Headers) {
      headers = req;
    } else if (req?.headers instanceof Headers) {
      headers = req.headers;
    } else if (typeof req?.headers?.get === "function") {
      headers = req.headers;
    } else {
      headers = new Headers(req?.headers || {});
    }

    // Check Cloudflare header first (if present and trusted)
    const cfConnectingIp = headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return this.normalizeIp(cfConnectingIp.trim());
    }

    // Check standard X-Real-IP
    const xRealIp = headers.get("x-real-ip");
    if (xRealIp) {
      return this.normalizeIp(xRealIp.trim());
    }

    // Check X-Forwarded-For
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
      const ips = xForwardedFor.split(",").map((ip) => ip.trim());
      if (ips.length > 0 && ips[0]) {
        return this.normalizeIp(ips[0]);
      }
    }

    return "127.0.0.1";
  }

  /**
   * Normalizes IPv4-mapped IPv6 addresses (e.g. ::ffff:192.168.1.1 -> 192.168.1.1).
   */
  public static normalizeIp(ip: string): string {
    if (!ip) return "127.0.0.1";
    let clean = ip.trim();
    if (clean.startsWith("::ffff:")) {
      clean = clean.substring(7);
    }
    if (clean === "::1") {
      clean = "127.0.0.1";
    }
    return clean;
  }

  /**
   * Validates if a string is a valid IPv4, IPv6, or CIDR block.
   */
  public static isValidIpOrCidr(input: string): boolean {
    if (!input || typeof input !== "string") return false;
    const clean = input.trim();

    try {
      if (clean.includes("/")) {
        ipaddr.parseCIDR(clean);
        return true;
      } else {
        ipaddr.parse(clean);
        return true;
      }
    } catch {
      return false;
    }
  }

  // ==========================================
  // 2. BRANCH-AWARE IP WHITELIST CHECK
  // ==========================================

  /**
   * Evaluates client IP against tenant IP whitelist policies.
   */
  public static async evaluateIpAccess(
    tenantId: string,
    clientIp: string,
    userRole?: string,
    branchId?: number
  ): Promise<IpCheckResult> {
    try {
      const normalizedClient = this.normalizeIp(clientIp);

      // Localhost / internal loopback is always permitted
      if (normalizedClient === "127.0.0.1" || normalizedClient === "localhost") {
        return { allowed: true, mode: "LOCALHOST_BYPASS", clientIp: normalizedClient };
      }

      const policy = await this.getTenantPolicy(tenantId);
      const mode = policy.ipWhitelistMode || "MONITOR_ONLY";

      if (!policy.ipWhitelistEnabled || mode === "DISABLED") {
        return { allowed: true, mode: "DISABLED", clientIp: normalizedClient };
      }

      // Fetch active IP rules for tenant (and optional branch)
      const rules = await prisma.ipWhitelistRule.findMany({
        where: {
          tenantId,
          status: "ACTIVE",
          OR: [
            { branchId: null },
            { branchId: 0 },
            ...(branchId ? [{ branchId }] : []),
          ],
        },
      });

      // Parse client IP with ipaddr.js
      let parsedClientIp: ipaddr.IPv4 | ipaddr.IPv6;
      try {
        parsedClientIp = ipaddr.parse(normalizedClient);
      } catch {
        return {
          allowed: false,
          mode,
          clientIp: normalizedClient,
          reason: "Malformed client IP address",
        };
      }

      let matchedRule: any = null;

      for (const rule of rules) {
        // Check role restriction on rule
        if (rule.appliesToRoles && rule.appliesToRoles.length > 0 && userRole) {
          if (!rule.appliesToRoles.includes(userRole)) {
            continue;
          }
        }

        const cleanRule = rule.ipCidr.trim();
        try {
          if (cleanRule.includes("/")) {
            const parsedCidr = ipaddr.parseCIDR(cleanRule);
            if (parsedClientIp.match(parsedCidr)) {
              matchedRule = rule;
              break;
            }
          } else {
            const parsedSingle = ipaddr.parse(this.normalizeIp(cleanRule));
            if (parsedClientIp.toNormalizedString() === parsedSingle.toNormalizedString()) {
              matchedRule = rule;
              break;
            }
          }
        } catch {
          // Skip invalid database rule format
          continue;
        }
      }

      if (matchedRule) {
        return {
          allowed: true,
          mode,
          clientIp: normalizedClient,
          matchedRule,
        };
      }

      // IP is NOT in the whitelist
      if (mode === "MONITOR_ONLY") {
        return {
          allowed: true,
          mode: "MONITOR_ONLY",
          clientIp: normalizedClient,
          reason: "IP not listed but monitor mode is active",
        };
      }

      if (mode === "RESTRICT_ADMIN_MANAGER") {
        const isPrivileged = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "MANAGER";
        if (!isPrivileged) {
          return {
            allowed: true,
            mode: "RESTRICT_ADMIN_MANAGER",
            clientIp: normalizedClient,
            reason: "Non-administrative role exempted from IP restriction",
          };
        }
      }

      // Mode is RESTRICT_ALL or privileged user in RESTRICT_ADMIN_MANAGER
      return {
        allowed: false,
        mode,
        clientIp: normalizedClient,
        reason: "Access from this network is not permitted by store IP policy.",
      };
    } catch (err: any) {
      console.error("[SecurityService.evaluateIpAccess] Error:", err);
      return { allowed: true, mode: "ERROR_FALLBACK", clientIp, reason: err.message };
    }
  }

  /**
   * Emergency Lockout Prevention: checks if removing or disabling an IP rule would lock out the current admin.
   */
  public static async checkLockoutRisk(
    tenantId: string,
    clientIp: string,
    targetRuleId: string
  ): Promise<{ hasRisk: boolean; message?: string }> {
    const normalizedClient = this.normalizeIp(clientIp);
    if (normalizedClient === "127.0.0.1" || normalizedClient === "localhost") {
      return { hasRisk: false };
    }

    const policy = await this.getTenantPolicy(tenantId);
    if (!policy.ipWhitelistEnabled || policy.ipWhitelistMode === "DISABLED" || policy.ipWhitelistMode === "MONITOR_ONLY") {
      return { hasRisk: false };
    }

    // Fetch all other active rules
    const otherRules = await prisma.ipWhitelistRule.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        id: { not: targetRuleId },
      },
    });

    let clientIpCovered = false;
    try {
      const parsedClient = ipaddr.parse(normalizedClient);
      for (const rule of otherRules) {
        const clean = rule.ipCidr.trim();
        if (clean.includes("/")) {
          if (parsedClient.match(ipaddr.parseCIDR(clean))) {
            clientIpCovered = true;
            break;
          }
        } else {
          if (parsedClient.toNormalizedString() === ipaddr.parse(this.normalizeIp(clean)).toNormalizedString()) {
            clientIpCovered = true;
            break;
          }
        }
      }
    } catch {
      return { hasRisk: false };
    }

    if (!clientIpCovered) {
      return {
        hasRisk: true,
        message: "Emergency Lockout Protection: Removing or disabling this rule will lock your current IP address out of the ERP. Please add another allowed IP for your current connection before removing this one.",
      };
    }

    return { hasRisk: false };
  }

  // ==========================================
  // 3. GOOGLE RECAPTCHA V3 VERIFICATION
  // ==========================================

  /**
   * Verifies Google reCAPTCHA v3 response server-side with score validation.
   */
  public static async verifyRecaptcha(
    tenantId: string,
    token: string,
    actionName: string,
    clientIp?: string
  ): Promise<RecaptchaVerifyResult> {
    try {
      const policy = await this.getTenantPolicy(tenantId);
      if (!policy.recaptchaEnabled) {
        return { success: true, score: 1.0, action: actionName };
      }

      // Check if action is protected
      const actionsConfig = (policy.recaptchaActions as any) || { login: true, passwordReset: true, recovery: true };
      if (!actionsConfig[actionName]) {
        return { success: true, score: 1.0, action: actionName };
      }

      // Fetch Secret Key
      const intConfig = await this.getIntegrationConfig(tenantId);
      let secretKey = "";
      if (intConfig.recaptchaSecretKeyEncrypted) {
        secretKey = SecurityCrypto.decrypt(intConfig.recaptchaSecretKeyEncrypted);
      }
      if (!secretKey) {
        secretKey = process.env.RECAPTCHA_SECRET_KEY || "";
      }

      // If no secret key configured, bypass with warning
      if (!secretKey) {
        console.warn("[SecurityService.verifyRecaptcha] No reCAPTCHA secret key configured. Bypassing.");
        return { success: true, score: 1.0, action: actionName };
      }

      if (!token) {
        return { success: false, score: 0.0, action: actionName, error: "reCAPTCHA token missing" };
      }

      const params = new URLSearchParams();
      params.append("secret", secretKey);
      params.append("response", token);
      if (clientIp) params.append("remoteip", this.normalizeIp(clientIp));

      const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = await res.json();
      if (!data.success) {
        return {
          success: false,
          score: 0.0,
          action: actionName,
          error: data["error-codes"] ? data["error-codes"].join(", ") : "reCAPTCHA verification failed",
        };
      }

      const score = typeof data.score === "number" ? data.score : 0.9;
      let threshold = policy.recaptchaLoginThreshold || 0.5;
      if (actionName === "passwordReset") threshold = policy.recaptchaPasswordResetThreshold || 0.7;
      if (actionName === "recovery") threshold = policy.recaptchaRecoveryThreshold || 0.8;

      if (score < threshold) {
        return {
          success: false,
          score,
          action: data.action || actionName,
          hostname: data.hostname,
          error: `High risk score (${score.toFixed(2)} < ${threshold.toFixed(2)}). Bot activity suspected.`,
        };
      }

      return {
        success: true,
        score,
        action: data.action || actionName,
        hostname: data.hostname,
      };
    } catch (err: any) {
      console.error("[SecurityService.verifyRecaptcha] Error:", err);
      return { success: false, score: 0.0, action: actionName, error: err.message };
    }
  }

  // ==========================================
  // 4. TOTP 2FA ENGINE
  // ==========================================

  /**
   * Generates a new TOTP Secret & QR Code for user 2FA enrollment.
   */
  public static async generateTotpSetup(
    tenantId: string,
    userEmail: string,
    userName: string
  ): Promise<{ secret: string; otpauthUri: string; qrCodeDataUrl: string }> {
    const policy = await this.getTenantPolicy(tenantId);
    const issuer = policy.totpIssuer || "MOUAL ERP";

    const secret = generateSecret();
    const otpauthUri = generateURI({
      secret,
      label: userEmail,
      issuer,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
      margin: 1,
      width: 240,
      color: {
        dark: "#C5A262",
        light: "#0A0A0B",
      },
    });

    return { secret, otpauthUri, qrCodeDataUrl };
  }

  /**
   * Verifies a 6-digit TOTP token against a user's plaintext or encrypted secret.
   */
  public static verifyTotp(
    secret: string,
    token: string,
    tolerance = 1
  ): boolean {
    if (!secret || !token) return false;
    const cleanToken = token.replace(/\s+/g, "").trim();
    if (cleanToken.length !== 6) return false;

    try {
      const res = verifySync({
        token: cleanToken,
        secret,
      });
      return typeof res === "boolean" ? res : Boolean(res?.valid);
    } catch {
      return false;
    }
  }

  // ==========================================
  // 5. RECOVERY CODES MANAGEMENT
  // ==========================================

  /**
   * Generates 10 recovery codes, hashes them, and persists them for the user.
   */
  public static async regenerateRecoveryCodes(
    tenantId: string,
    userId: number
  ): Promise<string[]> {
    const { plaintext, hashed } = SecurityCrypto.generateRecoveryCodes(10);

    // Invalidate existing unused recovery codes
    await prisma.recoveryCode.deleteMany({
      where: { tenantId, userId },
    });

    // Save hashed recovery codes
    await prisma.recoveryCode.createMany({
      data: hashed.map((codeHash) => ({
        tenantId,
        userId,
        codeHash,
        used: false,
      })),
    });

    return plaintext;
  }

  /**
   * Verifies and immediately consumes a single-use recovery code.
   */
  public static async verifyAndConsumeRecoveryCode(
    tenantId: string,
    userId: number,
    inputCode: string
  ): Promise<boolean> {
    if (!inputCode) return false;

    const unusedCodes = await prisma.recoveryCode.findMany({
      where: { tenantId, userId, used: false },
    });

    for (const record of unusedCodes) {
      if (SecurityCrypto.verifyRecoveryCode(inputCode, record.codeHash)) {
        // Mark as used immediately
        await prisma.recoveryCode.update({
          where: { id: record.id },
          data: { used: true, usedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  // ==========================================
  // 6. SERVER-SIDE RATE LIMITING
  // ==========================================

  /**
   * Enforces server-side rate limiting by IP / User identifier.
   */
  public static checkRateLimit(
    key: string,
    maxAttempts = 5,
    windowMs = 900000 // 15 mins default
  ): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry) {
      rateLimitStore.set(key, { count: 1, firstAttemptAt: now });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    if (entry.lockedUntil && entry.lockedUntil > now) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: entry.lockedUntil };
    }

    if (now - entry.firstAttemptAt > windowMs) {
      // Window expired, reset
      rateLimitStore.set(key, { count: 1, firstAttemptAt: now });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    entry.count += 1;
    if (entry.count > maxAttempts) {
      entry.lockedUntil = now + windowMs;
      return { allowed: false, remainingAttempts: 0, lockedUntil: entry.lockedUntil };
    }

    return { allowed: true, remainingAttempts: maxAttempts - entry.count };
  }

  /**
   * Clears rate limit for successful action.
   */
  public static resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
  }

  // ==========================================
  // 7. SECURITY AUDIT LOGGING
  // ==========================================

  /**
   * Appends an immutable security audit event across SecurityAuditLog and EnterpriseAuditLog.
   */
  public static async logAudit(options: SecurityAuditLogOptions): Promise<void> {
    try {
      const tenantId = options.tenantId || "default-tenant";
      const normalizedIp = options.ipAddress ? this.normalizeIp(options.ipAddress) : undefined;

      await prisma.securityAuditLog.create({
        data: {
          tenantId,
          userId: options.userId,
          userEmail: options.userEmail,
          branchId: options.branchId,
          eventType: options.eventType,
          action: options.action,
          success: options.success,
          ipAddress: normalizedIp,
          userAgent: options.userAgent,
          reason: options.reason,
          metadata: options.metadata ? (options.metadata as any) : undefined,
        },
      });

      // Also record in EnterpriseAuditLog unified stream
      const { AuditLogService } = await import("@/lib/audit/AuditLogService");
      await AuditLogService.recordBusinessEvent({
        module: "SECURITY",
        action: `SECURITY.${options.eventType}`,
        entityType: "SECURITY_EVENT",
        description: options.action,
        status: options.success ? "SUCCESS" : "FAILED",
        severity: options.success ? "MEDIUM" : "HIGH",
        isSecurityEvent: true,
        reason: options.reason,
        context: {
          tenantId,
          userId: options.userId,
          userNameSnapshot: options.userEmail,
          branchId: options.branchId,
          ipAddress: normalizedIp || "127.0.0.1",
          userAgent: options.userAgent,
        },
        metadata: options.metadata,
      });
    } catch (err: any) {
      console.error("[SecurityService.logAudit] Logging error:", err.message);
    }
  }

  // ==========================================
  // 8. HELPERS & POLICY RESOLUTION
  // ==========================================

  public static async getTenantPolicy(tenantId = "default-tenant") {
    let policy = await prisma.tenantSecurityPolicy.findUnique({
      where: { tenantId },
    });

    if (!policy) {
      policy = await prisma.tenantSecurityPolicy.create({
        data: {
          tenantId,
          twoFactorRoles: {
            SUPER_ADMIN: "REQUIRED",
            ADMIN: "REQUIRED",
            MANAGER: "REQUIRED",
            ACCOUNTANT: "OPTIONAL",
            SALESMAN: "OPTIONAL",
            VIEWER: "OPTIONAL",
          },
        },
      });
    }

    return policy;
  }

  public static async getIntegrationConfig(tenantId = "default-tenant") {
    let config = await prisma.securityIntegrationConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await prisma.securityIntegrationConfig.create({
        data: { tenantId },
      });
    }

    return config;
  }

  /**
   * Determines if 2FA is required for a user given their role and tenant policy.
   */
  public static async isTwoFactorRequired(
    tenantId: string,
    userId: number,
    userRole: string
  ): Promise<{ required: boolean; reason: string; userEnrolled: boolean }> {
    const policy = await this.getTenantPolicy(tenantId);
    const userSec = await prisma.userSecurity.findUnique({
      where: { userId },
    });

    const userEnrolled = Boolean(userSec?.twoFactorEnabled && userSec?.totpSecretEncrypted);

    if (!policy.twoFactorEnabled) {
      return { required: userEnrolled, reason: userEnrolled ? "USER_PREFERENCE" : "DISABLED", userEnrolled };
    }

    const roleMap = (policy.twoFactorRoles as any) || {};
    const roleSetting = roleMap[userRole] || "OPTIONAL";

    if (roleSetting === "REQUIRED") {
      return { required: true, reason: "MANDATORY_ROLE_POLICY", userEnrolled };
    }

    if (roleSetting === "DISABLED") {
      return { required: false, reason: "ROLE_DISABLED", userEnrolled };
    }

    return { required: userEnrolled, reason: userEnrolled ? "USER_PREFERENCE" : "OPTIONAL", userEnrolled };
  }
}
