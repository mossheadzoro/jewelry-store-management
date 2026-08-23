// client/src/lib/security/SecurityCrypto.ts

import crypto from "crypto";

export class SecurityCrypto {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 12; // 96-bit IV
  private static readonly AUTH_TAG_LENGTH = 16; // 128-bit Auth Tag

  /**
   * Derives a deterministic 32-byte master encryption key from environment secret.
   */
  private static getKey(): Buffer {
    const rawSecret =
      process.env.SECURITY_ENCRYPTION_KEY ||
      process.env.EMAIL_ENCRYPTION_KEY ||
      process.env.BACKUP_ENCRYPTION_KEY ||
      process.env.NEXTAUTH_SECRET ||
      "moual-erp-enterprise-security-master-key-2026";

    return crypto.createHash("sha256").update(rawSecret).digest();
  }

  /**
   * Encrypts sensitive string (TOTP secret, reCAPTCHA secret key) using AES-256-GCM.
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
      console.error("[SecurityCrypto] Decryption failed:", err.message);
      return "";
    }
  }

  /**
   * Generates a set of cryptographically secure formatted recovery codes.
   * Format: XXXX-XXXX-XXXX
   */
  public static generateRecoveryCodes(count = 10): { plaintext: string[]; hashed: string[] } {
    const plaintext: string[] = [];
    const hashed: string[] = [];

    for (let i = 0; i < count; i++) {
      const bytes = crypto.randomBytes(6).toString("hex").toUpperCase();
      const code = `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}`;
      plaintext.push(code);
      hashed.push(this.hashRecoveryCode(code));
    }

    return { plaintext, hashed };
  }

  /**
   * Hashes a recovery code for secure database storage.
   */
  public static hashRecoveryCode(code: string): string {
    const normalized = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Verifies a recovery code against stored hashes using constant-time comparison.
   */
  public static verifyRecoveryCode(inputCode: string, storedHash: string): boolean {
    const inputHash = this.hashRecoveryCode(inputCode);
    const bufA = Buffer.from(inputHash, "hex");
    const bufB = Buffer.from(storedHash, "hex");

    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generates a cryptographically secure random token (e.g. for challenges or device tokens).
   */
  public static generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString("hex");
  }

  /**
   * Hashes a session or device token.
   */
  public static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Returns a standard masked placeholder for UI display.
   */
  public static maskSecret(secret?: string | null): string {
    if (!secret) return "";
    return "••••••••••••••••";
  }
}
