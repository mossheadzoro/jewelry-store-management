// client/src/lib/backup/storage/BackupStorageProvider.ts

import { Readable } from "stream";

export interface StorageObjectMetadata {
  size: number;
  lastModified?: Date;
  etag?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  etag?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: string;
  bucket: string;
  latencyMs: number;
  details: string;
  error?: string;
}

export interface StorageStatsResult {
  provider: string;
  bucket: string;
  totalObjects: number;
  totalSizeBytes: number;
}

export interface StorageListItem {
  key: string;
  size: number;
  lastModified?: Date;
  etag?: string;
}

export interface BackupStorageProvider {
  readonly name: string;

  /**
   * Lists objects with optional prefix.
   */
  list(prefix?: string): Promise<StorageListItem[]>;

  /**
   * Uploads a buffer or stream to the object storage.
   */
  upload(
    key: string,
    data: Buffer | Uint8Array | Readable,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult>;

  /**
   * Downloads an object as a Buffer.
   */
  download(key: string): Promise<Buffer>;

  /**
   * Gets a readable stream of the object.
   */
  getDownloadStream(key: string): Promise<Readable>;

  /**
   * Deletes an object by key.
   */
  delete(key: string): Promise<void>;

  /**
   * Checks existence and retrieves metadata of an object.
   */
  head(key: string): Promise<StorageObjectMetadata | null>;

  /**
   * Generates a secure, temporary presigned URL for downloading.
   */
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Performs an active probe test (Write -> Read -> Delete) to verify full read/write storage access.
   */
  testConnection(): Promise<ConnectionTestResult>;

  /**
   * Calculates storage statistics for the backup prefix.
   */
  getStorageStats(prefix?: string): Promise<StorageStatsResult>;
}
