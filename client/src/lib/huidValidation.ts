/**
 * HUID (Hallmark Unique Identification) Validation
 *
 * As per BIS (Bureau of Indian Standards) regulations effective from 2023,
 * all gold jewelry sold in India must carry a HUID number.
 * This module validates that items being sold or transferred
 * have a HUID number recorded when the compliance setting is enabled.
 *
 * The compliance check is controlled by CompanySettings.requireHuidForSales.
 * When enabled, SALE_OUT and TRANSFER_OUT transactions will be blocked
 * if the ledger entry does not have a HUID number.
 */

// ============================================================
// TYPES
// ============================================================

/** Minimal CompanySettings shape needed for HUID validation */
export interface HuidCompanySettings {
  requireHuidForSales: boolean;
}

/** Transaction types that require HUID compliance */
const HUID_REQUIRED_TXN_TYPES = new Set([
  "SALE_OUT",
  "TRANSFER_OUT",
]);

// ============================================================
// ERRORS
// ============================================================

/**
 * Thrown when a sale or transfer is attempted without a HUID number
 * and the company has enabled mandatory HUID compliance.
 */
export class HuidComplianceError extends Error {
  public readonly txnType: string;

  constructor(txnType: string) {
    super(
      `HUID compliance violation: Transaction type "${txnType}" requires a HUID number. ` +
      `Please ensure the item has been hallmarked and the HUID is recorded before proceeding. ` +
      `This is mandatory as per BIS regulations (2023+).`
    );
    this.name = "HuidComplianceError";
    this.txnType = txnType;
  }
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validates that items being sold (SALE_OUT) or transferred (TRANSFER_OUT)
 * have a HUID number recorded. Throws HuidComplianceError if not present
 * and company setting requireHuidForSales is true.
 *
 * This function is designed to be called from insertLedgerEntry() before
 * the ledger row is committed.
 *
 * @param txnType - The inventory transaction type being performed
 * @param huidNumber - The HUID number on the ledger entry (may be null/undefined)
 * @param companySettings - Company settings containing the compliance toggle
 * @throws HuidComplianceError if compliance check fails
 */
export function assertHuidCompliance(
  txnType: string,
  huidNumber: string | null | undefined,
  companySettings: HuidCompanySettings | null
): void {
  // If company settings don't exist or HUID is not required, skip check
  if (!companySettings?.requireHuidForSales) {
    return;
  }

  // Only check for transaction types that require HUID
  if (!HUID_REQUIRED_TXN_TYPES.has(txnType)) {
    return;
  }

  // Check if HUID is present
  if (!huidNumber || huidNumber.trim().length === 0) {
    throw new HuidComplianceError(txnType);
  }
}

/**
 * Fetches company settings for HUID validation.
 * Returns null if no settings exist (HUID check will be skipped).
 *
 * @param tx - Prisma transaction client
 */
export async function getHuidSettings(
  tx: any
): Promise<HuidCompanySettings | null> {
  const settings = await tx.companySettings.findFirst({
    select: { requireHuidForSales: true },
  });
  return settings;
}
