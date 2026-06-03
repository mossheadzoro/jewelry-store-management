import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// Key generation fallback using NEXTAUTH_SECRET to guarantee setup-free run in dev,
// while permitting environment-controlled 256-bit hex keys in prod.
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.KYC_ENCRYPTION_KEY;
  if (envKey) {
    return Buffer.from(envKey, "hex");
  }
  const secret = process.env.NEXTAUTH_SECRET || "default-atelier-secret-key-123456";
  return crypto.scryptSync(secret, "salt-kyc", 32);
};

export function encryptBuffer(buffer: Buffer): { encrypted: Buffer; iv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv: iv.toString("hex") };
}

export function decryptBuffer(buffer: Buffer, ivHex: string): Buffer {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return decrypted;
}
