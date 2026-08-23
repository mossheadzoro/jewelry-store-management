// client/src/lib/email/providers/EmailProviderFactory.ts

import { EmailProvider } from "./EmailProvider";
import { CustomSmtpEmailProvider, SmtpConfig } from "./CustomSmtpEmailProvider";
import { ErpManagedEmailProvider } from "./ErpManagedEmailProvider";
import { EmailCrypto } from "../crypto/EmailCrypto";
import { prisma } from "@libs/prisma";

export class EmailProviderFactory {
  /**
   * Resolves the active EmailProvider for a given tenant and branch with automatic inheritance.
   */
  public static async getProvider(tenantId = "default-tenant", branchId?: number): Promise<EmailProvider> {
    try {
      let settings = null;

      // 1. Check for branch-specific override (branchId > 0)
      if (branchId && branchId > 0) {
        settings = await prisma.emailSettings.findFirst({
          where: { tenantId, branchId, isInherited: false },
        });
      }

      // 2. Fallback to global tenant default (branchId: 0 or null)
      if (!settings) {
        settings = await prisma.emailSettings.findFirst({
          where: {
            tenantId,
            OR: [{ branchId: 0 }, { branchId: null }],
          },
        });
      }

      if (settings) {
        if (settings.provider === "CUSTOM_SMTP" && settings.smtpHost) {
          const decryptedPassword = settings.smtpPasswordEncrypted
            ? EmailCrypto.decrypt(settings.smtpPasswordEncrypted)
            : undefined;

          return new CustomSmtpEmailProvider({
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            encryption: settings.smtpEncryption || "STARTTLS",
            username: settings.smtpUsername || undefined,
            password: decryptedPassword,
            senderName: settings.senderName || undefined,
            senderEmail: settings.senderEmail || undefined,
            replyTo: settings.replyTo || undefined,
          });
        }

        const apiKey = settings.providerApiKeyEncrypted
          ? EmailCrypto.decrypt(settings.providerApiKeyEncrypted)
          : process.env.BREVO_API_KEY || process.env.SIB_API_KEY || process.env.MANAGED_EMAIL_API_KEY;

        return new ErpManagedEmailProvider({ apiKey, tenantId, branchId });
      }
    } catch (err: any) {
      console.warn("[EmailProviderFactory] Failed to load settings from database:", err.message);
    }

    // Default to ERP Managed platform route
    const fallbackApiKey =
      process.env.BREVO_API_KEY || process.env.SIB_API_KEY || process.env.MANAGED_EMAIL_API_KEY;
    return new ErpManagedEmailProvider({ apiKey: fallbackApiKey, tenantId, branchId });
  }

  /**
   * Creates an ad-hoc Custom SMTP provider (e.g. for testing unsaved credentials in UI).
   */
  public static createCustomSmtpProvider(config: SmtpConfig): EmailProvider {
    return new CustomSmtpEmailProvider(config);
  }

  /**
   * Creates an ad-hoc ERP Managed provider.
   */
  public static createErpManagedProvider(apiKey?: string, tenantId = "default-tenant", branchId?: number): EmailProvider {
    return new ErpManagedEmailProvider({ apiKey, tenantId, branchId });
  }
}
