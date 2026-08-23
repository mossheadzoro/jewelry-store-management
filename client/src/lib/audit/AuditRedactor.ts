// client/src/lib/audit/AuditRedactor.ts
// Sensitive field sanitizer for Enterprise Audit Logging

const SENSITIVE_KEY_PATTERNS = [
  /^password$/i,
  /^passwordhash$/i,
  /^currentpassword$/i,
  /^newpassword$/i,
  /^secret$/i,
  /^secretkey$/i,
  /^totpsecret/i,
  /^recoverycode/i,
  /^token$/i,
  /^accesstoken$/i,
  /^refreshtoken$/i,
  /^jwt$/i,
  /^apikey$/i,
  /^apisecret$/i,
  /^encryptionkey$/i,
  /^privatekey$/i,
  /^authheader$/i,
  /^authorization$/i,
  /^sessiontoken/i,
  /^cardcvv$/i,
  /^pincode_auth$/i,
];

export class AuditRedactor {
  private static isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }

  /**
   * Recursively sanitizes an object or array, stripping or replacing sensitive keys.
   */
  public static sanitize<T = any>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === "string") {
      // Check for JWT pattern
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(obj) && obj.length > 50) {
        return "[REDACTED_TOKEN]" as any;
      }
      return obj;
    }

    if (typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item)) as any;
    }

    const cleanObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        cleanObj[key] = "[REDACTED]";
      } else if (value && typeof value === "object") {
        cleanObj[key] = this.sanitize(value);
      } else {
        cleanObj[key] = value;
      }
    }

    return cleanObj as T;
  }
}
