// client/src/lib/backup/storage/StorageFactory.ts

import { BackupStorageProvider } from "./BackupStorageProvider";
import { S3CompatibleStorageProvider, S3StorageConfig } from "./S3CompatibleStorageProvider";
import { prisma } from "@libs/prisma";

export class StorageFactory {
  private static instance: BackupStorageProvider | null = null;

  /**
   * Returns the singleton storage provider, dynamically resolving configuration
   * from database BackupSettings or fallback to environment variables.
   */
  public static getProvider(): BackupStorageProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = (process.env.BACKUP_STORAGE_PROVIDER || "r2").toLowerCase();

    let endpoint =
      process.env.BACKUP_R2_ENDPOINT ||
      process.env.BACKUP_S3_ENDPOINT ||
      process.env.R2_ENDPOINT ||
      process.env.Jurisdiction_endpoint ||
      undefined;

    if (endpoint && endpoint.includes("r2.cloudflarestorage.com/")) {
      endpoint = endpoint.replace(/r2\.cloudflarestorage\.com\/.*$/, "r2.cloudflarestorage.com");
    }

    const bucket =
      process.env.BACKUP_R2_BUCKET ||
      process.env.BACKUP_S3_BUCKET ||
      process.env.R2_BUCKET_NAME ||
      "moual-backup";

    const accessKeyId =
      process.env.BACKUP_R2_ACCESS_KEY_ID ||
      process.env.BACKUP_S3_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY_ID ||
      "";

    const secretAccessKey =
      process.env.BACKUP_R2_SECRET_ACCESS_KEY ||
      process.env.BACKUP_S3_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY ||
      "";

    const region =
      process.env.BACKUP_R2_REGION ||
      process.env.BACKUP_S3_REGION ||
      process.env.R2_REGION ||
      "auto";

    let providerName = "Cloudflare R2";
    if (providerType === "aws" || providerType === "s3") {
      providerName = "AWS S3";
    } else if (providerType === "b2") {
      providerName = "Backblaze B2";
    } else if (providerType === "minio") {
      providerName = "MinIO Object Storage";
    }

    this.instance = new S3CompatibleStorageProvider({
      endpoint,
      region,
      bucket,
      accessKeyId,
      secretAccessKey,
      providerName,
    });

    return this.instance;
  }

  /**
   * Dynamically loads credentials from BackupSettings in PostgreSQL.
   */
  public static async getProviderAsync(): Promise<BackupStorageProvider> {
    try {
      const settings = await prisma.backupSettings.findUnique({ where: { id: 1 } });
      if (settings && settings.r2AccessKeyId && settings.r2SecretAccessKey && settings.r2BucketName) {
        let endpoint = settings.r2Endpoint;
        if (!endpoint && settings.r2AccountId) {
          endpoint = `https://${settings.r2AccountId}.r2.cloudflarestorage.com`;
        }
        if (endpoint && endpoint.includes("r2.cloudflarestorage.com/")) {
          endpoint = endpoint.replace(/r2\.cloudflarestorage\.com\/.*$/, "r2.cloudflarestorage.com");
        }

        return new S3CompatibleStorageProvider({
          endpoint: endpoint || undefined,
          region: settings.r2Region || "auto",
          bucket: settings.r2BucketName,
          accessKeyId: settings.r2AccessKeyId,
          secretAccessKey: settings.r2SecretAccessKey,
          providerName: "Cloudflare R2",
        });
      }
    } catch {}

    return this.getProvider();
  }

  /**
   * Instantiates a custom ad-hoc S3/R2 provider (e.g. for testing unsaved credentials).
   */
  public static createCustomProvider(config: S3StorageConfig): BackupStorageProvider {
    let endpoint = config.endpoint;
    if (endpoint && endpoint.includes("r2.cloudflarestorage.com/")) {
      endpoint = endpoint.replace(/r2\.cloudflarestorage\.com\/.*$/, "r2.cloudflarestorage.com");
    }

    return new S3CompatibleStorageProvider({
      ...config,
      endpoint,
      providerName: config.providerName || "Cloudflare R2",
    });
  }

  public static isConfigured(): boolean {
    const key =
      process.env.BACKUP_R2_ACCESS_KEY_ID ||
      process.env.BACKUP_S3_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY_ID;
    const secret =
      process.env.BACKUP_R2_SECRET_ACCESS_KEY ||
      process.env.BACKUP_S3_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY;
    const bucket =
      process.env.BACKUP_R2_BUCKET ||
      process.env.BACKUP_S3_BUCKET ||
      process.env.R2_BUCKET_NAME;
    return Boolean(key && secret && bucket);
  }

  public static resetInstance() {
    this.instance = null;
  }
}
