// client/src/lib/email/templates/EmailTemplateEngine.ts

export interface BrandingConfig {
  businessName?: string;
  branchName?: string;
  logoUrl?: string;
  emailSignature?: string;
  businessAddress?: string;
  phone?: string;
  website?: string;
  gstin?: string;
}

export class EmailTemplateEngine {
  /**
   * Replaces all {{variable}} occurrences in a string.
   */
  public static interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      return data[key] !== undefined && data[key] !== null ? String(data[key]) : "";
    });
  }

  /**
   * Wraps email body content with the standard Jewellery ERP luxury responsive wrapper.
   */
  private static wrapLayout(content: string, branding: BrandingConfig, title: string): string {
    const businessName = branding.businessName || "Royal Jewels";
    const year = new Date().getFullYear();
    const logoHtml = branding.logoUrl
      ? `<img src="${branding.logoUrl}" alt="${businessName}" style="max-height: 48px; margin-bottom: 12px;" />`
      : `<h1 style="color: #C5A262; font-family: 'Cinzel', Georgia, serif; margin: 0; font-size: 24px; letter-spacing: 1px;">${businessName}</h1>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E7EB;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0A0B; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #111113; border: 1px solid #1F1F24; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 24px 24px; text-align: center; border-bottom: 1px solid #1F1F24; background: linear-gradient(180deg, #1A1A1E 0%, #111113 100%);">
                    ${logoHtml}
                    ${branding.branchName ? `<p style="margin: 4px 0 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${branding.branchName}</p>` : ""}
                  </td>
                </tr>
                <!-- Body Content -->
                <tr>
                  <td style="padding: 32px 24px;">
                    ${content}
                  </td>
                </tr>
                <!-- Signature / Footer -->
                <tr>
                  <td style="padding: 24px; background-color: #0E0E10; border-top: 1px solid #1F1F24; text-align: center; font-size: 11px; color: #6B7280; line-height: 1.6;">
                    ${branding.emailSignature ? `<div style="color: #D1D5DB; font-size: 12px; margin-bottom: 12px; font-style: italic;">${branding.emailSignature}</div>` : `<div style="color: #D1D5DB; font-size: 12px; margin-bottom: 12px; font-style: italic;">Thank you for choosing Royal Jewels. All jewellery is 100% BIS Hallmarked.</div>`}
                    <p style="margin: 0;"><strong>${businessName}</strong>${branding.gstin ? ` • GSTIN: ${branding.gstin}` : ""}</p>
                    ${branding.businessAddress ? `<p style="margin: 4px 0 0;">${branding.businessAddress}</p>` : ""}
                    ${branding.phone ? `<p style="margin: 4px 0 0;">Tel: ${branding.phone}${branding.website ? ` • <a href="${branding.website}" style="color: #C5A262; text-decoration: none;">${branding.website}</a>` : ""}</p>` : ""}
                    <p style="margin: 12px 0 0; color: #4B5563;">© ${year} MOUAL ERP Software. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Generates Tax Invoice Email HTML.
   */
  public static renderInvoiceEmail(data: {
    customerName: string;
    invoiceNumber: string;
    invoiceDate: string;
    grandTotal: string | number;
    paidAmount?: string | number;
    balanceDue?: string | number;
    itemsCount?: number;
    downloadUrl?: string;
  }, branding: BrandingConfig): { subject: string; html: string } {
    const subject = `Your Tax Invoice [${data.invoiceNumber}] - ${branding.businessName || "Royal Jewels"}`;
    const content = `
      <h2 style="color: #C5A262; margin: 0 0 12px; font-size: 18px;">Thank You for Your Patronage</h2>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
        Dear <strong>${data.customerName}</strong>,<br>
        Your invoice for recent fine jewellery purchases has been generated. Summary details are outlined below:
      </p>

      <table width="100%" style="background-color: #16161A; border: 1px solid #2F2F36; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #E5E7EB;">
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Invoice Number:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; font-family: monospace; color: #C5A262;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Date of Invoice:</td>
          <td style="padding: 6px 0; text-align: right;">${data.invoiceDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Items Count:</td>
          <td style="padding: 6px 0; text-align: right;">${data.itemsCount || 1} Item(s)</td>
        </tr>
        <tr style="border-top: 1px solid #2F2F36;">
          <td style="padding: 10px 0 6px; font-weight: bold; color: #FFF;">Grand Total:</td>
          <td style="padding: 10px 0 6px; text-align: right; font-weight: bold; font-size: 16px; color: #10B981;">₹${data.grandTotal}</td>
        </tr>
        ${data.balanceDue !== undefined && Number(data.balanceDue) > 0 ? `
        <tr>
          <td style="padding: 6px 0; color: #F59E0B;">Outstanding Balance:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #F59E0B;">₹${data.balanceDue}</td>
        </tr>` : `
        <tr>
          <td style="padding: 6px 0; color: #10B981;">Payment Status:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #10B981;">Paid in Full</td>
        </tr>`}
      </table>

      ${data.downloadUrl ? `
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${data.downloadUrl}" style="display: inline-block; background-color: #C5A262; color: #0A0A0B; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 13px;">
          Download Tax Invoice PDF
        </a>
      </div>` : ""}

      <p style="color: #9CA3AF; font-size: 12px; margin: 16px 0 0;">
        All gold and diamond ornaments are hallmarked & certified in compliance with Bureau of Indian Standards (BIS) regulations.
      </p>
    `;

    return {
      subject,
      html: this.wrapLayout(content, branding, subject),
    };
  }

  /**
   * Generates Payment Receipt Email HTML.
   */
  public static renderPaymentReceiptEmail(data: {
    customerName: string;
    receiptNumber: string;
    paymentDate: string;
    paymentMode: string;
    amountPaid: string | number;
    invoiceNumber?: string;
    balanceDue?: string | number;
  }, branding: BrandingConfig): { subject: string; html: string } {
    const subject = `Payment Receipt [${data.receiptNumber}] - ${branding.businessName || "Royal Jewels"}`;
    const content = `
      <h2 style="color: #10B981; margin: 0 0 12px; font-size: 18px;">Payment Received Successfully</h2>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
        Dear <strong>${data.customerName}</strong>,<br>
        We have received your payment of <strong style="color: #10B981;">₹${data.amountPaid}</strong>. Details of the transaction are below:
      </p>

      <table width="100%" style="background-color: #16161A; border: 1px solid #2F2F36; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #E5E7EB;">
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Receipt Number:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; font-family: monospace; color: #C5A262;">${data.receiptNumber}</td>
        </tr>
        ${data.invoiceNumber ? `
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Reference Invoice:</td>
          <td style="padding: 6px 0; text-align: right; font-family: monospace;">${data.invoiceNumber}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Payment Date:</td>
          <td style="padding: 6px 0; text-align: right;">${data.paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Payment Mode:</td>
          <td style="padding: 6px 0; text-align: right;">${data.paymentMode}</td>
        </tr>
        <tr style="border-top: 1px solid #2F2F36;">
          <td style="padding: 10px 0 6px; font-weight: bold; color: #FFF;">Amount Paid:</td>
          <td style="padding: 10px 0 6px; text-align: right; font-weight: bold; font-size: 16px; color: #10B981;">₹${data.amountPaid}</td>
        </tr>
      </table>
    `;

    return {
      subject,
      html: this.wrapLayout(content, branding, subject),
    };
  }

  /**
   * Generates Security 2FA / Login Alert Email HTML.
   */
  public static renderSecurityEmail(data: {
    userName: string;
    actionType: string; // "2FA_OTP" | "LOGIN_ALERT" | "PASSWORD_RESET"
    otpCode?: string;
    ipAddress?: string;
    device?: string;
    timestamp: string;
  }, branding: BrandingConfig): { subject: string; html: string } {
    let subject = `[Security Alert] Jewellery ERP Account Activity`;
    if (data.actionType === "2FA_OTP") subject = `Your Two-Factor Authentication Code - ${branding.businessName || "Jewellery ERP"}`;
    if (data.actionType === "PASSWORD_RESET") subject = `Password Reset Request - ${branding.businessName || "Jewellery ERP"}`;

    const content = `
      <h2 style="color: #F59E0B; margin: 0 0 12px; font-size: 18px;">Security Notification</h2>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
        Hello <strong>${data.userName}</strong>,
      </p>

      ${data.otpCode ? `
      <div style="background-color: #16161A; border: 1px solid #F59E0B; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 8px; text-transform: uppercase;">Your One-Time Security Passcode</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #F59E0B; font-family: monospace;">${data.otpCode}</div>
        <p style="color: #6B7280; font-size: 11px; margin: 8px 0 0;">This passcode expires in 10 minutes. Do not share it with anyone.</p>
      </div>` : ""}

      <div style="background-color: #111113; border: 1px solid #1F1F24; border-radius: 8px; padding: 14px; font-size: 12px; color: #9CA3AF;">
        <p style="margin: 0 0 4px;"><strong>Activity Details:</strong></p>
        <p style="margin: 0;">Time: ${data.timestamp}${data.ipAddress ? ` • IP: ${data.ipAddress}` : ""}${data.device ? ` • Device: ${data.device}` : ""}</p>
      </div>
    `;

    return {
      subject,
      html: this.wrapLayout(content, branding, subject),
    };
  }

  /**
   * Generates Backup & Disaster Recovery Notification Email HTML.
   */
  public static renderBackupNotificationEmail(data: {
    backupId: string;
    status: "SUCCESS" | "FAILED";
    sizeKb: number;
    storageProvider: string;
    timestamp: string;
    errorMessage?: string;
  }, branding: BrandingConfig): { subject: string; html: string } {
    const isSuccess = data.status === "SUCCESS";
    const subject = `[Database Backup ${data.status}] ${data.backupId} - ${branding.businessName || "Jewellery ERP"}`;

    const content = `
      <h2 style="color: ${isSuccess ? "#10B981" : "#EF4444"}; margin: 0 0 12px; font-size: 18px;">
        Database Backup Snapshot: ${data.status}
      </h2>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
        ${isSuccess 
          ? "Your automated disaster recovery database backup snapshot was completed and verified successfully."
          : "An error occurred while creating your automated database backup snapshot."}
      </p>

      <table width="100%" style="background-color: #16161A; border: 1px solid #2F2F36; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #E5E7EB;">
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Snapshot ID:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; font-family: monospace; color: #C5A262;">${data.backupId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Storage Vault:</td>
          <td style="padding: 6px 0; text-align: right;">${data.storageProvider}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Encrypted Size:</td>
          <td style="padding: 6px 0; text-align: right;">${data.sizeKb.toFixed(1)} KB</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9CA3AF;">Timestamp:</td>
          <td style="padding: 6px 0; text-align: right;">${data.timestamp}</td>
        </tr>
        ${data.errorMessage ? `
        <tr style="border-top: 1px solid #2F2F36;">
          <td style="padding: 8px 0 0; color: #EF4444;" colspan="2">Error: ${data.errorMessage}</td>
        </tr>` : ""}
      </table>
    `;

    return {
      subject,
      html: this.wrapLayout(content, branding, subject),
    };
  }
}
