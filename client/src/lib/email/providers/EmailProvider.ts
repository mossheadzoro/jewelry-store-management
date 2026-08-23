// client/src/lib/email/providers/EmailProvider.ts

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  errorCode?: string;
  isTemporaryError?: boolean;
}

export interface VerifyConnectionResult {
  success: boolean;
  provider: string;
  message: string;
  latencyMs?: number;
  error?: string;
}

export interface EmailUsageResult {
  monthlyLimit: number;
  monthlyUsage: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  providerName: string;
  isAvailable: boolean;
}

export interface EmailProvider {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  verifyConnection(): Promise<VerifyConnectionResult>;
  sendTestEmail(recipient: string, senderEmail?: string, senderName?: string, signature?: string): Promise<SendEmailResult>;
  getUsage?(): Promise<EmailUsageResult>;
}
