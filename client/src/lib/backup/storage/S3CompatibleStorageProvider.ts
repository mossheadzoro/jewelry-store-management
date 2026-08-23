// client/src/lib/backup/storage/S3CompatibleStorageProvider.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import {
  BackupStorageProvider,
  StorageObjectMetadata,
  UploadResult,
  ConnectionTestResult,
  StorageStatsResult,
} from "./BackupStorageProvider";

export interface S3StorageConfig {
  endpoint?: string;
  region?: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  providerName?: string;
}

export class S3CompatibleStorageProvider implements BackupStorageProvider {
  public readonly name: string;
  private client: S3Client;
  private bucket: string;

  constructor(config: S3StorageConfig) {
    this.name = config.providerName || "S3-Compatible (Cloudflare R2)";
    this.bucket = config.bucket;

    this.client = new S3Client({
      region: config.region || "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | Readable,
    contentType = "application/octet-stream",
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    let bodyBuffer: Buffer;
    if (Buffer.isBuffer(data)) {
      bodyBuffer = data;
    } else if (data instanceof Uint8Array) {
      bodyBuffer = Buffer.from(data);
    } else if (data instanceof Readable) {
      // Convert stream to Buffer if needed for small/medium payloads
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      bodyBuffer = Buffer.concat(chunks);
    } else {
      throw new Error("Invalid data format for storage upload");
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: contentType,
      Metadata: metadata,
    });

    const response = await this.client.send(command);

    return {
      key,
      bucket: this.bucket,
      size: bodyBuffer.length,
      etag: response.ETag?.replace(/"/g, ""),
    };
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`Empty response body for object: ${key}`);
    }

    if (response.Body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    // Fallback for browser / SDK transform streams
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  async getDownloadStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`Empty response body for object: ${key}`);
    }

    if (response.Body instanceof Readable) {
      return response.Body;
    }

    const byteArray = await response.Body.transformToByteArray();
    return Readable.from(Buffer.from(byteArray));
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async head(key: string): Promise<StorageObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified,
        etag: response.ETag?.replace(/"/g, ""),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${key.split("/").pop()}"`,
    });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const testKey = `_health_probes/probe-${Date.now()}-${Math.random().toString(36).substring(7)}.tmp`;
    const testPayload = Buffer.from(`Health check probe at ${new Date().toISOString()}`);

    try {
      // 1. Write probe
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: testKey,
          Body: testPayload,
          ContentType: "text/plain",
        })
      );

      // 2. Read probe
      const getRes = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: testKey,
        })
      );
      if (!getRes.Body) {
        throw new Error("Probe read returned empty body");
      }

      // 3. Delete probe
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: testKey,
        })
      );

      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        provider: this.name,
        bucket: this.bucket,
        latencyMs,
        details: `Write, Read & Delete verification succeeded (${latencyMs}ms)`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      // Try cleaning up test object if leftover
      try {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: testKey }));
      } catch {}

      return {
        success: false,
        provider: this.name,
        bucket: this.bucket,
        latencyMs,
        details: "Storage connection test failed",
        error: err.message || "Failed to communicate with S3/R2 storage",
      };
    }
  }

  async getStorageStats(prefix = "backups/"): Promise<StorageStatsResult> {
    try {
      let totalObjects = 0;
      let totalSizeBytes = 0;
      let continuationToken: string | undefined = undefined;

      do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });
        const response = await this.client.send(command);

        if (response.Contents) {
          for (const item of response.Contents) {
            totalObjects++;
            totalSizeBytes += item.Size || 0;
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return {
        provider: this.name,
        bucket: this.bucket,
        totalObjects,
        totalSizeBytes,
      };
    } catch (err) {
      return {
        provider: this.name,
        bucket: this.bucket,
        totalObjects: 0,
        totalSizeBytes: 0,
      };
    }
  }

  async list(prefix = "backups/"): Promise<any[]> {
    const items: any[] = [];
    let continuationToken: string | undefined = undefined;

    try {
      do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });
        const response = await this.client.send(command);

        if (response.Contents) {
          for (const item of response.Contents) {
            if (item.Key) {
              items.push({
                key: item.Key,
                size: item.Size || 0,
                lastModified: item.LastModified,
                etag: item.ETag?.replace(/"/g, ""),
              });
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return items;
    } catch {
      return [];
    }
  }
}
