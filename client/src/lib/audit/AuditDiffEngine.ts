// client/src/lib/audit/AuditDiffEngine.ts
// Calculates field-level diffs for entity updates

import { AuditRedactor } from "./AuditRedactor";

export interface AuditDiffResult {
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  changedFields: string[];
}

export class AuditDiffEngine {
  /**
   * Compares before and after states of an entity and extracts only changed fields.
   */
  public static computeDiff(
    beforeObj?: Record<string, any> | null,
    afterObj?: Record<string, any> | null,
    ignoredKeys: string[] = ["updatedAt", "lastLogin", "createdAt"]
  ): AuditDiffResult {
    if (!beforeObj && !afterObj) {
      return { before: null, after: null, changedFields: [] };
    }

    if (!beforeObj && afterObj) {
      const sanitized = AuditRedactor.sanitize(afterObj);
      return {
        before: null,
        after: sanitized,
        changedFields: Object.keys(sanitized),
      };
    }

    if (beforeObj && !afterObj) {
      const sanitized = AuditRedactor.sanitize(beforeObj);
      return {
        before: sanitized,
        after: null,
        changedFields: Object.keys(sanitized),
      };
    }

    const cleanBefore: Record<string, any> = {};
    const cleanAfter: Record<string, any> = {};
    const changedFields: string[] = [];

    const allKeys = Array.from(
      new Set([...Object.keys(beforeObj || {}), ...Object.keys(afterObj || {})])
    );

    for (const key of allKeys) {
      if (ignoredKeys.includes(key)) continue;

      const valA = beforeObj?.[key];
      const valB = afterObj?.[key];

      const isDifferent =
        typeof valA === "object" || typeof valB === "object"
          ? JSON.stringify(valA) !== JSON.stringify(valB)
          : valA !== valB;

      if (isDifferent) {
        cleanBefore[key] = valA === undefined ? null : valA;
        cleanAfter[key] = valB === undefined ? null : valB;
        changedFields.push(key);
      }
    }

    return {
      before: AuditRedactor.sanitize(cleanBefore),
      after: AuditRedactor.sanitize(cleanAfter),
      changedFields,
    };
  }
}
