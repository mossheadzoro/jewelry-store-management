// client/src/lib/email/services/EmailService.ts

import { prisma } from "@/lib/prisma";
import { EmailProviderFactory } from "../providers/EmailProviderFactory";
import { EmailTemplateEngine, BrandingConfig } from "../templates/EmailTemplateEngine";
import { EmailQueueService, CreateEmailJobOptions } from "../queue/EmailQueueService";
import { SendEmailOptions, SendEmailResult, VerifyConnectionResult, EmailUsageResult } from "../providers/EmailProvider";
import { SmtpConfig } from "../providers/CustomSmtpEmailProvider";

export class EmailService {
  /**
   * Enqueues an email for asynchronous, non-blocking delivery.
   */
  public static async queueEmail(options: CreateEmailJobOptions): Promise<string> {
    return EmailQueueService.enqueueJob(options);
  }

  /**
   * Helper to load branding for a branch/tenant.
   */
  public static async getBranding(tenantId = "default-tenant", branchId?: number): Promise<BrandingConfig> {
    try {
      let emailSettings = null;
      if (branchId && branchId > 0) {
        emailSettings = await prisma.emailSettings.findFirst({
          where: { tenantId, branchId },
        });
      }
      if (!emailSettings) {
        emailSettings = await prisma.emailSettings.findFirst({
          where: { tenantId, OR: [{ branchId: 0 }, { branchId: null }] },
        });
      }

      const branch = branchId && branchId > 0 ? await prisma.branch.findUnique({ where: { id: branchId } }) : null;

      // Automatically sync shop name from active branch name if available
      const effectiveShopName = branch?.name || emailSettings?.senderName || "Jewellery ERP";

      return {
        businessName: effectiveShopName,
        branchName: branch?.name,
        logoUrl: emailSettings?.companyLogoUrl || undefined,
        emailSignature: emailSettings?.emailSignature || undefined,
        businessAddress: emailSettings?.businessAddress || branch?.address || undefined,
        phone: emailSettings?.phone || branch?.phone || undefined,
        website: emailSettings?.website || undefined,
        gstin: emailSettings?.gstin || undefined,
      };
    } catch {
      return { businessName: "Jewellery ERP" };
    }
  }

  /**
   * Sends Tax Invoice PDF email to a customer.
   */
  public static async sendInvoiceEmail(
    data: {
      customerName: string;
      invoiceNumber: string;
      invoiceDate: string;
      grandTotal: string | number;
      paidAmount?: string | number;
      balanceDue?: string | number;
      itemsCount?: number;
      downloadUrl?: string;
    },
    recipient: string,
    branchId?: number,
    tenantId = "default-tenant"
  ): Promise<string> {
    const branding = await this.getBranding(tenantId, branchId);
    const { subject, html } = EmailTemplateEngine.renderInvoiceEmail(data, branding);

    return this.queueEmail({
      tenantId,
      branchId,
      recipient,
      templateId: "INVOICE_PDF",
      subject,
      bodyHtml: html,
      payload: data,
    });
  }

  /**
   * Sends Payment Receipt email.
   */
  public static async sendPaymentReceipt(
    data: {
      customerName: string;
      receiptNumber: string;
      paymentDate: string;
      paymentMode: string;
      amountPaid: string | number;
      invoiceNumber?: string;
      balanceDue?: string | number;
    },
    recipient: string,
    branchId?: number,
    tenantId = "default-tenant"
  ): Promise<string> {
    const branding = await this.getBranding(tenantId, branchId);
    const { subject, html } = EmailTemplateEngine.renderPaymentReceiptEmail(data, branding);

    return this.queueEmail({
      tenantId,
      branchId,
      recipient,
      templateId: "PAYMENT_RECEIPT",
      subject,
      bodyHtml: html,
      payload: data,
    });
  }

  /**
   * Sends Security 2FA / Login Alert email.
   */
  public static async sendSecurityEmail(
    data: {
      userName: string;
      actionType: string;
      otpCode?: string;
      ipAddress?: string;
      device?: string;
      timestamp: string;
    },
    recipient: string,
    branchId?: number,
    tenantId = "default-tenant"
  ): Promise<string> {
    const branding = await this.getBranding(tenantId, branchId);
    const { subject, html } = EmailTemplateEngine.renderSecurityEmail(data, branding);

    return this.queueEmail({
      tenantId,
      branchId,
      recipient,
      templateId: "SECURITY_ALERT",
      subject,
      bodyHtml: html,
      payload: data,
    });
  }

