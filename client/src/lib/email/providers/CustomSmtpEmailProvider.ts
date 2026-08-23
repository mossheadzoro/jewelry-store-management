// client/src/lib/email/providers/CustomSmtpEmailProvider.ts

import nodemailer from "nodemailer";
import { EmailProvider, SendEmailOptions, SendEmailResult, VerifyConnectionResult } from "./EmailProvider";

export interface SmtpConfig {
  host: string;
  port: number;
  encryption: string; // STARTTLS, SSL, NONE
  username?: string;
  password?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
}

export class CustomSmtpEmailProvider implements EmailProvider {
  public readonly name = "Custom SMTP";
  private config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = config;
  }

  private createTransporter() {
    const isSsl =
      this.config.encryption?.toUpperCase() === "SSL" ||
      this.config.port === 465;

    const isNone = this.config.encryption?.toUpperCase() === "NONE";

    const transportOptions: any = {
      host: this.config.host,
      port: this.config.port || 587,
      secure: isSsl,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };

    if (this.config.username && this.config.password) {
      transportOptions.auth = {
        user: this.config.username,
        pass: this.config.password,
      };
    }

    if (!isNone) {
      transportOptions.tls = {
        rejectUnauthorized: false,
      };
    }

    return nodemailer.createTransport(transportOptions);
  }

  /**
   * Tests connection and authentication against the SMTP server.
   */
  public async verifyConnection(): Promise<VerifyConnectionResult> {
    const startTime = Date.now();

    if (!this.config.host) {
      return {
        success: false,
        provider: this.name,
        message: "SMTP Host server address is required.",
        error: "MISSING_HOST",
      };
    }

    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        provider: this.name,
        message: `SMTP Connection verified successfully with ${this.config.host}:${this.config.port} (${latencyMs}ms).`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      let safeErrorMessage = "SMTP Authentication / Connection failed.";

      if (err.code === "EAUTH" || err.responseCode === 535) {
        safeErrorMessage =
          "Authentication failed. Please verify your SMTP username and app password.";
      } else if (err.code === "ETIMEDOUT" || err.code === "ESOCKET") {
        safeErrorMessage = `Connection timed out while reaching ${this.config.host}:${this.config.port}. Check firewall or port settings.`;
      } else if (err.code === "ENOTFOUND") {
        safeErrorMessage = `SMTP Host "${this.config.host}" not found. Verify domain name.`;
      } else if (err.message) {
        // Strip any accidental password leakage from error string
        safeErrorMessage = err.message.replace(this.config.password || "___", "••••••••");
      }

      return {
        success: false,
        provider: this.name,
        message: safeErrorMessage,
        latencyMs,
        error: err.code || "SMTP_ERROR",
      };
    }
  }

  /**
   * Dispatches an email via SMTP.
   */
  public async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const transporter = this.createTransporter();

      const fromAddress =
        options.senderEmail || this.config.senderEmail || this.config.username || "no-reply@jewelleryerp.com";
      const fromName = options.senderName || this.config.senderName || "Jewellery ERP";
      const formattedFrom = `"${fromName}" <${fromAddress}>`;

      const mailOptions: any = {
        from: formattedFrom,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, "") : ""),
        replyTo: options.replyTo || this.config.replyTo || fromAddress,
      };

      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          path: a.path,
          contentType: a.contentType,
        }));
      }

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
      };
    } catch (err: any) {
      console.error("[CustomSmtpEmailProvider] Send failed:", err.message);

      const isTemporary =
        err.code === "ETIMEDOUT" ||
        err.code === "ECONNRESET" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ENETUNREACH" ||
        err.responseCode === 421 ||
        err.responseCode === 450 ||
        err.responseCode === 451;

      return {
        success: false,
        provider: this.name,
        error: err.message?.replace(this.config.password || "___", "••••••••") || "Failed to send email via SMTP",
        errorCode: err.code || `HTTP_${err.responseCode || 500}`,
        isTemporaryError: isTemporary,
      };
    }
  }

  /**
   * Sends a test email to verify end-to-end delivery.
   */
  public async sendTestEmail(recipient: string, senderEmail?: string, senderName?: string, signature?: string): Promise<SendEmailResult> {
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const host = this.config.host;
    const port = this.config.port;
    const activeSenderEmail = senderEmail || this.config.senderEmail || "dasankandura@gmail.com";
    const activeSenderName = senderName || this.config.senderName || "Royal Heritage Jewels";
    const activeSignature = signature || "Thank you for choosing Royal Jewels. All jewellery is 100% BIS Hallmarked.";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0B; color: #E5E7EB; border: 1px solid #C5A262; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #16161A, #0A0A0B); padding: 24px; border-bottom: 1px solid #2F2F36; text-align: center;">
          <h2 style="color: #C5A262; margin: 0; font-size: 22px;">${activeSenderName}</h2>
          <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 13px;">MOUAL ERP Software SMTP Gateway</p>
        </div>
        <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <p>Hello Administrator,</p>
          <p>This is a test message confirming that your <strong>MOUAL ERP Software</strong> custom SMTP email delivery gateway is configured and operating properly.</p>
          <div style="background-color: #111113; border: 1px solid #1F1F24; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Configuration Details:</strong></p>
            <ul style="margin: 0; padding-left: 20px; color: #D1D5DB; font-size: 13px;">
              <li>Shop / Brand: <code>${activeSenderName}</code></li>
              <li>SMTP Host: <code>${host}</code></li>
              <li>Port: <code>${port}</code></li>
              <li>Encryption: <code>${this.config.encryption || "STARTTLS"}</code></li>
              <li>Sender Identity: <code>${activeSenderName} &lt;${activeSenderEmail}&gt;</code></li>
              <li>Dispatched At: <code>${timestamp}</code></li>
            </ul>
          </div>
          <p style="color: #10B981; font-weight: bold; margin: 0;">✓ End-to-End SMTP Delivery Verified</p>

          ${activeSignature ? `
          <div style="background-color: #141418; border: 1px solid #25252B; border-radius: 8px; padding: 14px; margin: 20px 0 0; color: #D1D5DB; font-size: 12px; font-style: italic; line-height: 1.5;">
            ${activeSignature}
          </div>` : ""}
        </div>
        <div style="background-color: #111113; padding: 16px; text-align: center; font-size: 11px; color: #6B7280; border-top: 1px solid #1F1F24;">
          © ${new Date().getFullYear()} MOUAL ERP Software. All rights reserved.
        </div>
      </div>
    `;

    return this.send({
      to: recipient,
      senderEmail: activeSenderEmail,
      senderName: activeSenderName,
      subject: `[Test Email] ${activeSenderName} - MOUAL ERP Software SMTP Verification`,
      html,
    });
  }
}
