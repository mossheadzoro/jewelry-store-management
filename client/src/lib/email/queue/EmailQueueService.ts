// client/src/lib/email/queue/EmailQueueService.ts

import { prisma } from "@/lib/prisma";
import { EmailProviderFactory } from "../providers/EmailProviderFactory";
import { SendEmailOptions } from "../providers/EmailProvider";

export interface CreateEmailJobOptions {
  tenantId?: string;
  branchId?: number;
  recipient: string;
  cc?: string;
  bcc?: string;
  templateId?: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments?: any[];
  payload?: any;
  provider?: string;
  scheduledAt?: Date;
}

export class EmailQueueService {
  private static isProcessing = false;

  /**
   * Enqueues an email job into the database queue (<5ms operation).
   */
  public static async enqueueJob(options: CreateEmailJobOptions): Promise<string> {
    const tenantId = options.tenantId || "default-tenant";
    const provider = options.provider || "ERP_MANAGED";

    const job = await prisma.emailJob.create({
      data: {
        tenantId,
        branchId: options.branchId,
        recipient: options.recipient,
        cc: options.cc,
        bcc: options.bcc,
        templateId: options.templateId,
        subject: options.subject,
        bodyHtml: options.bodyHtml,
        bodyText: options.bodyText,
        attachments: options.attachments as any,
        payload: options.payload as any,
        provider,
        status: "QUEUED",
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: options.scheduledAt || new Date(),
      },
    });

    // Fire-and-forget background worker execution
    setTimeout(() => {
      this.processQueue().catch((err) =>
        console.error("[EmailQueueWorker] Background processing error:", err.message)
      );
    }, 100);

    return job.id;
  }

  /**
   * Processes all pending queued email jobs.
   */
  public static async processQueue(batchSize = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let succeeded = 0;
    let failed = 0;

    try {
      const now = new Date();

      // Fetch pending jobs scheduled for delivery
      const pendingJobs = await prisma.emailJob.findMany({
        where: {
          status: "QUEUED",
          scheduledAt: { lte: now },
        },
        orderBy: { scheduledAt: "asc" },
        take: batchSize,
      });

      for (const job of pendingJobs) {
        // Mark job as in-flight
        await prisma.emailJob.update({
          where: { id: job.id },
          data: { status: "SENDING", attempts: job.attempts + 1 },
        });

        try {
          const provider = await EmailProviderFactory.getProvider(job.tenantId, job.branchId || undefined);

          const sendOptions: SendEmailOptions = {
            to: job.recipient,
            cc: job.cc || undefined,
            bcc: job.bcc || undefined,
            subject: job.subject,
            html: job.bodyHtml || undefined,
            text: job.bodyText || undefined,
            attachments: (job.attachments as any) || undefined,
          };

          const result = await provider.send(sendOptions);

          if (result.success) {
            await prisma.emailJob.update({
              where: { id: job.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
                deliveredAt: new Date(),
                providerMessageId: result.messageId,
                errorCode: null,
                errorMessage: null,
              },
            });
            succeeded++;
          } else {
            // Handle failure
            const nextAttempt = job.attempts + 1;
            const isTemporary = result.isTemporaryError !== false;

            if (isTemporary && nextAttempt < job.maxAttempts) {
              // Exponential backoff: attempt 1 -> 5s, attempt 2 -> 30s, attempt 3 -> 120s
              const backoffDelays = [5000, 30000, 120000];
              const delayMs = backoffDelays[nextAttempt - 1] || 60000;
              const nextSchedule = new Date(Date.now() + delayMs);

              await prisma.emailJob.update({
                where: { id: job.id },
                data: {
                  status: "QUEUED",
                  scheduledAt: nextSchedule,
                  errorCode: result.errorCode || "TEMPORARY_ERROR",
                  errorMessage: result.error || "Temporary delivery failure",
                },
              });
            } else {
              // Permanent failure or max attempts exhausted
              await prisma.emailJob.update({
                where: { id: job.id },
                data: {
                  status: "FAILED",
                  failedAt: new Date(),
                  errorCode: result.errorCode || "PERMANENT_ERROR",
                  errorMessage: result.error || "Email delivery failed",
                },
              });
              failed++;
            }
          }
        } catch (jobErr: any) {
          await prisma.emailJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              failedAt: new Date(),
              errorCode: "EXECUTION_EXCEPTION",
              errorMessage: jobErr.message || "Unexpected exception during email dispatch",
            },
          });
          failed++;
        }
      }

      return {
        processed: pendingJobs.length,
        succeeded,
        failed,
      };
    } finally {
      this.isProcessing = false;
    }
  }
}
