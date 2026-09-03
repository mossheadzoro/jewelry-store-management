// src/lib/services/returns/ReturnNumberingService.ts
// Financial-Year aware, concurrency-safe document sequence generation

export type ReturnDocumentType = "RETURN" | "EXCHANGE" | "CREDIT_NOTE" | "DEBIT_NOTE" | "REFUND" | "INVOICE";

export class ReturnNumberingService {
  /**
   * Computes the financial year string (e.g. "26-27") based on Indian FY (Apr 1 - Mar 31).
   */
  public static getFinancialYear(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Jan, 3 = Apr

    let startYear: number;
    let endYear: number;

    if (month >= 3) {
      // April to December
      startYear = year;
      endYear = year + 1;
    } else {
      // January to March
      startYear = year - 1;
      endYear = year;
    }

    const startStr = startYear.toString().slice(-2);
    const endStr = endYear.toString().slice(-2);
    return `${startStr}-${endStr}`;
  }

  /**
   * Generates a unique, non-reusable document number in the format:
   * PREFIX/YY-YY/XXXXXX (e.g. RET/26-27/000031, CN/26-27/000122)
   */
  public static async generateDocumentNumber(
    tx: any,
    branchId: number,
    docType: ReturnDocumentType,
    customDate: Date = new Date()
  ): Promise<{ documentNumber: string; financialYear: string; sequence: number }> {
    const fy = this.getFinancialYear(customDate);

    const prefixMap: Record<ReturnDocumentType, string> = {
      RETURN: "RET",
      EXCHANGE: "EX",
      CREDIT_NOTE: "CN",
      DEBIT_NOTE: "DN",
      REFUND: "REF",
      INVOICE: "INV",
    };

    const prefix = prefixMap[docType] || "DOC";
    const categoryKey = `${prefix}_${fy}`;

    // Atomically upsert the sequence counter for this branch and FY category
    const tracker = await tx.sequenceTracker.upsert({
      where: {
        branchId_categoryName: {
          branchId,
          categoryName: categoryKey,
        },
      },
      update: {
        lastValue: { increment: 1 },
      },
      create: {
        branchId,
        categoryName: categoryKey,
        lastValue: 1,
      },
    });

    const seq = tracker.lastValue;
    const paddedSeq = seq.toString().padStart(6, "0");
    const documentNumber = `${prefix}/${fy}/${paddedSeq}`;

    return {
      documentNumber,
      financialYear: fy,
      sequence: seq,
    };
  }
}
