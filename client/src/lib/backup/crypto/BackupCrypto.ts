// client/src/lib/backup/crypto/BackupCrypto.ts

import crypto from "crypto";
import zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

export class BackupCrypto {
  /**
   * Derive a 256-bit key from environment or fallback secret.
   */
  private static getEncryptionKey(): Buffer {
    const rawKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (rawKey) {
      if (rawKey.length === 64) {
        // Hex encoded 32-byte key
        return Buffer.from(rawKey, "hex");
      }
      // Passphrase: derive with scrypt
      return crypto.scryptSync(rawKey, "atelier-backup-salt-v1", 32);
    }

    // Fallback using NEXTAUTH_SECRET to ensure seamless dev operation
    const fallbackSecret =
      process.env.NEXTAUTH_SECRET || "atelier-jewelry-erp-super-secure-backup-key-2026";
    return crypto.scryptSync(fallbackSecret, "atelier-backup-salt-v1", 32);
  }

  /**
   * Computes SHA-256 checksum of a buffer or string.
   */
  public static calculateChecksum(data: Buffer | string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Compresses raw data with gzip.
   */
  public static async compress(data: Buffer | string): Promise<Buffer> {
    const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
    return await gzip(inputBuffer, { level: zlib.constants.Z_BEST_COMPRESSION });
  }

  /**
   * Decompresses gzipped data.
   */
  public static async decompress(compressedData: Buffer): Promise<Buffer> {
    return await gunzip(compressedData);
  }

  /**
   * Encrypts buffer using AES-256-GCM.
   * Format: [12-byte IV][Encrypted Data][16-byte Auth Tag]
   */
  public static encrypt(buffer: Buffer): { encryptedPayload: Buffer; iv: string; authTag: string } {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Packed binary payload: IV (12) + ciphertext + AuthTag (16)
    const encryptedPayload = Buffer.concat([iv, encrypted, authTag]);

    return {
      encryptedPayload,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  /**
   * Decrypts buffer using AES-256-GCM.
   * Extracts IV and AuthTag from the packed payload.
   */
  public static decrypt(packedPayload: Buffer): Buffer {
    if (packedPayload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Invalid encrypted payload: size too small");
    }

    const key = this.getEncryptionKey();
    const iv = packedPayload.subarray(0, IV_LENGTH);
    const authTag = packedPayload.subarray(packedPayload.length - AUTH_TAG_LENGTH);
    const ciphertext = packedPayload.subarray(IV_LENGTH, packedPayload.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  }

  /**
   * Full pipeline: Raw Buffer -> Compute SHA256 -> Compress -> Encrypt
   */
  public static async processBackupPipeline(rawSql: string | Buffer): Promise<{
    processedBuffer: Buffer;
    rawSize: number;
    fileSize: number;
    checksum: string;
  }> {
    const rawBuffer = Buffer.isBuffer(rawSql) ? rawSql : Buffer.from(rawSql, "utf8");
    const rawSize = rawBuffer.length;

    // 1. Calculate pre-encryption integrity checksum
    const checksum = this.calculateChecksum(rawBuffer);

    // 2. Compress
    const compressed = await this.compress(rawBuffer);

    // 3. Encrypt
    const { encryptedPayload } = this.encrypt(compressed);

    return {
      processedBuffer: encryptedPayload,
      rawSize,
      fileSize: encryptedPayload.length,
      checksum,
    };
  }

  /**
   * Full reverse pipeline: Encrypted Payload -> Decrypt -> Decompress -> Verify SHA256
   */
  public static async unpackBackupPipeline(
    encryptedPayload: Buffer,
    expectedChecksum?: string
  ): Promise<string> {
    // 1. Decrypt
    const compressed = this.decrypt(encryptedPayload);

    // 2. Decompress
    const decompressed = await this.decompress(compressed);

    // 3. Verify Checksum
    if (expectedChecksum && expectedChecksum.length === 64 && /^[0-9a-fA-F]{64}$/.test(expectedChecksum)) {
      const actualChecksum = this.calculateChecksum(decompressed);
      if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
        throw new Error(
          `Integrity verification failed! Checksum mismatch. Expected: ${expectedChecksum}, Actual: ${actualChecksum}`
        );
      }
    }

    return decompressed.toString("utf8");
  }
}
