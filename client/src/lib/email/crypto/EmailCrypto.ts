// client/src/lib/email/crypto/EmailCrypto.ts

import crypto from "crypto";

export class EmailCrypto {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits

  /**
   * Derives a deterministic 32-byte encryption key.
   */
  private static getKey(): Buffer {
    const rawSecret =
      process.env.EMAIL_ENCRYPTION_KEY ||
      process.env.BACKUP_ENCRYPTION_KEY ||
      process.env.NEXTAUTH_SECRET ||
      "jewelry-erp-default-secure-email-key-2026";

    return crypto.createHash("sha256").update(rawSecret).digest();
  }

  /**
   * Encrypts sensitive string (e.g. SMTP Password, API Key) using AES-256-GCM.
   * Returns: ivHex:authTagHex:encryptedHex
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return "";

    const key = this.getKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted payload.
   */
  public static decrypt(payload: string): string {
    if (!payload || !payload.includes(":")) return "";

    try {
      const parts = payload.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted payload format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = Buffer.from(parts[2], "hex");

      const key = this.getKey();
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH,
      });

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (err: any) {
      console.error("[EmailCrypto] Decryption failed:", err.message);
      return "";
    }
  }

  /**
   * Returns a standard masked placeholder for UI display.
   */
  public static maskSecret(secret?: string | null): string {
    if (!secret) return "";
    return "••••••••••••••••";
  }
}