  /**
   * Sends Disaster Recovery & Backup Notification email.
   */
  public static async sendBackupNotification(
    data: {
      backupId: string;
      status: "SUCCESS" | "FAILED";
      sizeKb: number;
      storageProvider: string;
      timestamp: string;
      errorMessage?: string;
    },
    recipient: string,
    tenantId = "default-tenant"
  ): Promise<string> {
    const branding = await this.getBranding(tenantId);
    const { subject, html } = EmailTemplateEngine.renderBackupNotificationEmail(data, branding);

    return this.queueEmail({
      tenantId,
      recipient,
      templateId: "BACKUP_NOTIFICATION",
      subject,
      bodyHtml: html,
      payload: data,
    });
  }

  /**
   * Tests connection with either active saved provider or ad-hoc test configuration.
   */
  public static async verifyConnection(
    tenantId = "default-tenant",
    branchId?: number,
    adHocSmtp?: SmtpConfig,
    providerType?: string,
    apiKey?: string
  ): Promise<VerifyConnectionResult> {
    if (providerType === "CUSTOM_SMTP" && adHocSmtp) {
      const provider = EmailProviderFactory.createCustomSmtpProvider(adHocSmtp);
      return provider.verifyConnection();
    } else if (providerType === "ERP_MANAGED") {
      const resolvedKey =
        apiKey ||
        process.env.BREVO_API_KEY ||
        process.env.SIB_API_KEY ||
        process.env.MANAGED_EMAIL_API_KEY;
      const provider = EmailProviderFactory.createErpManagedProvider(resolvedKey, tenantId, branchId);
      return provider.verifyConnection();
    }

    const provider = await EmailProviderFactory.getProvider(tenantId, branchId);
    return provider.verifyConnection();
  }

  /**
   * Sends a live test email to verify end-to-end delivery.
   */
  public static async sendTestEmail(
    recipient: string,
    tenantId = "default-tenant",
    branchId?: number,
    adHocSmtp?: SmtpConfig,
    providerType?: string,
    apiKey?: string,
    senderEmail?: string,
    senderName?: string
  ): Promise<SendEmailResult> {
    let provider;
    if (providerType === "CUSTOM_SMTP" && adHocSmtp) {
      provider = EmailProviderFactory.createCustomSmtpProvider(adHocSmtp);
    } else if (providerType === "ERP_MANAGED") {
      const resolvedKey =
        apiKey ||
        process.env.BREVO_API_KEY ||
        process.env.SIB_API_KEY ||
        process.env.MANAGED_EMAIL_API_KEY;
      const providerInstance = EmailProviderFactory.createErpManagedProvider(resolvedKey, tenantId, branchId);
      provider = providerInstance;
    } else {
      provider = await EmailProviderFactory.getProvider(tenantId, branchId);
    }

    const branding = await this.getBranding(tenantId, branchId);
    const effectiveSenderName = senderName || branding.businessName || "Royal Heritage Jewels";
    const effectiveSignature = branding.emailSignature || "Thank you for choosing Royal Jewels. All jewellery is 100% BIS Hallmarked.";

    const result = await provider.sendTestEmail(recipient, senderEmail, effectiveSenderName, effectiveSignature);

    // Record test in audit log
    try {
      await prisma.emailAuditLog.create({
        data: {
          tenantId,
          branchId,
          action: "TEST_EMAIL_SENT",
          details: {
            recipient,
            provider: provider.name,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          },
        },
      });
    } catch {}

    return result;
  }

  /**
   * Gets email usage statistics for tenant/branch.
   */
  public static async getEmailUsage(tenantId = "default-tenant", branchId?: number): Promise<EmailUsageResult> {
    const provider = await EmailProviderFactory.getProvider(tenantId, branchId);
    if (provider.getUsage) {
      return provider.getUsage();
    }

    return {
      monthlyLimit: 5000,
      monthlyUsage: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      providerName: provider.name,
      isAvailable: true,
    };
  }

  /**
   * Retrieves email dispatch logs.
   */
  public static async getEmailLogs(
    tenantId = "default-tenant",
    branchId?: number,
    options?: { page?: number; limit?: number; status?: string; search?: string }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    if (options?.status && options.status !== "ALL") where.status = options.status;
    if (options?.search) {
      where.OR = [
        { recipient: { contains: options.search, mode: "insensitive" } },
        { subject: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.emailJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailJob.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
